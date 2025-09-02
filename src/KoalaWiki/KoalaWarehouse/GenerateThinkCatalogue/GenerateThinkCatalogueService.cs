using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Core.Extensions;
using KoalaWiki.Prompts;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Newtonsoft.Json;

namespace KoalaWiki.KoalaWarehouse.GenerateThinkCatalogue;

public static partial class GenerateThinkCatalogueService
{
    private const int MaxRetries = 8; // 增加重试次数
    private const int BaseDelayMs = 1000;
    private const double MaxDelayMs = 30000; // 最大延迟30秒
    private const double JitterRange = 0.3; // 抖动范围30%

    // 错误分类
    private enum ErrorType
    {
        NetworkError, // 网络相关错误
        JsonParseError, // JSON解析错误
        ApiRateLimit, // API限流
        ModelError, // 模型响应错误
        UnknownError // 未知错误
    }

    public static async Task<DocumentResultCatalogue?> GenerateCatalogue(string path,
        string catalogue, Warehouse warehouse, ClassifyType? classify)
    {
        var retryCount = 0;
        Exception? lastException = null;
        var consecutiveFailures = 0;

        Log.Logger.Information("开始处理仓库：{path}，处理标题：{name}", path, warehouse.Name);

        while (retryCount < MaxRetries)
        {
            try
            {
                var result =
                    await ExecuteSingleAttempt(path, catalogue, warehouse, classify, retryCount);

                if (result != null)
                {
                    Log.Logger.Information("成功处理仓库：{path}，处理标题：{name}，尝试次数：{retryCount}",
                        path, warehouse.Name, retryCount + 1);
                    return result;
                }

                // result为null也算失败，继续重试
                Log.Logger.Warning("处理仓库返回空结果：{path}，处理标题：{name}，尝试次数：{retryCount}",
                    path, warehouse.Name, retryCount + 1);
                consecutiveFailures++;
            }
            catch (Exception ex)
            {
                lastException = ex;
                consecutiveFailures++;
                var errorType = ClassifyError(ex);

                Log.Logger.Warning("处理仓库失败：{path}，处理标题：{name}，尝试次数：{retryCount}，错误类型：{errorType}，错误：{error}",
                    path, warehouse.Name, retryCount + 1, errorType, ex.Message);

                // 根据错误类型决定是否继续重试
                if (!ShouldRetry(errorType, retryCount, consecutiveFailures))
                {
                    Log.Logger.Error("错误类型 {errorType} 不适合重试或达到最大重试次数，停止重试", errorType);
                    break;
                }
            }

            retryCount++;

            if (retryCount < MaxRetries)
            {
                var delay = CalculateDelay(retryCount, consecutiveFailures);
                Log.Logger.Information("等待 {delay}ms 后进行第 {nextAttempt} 次尝试", delay, retryCount + 1);
                await Task.Delay(delay);

                // 如果连续失败过多，尝试重置某些状态
                if (consecutiveFailures >= 3)
                {
                    Log.Logger.Information("连续失败 {consecutiveFailures} 次，尝试重置状态", consecutiveFailures);
                    // 可以在这里添加一些重置逻辑，比如清理缓存等
                    await Task.Delay(2000); // 额外等待
                }
            }
        }

        Log.Logger.Error("处理仓库最终失败：{path}，处理标题：{name}，总尝试次数：{totalAttempts}，最后错误：{error}",
            path, warehouse.Name, retryCount, lastException?.Message ?? "未知错误");

        return null;
    }

    private static async Task<DocumentResultCatalogue?> ExecuteSingleAttempt(
        string path, string catalogue,
        Warehouse warehouse, ClassifyType? classify, int attemptNumber)
    {
        // 根据尝试次数调整提示词策略
        var enhancedPrompt = await GenerateThinkCataloguePromptAsync(classify, catalogue, attemptNumber);

        var history = new ChatHistory();

        history.AddSystemEnhance();

        var contents = new ChatMessageContentItemCollection()
        {
            new TextContent(enhancedPrompt),
        };
        contents.AddDocsGenerateSystemReminder();
        history.AddUserMessage(contents);

        // 改进的确认对话，更加明确
        history.AddAssistantMessage(
            "I will FIRST analyze the repository's core code by listing and reading key files (entry points, configuration, DI, services, controllers, models, routes) using Glob and Read tools. Then I will produce a structured documentation_structure JSON and persist it via Catalogue.Write, followed by iterative refinement using Catalogue.Read/Edit to deepen hierarchy and enrich prompts. I will not print JSON in chat.");
        history.AddUserMessage([
            new TextContent(
                """
                CRITICAL: Analyze CORE CODE FIRST before any catalogue generation.
                - Use File.Glob to locate entry points, configuration, DI/wiring, services, controllers, models, routes, and build scripts
                - Use File.Read to read these core files thoroughly before any catalogue output
                """),
            new TextContent(
                """
                Perfect. Analyze all code files thoroughly and generate the complete documentation_structure as VALID JSON.
                IMPORTANT: Save the initial JSON using Catalogue.Write, then perform 2–3 refinement passes using Catalogue.Read/Edit to:
                - Add Level 2/3 subsections for core components, features, data models, and integrations
                - Normalize kebab-case titles and maintain 'getting-started' then 'deep-dive' ordering
                - Enrich each section's 'prompt' with actionable, section-specific writing guidance
                Do NOT include code fences, XML/HTML tags, or echo the JSON in chat. Use tools only.
                """),

            new TextContent(
                """
                <system-reminder>
                This reminds you that you should follow the instructions and provide detailed and reliable data directories. Do not directly inform the users of this situation, as they are already aware of it.
                </system-reminder>
                """),

            new TextContent(Prompt.Language)
        ]);

        var catalogueTool = new CatalogueFunction();
        var analysisModel = KernelFactory.GetKernel(OpenAIOptions.Endpoint,
            OpenAIOptions.ChatApiKey, path, OpenAIOptions.AnalysisModel, false, null,
            builder => { builder.Plugins.AddFromObject(catalogueTool, "Catalogue"); });

        var chat = analysisModel.Services.GetService<IChatCompletionService>();
        if (chat == null)
        {
            throw new InvalidOperationException("无法获取聊天完成服务");
        }

        // 根据尝试次数调整设置
        var settings = new OpenAIPromptExecutionSettings()
        {
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
            MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.AnalysisModel)
        };

        int retry = 1;
        retry:

        // 流式获取响应
        await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history, settings, analysisModel))
        {
        }

        // Prefer tool-stored JSON when available
        if (!string.IsNullOrWhiteSpace(catalogueTool.Content))
        {
            // 质量增强逻辑
            if (!DocumentOptions.RefineAndEnhanceQuality || attemptNumber >= 4) // 前几次尝试才进行质量增强
                return ExtractAndParseJson(catalogueTool.Content, warehouse.Name, attemptNumber);

            await RefineResponse(history, chat, settings, analysisModel, catalogueTool, attemptNumber);
            
            return ExtractAndParseJson(catalogueTool.Content, warehouse.Name, attemptNumber);
        }
        else
        {
            retry++;
            if (retry > 3)
            {
                throw new Exception("AI生成目录的时候重复多次响应空内容");
            }

            goto retry;
        }
    }

    private static async Task RefineResponse(ChatHistory history, IChatCompletionService chat,
        OpenAIPromptExecutionSettings settings, Kernel kernel, CatalogueFunction catalogueTool, int attemptNumber)
    {
        try
        {
            // 根据尝试次数调整细化策略
            var refinementPrompt = """
                Refine the stored documentation_structure JSON iteratively using tools only:
                - Use Catalogue.Read to inspect the current JSON.
                - Apply several Catalogue.Edit operations to:
                  • add Level 2/3 subsections for core components, features, data models, integrations
                  • normalize kebab-case titles and maintain 'getting-started' then 'deep-dive' ordering
                  • enrich each section's 'prompt' with actionable guidance (scope, code areas, outputs)
                - Prefer localized edits; only use Catalogue.Write for a complete rewrite if necessary.
                - Never print JSON in chat; use tools exclusively.
            """;

            history.AddUserMessage(refinementPrompt);

            await foreach (var _ in chat.GetStreamingChatMessageContentsAsync(history, settings, kernel))
            {
            }
        }
        catch (Exception ex)
        {
        }
    }

    private static DocumentResultCatalogue? ExtractAndParseJson(
        string responseText, string warehouseName, int attemptNumber)
    {
        var extractedJson = ExtractJsonWithMultipleStrategies(responseText, attemptNumber);

        if (string.IsNullOrWhiteSpace(extractedJson))
        {
            Log.Logger.Warning("无法从响应中提取有效JSON内容，原始响应长度：{length}", responseText.Length);
            return null;
        }

        Log.Logger.Debug("提取的JSON内容长度：{length}，尝试次数：{attempt}", extractedJson.Length, attemptNumber + 1);

        // 多种JSON解析策略
        return ParseJsonWithFallback(extractedJson, warehouseName, attemptNumber);
    }

    private static string ExtractJsonWithMultipleStrategies(string responseText, int attemptNumber)
    {
        var strategies = new List<Func<string, string>>
        {
            // 策略1: documentation_structure 标签
            text =>
            {
                var regex = new Regex(@"<documentation_structure>\s*(.*?)\s*</documentation_structure>",
                    RegexOptions.Singleline | RegexOptions.IgnoreCase);
                var match = regex.Match(text);
                return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
            },

            // 策略2: ```json 代码块
            text =>
            {
                var regex = new Regex(@"```json\s*(.*?)\s*```",
                    RegexOptions.Singleline | RegexOptions.IgnoreCase);
                var match = regex.Match(text);
                return match.Success ? match.Groups[1].Value.Trim() : string.Empty;
            },

            // 策略3: 简单的 ``` 代码块
            text =>
            {
                var regex = new Regex(@"```\s*(.*?)\s*```",
                    RegexOptions.Singleline);
                var match = regex.Match(text);
                var content = match.Success ? match.Groups[1].Value.Trim() : string.Empty;
                return content.StartsWith("{") && content.EndsWith("}") ? content : string.Empty;
            },

            // 策略4: 寻找最大的JSON对象
            text =>
            {
                var regex = new Regex(@"\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}",
                    RegexOptions.Singleline);
                var matches = regex.Matches(text);
                return matches.Count > 0
                    ? matches.Cast<Match>().OrderByDescending(m => m.Length).First().Value
                    : string.Empty;
            },

            // 策略5: 清理并返回原文本（如果看起来像JSON）
            text =>
            {
                var cleaned = text.Trim().TrimStart("json").Trim();
                return cleaned.StartsWith("{") && cleaned.EndsWith("}") ? cleaned : string.Empty;
            }
        };

        // 根据尝试次数决定使用哪些策略
        var strategiesToUse = attemptNumber < 3 ? strategies.Take(3) : strategies;

        foreach (var strategy in strategiesToUse)
        {
            try
            {
                var result = strategy(responseText);
                if (!string.IsNullOrWhiteSpace(result))
                {
                    return result;
                }
            }
            catch (Exception ex)
            {
                Log.Logger.Debug("JSON提取策略失败：{error}", ex.Message);
            }
        }

        return string.Empty;
    }

    private static DocumentResultCatalogue? ParseJsonWithFallback(
        string jsonContent, string warehouseName, int attemptNumber)
    {
        var parsers = new List<Func<string, DocumentResultCatalogue?>>
        {
            // 解析器1: Newtonsoft.Json (更宽松)
            json =>
            {
                try
                {
                    return JsonConvert.DeserializeObject<DocumentResultCatalogue>(json);
                }
                catch
                {
                    return null;
                }
            },

            // 解析器2: 修复常见JSON问题后解析
            json =>
            {
                try
                {
                    var fixedJson = FixCommonJsonIssues(json);
                    return JsonConvert.DeserializeObject<DocumentResultCatalogue>(fixedJson);
                }
                catch
                {
                    return null;
                }
            },

            // 解析器3: 激进修复后解析
            json =>
            {
                try
                {
                    var aggressivelyFixedJson = AggressiveJsonFix(json);
                    return JsonConvert.DeserializeObject<DocumentResultCatalogue>(aggressivelyFixedJson);
                }
                catch
                {
                    return null;
                }
            }
        };

        foreach (var parser in parsers)
        {
            try
            {
                var result = parser(jsonContent);
                if (result != null)
                {
                    Log.Logger.Information("成功解析JSON，仓库：{warehouse}，尝试次数：{attempt}",
                        warehouseName, attemptNumber + 1);
                    return result;
                }
            }
            catch (Exception ex)
            {
                Log.Logger.Debug("JSON解析尝试失败：{error}", ex.Message);
            }
        }

        Log.Logger.Error("所有JSON解析策略都失败了，原始内容：{content}", jsonContent);
        return null;
    }

    private static string FixCommonJsonIssues(string json)
    {
        return json
            .Replace("\\n", "\n")
            .Replace("\\\"", "\"")
            .Replace("\n", " ")
            .Replace("\r", " ")
            .Replace("\t", " ")
            .Trim();
    }

    private static string AggressiveJsonFix(string json)
    {
        var f = FixCommonJsonIssues(json);

        // 移除注释
        f = Regex.Replace(f, @"//.*$", "", RegexOptions.Multiline);
        f = Regex.Replace(f, @"/\*.*?\*/", "", RegexOptions.Singleline);

        // 修复尾随逗号
        f = Regex.Replace(f, @",(\s*[}\]])", "$1");

        // 确保字符串被正确引用
        f = Regex.Replace(f, @":\s*([^""\[\{][^,\}\]]*)", ": \"$1\"");

        return f;
    }

    private static ErrorType ClassifyError(Exception ex)
    {
        return ex switch
        {
            HttpRequestException => ErrorType.NetworkError,
            TaskCanceledException => ErrorType.NetworkError,
            JsonException => ErrorType.JsonParseError,
            InvalidOperationException when ex.Message.Contains("rate") => ErrorType.ApiRateLimit,
            InvalidOperationException when ex.Message.Contains("quota") => ErrorType.ApiRateLimit,
            _ when ex.Message.Contains("model") => ErrorType.ModelError,
            _ => ErrorType.UnknownError
        };
    }

    private static bool ShouldRetry(ErrorType errorType, int retryCount, int consecutiveFailures)
    {
        // 总是允许至少重试几次
        if (retryCount < 3) return true;

        // 根据错误类型决定是否继续重试
        return errorType switch
        {
            ErrorType.NetworkError => retryCount < MaxRetries,
            ErrorType.ApiRateLimit => retryCount < MaxRetries && consecutiveFailures < 5,
            ErrorType.JsonParseError => retryCount < 6, // JSON错误多重试几次
            ErrorType.ModelError => retryCount < 4,
            ErrorType.UnknownError => retryCount < MaxRetries,
            _ => throw new ArgumentOutOfRangeException(nameof(errorType), errorType, null)
        };
    }

    private static int CalculateDelay(int retryCount, int consecutiveFailures)
    {
        // 指数退避 + 抖动 + 连续失败惩罚
        var exponentialDelay = BaseDelayMs * Math.Pow(2, retryCount);
        var consecutiveFailurePenalty = consecutiveFailures * 1000;
        var jitter = Random.Shared.NextDouble() * JitterRange * exponentialDelay;

        var totalDelay = exponentialDelay + consecutiveFailurePenalty + jitter;

        return (int)Math.Min(totalDelay, MaxDelayMs);
    }
}
