using System.Diagnostics;
using System.Text.Json;
using KoalaWiki.Entities;

namespace KoalaWiki.KoalaWarehouse.Pipeline.Steps;

public class KnowledgeGraphGenerationStep : DocumentProcessingStepBase<DocumentProcessingContext, DocumentProcessingContext>
{
    public KnowledgeGraphGenerationStep(ILogger<KnowledgeGraphGenerationStep> logger) : base(logger) { }

    public override string StepName => "生成知识图谱";

    public override async Task<DocumentProcessingContext> ExecuteAsync(DocumentProcessingContext context,
        CancellationToken cancellationToken = default)
    {
        using var activity = ActivitySource.StartActivity(StepName);
        SetActivityTags(activity, context);
        Logger.LogInformation("开始执行 {StepName} 步骤", StepName);

        try
        {
            var miniMap = await MiniMapService.GenerateMiniMap(
                context.Catalogue ?? string.Empty, 
                context.Warehouse, 
                context.Document.GitPath);
            
            // 删除现有的知识图谱
            await context.DbContext.MiniMaps.Where(x => x.WarehouseId == context.Warehouse.Id)
                .ExecuteDeleteAsync(cancellationToken: cancellationToken);
            
            // 添加新的知识图谱
            await context.DbContext.MiniMaps.AddAsync(new MiniMap()
            {
                Id = Guid.NewGuid().ToString("N"),
                WarehouseId = context.Warehouse.Id,
                Value = JsonSerializer.Serialize(miniMap, JsonSerializerOptions.Web)
            }, cancellationToken);
            
            activity?.SetTag("minimap.generated", true);                                                               
            context.SetStepResult(StepName, miniMap);
            
            Logger.LogInformation("完成 {StepName} 步骤，已生成知识图谱", StepName);
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
}