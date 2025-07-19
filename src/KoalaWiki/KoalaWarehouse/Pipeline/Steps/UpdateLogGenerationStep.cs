using System.Diagnostics;
using KoalaWiki.Entities;
using KoalaWiki.Options;

namespace KoalaWiki.KoalaWarehouse.Pipeline.Steps;

public class UpdateLogGenerationStep : DocumentProcessingStepBase<DocumentProcessingContext, DocumentProcessingContext>
{
    public UpdateLogGenerationStep(ILogger<UpdateLogGenerationStep> logger) : base(logger) { }

    public override string StepName => "生成更新日志";

    public override async Task<bool> CanExecuteAsync(DocumentProcessingContext input)
    {
        return input.Warehouse.Type.Equals("git", StringComparison.CurrentCultureIgnoreCase);
    }

    public override async Task<DocumentProcessingContext> ExecuteAsync(
        DocumentProcessingContext context, 
        CancellationToken cancellationToken = default)
    {
        using var activity = ActivitySource.StartActivity(StepName);
        SetActivityTags(activity, context);

        Logger.LogInformation("开始执行 {StepName} 步骤", StepName);

        try
        {
            // 确保有内核实例
            context.KernelInstance ??= KernelFactory.GetKernel(
                OpenAIOptions.Endpoint,
                OpenAIOptions.ChatApiKey,
                context.Document.GitPath,
                OpenAIOptions.ChatModel);

            // 删除现有的更新日志记录
            await context.DbContext.DocumentCommitRecords.Where(x => x.WarehouseId == context.Warehouse.Id)
                .ExecuteDeleteAsync(cancellationToken: cancellationToken);

            // 生成更新日志
            var committer = await DocumentsService.GenerateUpdateLogAsync(
                context.Document.GitPath, 
                context.Readme ?? string.Empty,
                context.Warehouse.Address,
                context.Warehouse.Branch,
                context.KernelInstance);

            var records = committer.Select(x => new DocumentCommitRecord()
            {
                WarehouseId = context.Warehouse.Id,
                CreatedAt = DateTime.Now,
                Author = string.Empty,
                Id = Guid.NewGuid().ToString("N"),
                CommitMessage = x.description,
                Title = x.title,
                LastUpdate = x.date,
            });

            await context.DbContext.DocumentCommitRecords.AddRangeAsync(records, cancellationToken);

            activity?.SetTag("commit_records.count", records.Count());
            context.SetStepResult(StepName, records.Count());
            
            Logger.LogInformation("完成 {StepName} 步骤，生成更新记录数量: {Count}", 
                StepName, records.Count());
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
        activity?.SetTag("warehouse.type", "git");
        activity?.SetTag("git.address", input.Warehouse.Address);
        activity?.SetTag("git.branch", input.Warehouse.Branch);
    }
}