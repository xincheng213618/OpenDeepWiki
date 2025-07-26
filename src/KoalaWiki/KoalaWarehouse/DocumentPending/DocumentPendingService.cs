using System.Collections.Concurrent;
using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Core.Extensions;
using KoalaWiki.Domains;
using KoalaWiki.Domains.DocumentFile;
using KoalaWiki.Domains.Warehouse;
using KoalaWiki.Entities;
using KoalaWiki.Functions;
using KoalaWiki.Options;
using KoalaWiki.Prompts;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace KoalaWiki.KoalaWarehouse.DocumentPending;

public partial class DocumentPendingService
{
    private static readonly int TaskMaxSizePerUser = 5;

    static DocumentPendingService()
    {
        // 读取环境变量
        var maxSize = Environment.GetEnvironmentVariable("TASK_MAX_SIZE_PER_USER").GetTrimmedValueOrEmpty();
        if (!string.IsNullOrEmpty(maxSize) && int.TryParse(maxSize, out var maxSizeInt))
        {
            TaskMaxSizePerUser = maxSizeInt;
        }
    }

    /// <summary>
    /// 处理文档生成
    /// </summary>
    /// <param name="documents"></param>
    /// <param name="fileKernel"></param>
    /// <param name="catalogue"></param>
    /// <param name="gitRepository"></param>
    /// <param name="warehouse"></param>
    /// <param name="path"></param>
    /// <param name="dbContext"></param>
    /// <param name="classifyType">
    /// 分类类型
    /// </param>
    /// <exception cref="Exception"></exception>
    public static async Task HandlePendingDocumentsAsync(List<DocumentCatalog> documents, Kernel fileKernel,
        string catalogue,
        string gitRepository, Warehouse warehouse, string path, IKoalaWikiContext dbContext, ClassifyType? classifyType)
    {
        // 提供5个并发的信号量,很容易触发429错误
        var semaphore = new SemaphoreSlim(TaskMaxSizePerUser);

        // 等待中的任务列表
        var pendingDocuments = new ConcurrentBag<DocumentCatalog>(documents);
        var runningTasks = new List<Task<(DocumentCatalog catalog, DocumentFileItem fileItem, List<string> files)>>();

        // 开始处理文档，直到所有文档都处理完成
        while (pendingDocuments.Count > 0 || runningTasks.Count > 0)
        {
            // 尝试启动新任务，直到达到并发限制
            while (pendingDocuments.Count > 0 && runningTasks.Count < TaskMaxSizePerUser)
            {
                if (!pendingDocuments.TryTake(out var documentCatalog)) continue;

                var task = ProcessDocumentAsync(documentCatalog, fileKernel, catalogue, gitRepository,
                    warehouse.Branch, path, semaphore, classifyType);
                runningTasks.Add(task);

                // 这里使用了一个小的延迟来避免过于频繁的任务启动
                await Task.Delay(1000, CancellationToken.None);
            }

            // 如果没有正在运行的任务，退出循环
            if (runningTasks.Count == 0)
                break;

            // 等待任意一个任务完成
            var completedTask = await Task.WhenAny(runningTasks);
            runningTasks.Remove(completedTask);

            try
            {
                var (catalog, fileItem, files) = await completedTask;

                if (fileItem == null)
                {
                    // 构建失败
                    Log.Logger.Error("处理仓库；{path} ,处理标题：{name} 失败:文件内容为空", path, catalog.Name);

                    throw new Exception("处理失败，文件内容为空: " + catalog.Name);
                }

                // 更新文档状态
                await dbContext.DocumentCatalogs.Where(x => x.Id == catalog.Id)
                    .ExecuteUpdateAsync(x => x.SetProperty(y => y.IsCompleted, true));

                // 修复Mermaid语法错误
                RepairMermaid(fileItem);

                await dbContext.DocumentFileItems.AddAsync(fileItem);
                await dbContext.DocumentFileItemSources.AddRangeAsync(files.Select(x => new DocumentFileItemSource()
                {
                    Address = x,
                    DocumentFileItemId = fileItem.Id,
                    Name = x,
                    Id = Guid.NewGuid().ToString("N"),
                }));

                await dbContext.SaveChangesAsync();

                Log.Logger.Information("处理仓库；{path}, 处理标题：{name} 完成并保存到数据库！", path, catalog.Name);
            }
            catch (Exception ex)
            {
                Log.Logger.Error("处理文档失败: {ex}", ex.ToString());
            }
        }
    }

    /// <summary>
    /// 处理单个文档的异步方法
    /// <returns>
    /// 返回列表
    /// </returns>
    /// </summary>
    public static async Task<(DocumentCatalog catalog, DocumentFileItem fileItem, List<string> files)>
        ProcessDocumentAsync(DocumentCatalog catalog, Kernel kernel, string catalogue, string gitRepository,
            string branch,
            string path,
            SemaphoreSlim? semaphore, ClassifyType? classifyType)
    {
        int retryCount = 0;
        const int retries = 5;
        var files = new List<string>();
        DocumentContext.DocumentStore = new DocumentStore();

        while (true)
        {
            try
            {
                if (semaphore != null)
                {
                    await semaphore.WaitAsync();
                }

                Log.Logger.Information("处理仓库；{path} ,处理标题：{name}", path, catalog.Name);
                var fileItem = await ProcessCatalogueItems(catalog, kernel, catalogue, gitRepository, branch, path,
                    classifyType);
                files.AddRange(DocumentContext.DocumentStore.Files);

                Log.Logger.Information("处理仓库；{path} ,处理标题：{name} 完成！", path, catalog.Name);
                semaphore?.Release();

                return (catalog, fileItem, files);
            }
            catch (Exception ex)
            {
                Log.Logger.Error("处理仓库；{path} ,处理标题：{name} 失败:{ex}", path, catalog.Name, ex.ToString());
                semaphore?.Release();

                retryCount++;
                if (retryCount >= retries)
                {
                    Console.WriteLine($"处理 {catalog.Name} 失败，已重试 {retryCount} 次，错误：{ex.Message}");
                    throw; // 重试耗尽后向上层抛出异常
                }
                else
                {
                    // 等待一段时间后重试
                    await Task.Delay(10000 * retryCount);
                }
            }
        }
    }


    /// <summary>
    /// 处理每一个标题产生文件内容
    /// </summary>
    private static async Task<DocumentFileItem> ProcessCatalogueItems(DocumentCatalog catalog, Kernel kernel,
        string codeFiles,
        string gitRepository, string branch, string path, ClassifyType? classify)
    {
        // 为每个文档处理创建独立的Kernel实例，避免状态管理冲突
        var documentKernel = KernelFactory.GetKernel(
            OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey,
            path,
            OpenAIOptions.ChatModel,
            false // 文档生成不需要代码分析功能
        );

        var chat = documentKernel.Services.GetService<IChatCompletionService>();

        string prompt = await 
            GetDocumentPendingPrompt(classify, codeFiles, gitRepository, branch, catalog.Name, catalog.Prompt);

        var history = new ChatHistory();

        history.AddSystemEnhance();

        var contents = new ChatMessageContentItemCollection
        {
            new TextContent(prompt)
        };
        contents.AddSystemReminder();
        history.AddUserMessage(contents);

        var sr = new StringBuilder();

        var settings = new OpenAIPromptExecutionSettings()
        {
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
            MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.ChatModel),
        };

        await foreach (var i in chat.GetStreamingChatMessageContentsAsync(history, settings, documentKernel))
        {
            if (!string.IsNullOrEmpty(i.Content))
            {
                sr.Append(i.Content);
            }
        }

        // 保存原始内容，防止精炼失败时丢失
        var originalContent = sr.ToString();
        
        if (DocumentOptions.RefineAndEnhanceQuality)
        {
            try
            {
                history.AddAssistantMessage(originalContent);
                
                var refineContents = new ChatMessageContentItemCollection
                {
                    new TextContent(
                        """
                        Please refine and enhance the previous documentation content while maintaining its structure and approach. Focus on:

                        **Enhancement Areas:**
                        - Deepen existing architectural explanations with more technical detail
                        - Expand code analysis with additional insights from the repository
                        - Strengthen existing Mermaid diagrams with more comprehensive representations
                        - Improve clarity and readability of existing explanations
                        - Add more specific code references and examples where appropriate
                        - Enhance existing sections with additional technical depth

                        **Quality Standards:**
                        - Maintain the 90-10 description-to-code ratio established in the original
                        - Ensure all additions are evidence-based from the actual code files
                        - Preserve the Microsoft documentation style approach
                        - Enhance conceptual understanding through improved explanations
                        - Strengthen the progressive learning structure

                        Build upon the solid foundation that exists to create even more comprehensive and valuable documentation.
                        """),
                    new TextContent(
                        """
                        <system-reminder>
                        CRITICAL: You are now in document refinement phase. Your task is to ENHANCE and IMPROVE the EXISTING documentation content that was just generated, NOT to create completely new content.
                        
                        MANDATORY REQUIREMENTS:
                        1. PRESERVE the original document structure and organization
                        2. ENHANCE existing explanations with more depth and clarity
                        3. IMPROVE technical accuracy and completeness based on actual code analysis
                        4. EXPAND existing sections with more detailed architectural analysis
                        5. REFINE language for better readability while maintaining technical precision
                        6. STRENGTHEN existing Mermaid diagrams or add complementary ones
                        7. ENSURE all enhancements are based on the code files analyzed in the original generation
                        
                        FORBIDDEN ACTIONS:
                        - Do NOT restructure or reorganize the document completely
                        - Do NOT remove existing sections or content
                        - Do NOT add content not based on the analyzed code files
                        - Do NOT change the fundamental approach or style established in the original
                        
                        Your goal is to take the good foundation that exists and make it BETTER, MORE DETAILED, and MORE COMPREHENSIVE while preserving its core structure and insights.
                        </system-reminder>
                        """)
                };
                history.AddUserMessage(refineContents);

                var refinedContent = new StringBuilder();
                await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history, settings, documentKernel))
                {
                    if (!string.IsNullOrEmpty(item.Content))
                    {
                        refinedContent.Append(item.Content);
                    }
                }

                // 检查精炼后的内容是否有效
                if (!string.IsNullOrWhiteSpace(refinedContent.ToString()))
                {
                    sr.Clear();
                    sr.Append(refinedContent.ToString());
                    Log.Logger.Information("文档精炼成功，文档：{name}", catalog.Name);
                }
                else
                {
                    Log.Logger.Warning("文档精炼后内容为空，使用原始内容，文档：{name}", catalog.Name);
                }
            }
            catch (Exception ex)
            {
                Log.Logger.Error("文档精炼失败，使用原始内容，文档：{name}，错误：{error}", catalog.Name, ex.Message);
                // sr已经包含原始内容，无需额外操作
            }
        }

        // 删除内容中所有的<thinking>内的内容，可能存在多个<thinking>标签,
        var thinkingRegex = new Regex(@"<thinking>.*?</thinking>", RegexOptions.Singleline);
        sr = new StringBuilder(thinkingRegex.Replace(sr.ToString(), string.Empty));


        // 使用正则表达式将<blog></blog>中的内容提取
        var regex = new Regex(@"<blog>(.*?)</blog>", RegexOptions.Singleline);

        var match = regex.Match(sr.ToString());

        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value;
            sr.Clear();
            sr.Append(extractedContent);
        }

        var content = sr.ToString().Trim();

        // 删除所有的所有的<think></think>
        var thinkRegex = new Regex(@"<think>(.*?)</think>", RegexOptions.Singleline);
        content = thinkRegex.Replace(content, string.Empty);

        // 从docs提取
        var docsRegex = new Regex(@"<docs>(.*?)</docs>", RegexOptions.Singleline);
        var docsMatch = docsRegex.Match(content);
        if (docsMatch.Success)
        {
            // 提取到的内容
            var extractedDocs = docsMatch.Groups[1].Value;
            content = content.Replace(docsMatch.Value, extractedDocs);
        }

        var fileItem = new DocumentFileItem()
        {
            Content = content,
            DocumentCatalogId = catalog.Id,
            Description = string.Empty,
            Extra = new Dictionary<string, string>(),
            Metadata = new Dictionary<string, string>(),
            Source = [],
            CommentCount = 0,
            RequestToken = 0,
            CreatedAt = DateTime.Now,
            Id = Guid.NewGuid().ToString("N"),
            ResponseToken = 0,
            Size = 0,
            Title = catalog.Name,
        };

        return fileItem;
    }

    /// <summary>
    /// Mermaid可能存在语法错误，使用大模型进行修复
    /// </summary>
    /// <param name="fileItem"></param>
    public static void RepairMermaid(DocumentFileItem fileItem)
    {
        try
        {
            var regex = new Regex(@"```mermaid\s*([\s\S]*?)```", RegexOptions.Multiline);
            var matches = regex.Matches(fileItem.Content);

            foreach (Match match in matches)
            {
                var code = match.Groups[1].Value;

                // 只需要删除[]里面的(和)，它可能单独处理
                var codeWithoutBrackets =
                    Regex.Replace(code, @"\[[^\]]*\]",
                        m => m.Value.Replace("(", "").Replace(")", "").Replace("（", "").Replace("）", ""));
                // 然后替换原有内容
                fileItem.Content = fileItem.Content.Replace(match.Value, $"```mermaid\n{codeWithoutBrackets}```");
            }
        }
        catch (Exception ex)
        {
            Log.Error(ex, "修复mermaid语法失败");
        }
    }
}