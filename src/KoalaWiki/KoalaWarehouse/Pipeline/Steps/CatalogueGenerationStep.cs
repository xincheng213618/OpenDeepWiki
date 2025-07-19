using System.Diagnostics;
using KoalaWiki.Options;
using Microsoft.EntityFrameworkCore;

namespace KoalaWiki.KoalaWarehouse.Pipeline.Steps;

public class CatalogueGenerationStep : DocumentProcessingStepBase<DocumentProcessingContext, DocumentProcessingContext>
{
    public CatalogueGenerationStep(ILogger<CatalogueGenerationStep> logger) : base(logger) { }

    public override string StepName => "读取并生成目录结构";

    public override async Task<DocumentProcessingContext> ExecuteAsync(
        DocumentProcessingContext context, 
        CancellationToken cancellationToken = default)
    {
        using var activity = ActivitySource.StartActivity(StepName);
        SetActivityTags(activity, context);

        Logger.LogInformation("开始执行 {StepName} 步骤", StepName);

        try
        {
            var catalogue = context.Warehouse.OptimizedDirectoryStructure;

            if (string.IsNullOrWhiteSpace(catalogue))
            {
                activity?.SetTag("action", "generate_new_catalogue");
                Logger.LogInformation("生成新的目录结构");
                
                catalogue = await DocumentsService.GetCatalogueSmartFilterOptimizedAsync(
                    context.Document.GitPath, 
                    context.Readme ?? string.Empty);
                
                if (!string.IsNullOrWhiteSpace(catalogue))
                {
                    await context.DbContext.Warehouses.Where(x => x.Id == context.Warehouse.Id)
                        .ExecuteUpdateAsync(x => x.SetProperty(y => y.OptimizedDirectoryStructure, catalogue), cancellationToken: cancellationToken);
                }
            }
            else
            {
                activity?.SetTag("action", "use_existing_catalogue");
                Logger.LogInformation("使用现有目录结构");
            }

            context.Catalogue = catalogue;
            activity?.SetTag("catalogue.length", catalogue?.Length ?? 0);
            context.SetStepResult(StepName, catalogue);
            
            Logger.LogInformation("完成 {StepName} 步骤，目录结构长度: {Length}", 
                StepName, catalogue?.Length ?? 0);
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
    }
}