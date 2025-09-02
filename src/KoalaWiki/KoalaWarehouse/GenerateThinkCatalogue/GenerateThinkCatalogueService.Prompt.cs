using KoalaWiki.Prompts;

namespace KoalaWiki.KoalaWarehouse.GenerateThinkCatalogue;

public partial class GenerateThinkCatalogueService
{
    public static async Task<string> GenerateThinkCataloguePromptAsync(ClassifyType? classifyType,
        string catalogue, int attemptNumber)
    {
        var projectType = GetProjectTypeDescription(classifyType);
        var language = Environment.GetEnvironmentVariable("LANGUAGE");
        if (string.IsNullOrWhiteSpace(language))
        {
            // Default to English if not provided; Prompt.Language note will still be appended downstream
            language = "English";
        }

        var basePrompt = await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.AnalyzeCatalogue),
            new KernelArguments()
            {
                ["code_files"] = catalogue,
                ["projectType"] = projectType,
                ["language"] = language
            }, OpenAIOptions.AnalysisModel);

        // Attempt-based reinforcement aligned with AnalyzeCatalogue.md output contract
        var enhancementLevel = Math.Min(attemptNumber, 3);
        var enhancement = enhancementLevel switch
        {
            0 => "\n\nRespond with JSON only following the items/children schema. No code fences, XML/HTML tags, or explanations.",
            1 =>
                "\n\nIMPORTANT: Output valid JSON only (no code fences or tags). Use fields: title (kebab-case), name, requirement, children[]. Top-level must include 'getting-started' then 'deep-dive'.",
            2 =>
                "\n\nCRITICAL: Previous output was invalid. Return ONLY valid JSON with an 'items' array and the two required top-level modules ('getting-started', 'deep-dive') in this order. No extra text.",
            _ =>
                "\n\nFINAL ATTEMPT: Return minimal valid JSON with exactly the two required top-level modules and empty children arrays. No extra text."
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

