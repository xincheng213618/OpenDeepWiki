using System.Diagnostics;
using System.Text.RegularExpressions;
using KoalaWiki.Options;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace KoalaWiki.KoalaWarehouse.Pipeline.Steps;

public class ReadmeGenerationStep : DocumentProcessingStepBase<DocumentProcessingContext, DocumentProcessingContext>
{
    public ReadmeGenerationStep(ILogger<ReadmeGenerationStep> logger) : base(logger) { }

    public override string StepName => "读取生成README";

    public override StepExecutionConfig Configuration => new()
    {
        ExecutionStrategy = StepExecutionStrategy.BestEffort, // README生成失败不影响整体流程
        RetryStrategy = StepRetryStrategy.Smart,
        MaxRetryAttempts = 2,
        RetryDelay = TimeSpan.FromSeconds(3),
        StepTimeout = TimeSpan.FromMinutes(5),
        ContinueOnFailure = true,
        RetriableExceptions = new List<Type>
        {
            typeof(HttpRequestException),
            typeof(TaskCanceledException),
            typeof(InvalidOperationException),
            typeof(TimeoutException)
        },
        NonRetriableExceptions = new List<Type>
        {
            typeof(FileNotFoundException),
            typeof(UnauthorizedAccessException),
            typeof(DirectoryNotFoundException)
        }
    };

    public override async Task<DocumentProcessingContext> ExecuteAsync(
        DocumentProcessingContext context, 
        CancellationToken cancellationToken = default)
    {
        using var activity = ActivitySource.StartActivity(StepName);
        SetActivityTags(activity, context);

        Logger.LogInformation("开始执行 {StepName} 步骤", StepName);

        try
        {
            var readme = await GenerateReadMe(context.Warehouse, context.Document.GitPath, context.DbContext);
            context.Readme = readme;
            
            activity?.SetTag("readme.length", readme?.Length ?? 0);
            context.SetStepResult(StepName, readme);
            
            Logger.LogInformation("完成 {StepName} 步骤，README长度: {Length}", 
                StepName, readme?.Length ?? 0);
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "执行 {StepName} 步骤时发生错误", StepName);
            activity?.SetTag("error", ex.Message);
            throw;
        }

        return context;
    }

    public override async Task<DocumentProcessingContext> HandleErrorAsync(
        DocumentProcessingContext input, 
        Exception exception, 
        int attemptCount)
    {
        Logger.LogWarning("README生成失败，尝试使用备选方案，异常: {Exception}", exception.Message);
        
        // README生成失败时，使用仓库现有的README或生成默认值
        if (string.IsNullOrEmpty(input.Readme))
        {
            var fallbackReadme = input.Warehouse.Readme;
            
            if (string.IsNullOrEmpty(fallbackReadme))
            {
                // 生成一个基础的README模板
                fallbackReadme = GenerateFallbackReadme(input.Warehouse, input.GitRepository);
            }
            
            input.Readme = fallbackReadme;
            Logger.LogInformation("使用备选README内容，长度: {Length}", fallbackReadme?.Length ?? 0);
        }
        
        return input;
    }

    public override async Task<bool> IsHealthyAsync(DocumentProcessingContext input)
    {
        try
        {
            // 检查文件系统访问
            var exists = Directory.Exists(input.Document.GitPath);
            if (!exists)
            {
                Logger.LogWarning("Git路径不存在: {Path}", input.Document.GitPath);
                return false;
            }
            
            // 检查是否有基本的文件读取权限
            var testFile = Path.Combine(input.Document.GitPath, "README.md");
            if (File.Exists(testFile))
            {
                try
                {
                    _ = await File.ReadAllTextAsync(testFile);
                }
                catch (UnauthorizedAccessException)
                {
                    Logger.LogWarning("无法读取README文件，权限不足");
                    return false;
                }
            }
            
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "README生成步骤健康检查失败");
            return false;
        }
    }

    public override async Task<string[]> GetDependenciesAsync()
    {
        // README生成不依赖其他步骤
        return Array.Empty<string>();
    }

    protected override void SetActivityTags(Activity? activity, DocumentProcessingContext input)
    {
        activity?.SetTag("warehouse.id", input.Warehouse.Id);
        activity?.SetTag("path", input.Document.GitPath);
    }

    private string GenerateFallbackReadme(Warehouse warehouse, string gitRepository)
    {
        var repoName = !string.IsNullOrEmpty(gitRepository) 
            ? Path.GetFileNameWithoutExtension(gitRepository.Split('/').Last().Replace(".git", ""))
            : warehouse.Name;
        
        return $@"# {repoName}

## 项目概述

这是一个代码仓库的自动生成文档。

## 仓库信息

- **仓库名称**: {warehouse.Name}
- **仓库类型**: {warehouse.Type}
- **分支**: {warehouse.Branch}

## 说明

此README文档由系统自动生成。如需更详细的项目说明，请查看项目源代码或联系项目维护者。

---
*此文档由 KoalaWiki 自动生成*
";
    }

    private static async Task<string> GenerateReadMe(Warehouse warehouse, string path, IKoalaWikiContext koalaWikiContext)
    {
        using var activity = new ActivitySource("KoalaWiki.Warehouse").StartActivity("生成README文档", ActivityKind.Server);
        activity?.SetTag("warehouse.id", warehouse.Id);
        activity?.SetTag("warehouse.name", warehouse.Name);
        activity?.SetTag("path", path);

        var readme = await DocumentsHelper.ReadMeFile(path);
        activity?.SetTag("existing_readme_found", !string.IsNullOrEmpty(readme));
        activity?.SetTag("warehouse_readme_exists", !string.IsNullOrEmpty(warehouse.Readme));

        if (string.IsNullOrEmpty(readme) && string.IsNullOrEmpty(warehouse.Readme))
        {
            activity?.SetTag("action", "generate_new_readme");

            var catalogue = DocumentsHelper.GetCatalogue(path);
            activity?.SetTag("catalogue.length", catalogue?.Length ?? 0);

            var kernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
                OpenAIOptions.ChatApiKey,
                path, OpenAIOptions.ChatModel);

            var fileKernel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
                OpenAIOptions.ChatApiKey, path, OpenAIOptions.ChatModel, false);

            var generateReadmePlugin = kernel.Plugins["CodeAnalysis"]["GenerateReadme"];
            var generateReadme = await fileKernel.InvokeAsync(generateReadmePlugin, new KernelArguments(
                new OpenAIPromptExecutionSettings()
                {
                    ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
                })
            {
                ["catalogue"] = catalogue,
                ["git_repository"] = warehouse.Address.Replace(".git", ""),
                ["branch"] = warehouse.Branch
            });

            readme = generateReadme.ToString();
            activity?.SetTag("generated_readme.length", readme?.Length ?? 0);

            var readmeRegex = new Regex(@"<readme>(.*?)</readme>", RegexOptions.Singleline);
            var readmeMatch = readmeRegex.Match(readme);

            if (readmeMatch.Success)
            {
                var extractedContent = readmeMatch.Groups[1].Value;
                readme = extractedContent;
                activity?.SetTag("extraction_method", "readme_tag");
            }
            else
            {
                activity?.SetTag("extraction_method", "raw_content");
            }

            await koalaWikiContext.Warehouses.Where(x => x.Id == warehouse.Id)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.Readme, readme));
        }
        else
        {
            activity?.SetTag("action", "use_existing_readme");
            await koalaWikiContext.Warehouses.Where(x => x.Id == warehouse.Id)
                .ExecuteUpdateAsync(x => x.SetProperty(y => y.Readme, readme));
        }

        if (string.IsNullOrEmpty(readme))
        {
            activity?.SetTag("fallback_to_warehouse_readme", true);
            return warehouse.Readme;
        }

        activity?.SetTag("final_readme.length", readme?.Length ?? 0);
        return readme;
    }
}