using System.Diagnostics;
using KoalaWiki.Entities;
using KoalaWiki.Options;

namespace KoalaWiki.KoalaWarehouse.Pipeline.Steps;

public class UpdateLogGenerationStep : DocumentProcessingStepBase<DocumentProcessingContext, DocumentProcessingContext>
{
    public UpdateLogGenerationStep(ILogger<UpdateLogGenerationStep> logger) : base(logger) { }

    public override string StepName => "生成更新日志";

    public override StepExecutionConfig Configuration => new()
    {
        ExecutionStrategy = StepExecutionStrategy.Optional, // 更新日志是可选功能
        RetryStrategy = StepRetryStrategy.Smart,
        MaxRetryAttempts = 2,
        RetryDelay = TimeSpan.FromSeconds(5),
        StepTimeout = TimeSpan.FromMinutes(8),
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
            typeof(UnauthorizedAccessException),
            typeof(DirectoryNotFoundException)
        }
    };

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

    public override async Task<DocumentProcessingContext> HandleErrorAsync(
        DocumentProcessingContext input, 
        Exception exception, 
        int attemptCount)
    {
        Logger.LogWarning("更新日志生成失败，跳过此步骤，异常: {Exception}", exception.Message);
        
        // 更新日志生成失败时，记录警告但不影响整体流程
        input.SetMetadata("UpdateLogAvailable", false);
        input.SetMetadata("UpdateLogError", exception.Message);
        
        return input;
    }

    public override async Task<bool> IsHealthyAsync(DocumentProcessingContext input)
    {
        try
        {
            // 检查是否是Git仓库
            if (!input.Warehouse.Type.Equals("git", StringComparison.CurrentCultureIgnoreCase))
            {
                return true; // 非Git仓库，健康检查通过（会在CanExecute中跳过）
            }
            
            // 检查Git路径是否存在
            if (!Directory.Exists(input.Document.GitPath))
            {
                Logger.LogWarning("Git路径不存在: {Path}", input.Document.GitPath);
                return false;
            }
            
            // 检查是否是有效的Git仓库
            var gitDir = Path.Combine(input.Document.GitPath, ".git");
            if (!Directory.Exists(gitDir) && !File.Exists(gitDir))
            {
                Logger.LogWarning("不是有效的Git仓库: {Path}", input.Document.GitPath);
                return false;
            }
            
            return true;
        }
        catch (Exception ex)
        {
            Logger.LogWarning(ex, "更新日志生成步骤健康检查失败");
            return false;
        }
    }

    public override async Task<string[]> GetDependenciesAsync()
    {
        // 更新日志生成依赖README内容
        return new[] { "读取生成README" };
    }

    protected override void SetActivityTags(Activity? activity, DocumentProcessingContext input)
    {
        activity?.SetTag("warehouse.id", input.Warehouse.Id);
        activity?.SetTag("warehouse.type", "git");
        activity?.SetTag("git.address", input.Warehouse.Address);
        activity?.SetTag("git.branch", input.Warehouse.Branch);
    }
}