namespace KoalaWiki.Options;

public class DocumentOptions
{
    public const string Name = "Document";

    /// <summary>
    /// 是否启用增量更新
    /// </summary>
    /// <returns></returns>
    public static bool EnableIncrementalUpdate { get; set; } = true;

    /// <summary>
    /// 排除的文件
    /// </summary>
    /// <returns></returns>
    public static string[] ExcludedFiles { get; set; } = [];

    /// <summary>
    /// 排除的文件夹
    /// </summary>
    /// <returns></returns>
    public static string[] ExcludedFolders { get; set; } = [];

    /// <summary>
    /// 是否启用智能过滤
    /// </summary>
    /// <returns></returns>
    public static bool EnableSmartFilter { get; set; } = true;

    /// <summary>
    /// 是否启用代码依赖分析
    /// </summary>
    /// <returns></returns>
    public static bool EnableCodeDependencyAnalysis { get; set; } = false;

    public static void InitConfig(IConfiguration configuration)
    {
        configuration.GetSection(Name).Get<DocumentOptions>();

        var enableCodeDependencyAnalysis = configuration.GetValue<string>($"ENABLE_CODED_DEPENDENCY_ANALYSIS");

        if (!string.IsNullOrEmpty(enableCodeDependencyAnalysis))
        {
            if (bool.TryParse(enableCodeDependencyAnalysis, out var enable))
            {
                EnableCodeDependencyAnalysis = enable;
            }
        }
    }
}