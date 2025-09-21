using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Core.Extensions;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Newtonsoft.Json;
using OpenAI.Chat;
using JsonSerializer = System.Text.Json.JsonSerializer;

namespace KoalaWiki.KoalaWarehouse.GenerateThinkCatalogue;

public static partial class GenerateThinkCatalogueService
{
    private const int MaxRetries = 8; // 增加重试次数
    private const int BaseDelayMs = 1000;
    private const double MaxDelayMs = 30000; // 最大延迟30秒
    private const double JitterRange = 0.3; // 抖动范围30%

    // 错误分类
    private enum ErrorType
    {
        NetworkError, // 网络相关错误
        JsonParseError, // JSON解析错误
        ApiRateLimit, // API限流
        ModelError, // 模型响应错误
        UnknownError // 未知错误
    }

    public static async Task<DocumentResultCatalogue?> GenerateCatalogue(string path,
        string catalogue, Warehouse warehouse, ClassifyType? classify)
    {
        var retryCount = 0;
        Exception? lastException = null;
        var consecutiveFailures = 0;

        Log.Logger.Information("开始处理仓库：{path}，处理标题：{name}", path, warehouse.Name);

        while (retryCount < MaxRetries)
        {
            try
            {
                var result =
                    await ExecuteSingleAttempt(path, catalogue, warehouse, classify, retryCount);

                if (result != null)
                {
                    Log.Logger.Information("成功处理仓库：{path}，处理标题：{name}，尝试次数：{retryCount}",
                        path, warehouse.Name, retryCount + 1);
                    return result;
                }

                // result为null也算失败，继续重试
                Log.Logger.Warning("处理仓库返回空结果：{path}，处理标题：{name}，尝试次数：{retryCount}",
                    path, warehouse.Name, retryCount + 1);
                consecutiveFailures++;
            }
            catch (Exception ex)
            {
                lastException = ex;
                consecutiveFailures++;
                var errorType = ClassifyError(ex);

                Log.Logger.Warning("处理仓库失败：{path}，处理标题：{name}，尝试次数：{retryCount}，错误类型：{errorType}，错误：{error}",
                    path, warehouse.Name, retryCount + 1, errorType, ex.Message);

                // 根据错误类型决定是否继续重试
                if (!ShouldRetry(errorType, retryCount, consecutiveFailures))
                {
                    Log.Logger.Error("错误类型 {errorType} 不适合重试或达到最大重试次数，停止重试", errorType);
                    break;
                }
            }

            retryCount++;

            if (retryCount < MaxRetries)
            {
                var delay = CalculateDelay(retryCount, consecutiveFailures);
                Log.Logger.Information("等待 {delay}ms 后进行第 {nextAttempt} 次尝试", delay, retryCount + 1);
                await Task.Delay(delay);

                // 如果连续失败过多，尝试重置某些状态
                if (consecutiveFailures >= 3)
                {
                    Log.Logger.Information("连续失败 {consecutiveFailures} 次，尝试重置状态", consecutiveFailures);
                    // 可以在这里添加一些重置逻辑，比如清理缓存等
                    await Task.Delay(2000); // 额外等待
                }
            }
        }

        Log.Logger.Error("处理仓库最终失败：{path}，处理标题：{name}，总尝试次数：{totalAttempts}，最后错误：{error}",
            path, warehouse.Name, retryCount, lastException?.Message ?? "未知错误");

        return null;
    }

    private static async Task<DocumentResultCatalogue?> ExecuteSingleAttempt(
        string path, string catalogue,
        Warehouse warehouse, ClassifyType? classify, int attemptNumber)
    {
        // 根据尝试次数调整提示词策略
        var enhancedPrompt = await GenerateThinkCataloguePromptAsync(classify, catalogue, attemptNumber);

        var history = new ChatHistory();

        history.AddSystemEnhance();

        var contents = new ChatMessageContentItemCollection()
        {
            new TextContent(enhancedPrompt),
            new TextContent(
                $"""
                 <system-reminder>
                 **CRITICAL FIRST STEP: You MUST begin every research task by calling the 'think' tool to analyze the query complexity. This is mandatory and must be the very first action you take, regardless of the query type or complexity.**
                 For maximum efficiency, whenever you need to perform multiple independent operations, invoke all relevant tools simultaneously rather than sequentially.
                 Note: The repository's directory structure has been provided in <code_files>. Please utilize the provided structure directly for file navigation and reading operations, rather than relying on glob patterns or filesystem traversal methods.
                 {Prompt.Language}
                 </system-reminder>
                 """),
            new TextContent(Prompt.Language)
        };
        contents.AddDocsGenerateSystemReminder();
        history.AddUserMessage(contents);

        var catalogueTool = new CatalogueFunction();
        var analysisModel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, path, OpenAIOptions.AnalysisModel, false, null,
            builder => { builder.Plugins.AddFromObject(catalogueTool, "Catalogue"); });

        var chat = analysisModel.Services.GetService<IChatCompletionService>();
        if (chat == null)
        {
            throw new InvalidOperationException("无法获取聊天完成服务");
        }

        // 根据尝试次数调整设置
        var settings = new OpenAIPromptExecutionSettings()
        {
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
            MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.AnalysisModel)
        };

        int retry = 1;

        var inputTokenCount = 0;
        var outputTokenCount = 0;
        
        retry:
        // 流式获取响应
        await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history, settings, analysisModel))
        {
            if (item.InnerContent is StreamingChatCompletionUpdate { Usage.InputTokenCount: > 0 } content)
            {
                inputTokenCount += content.Usage.InputTokenCount;
                outputTokenCount += content.Usage.OutputTokenCount;
            }
        }

        // Prefer tool-stored JSON when available
        if (!string.IsNullOrWhiteSpace(catalogueTool.Content))
        {
            // 质量增强逻辑
            if (!DocumentOptions.RefineAndEnhanceQuality || attemptNumber >= 3) // 前几次尝试才进行质量增强
                return ExtractAndParseJson(catalogueTool.Content);

            await RefineResponse(history, chat, settings, analysisModel);

            return ExtractAndParseJson(catalogueTool.Content);
        }
        else
        {
            retry++;
            if (retry > 5)
            {
                throw new Exception("AI生成目录的时候重复多次响应空内容");
            }

            goto retry;
        }
    }

    private static async Task RefineResponse(ChatHistory history, IChatCompletionService chat,
        OpenAIPromptExecutionSettings settings, Kernel kernel)
    {
        try
        {
            // 根据尝试次数调整细化策略
            const string refinementPrompt = """
                                                Refine the stored documentation_structure JSON iteratively using tools only:
                                                - Use Catalogue.Read to inspect the current JSON.
                                                - Apply several Catalogue.Edit operations to:
                                                  • add Level 2/3 subsections for core components, features, data models, integrations
                                                  • normalize kebab-case titles and maintain 'getting-started' then 'deep-dive' ordering
                                                  • enrich each section's 'prompt' with actionable guidance (scope, code areas, outputs)
                                                - Prefer localized edits; only use Catalogue.Write for a complete rewrite if necessary.
                                                - Never print JSON in chat; use tools exclusively.
                                            """;

            history.AddUserMessage(refinementPrompt);

            await foreach (var _ in chat.GetStreamingChatMessageContentsAsync(history, settings, kernel))
            {
            }
        }
        catch (Exception ex)
        {
        }
    }

    private static DocumentResultCatalogue? ExtractAndParseJson(string responseText)
    {
        var extractedJson = JsonConvert.DeserializeObject<DocumentResultCatalogue>(responseText);

        return extractedJson;
    }

    private static ErrorType ClassifyError(Exception ex)
    {
        return ex switch
        {
            HttpRequestException => ErrorType.NetworkError,
            TaskCanceledException => ErrorType.NetworkError,
            JsonException => ErrorType.JsonParseError,
            InvalidOperationException when ex.Message.Contains("rate") => ErrorType.ApiRateLimit,
            InvalidOperationException when ex.Message.Contains("quota") => ErrorType.ApiRateLimit,
            _ when ex.Message.Contains("model") => ErrorType.ModelError,
            _ => ErrorType.UnknownError
        };
    }

    private static bool ShouldRetry(ErrorType errorType, int retryCount, int consecutiveFailures)
    {
        // 总是允许至少重试几次
        if (retryCount < 3) return true;

        // 根据错误类型决定是否继续重试
        return errorType switch
        {
            ErrorType.NetworkError => retryCount < MaxRetries,
            ErrorType.ApiRateLimit => retryCount < MaxRetries && consecutiveFailures < 5,
            ErrorType.JsonParseError => retryCount < 6, // JSON错误多重试几次
            ErrorType.ModelError => retryCount < 4,
            ErrorType.UnknownError => retryCount < MaxRetries,
            _ => throw new ArgumentOutOfRangeException(nameof(errorType), errorType, null)
        };
    }

    private static int CalculateDelay(int retryCount, int consecutiveFailures)
    {
        // 指数退避 + 抖动 + 连续失败惩罚
        var exponentialDelay = BaseDelayMs * Math.Pow(2, retryCount);
        var consecutiveFailurePenalty = consecutiveFailures * 1000;
        var jitter = Random.Shared.NextDouble() * JitterRange * exponentialDelay;

        var totalDelay = exponentialDelay + consecutiveFailurePenalty + jitter;

        return (int)Math.Min(totalDelay, MaxDelayMs);
    }
}