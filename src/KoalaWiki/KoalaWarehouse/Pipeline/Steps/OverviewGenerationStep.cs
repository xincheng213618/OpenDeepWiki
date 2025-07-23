using System.Diagnostics;
using System.Text.RegularExpressions;
using KoalaWiki.Entities;
using KoalaWiki.KoalaWarehouse.Overview;

namespace KoalaWiki.KoalaWarehouse.Pipeline.Steps;

public class OverviewGenerationStep : DocumentProcessingStepBase<DocumentProcessingContext, DocumentProcessingContext>
{
    public OverviewGenerationStep(ILogger<OverviewGenerationStep> logger) : base(logger) 
    {
        OverviewService.SetLogger(logger);
    }

    public override string StepName => "生成项目概述";

    public override async Task<DocumentProcessingContext> ExecuteAsync(
        DocumentProcessingContext context, 
        CancellationToken cancellationToken = default)
    {
        using var activity = ActivitySource.StartActivity(StepName);
        SetActivityTags(activity, context);

        Logger.LogInformation("开始执行 {StepName} 步骤", StepName);

        try
        {
            // 确保有文件内核实例
            if (context.FileKernelInstance == null)
            {
                context.FileKernelInstance = KernelFactory.GetKernel(
                    OpenAIOptions.Endpoint,
                    OpenAIOptions.ChatApiKey, 
                    context.Document.GitPath, 
                    OpenAIOptions.ChatModel, 
                    false);
            }
            
            var overview = await OverviewService.GenerateProjectOverview(
                context.FileKernelInstance, 
                context.Catalogue ?? string.Empty,
                context.GitRepository,
                context.Warehouse.Branch, 
                context.Readme ?? string.Empty, 
                context.Classification);

            // 处理 project_analysis 标签
            var projectAnalysisRegex = new Regex(@"<project_analysis>(.*?)</project_analysis>", RegexOptions.Singleline);
            var projectAnalysisMatch = projectAnalysisRegex.Match(overview);
            if (projectAnalysisMatch.Success)
            {
                overview = overview.Replace(projectAnalysisMatch.Value, "");
            }

            // 处理 blog 标签
            var blogRegex = new Regex(@"<blog>(.*?)</blog>", RegexOptions.Singleline);
            var blogMatch = blogRegex.Match(overview);
            if (blogMatch.Success)
            {
                overview = blogMatch.Groups[1].Value;
            }

            // 删除现有的概述
            await context.DbContext.DocumentOverviews.Where(x => x.DocumentId == context.Document.Id)
                .ExecuteDeleteAsync(cancellationToken: cancellationToken);

            // 添加新的概述
            await context.DbContext.DocumentOverviews.AddAsync(new DocumentOverview()
            {
                Content = overview,
                Title = "",
                DocumentId = context.Document.Id,
                Id = Guid.NewGuid().ToString("N")
            }, cancellationToken);

            context.Overview = overview;
            activity?.SetTag("overview.length", overview?.Length ?? 0);
            context.SetStepResult(StepName, overview);
            
            Logger.LogInformation("完成 {StepName} 步骤，概述长度: {Length}", 
                StepName, overview?.Length ?? 0);
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
        activity?.SetTag("git.repository", input.GitRepository);
        activity?.SetTag("branch", input.Warehouse.Branch);
    }
}