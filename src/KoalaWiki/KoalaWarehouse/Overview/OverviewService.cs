using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Domains;
using KoalaWiki.Options;
using KoalaWiki.Prompts;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

namespace KoalaWiki.KoalaWarehouse.Overview;

public partial class OverviewService
{
    /// <summary>
    /// 默认最大重试次数
    /// </summary>
    private const int DefaultMaxRetries = 3;

    /// <summary>
    /// 默认基础延迟时间
    /// </summary>
    private static readonly TimeSpan DefaultBaseDelay = TimeSpan.FromSeconds(2);

    private static Microsoft.Extensions.Logging.ILogger? _logger;

    /// <summary>
    /// 设置日志记录器
    /// </summary>
    public static void SetLogger(Microsoft.Extensions.Logging.ILogger logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// 生成项目概述
    /// </summary>
    /// <returns></returns>
    public static async Task<string> GenerateProjectOverview(Kernel kernel, string catalog, string gitRepository,
        string branch, string readme, ClassifyType? classify)
    {
        return await GenerateProjectOverview(kernel, catalog, gitRepository, branch, readme, classify,
            DefaultMaxRetries, DefaultBaseDelay);
    }

    /// <summary>
    /// 生成项目概述（带重试机制）
    /// </summary>
    /// <param name="kernel">AI内核</param>
    /// <param name="catalog">目录信息</param>
    /// <param name="gitRepository">Git仓库地址</param>
    /// <param name="branch">分支名称</param>
    /// <param name="readme">README内容</param>
    /// <param name="classify">分类类型</param>
    /// <param name="maxRetries">最大重试次数</param>
    /// <param name="baseDelay">基础延迟时间</param>
    /// <returns>项目概述内容</returns>
    public static async Task<string> GenerateProjectOverview(Kernel kernel, string catalog, string gitRepository,
        string branch, string readme, ClassifyType? classify, int maxRetries, TimeSpan baseDelay)
    {
        var lastException = (Exception?)null;

        for (int attempt = 1; attempt <= maxRetries + 1; attempt++)
        {
            try
            {
                return await ExecuteSingleAttempt(kernel, catalog, gitRepository, branch, readme, classify);
            }
            catch (Exception ex) when (IsRetriableException(ex) && attempt <= maxRetries)
            {
                lastException = ex;
                var delay = CalculateDelay(attempt, baseDelay);

                _logger?.LogWarning(ex, "项目概述生成失败，{Delay}s后重试({Attempt}/{MaxRetries})",
                    delay.TotalSeconds, attempt, maxRetries);

                await Task.Delay(delay);
            }
        }

        throw new InvalidOperationException($"项目概述生成失败，已重试{maxRetries}次。最后一次错误: {lastException?.Message}",
            lastException);
    }

    /// <summary>
    /// 执行单次尝试
    /// </summary>
    private static async Task<string> ExecuteSingleAttempt(Kernel kernel, string catalog, string gitRepository,
        string branch, string readme, ClassifyType? classify)
    {
        var sr = new StringBuilder();

        var settings = new OpenAIPromptExecutionSettings()
        {
            ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions,
            MaxTokens = DocumentsHelper.GetMaxTokens(OpenAIOptions.ChatModel)
        };

        var chat = kernel.GetRequiredService<IChatCompletionService>();
        var history = new ChatHistory();

        var prompt = await GetOverviewPrompt(classify, catalog, gitRepository, branch, readme);

        history.AddSystemEnhance();
        var contents = new ChatMessageContentItemCollection
        {
            new TextContent(prompt),
        };

        contents.AddSystemReminder();

        history.AddUserMessage(contents);

        await foreach (var item in chat.GetStreamingChatMessageContentsAsync(history, settings, kernel))
        {
            if (!string.IsNullOrEmpty(item.Content))
            {
                sr.Append(item.Content);
            }
        }

        // 使用正则表达式将<blog></blog>中的内容提取
        var regex = new Regex(@"<blog>(.*?)</blog>", RegexOptions.Singleline);

        var match = regex.Match(sr.ToString());

        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value;
            sr.Clear();
            sr.Append(extractedContent);
        }

        // 使用正则表达式将```markdown中的内容提取
        regex = new Regex(@"```markdown(.*?)```", RegexOptions.Singleline);
        match = regex.Match(sr.ToString());
        if (match.Success)
        {
            // 提取到的内容
            var extractedContent = match.Groups[1].Value;
            sr.Clear();
            sr.Append(extractedContent);
        }

        return sr.ToString();
    }

    /// <summary>
    /// 判断异常是否可重试
    /// </summary>
    private static bool IsRetriableException(Exception ex)
    {
        return ex switch
        {
            HttpRequestException => true,
            TaskCanceledException => true,
            TimeoutException => true,
            OperationCanceledException => true,
            _ => false
        };
    }

    /// <summary>
    /// 计算重试延迟时间（指数退避策略）
    /// </summary>
    private static TimeSpan CalculateDelay(int attempt, TimeSpan baseDelay)
    {
        return TimeSpan.FromMilliseconds(baseDelay.TotalMilliseconds * Math.Pow(2, attempt - 1));
    }
}