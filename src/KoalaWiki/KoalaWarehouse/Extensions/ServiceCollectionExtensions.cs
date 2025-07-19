using KoalaWiki.KoalaWarehouse.Pipeline;
using KoalaWiki.KoalaWarehouse.Pipeline.Steps;
using Microsoft.Extensions.DependencyInjection;

namespace KoalaWiki.KoalaWarehouse.Extensions;

public static class ServiceCollectionExtensions
{
    /// <summary>
    /// 注册文档处理管道相关服务
    /// </summary>
    /// <param name="services">服务集合</param>
    /// <returns>服务集合</returns>
    public static IServiceCollection AddDocumentProcessingPipeline(this IServiceCollection services)
    {
        // 注册处理步骤（按执行顺序）
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, ReadmeGenerationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, CatalogueGenerationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, ProjectClassificationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, KnowledgeGraphGenerationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, OverviewGenerationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, DocumentStructureGenerationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, DocumentContentGenerationStep>();
        services.AddScoped<IDocumentProcessingStep<DocumentProcessingContext, DocumentProcessingContext>, UpdateLogGenerationStep>();

        // 注册管道和协调器
        services.AddScoped<IDocumentProcessingPipeline, DocumentProcessingPipeline>();
        services.AddScoped<IDocumentProcessingOrchestrator, DocumentProcessingOrchestrator>();

        // 注册重构后的DocumentsService
        services.AddScoped<DocumentsService>();

        return services;
    }
}