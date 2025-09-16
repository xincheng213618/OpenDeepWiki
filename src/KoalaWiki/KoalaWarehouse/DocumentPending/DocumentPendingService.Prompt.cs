using KoalaWiki.Domains;
using KoalaWiki.Options;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel;

namespace KoalaWiki.KoalaWarehouse.DocumentPending;

public partial class DocumentPendingService
{
    public static async Task<string> GetDocumentPendingPrompt(ClassifyType? classifyType, string codeFiles,
        string gitRepository, string branch, string title, string prompt)
    {
        string projectType = GetProjectTypeDescription(classifyType);

        // Add tool usage limitations to prevent context overflow
        string toolUsageLimitations = """
                                       ## CRITICAL TOOL USAGE LIMITATIONS (Context Overflow Prevention)
                                       
                                       **PARALLEL READ OPERATIONS**
                                       - MANDATORY: Always perform PARALLEL File.Read calls — batch multiple files in a SINGLE message for maximum efficiency
                                       - CRITICAL: Read MULTIPLE files simultaneously in one operation
                                       - PROHIBITED: Sequential one-by-one file reads (inefficient and wastes context capacity)
                                       
                                       **EDITING OPERATION LIMITS**
                                       - HARD LIMIT: Maximum of 3 editing operations total (Docs.MultiEdit + Docs.Edit combined)
                                       - PRIORITY: Use Docs.MultiEdit for grouped, related changes — far more efficient than multiple individual edits
                                       - STRATEGIC PLANNING: Combine adjustments into minimal edit operations to stay within the limit
                                       - Use Docs.Write **only once** for initial creation or full rebuild (counts as initial structure creation, not part of the 3 edits)
                                       - Always verify content before further changes using Docs.Read (Reads do NOT count toward limit)
                                       
                                       **RECOMMENDED EDITING SEQUENCE**
                                       1. Initial creation → Docs.Write (one-time full structure creation)
                                       2. Refinements → Prefer Docs.MultiEdit for bulk improvements (counts toward 3-edit limit)
                                       3. Fallback → Use Docs.Edit only when MultiEdit isn’t viable (also counts toward limit)
                                       4. Validation → Use Docs.Read after significant changes to confirm before next operation
                                       
                                       """;

        return await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.GenerateDocs),
            new KernelArguments()
            {
                ["code_files"] = codeFiles,
                ["prompt"] = prompt,
                ["git_repository"] = gitRepository.Replace(".git", ""),
                ["branch"] = branch,
                ["title"] = title,
                ["language"] = Prompt.Language,
                ["projectType"] = projectType + toolUsageLimitations
            }, OpenAIOptions.ChatModel);
    }

    private static string GetProjectTypeDescription(ClassifyType? classifyType)
    {
        if (classifyType == ClassifyType.Applications)
        {
            return """
                   ## Enterprise Application Documentation Protocol
                   <thinking>
                   Generate comprehensive enterprise application documentation that enables successful adoption, deployment, and maintenance through systematic coverage of user workflows, technical architecture, and operational procedures.
                   </thinking>

                   **DOCUMENTATION GENERATION METHODOLOGY:**
                   Create exhaustive application documentation through structured understanding-focused protocols:

                   **Phase 1: Conceptual Foundation Documentation**
                   - **Application Philosophy & Purpose**: Think step by step about the application's core mission, design philosophy, and value proposition
                   - **Architectural Concepts**: Comprehensive explanation of system design principles, patterns, and architectural decisions
                   - **User Experience Design**: Detailed analysis of user workflow concepts, interaction patterns, and usability considerations
                   - **Technology Stack Rationale**: In-depth explanation of technology choices, trade-offs, and architectural implications

                   **Phase 2: Implementation Understanding Documentation**
                   - **System Architecture Analysis**: Detailed examination of component relationships, data flow patterns, and integration strategies
                   - **Business Logic Exploration**: Comprehensive explanation of core business processes, rules, and decision-making workflows
                   - **Data Management Philosophy**: Analysis of data modeling approaches, persistence strategies, and information architecture
                   - **Security Architecture**: Thorough explanation of security concepts, authentication flows, and protection mechanisms

                   **Phase 3: Operational Understanding Documentation**
                   - **Deployment Strategy Analysis**: Conceptual explanation of deployment approaches, environment management, and scalability considerations
                   - **Monitoring Philosophy**: Understanding of observability concepts, logging strategies, and performance measurement approaches
                   - **Maintenance Methodology**: Analysis of operational procedures, troubleshooting approaches, and maintenance strategies
                   - **Integration Ecosystem**: Comprehensive explanation of external dependencies, API design philosophy, and integration patterns

                   **DOCUMENTATION QUALITY STANDARDS:**
                   - **Concept-First Approach**: Begin every section with comprehensive conceptual explanation before any implementation details
                   - **Understanding-Focused Content**: Prioritize explaining 'why' and 'how' systems work over showing what they do
                   - **Architectural Reasoning**: Extensive analysis of design decisions, trade-offs, and implementation rationale
                   - **Minimal Code Policy**: Use code snippets sparingly and only to illustrate critical concepts or configurations
                   """;
        }

        if (classifyType == ClassifyType.Frameworks)
        {
            return """
                   ## Development Framework Documentation Protocol
                   <thinking>
                   Create comprehensive framework documentation that facilitates developer adoption, mastery, and ecosystem integration through systematic coverage of concepts, APIs, and practical implementation guidance.
                   </thinking>

                   **FRAMEWORK DOCUMENTATION METHODOLOGY:**
                   Generate complete framework documentation through structured development-focused protocols:

                   **Phase 1: Framework Adoption Documentation**
                   - **Quick Start Guide**: Complete installation procedures, environment setup, and first project creation workflows
                   - **Core Concepts Explanation**: Framework philosophy, design principles, architectural patterns, and mental models
                   - **Developer Onboarding**: Learning path documentation, skill prerequisites, and concept progression strategies
                   - **Configuration Management**: Framework configuration options, environment setup, and customization capabilities

                   **Phase 2: Comprehensive API Documentation**
                   - **Complete API Reference**: Full method documentation, parameter specifications, return values, and usage examples
                   - **Extension & Plugin System**: Plugin development guides, hook systems, and extensibility mechanisms
                   - **Advanced Features**: Complex usage patterns, performance optimization, and advanced configuration options
                   - **Integration Patterns**: Framework integration with popular tools, libraries, and development ecosystems

                   **Phase 3: Practical Implementation Guidance**
                   - **Tutorial & Example Collection**: Step-by-step implementation guides, real-world examples, and best practice demonstrations
                   - **Migration & Upgrade Documentation**: Version migration guides, breaking change handling, and compatibility maintenance
                   - **Performance & Optimization**: Performance tuning guides, resource optimization, and scaling considerations
                   - **Community & Ecosystem**: Third-party integration guides, community resources, and contribution procedures

                   **FRAMEWORK DOCUMENTATION STANDARDS:**
                   - **Conceptual Mastery**: Focus on explaining framework philosophy, design patterns, and architectural principles
                   - **Progressive Understanding**: Content must build conceptual understanding from basic principles to advanced patterns
                   - **Framework Philosophy**: Comprehensively explain the framework's design philosophy, trade-offs, and intended usage patterns
                   - **Developer Mental Models**: Help developers build correct mental models of framework behavior and capabilities
                   """;
        }

        if (classifyType == ClassifyType.Libraries)
        {
            return """
                   ## Reusable Library Documentation Protocol
                   <thinking>
                   Create comprehensive library documentation that enables seamless integration, effective usage, and optimal performance through systematic coverage of APIs, implementation patterns, and best practices.
                   </thinking>

                   **LIBRARY DOCUMENTATION METHODOLOGY:**
                   Generate complete library documentation through structured integration-focused protocols:

                   **Phase 1: Library Integration Documentation**
                   - **Installation & Setup Guide**: Package manager installation, dependency management, and environment configuration
                   - **Quick Start Examples**: Immediate usage examples, basic implementation patterns, and key feature demonstrations
                   - **API Overview**: Complete public interface documentation, method categories, and functionality mapping
                   - **Type System Integration**: Type definitions, generic usage patterns, and TypeScript/typing support

                   **Phase 2: Comprehensive Usage Documentation**
                   - **Complete API Reference**: Full method signatures, parameter specifications, return types, and comprehensive usage examples
                   - **Implementation Patterns**: Common usage scenarios, design pattern applications, and integration strategies
                   - **Advanced Features**: Complex functionality, configuration options, and advanced usage techniques
                   - **Error Handling**: Exception documentation, error recovery patterns, and debugging guidance

                   **Phase 3: Optimization & Best Practices**
                   - **Performance Documentation**: Performance characteristics, optimization techniques, and resource usage patterns
                   - **Best Practices Guide**: Recommended implementation approaches, common pitfalls, and optimization strategies
                   - **Compatibility & Migration**: Version compatibility, upgrade procedures, and breaking change documentation
                   - **Integration Examples**: Real-world integration scenarios, framework compatibility, and ecosystem usage

                   **LIBRARY DOCUMENTATION STANDARDS:**
                   - **Conceptual API Understanding**: Explain the library's design philosophy, patterns, and intended usage concepts
                   - **API Design Rationale**: Comprehensive explanation of API design decisions, parameter choices, and method organization
                   - **Integration Philosophy**: Focus on understanding integration patterns, architectural considerations, and design implications
                   - **Performance Concepts**: Explain performance characteristics, optimization principles, and resource management approaches
                   """;
        }

        if (classifyType == ClassifyType.DevelopmentTools)
        {
            return """
                   ## Development Tool Documentation Protocol
                   <thinking>
                   Create comprehensive development tool documentation that maximizes developer productivity through detailed setup procedures, feature exploration, and workflow integration guidance.
                   </thinking>

                   **DEVELOPMENT TOOL DOCUMENTATION METHODOLOGY:**
                   Generate complete tool documentation through structured productivity-focused protocols:

                   **Phase 1: Tool Setup & Configuration Documentation**
                   - **Installation Guide**: Complete installation procedures, system requirements, and dependency management
                   - **Configuration Reference**: Comprehensive settings documentation, customization options, and preference management
                   - **Environment Integration**: Development environment setup, IDE plugins, and toolchain integration procedures
                   - **Initial Setup Workflows**: First-time configuration, account setup, and essential configuration procedures

                   **Phase 2: Feature & Capability Documentation**
                   - **Core Feature Guide**: Complete feature documentation, capability explanations, and functionality mapping
                   - **Workflow Integration**: Development workflow optimization, productivity enhancement techniques, and automation capabilities
                   - **Advanced Features**: Complex functionality, power-user features, and specialized use case documentation
                   - **Automation & Scripting**: Automation capabilities, scripting interfaces, and batch operation procedures

                   **Phase 3: Integration & Optimization Documentation**
                   - **Development Environment Integration**: IDE support, editor plugins, and development workflow integration
                   - **Build System Compatibility**: Build tool integration, CI/CD pipeline compatibility, and deployment workflow support
                   - **Performance Optimization**: Tool performance tuning, resource management, and efficiency optimization
                   - **Troubleshooting & Support**: Common issue resolution, debugging procedures, and performance problem diagnosis

                   **TOOL DOCUMENTATION STANDARDS:**
                   - **Step-by-Step Procedures**: All setup and usage procedures must include detailed, sequential instructions
                   - **Real-World Examples**: Include practical examples that demonstrate actual development workflow scenarios
                   - **Integration Verification**: All integration claims must be supported by actual implementation examples
                   - **Productivity Focus**: Emphasize practical productivity improvements and workflow optimization techniques
                   """;
        }

        if (classifyType == ClassifyType.CLITools)
        {
            return """
                   ## CLI Tool Documentation Protocol
                   <thinking>
                   Create comprehensive command-line tool documentation that enables mastery through detailed command references, practical examples, and automation integration guidance.
                   </thinking>

                   **CLI TOOL DOCUMENTATION METHODOLOGY:**
                   Generate complete CLI documentation through structured command-line focused protocols:

                   **Phase 1: Installation & Configuration Documentation**
                   - **Installation Guide**: Multiple installation methods, system requirements, and platform-specific procedures
                   - **Environment Setup**: Environment variable configuration, PATH setup, and shell integration procedures
                   - **Configuration Management**: Config file formats, persistent settings, and preference customization
                   - **Shell Integration**: Command completion, alias setup, and shell-specific optimization

                   **Phase 2: Complete Command Reference Documentation**
                   - **Command Hierarchy**: Complete command structure, subcommand organization, and option categorization
                   - **Detailed Command Reference**: Every command with full option documentation, parameter specifications, and usage examples
                   - **Input/Output Patterns**: Data input methods, output formatting options, and result processing techniques
                   - **Interactive Features**: Interactive modes, prompt handling, and user input processing

                   **Phase 3: Automation & Integration Documentation**
                   - **Scripting Integration**: Automation examples, scripting patterns, and batch operation procedures
                   - **Pipeline Integration**: Data pipeline usage, input/output chaining, and workflow automation
                   - **CI/CD Integration**: Continuous integration usage, automated deployment, and build process integration
                   - **Advanced Usage Patterns**: Complex workflows, advanced features, and power-user techniques

                   **CLI DOCUMENTATION STANDARDS:**
                   - **Executable Examples**: All command examples must be complete, runnable, and produce documented results
                   - **Comprehensive Command Coverage**: Document every command, option, and usage pattern with examples
                   - **Automation Focus**: Emphasize scripting capabilities and automation workflow integration
                   - **Error Handling Documentation**: Include comprehensive error message explanations and resolution procedures
                   """;
        }

        if (classifyType == ClassifyType.DevOpsConfiguration)
        {
            return """
                   ## DevOps Infrastructure Documentation Protocol
                   <thinking>
                   Create comprehensive infrastructure documentation that enables successful deployment, operation, and maintenance through detailed procedures, configuration guidance, and operational excellence practices.
                   </thinking>

                   **DEVOPS DOCUMENTATION METHODOLOGY:**
                   Generate complete infrastructure documentation through structured operational protocols:

                   **Phase 1: Infrastructure Architecture Documentation**
                   - **System Architecture Overview**: Complete infrastructure diagrams, component relationships, and deployment topology
                   - **Environment Strategy**: Development, staging, and production environment documentation with configuration differences
                   - **Service Dependencies**: Service interaction maps, dependency chains, and integration architecture documentation
                   - **Resource Management**: Infrastructure resource allocation, scaling strategies, and capacity planning procedures

                   **Phase 2: Deployment & Configuration Documentation**
                   - **Deployment Procedures**: Step-by-step deployment guides, environment preparation, and configuration procedures
                   - **Configuration Management**: Complete configuration reference, environment variables, and customization options
                   - **Infrastructure as Code**: IaC implementation documentation, version control procedures, and deployment automation
                   - **Environment Provisioning**: Infrastructure provisioning procedures, resource creation, and environment setup

                   **Phase 3: Operations & Maintenance Documentation**
                   - **Monitoring & Observability**: Complete monitoring setup, logging configuration, alerting procedures, and performance tracking
                   - **Security & Compliance**: Security implementation procedures, access controls, compliance requirements, and audit processes
                   - **Operational Procedures**: Maintenance workflows, backup procedures, disaster recovery, and incident response protocols
                   - **Scaling & Optimization**: Scaling procedures, performance optimization, and resource efficiency improvement techniques

                   **DEVOPS DOCUMENTATION STANDARDS:**
                   - **Executable Procedures**: All deployment and operational procedures must include complete, step-by-step instructions
                   - **Configuration Completeness**: Document every configuration option, environment variable, and customization capability
                   - **Security Integration**: Include comprehensive security procedures and compliance requirement documentation
                   - **Operational Excellence**: Focus on production-ready procedures and enterprise-grade operational practices
                   """;
        }

        if (classifyType == ClassifyType.Documentation)
        {
            return """
                   ## Documentation Project Documentation Protocol
                   <thinking>
                   Create comprehensive meta-documentation that enables effective contribution, maintenance, and improvement of documentation projects through detailed processes, quality standards, and workflow guidance.
                   </thinking>

                   **DOCUMENTATION PROJECT METHODOLOGY:**
                   Generate complete documentation project documentation through structured knowledge management protocols:

                   **Phase 1: Project Structure & Purpose Documentation**
                   - **Project Overview**: Documentation objectives, scope definition, target audiences, and success metrics
                   - **Content Architecture**: Information structure, navigation design, and content organization principles
                   - **Audience Analysis**: User persona documentation, content consumption patterns, and accessibility requirements
                   - **Content Strategy**: Content creation guidelines, maintenance procedures, and lifecycle management

                   **Phase 2: Contribution & Quality Assurance Documentation**
                   - **Contribution Guide**: Complete contributor onboarding, writing guidelines, and submission procedures
                   - **Style & Standards**: Writing style guides, formatting standards, and consistency requirements
                   - **Review Processes**: Content review workflows, approval procedures, and quality gates
                   - **Quality Assurance**: Testing methodologies, accuracy validation, and content quality measurement

                   **Phase 3: Tools & Workflow Documentation**
                   - **Documentation Toolchain**: Complete tool documentation, build processes, and publication workflows
                   - **Content Management**: Version control procedures, content organization, and asset management
                   - **Automation & Integration**: Automated testing, content generation, and publication automation
                   - **Maintenance Procedures**: Content update workflows, link validation, and accuracy maintenance procedures

                   **DOCUMENTATION PROJECT STANDARDS:**
                   - **Process Completeness**: Document every aspect of the documentation creation, review, and maintenance process
                   - **Contributor Experience**: Focus on enabling easy contribution and effective collaboration
                   - **Quality Framework**: Include comprehensive quality assurance procedures and measurement standards
                   - **Sustainability Focus**: Emphasize long-term maintainability and scalable documentation practices
                   """;
        }

        return """
               ## General Project Documentation Protocol
               <thinking>
               Create comprehensive software project documentation that enables understanding, adoption, and contribution through systematic coverage of project purpose, implementation guidance, and development procedures.
               </thinking>

               **COMPREHENSIVE PROJECT DOCUMENTATION METHODOLOGY:**
               Generate complete project documentation through structured multi-purpose protocols:

               **Phase 1: Project Understanding & Adoption Documentation**
               - **Project Overview & Purpose**: Complete project description, value proposition, key features, and target use case documentation
               - **Getting Started Guide**: Comprehensive installation procedures, environment setup, and initial configuration workflows
               - **Quick Start Examples**: Immediate usage examples, basic implementation patterns, and core feature demonstrations
               - **Architecture Understanding**: System design overview, component relationships, and technical decision documentation

               **Phase 2: Implementation & Usage Documentation**
               - **Feature Documentation**: Complete feature explanations, configuration options, and implementation guidance
               - **API & Interface Reference**: Complete interface documentation, method specifications, and usage examples
               - **Configuration & Customization**: Comprehensive configuration options, environment setup, and customization capabilities
               - **Integration Patterns**: Integration examples, compatibility information, and ecosystem usage guidance

               **Phase 3: Development & Contribution Documentation**
               - **Development Environment Setup**: Complete development environment configuration, build procedures, and tool requirements
               - **Contributing Guidelines**: Contribution procedures, code standards, testing requirements, and submission workflows
               - **Architecture & Design**: Internal architecture documentation, design principles, and development guidelines
               - **Maintenance & Operations**: Deployment procedures, operational guidelines, and maintenance workflows

               **UNIVERSAL DOCUMENTATION STANDARDS:**
               - **Complete Implementation Examples**: All documentation must include complete, executable examples and configuration samples
               - **Step-by-Step Guidance**: Every procedure must be documented with detailed, sequential instructions
               - **Evidence-Based Content**: All technical claims must be supported by actual code references and implementation examples
               - **Multi-Audience Approach**: Address the needs of users, developers, and operators with appropriate depth and focus
               """;
    }
}