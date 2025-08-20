using KoalaWiki.Prompts;

namespace KoalaWiki.KoalaWarehouse.GenerateThinkCatalogue;

public partial class GenerateThinkCatalogueService
{
    public static async Task<string> GenerateThinkCataloguePromptAsync(ClassifyType? classifyType,
        string catalogue, int attemptNumber)
    {
        var projectType = GetProjectTypeDescription(classifyType);

        var basePrompt = await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.AnalyzeCatalogue),
            new KernelArguments()
            {
                ["code_files"] = catalogue,
                ["projectType"] = projectType
            }, OpenAIOptions.AnalysisModel);


        // 根据尝试次数增强提示词
        var enhancementLevel = Math.Min(attemptNumber, 3);
        var enhancement = enhancementLevel switch
        {
            0 => "\n\nGenerate documentation catalog in the specified hierarchical JSON format within <documentation_structure> tags.",
            1 =>
                "\n\nIMPORTANT: You must respond with valid JSON using the items/children structure within <documentation_structure> tags. Follow the exact format specified.",
            2 =>
                "\n\nCRITICAL: Previous attempts failed. Generate ONLY valid JSON within <documentation_structure> tags. Use the hierarchical items structure with title, name, and children fields.",
            _ =>
                "\n\nFINAL ATTEMPT: Generate minimal but valid JSON structure. Must include: {\"items\":[{\"title\":\"getting-started\",\"name\":\"入门指南\",\"children\":[...]},{\"title\":\"deep-dive\",\"name\":\"深入解剖\",\"children\":[...]}]}."
        };

        return basePrompt + enhancement;
    }


    private static string GetProjectTypeDescription(ClassifyType? classifyType)
    {
        if (classifyType == ClassifyType.Applications)
        {
            return """
                   ## Application System
                   Focus on application-specific documentation needs:
                   - **Getting Started**: Business purpose, quick setup, basic usage patterns
                   - **Deep Dive**: System architecture, core features, technical implementation, integration points
                   Emphasize user workflows, business logic, and deployment considerations.
                   """;
        }

        if (classifyType == ClassifyType.Frameworks)
        {
            return """
                   ## Development Framework
                   Focus on framework-specific documentation needs:
                   - **Getting Started**: Framework purpose, quick setup, basic concepts, simple examples
                   - **Deep Dive**: Architecture patterns, extensibility mechanisms, API design, performance optimization
                   Emphasize developer experience, plugin systems, and integration workflows.
                   """;
        }

        if (classifyType == ClassifyType.Libraries)
        {
            return """
                   ## Reusable Code Library
                   Focus on library-specific documentation needs:
                   - **Getting Started**: Library purpose, installation, basic usage, common examples
                   - **Deep Dive**: API design, advanced features, performance characteristics, customization options
                   Emphasize practical usage patterns, integration strategies, and version compatibility.
                   """;
        }

        if (classifyType == ClassifyType.DevelopmentTools)
        {
            return """
                   ## Development Tool
                   Focus on tool-specific documentation needs:
                   - **Getting Started**: Tool purpose, installation, basic configuration, first workflow
                   - **Deep Dive**: Advanced features, customization options, integration patterns, optimization techniques
                   Emphasize practical workflows, automation capabilities, and IDE integration.
                   """;
        }

        if (classifyType == ClassifyType.CLITools)
        {
            return """
                   ## Command-Line Interface Tool
                   Focus on CLI-specific documentation needs:
                   - **Getting Started**: Tool purpose, installation, basic commands, common workflows
                   - **Deep Dive**: Command reference, advanced usage, scripting integration, configuration options
                   Emphasize command syntax, automation capabilities, and pipeline integration.
                   """;
        }

        if (classifyType == ClassifyType.DevOpsConfiguration)
        {
            return """
                   ## DevOps & Infrastructure Configuration
                   Focus on DevOps-specific documentation needs:
                   - **Getting Started**: Infrastructure purpose, basic setup, deployment workflow, monitoring basics
                   - **Deep Dive**: Advanced automation, security configuration, scaling strategies, operational procedures
                   Emphasize deployment patterns, infrastructure as code, and operational excellence.
                   """;
        }

        if (classifyType == ClassifyType.Documentation)
        {
            return """
                   ## Documentation & Testing Project
                   Focus on documentation-specific needs:
                   - **Getting Started**: Project purpose, content overview, contribution basics, style guidelines
                   - **Deep Dive**: Content architecture, testing methodologies, maintenance procedures, quality standards
                   Emphasize content organization, quality assurance, and contributor workflows.
                   """;
        }

        return """
               ## General Project Analysis
               Focus on general project documentation needs:
               - **Getting Started**: Project purpose, setup instructions, basic concepts, common usage
               - **Deep Dive**: System architecture, core features, technical implementation, advanced customization
               Provide comprehensive coverage balancing accessibility with technical depth.
               """;
    }
}