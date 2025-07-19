using System.Diagnostics;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace KoalaWiki.KoalaWarehouse.Pipeline;

public interface IDocumentProcessingStep<TInput, TOutput>
{
    string StepName { get; }
    Task<TOutput> ExecuteAsync(TInput input, CancellationToken cancellationToken = default);
    Task<bool> CanExecuteAsync(TInput input);
}

public abstract class DocumentProcessingStepBase<TInput, TOutput>(ILogger logger)
    : IDocumentProcessingStep<TInput, TOutput>
{
    protected readonly ActivitySource ActivitySource = new("KoalaWiki.Warehouse.Pipeline");
    protected readonly ILogger Logger = logger;

    public abstract string StepName { get; }
    
    public abstract Task<TOutput> ExecuteAsync(TInput input, CancellationToken cancellationToken = default);
    
    public virtual Task<bool> CanExecuteAsync(TInput input) => Task.FromResult(true);
    
    protected virtual void SetActivityTags(Activity? activity, TInput input)
    {
        // 基础实现，子类可以重写添加特定的标签
    }
}