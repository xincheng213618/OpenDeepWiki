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
                ["projectType"] = projectType,
                ["language"] = Prompt.Language
            }, OpenAIOptions.AnalysisModel);


        // 根据尝试次数增强提示词
        var enhancementLevel = Math.Min(attemptNumber, 3);
        var enhancement = enhancementLevel switch
        {
            0 => "\n\nPlease provide a comprehensive analysis in JSON format within <documentation_structure> tags.",
            1 =>
                "\n\nIMPORTANT: You must respond with valid JSON wrapped in <documentation_structure> tags. Ensure the JSON is properly formatted and complete.",
            2 =>
                "\n\nCRITICAL: Previous attempts failed. Please provide ONLY valid JSON within <documentation_structure> tags. Double-check JSON syntax before responding.",
            _ =>
                "\n\nFINAL ATTEMPT: Respond with MINIMAL but VALID JSON in <documentation_structure> tags. Focus on basic structure: {\"categories\":[{\"name\":\"...\",\"description\":\"...\"}],\"architecture_overview\":\"...\"}. Ensure valid JSON syntax."
        };

        return basePrompt + enhancement;
    }


    private static string GetProjectTypeDescription(ClassifyType? classifyType)
    {
        if (classifyType == ClassifyType.Applications)
        {
            return """
                   ## Application System
                   You are generating a documentation catalogue for an enterprise application system. Focus on:
                   - **Business Domain**: Core business logic, domain models, and value propositions
                   - **Architecture**: System design patterns, data flow, and component interactions
                   - **User Experience**: Interface design, user journeys, and accessibility considerations
                   - **Deployment**: Production deployment strategies, scaling considerations, and operational monitoring
                   - **Integration**: External service dependencies, API contracts, and data exchange patterns
                   Structure the documentation to cover all key aspects of the application system.
                   """;
        }

        if (classifyType == ClassifyType.Frameworks)
        {
            return """
                   ## Development Framework
                   You are generating a documentation catalogue for a development framework. Focus on:
                   - **Core Architecture**: Framework design patterns, plugin systems, and extensibility mechanisms
                   - **Developer Experience**: API consistency, documentation quality, and learning curve
                   - **Ecosystem**: Compatible tools, community contributions, and third-party integrations
                   - **Performance**: Runtime efficiency, memory usage, and optimization strategies
                   - **Standards**: Code conventions, best practices, and architectural guidelines
                   Structure the documentation to showcase framework capabilities and usage patterns.
                   """;
        }

        if (classifyType == ClassifyType.Libraries)
        {
            return """
                   ## Reusable Code Library
                   You are generating a documentation catalogue for a reusable code library. Focus on:
                   - **API Design**: Interface consistency, method signatures, and parameter patterns
                   - **Integration Patterns**: Installation methods, dependency management, and compatibility
                   - **Usage Examples**: Common use cases, code samples, and implementation patterns
                   - **Performance**: Efficiency benchmarks, resource usage, and optimization techniques
                   - **Maintenance**: Version compatibility, breaking changes, and migration guides
                   Structure the documentation to facilitate library adoption and integration.
                   """;
        }

        if (classifyType == ClassifyType.DevelopmentTools)
        {
            return """
                   ## Development Tool
                   You are generating a documentation catalogue for a development tool. Focus on:
                   - **Productivity Features**: Core capabilities, automation features, and workflow optimization
                   - **Configuration**: Setup procedures, customization options, and environment integration
                   - **Integration**: IDE support, build system compatibility, and toolchain integration
                   - **User Interface**: Command syntax, GUI elements, and user interaction patterns
                   - **Performance**: Execution speed, resource consumption, and scalability limits
                   Structure the documentation to guide users through setup and effective usage.
                   """;
        }

        if (classifyType == ClassifyType.CLITools)
        {
            return """
                   ## Command-Line Interface Tool
                   You are generating a documentation catalogue for a CLI tool. Focus on:
                   - **Command Structure**: Command hierarchy, argument patterns, and option consistency
                   - **Usability**: Help systems, error messages, and user guidance features
                   - **Automation**: Scripting capabilities, batch operations, and pipeline integration
                   - **Configuration**: Config files, environment variables, and persistent settings
                   - **Performance**: Execution efficiency, startup time, and resource optimization
                   Structure the documentation to enable efficient command-line usage and automation.
                   """;
        }

        if (classifyType == ClassifyType.DevOpsConfiguration)
        {
            return """
                   ## DevOps & Infrastructure Configuration
                   You are generating a documentation catalogue for a DevOps configuration project. Focus on:
                   - **Infrastructure Patterns**: Deployment architectures, scaling strategies, and resource management
                   - **Automation**: CI/CD pipelines, deployment scripts, and infrastructure as code
                   - **Monitoring**: Logging strategies, metrics collection, and alerting configurations
                   - **Security**: Access controls, secret management, and compliance requirements
                   - **Operations**: Maintenance procedures, backup strategies, and disaster recovery
                   Structure the documentation to support operational excellence and reliable deployments.
                   """;
        }

        if (classifyType == ClassifyType.Documentation)
        {
            return """
                   ## Documentation & Testing Project
                   You are generating a documentation catalogue for a documentation or testing project. Focus on:
                   - **Content Structure**: Information architecture, navigation patterns, and content organization
                   - **Quality Assurance**: Testing methodologies, coverage strategies, and validation processes
                   - **Maintenance**: Content lifecycle, update procedures, and version management
                   - **Accessibility**: Documentation formats, search capabilities, and user experience
                   - **Standards**: Style guides, contribution guidelines, and quality metrics
                   Structure the documentation to ensure comprehensive coverage and usability.
                   """;
        }

        return """
               ## General Project Analysis
               You are generating a documentation catalogue for a general software project. Focus on:
               - **Architecture**: System design, component relationships, and technical decisions
               - **Implementation**: Code quality, design patterns, and development practices
               - **Features**: Core functionality, user capabilities, and system behaviors
               - **Setup**: Installation procedures, configuration requirements, and environment setup
               - **Usage**: Common workflows, integration patterns, and practical applications
               Structure the documentation to provide comprehensive coverage of all project aspects.
               """;
    }
}