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

    protected override void SetActivityTags(Activity? activity, DocumentProcessingContext input)
    {
        activity?.SetTag("warehouse.id", input.Warehouse.Id);
        activity?.SetTag("path", input.Document.GitPath);
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