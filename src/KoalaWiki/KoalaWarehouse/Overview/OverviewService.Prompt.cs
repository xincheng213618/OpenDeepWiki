using KoalaWiki.Prompts;

namespace KoalaWiki.KoalaWarehouse.Overview;

public partial class OverviewService
{
    public static async Task<string> GetOverviewPrompt(ClassifyType? classifyType, string codeFiles,
        string gitRepository, string branch, string readme)
    {
        string projectType = GetProjectTypeDescription(classifyType);

        return await PromptContext.Warehouse(nameof(PromptConstant.Warehouse.Overview),
            new KernelArguments()
            {
                ["code_files"] = codeFiles,
                ["git_repository"] = gitRepository.Replace(".git", ""),
                ["branch"] = branch,
                ["readme"] = readme,
                ["projectType"] = projectType,
                ["language"] = Prompt.Language
            }, OpenAIOptions.ChatModel);
    }

    private static string GetProjectTypeDescription(ClassifyType? classifyType)
    {
        if (classifyType == ClassifyType.Applications)
        {
            return """
                ## Enterprise Application Analysis Protocol
                <thinking>
                Conduct systematic analysis of enterprise application architecture, focusing on business value, technical implementation, and operational excellence.
                </thinking>
                
                **ANALYSIS METHODOLOGY:**
                Execute comprehensive application assessment through structured phases:
                
                **Phase 1: Business Domain Intelligence**
                - **Core Business Logic**: Document domain models, business rules, and value proposition mechanisms
                - **Use Case Mapping**: Identify primary user journeys, feature interactions, and business process automation
                - **Value Chain Analysis**: Analyze how the application creates, delivers, and captures business value
                - **Stakeholder Impact**: Assess user roles, permission models, and workflow optimization
                
                **Phase 2: Technical Architecture Assessment**
                - **System Design Patterns**: Document architectural patterns, design principles, and technical decisions
                - **Component Interactions**: Map service dependencies, data flow patterns, and integration architectures
                - **Scalability Design**: Analyze scaling strategies, performance characteristics, and resource utilization
                - **Security Implementation**: Document authentication, authorization, and security control mechanisms
                
                **Phase 3: Operational Excellence Evaluation**
                - **Deployment Strategies**: Analyze deployment patterns, environment management, and release processes
                - **Monitoring & Observability**: Document logging, metrics, alerting, and operational visibility
                - **Maintenance Procedures**: Assess backup strategies, disaster recovery, and operational workflows
                - **Performance Optimization**: Identify bottlenecks, optimization opportunities, and resource efficiency
                
                **QUALITY REQUIREMENTS:**
                - **Evidence-Based Analysis**: All claims must be verifiable against actual codebase
                - **Comprehensive Coverage**: Address all critical application components and workflows
                - **Technical Depth**: Provide actionable insights for technical decision-makers
                - **Practical Focus**: Emphasize real-world implementation and operational considerations
                """;
        }
        
        if (classifyType == ClassifyType.Frameworks)
        {
            return """
                ## Development Framework Analysis Protocol
                <thinking>
                Systematically evaluate framework architecture, developer experience, and ecosystem positioning to assess adoption viability and technical excellence.
                </thinking>
                
                **FRAMEWORK ANALYSIS METHODOLOGY:**
                Execute multi-dimensional framework assessment through specialized protocols:
                
                **Phase 1: Framework Architecture Intelligence**
                - **Core Design Patterns**: Document architectural principles, design philosophy, and structural foundations
                - **Extensibility Mechanisms**: Analyze plugin systems, hooks, middleware patterns, and customization capabilities
                - **API Surface Analysis**: Map public interfaces, configuration options, and integration points
                - **Abstraction Layers**: Document how the framework abstracts complexity and provides developer-friendly interfaces
                
                **Phase 2: Developer Experience Assessment**
                - **Adoption Workflow**: Analyze installation, setup, first-project creation, and onboarding experience
                - **Learning Curve Evaluation**: Assess documentation quality, tutorial effectiveness, and concept complexity
                - **Developer Productivity**: Document development workflow optimization, debugging capabilities, and tooling integration
                - **Error Handling & Debugging**: Evaluate error messages, diagnostic tools, and troubleshooting support
                
                **Phase 3: Ecosystem & Performance Analysis**
                - **Community Ecosystem**: Assess third-party integrations, plugin availability, and community contribution patterns
                - **Framework Compatibility**: Analyze integration with popular tools, build systems, and development environments
                - **Performance Characteristics**: Document runtime efficiency, memory usage, startup time, and optimization strategies
                - **Migration & Upgrade Paths**: Evaluate version compatibility, breaking change management, and migration tools
                
                **VALIDATION REQUIREMENTS:**
                - **Architecture Verification**: All architectural claims must be supported by actual code implementation
                - **Performance Metrics**: Include quantitative performance data where available
                - **Developer Experience Evidence**: Base UX assessments on actual framework usage patterns
                - **Ecosystem Coverage**: Document real integrations and community adoption indicators
                """;
        }
        
        if (classifyType == ClassifyType.Libraries)
        {
            return """
                ## Reusable Library Analysis Protocol
                <thinking>
                Conduct comprehensive library evaluation focusing on API design, integration patterns, and developer adoption factors to assess library quality and usability.
                </thinking>
                
                **LIBRARY ANALYSIS METHODOLOGY:**
                Execute systematic library assessment through specialized evaluation protocols:
                
                **Phase 1: API Architecture Assessment**
                - **Interface Design Analysis**: Document API consistency, method signatures, parameter patterns, and return value structures
                - **Type System Integration**: Analyze type safety, generic usage, error handling patterns, and null safety considerations
                - **Usage Pattern Documentation**: Map common use cases, method chaining capabilities, and fluent interface designs
                - **Backward Compatibility**: Assess API stability, versioning strategy, and breaking change management
                
                **Phase 2: Integration & Dependency Analysis**
                - **Installation Workflow**: Document package manager compatibility, installation procedures, and dependency resolution
                - **Framework Integration**: Analyze compatibility with popular frameworks, build systems, and development environments
                - **Dependency Management**: Assess external dependencies, peer dependencies, and version conflict resolution
                - **Bundle Impact Assessment**: Evaluate library size, tree-shaking support, and build optimization compatibility
                
                **Phase 3: Performance & Quality Evaluation**
                - **Runtime Performance**: Analyze computational efficiency, memory usage patterns, and optimization strategies
                - **Code Quality Assessment**: Document testing coverage, code organization, and maintainability indicators
                - **Documentation Quality**: Evaluate API documentation, usage examples, and developer guidance effectiveness
                - **Community Health**: Assess maintenance activity, issue resolution patterns, and community contribution levels
                
                **VALIDATION STANDARDS:**
                - **API Completeness**: Document all public interfaces with usage examples and parameter specifications
                - **Performance Evidence**: Include measurable performance characteristics and optimization recommendations
                - **Integration Verification**: Validate compatibility claims with actual implementation examples
                - **Quality Metrics**: Provide evidence-based assessment of library reliability and maintainability
                """;
        }
        
        if (classifyType == ClassifyType.DevelopmentTools)
        {
            return """
                ## Development Tool Analysis Protocol
                <thinking>
                Systematically evaluate development tool capabilities, integration patterns, and workflow optimization potential to assess productivity impact and adoption value.
                </thinking>
                
                **DEVELOPMENT TOOL ANALYSIS METHODOLOGY:**
                Execute comprehensive tool assessment through specialized evaluation frameworks:
                
                **Phase 1: Core Capability Assessment**
                - **Productivity Feature Analysis**: Document automation capabilities, workflow optimization, and time-saving mechanisms
                - **Tool Functionality Mapping**: Analyze core features, advanced capabilities, and specialized use case support
                - **Configuration System**: Evaluate setup procedures, customization options, and preference management
                - **User Interface Evaluation**: Assess command syntax, GUI design, and user interaction patterns
                
                **Phase 2: Integration & Compatibility Analysis**
                - **Development Environment Integration**: Document IDE support, editor plugins, and development workflow integration
                - **Build System Compatibility**: Analyze integration with build tools, CI/CD pipelines, and deployment workflows
                - **Toolchain Ecosystem**: Assess compatibility with popular development tools and framework ecosystems
                - **Platform Support**: Document cross-platform compatibility and environment-specific optimizations
                
                **Phase 3: Performance & Adoption Evaluation**
                - **Execution Performance**: Analyze tool speed, resource consumption, and scalability characteristics
                - **Learning Curve Assessment**: Evaluate onboarding difficulty, documentation quality, and skill transfer requirements
                - **Maintenance Overhead**: Document update procedures, configuration management, and operational requirements
                - **Community Adoption**: Assess user base, community support, and ecosystem health indicators
                
                **QUALITY VALIDATION REQUIREMENTS:**
                - **Feature Verification**: All capability claims must be demonstrable through actual tool usage
                - **Integration Testing**: Validate compatibility assertions with real-world integration scenarios
                - **Performance Benchmarking**: Include measurable performance metrics and optimization recommendations
                - **Workflow Impact Assessment**: Document quantifiable productivity improvements and workflow enhancements
                """;
        }
        
        if (classifyType == ClassifyType.CLITools)
        {
            return """
                ## CLI Tool Analysis Protocol
                <thinking>
                Conduct systematic evaluation of command-line interface design, usability patterns, and automation integration to assess tool effectiveness and user experience quality.
                </thinking>
                
                **CLI TOOL ANALYSIS METHODOLOGY:**
                Execute structured command-line tool assessment through specialized evaluation protocols:
                
                **Phase 1: Command Interface Design Analysis**
                - **Command Structure Evaluation**: Document command hierarchy, subcommand organization, and argument pattern consistency
                - **Option Design Assessment**: Analyze flag naming conventions, parameter handling, and configuration option completeness
                - **Input/Output Patterns**: Map data input methods, output formatting options, and result presentation strategies
                - **Error Handling Analysis**: Evaluate error message quality, recovery suggestions, and debugging support mechanisms
                
                **Phase 2: Usability & Automation Assessment**
                - **User Experience Evaluation**: Assess help system quality, documentation integration, and learning curve characteristics
                - **Scripting Integration**: Document automation capabilities, batch operation support, and pipeline compatibility
                - **Configuration Management**: Analyze config file formats, environment variable usage, and persistent settings handling
                - **Shell Integration**: Evaluate completion support, alias compatibility, and shell-specific optimizations
                
                **Phase 3: Performance & Deployment Analysis**
                - **Execution Performance**: Analyze startup time, processing speed, and resource consumption patterns
                - **Scalability Assessment**: Document large dataset handling, concurrent operation support, and performance optimization
                - **Distribution & Installation**: Evaluate package management integration, installation procedures, and dependency handling
                - **Cross-Platform Compatibility**: Assess platform-specific behaviors, feature parity, and environment adaptations
                
                **VALIDATION STANDARDS:**
                - **Command Verification**: All command examples must be executable and produce documented results
                - **Usability Testing**: User experience claims must be supported by actual interface interaction patterns
                - **Performance Metrics**: Include quantifiable performance data for execution speed and resource usage
                - **Automation Validation**: Demonstrate scripting capabilities with real automation use case examples
                """;
        }
        
        if (classifyType == ClassifyType.DevOpsConfiguration)
        {
            return """
                ## DevOps Infrastructure Analysis Protocol
                <thinking>
                Systematically evaluate infrastructure configuration, automation pipelines, and operational practices to assess deployment readiness and operational excellence.
                </thinking>
                
                **DEVOPS ANALYSIS METHODOLOGY:**
                Execute comprehensive infrastructure assessment through specialized operational frameworks:
                
                **Phase 1: Infrastructure Architecture Assessment**
                - **Deployment Architecture Analysis**: Document infrastructure patterns, scaling strategies, and resource allocation mechanisms
                - **Service Topology Mapping**: Analyze service dependencies, communication patterns, and integration architectures
                - **Resource Management Evaluation**: Assess resource optimization, cost management, and capacity planning strategies
                - **Environment Strategy**: Document development, staging, and production environment configurations and promotion workflows
                
                **Phase 2: Automation & Pipeline Analysis**
                - **CI/CD Pipeline Assessment**: Analyze build processes, testing integration, deployment automation, and release management
                - **Infrastructure as Code Evaluation**: Document infrastructure provisioning, configuration management, and version control practices
                - **Deployment Strategy Analysis**: Assess deployment patterns, rollback mechanisms, and blue-green deployment capabilities
                - **Quality Gates Integration**: Evaluate automated testing, security scanning, and compliance validation in pipelines
                
                **Phase 3: Operational Excellence Evaluation**
                - **Monitoring & Observability**: Document logging strategies, metrics collection, alerting configurations, and performance monitoring
                - **Security & Compliance**: Analyze access controls, secret management, vulnerability scanning, and compliance automation
                - **Operational Procedures**: Assess maintenance workflows, backup strategies, disaster recovery, and incident response protocols
                - **Documentation & Knowledge**: Evaluate operational documentation, runbook quality, and knowledge transfer mechanisms
                
                **VALIDATION REQUIREMENTS:**
                - **Configuration Verification**: All infrastructure claims must be supported by actual configuration files and deployment scripts
                - **Automation Testing**: Pipeline and automation capabilities must be demonstrable through actual execution examples
                - **Security Validation**: Security measures must be verified through actual implementation and configuration analysis
                - **Operational Evidence**: Operational procedures must be documented with real workflow examples and monitoring data
                """;
        }
        
        if (classifyType == ClassifyType.Documentation)
        {
            return """
                ## Documentation Project Analysis Protocol
                <thinking>
                Systematically evaluate documentation architecture, content quality, and knowledge management effectiveness to assess information accessibility and maintenance sustainability.
                </thinking>
                
                **DOCUMENTATION ANALYSIS METHODOLOGY:**
                Execute comprehensive documentation assessment through specialized evaluation frameworks:
                
                **Phase 1: Content Architecture Assessment**
                - **Information Architecture Analysis**: Document content structure, navigation patterns, and information hierarchy design
                - **Content Organization Evaluation**: Analyze content categorization, tagging systems, and discoverability mechanisms
                - **User Journey Mapping**: Assess how users find, consume, and apply documented information
                - **Format & Presentation Analysis**: Evaluate documentation formats, visual design, and content presentation effectiveness
                
                **Phase 2: Quality & Testing Framework Analysis**
                - **Content Quality Standards**: Document style guides, writing standards, and content validation procedures
                - **Testing Methodology Assessment**: Analyze testing approaches, coverage strategies, and validation automation
                - **Review & Approval Processes**: Evaluate content review workflows, approval mechanisms, and quality gates
                - **Accuracy & Currency Validation**: Assess mechanisms for maintaining content accuracy and relevance over time
                
                **Phase 3: Maintenance & Governance Evaluation**
                - **Content Lifecycle Management**: Document creation, update, review, and retirement procedures for content
                - **Version Control Integration**: Analyze documentation versioning, change tracking, and release coordination
                - **Contributor Experience**: Assess contribution workflows, editing tools, and collaboration mechanisms
                - **Metrics & Analytics**: Evaluate content performance measurement, user feedback collection, and improvement processes
                
                **VALIDATION STANDARDS:**
                - **Content Verification**: All documentation claims must be verified against actual content and structure
                - **Process Documentation**: Workflow and governance procedures must be supported by actual implementation evidence
                - **Quality Evidence**: Quality standards and testing approaches must be demonstrable through real examples
                - **User Experience Validation**: Accessibility and usability claims must be supported by actual user interaction patterns
                """;
        }
        
        return """
            ## General Project Analysis Protocol
            <thinking>
            Conduct comprehensive software project evaluation through systematic analysis of architecture, implementation quality, and practical usage to provide complete technical assessment.
            </thinking>
            
            **COMPREHENSIVE PROJECT ANALYSIS METHODOLOGY:**
            Execute thorough project assessment through multi-dimensional evaluation protocols:
            
            **Phase 1: Technical Architecture Assessment**
            - **System Design Analysis**: Document overall architecture, design patterns, and structural organization principles
            - **Component Relationship Mapping**: Analyze module dependencies, service interactions, and integration architectures
            - **Technical Decision Evaluation**: Assess technology choices, architectural trade-offs, and design principle adherence
            - **Scalability & Performance Design**: Document performance characteristics, scaling considerations, and optimization strategies
            
            **Phase 2: Implementation Quality Evaluation**
            - **Code Quality Assessment**: Analyze code organization, maintainability, testing coverage, and development practices
            - **Design Pattern Implementation**: Document pattern usage, abstraction levels, and code reusability mechanisms
            - **Development Workflow Analysis**: Assess build processes, testing strategies, and quality assurance practices
            - **Documentation & Standards**: Evaluate code documentation, style consistency, and development guideline adherence
            
            **Phase 3: Functional & Operational Analysis**
            - **Feature Functionality Mapping**: Document core capabilities, user-facing features, and system behavior patterns
            - **Setup & Configuration Analysis**: Analyze installation procedures, environment requirements, and configuration management
            - **Usage Pattern Documentation**: Map common workflows, integration scenarios, and practical application examples
            - **Maintenance & Support Evaluation**: Assess operational procedures, troubleshooting capabilities, and support documentation
            
            **UNIVERSAL QUALITY STANDARDS:**
            - **Evidence-Based Assessment**: All technical claims must be verifiable through actual codebase analysis
            - **Comprehensive Coverage**: Address all major project components, features, and operational aspects
            - **Practical Focus**: Emphasize real-world usage scenarios and implementation considerations
            - **Technical Depth**: Provide actionable insights for developers, operators, and technical decision-makers
            """;
    }
}