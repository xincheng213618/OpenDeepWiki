using Microsoft.SemanticKernel;

namespace KoalaWiki.Prompts;

public class PromptContext
{
    private static readonly string PromptPath = Path.Combine("./", "Prompts");


    /// <summary>
    /// 仓库提示词
    /// </summary>
    private static string WarehousePrompt => Path.Combine(PromptPath, "Warehouse");

    private static string ChatPrompt => Path.Combine(PromptPath, "Chat");

    public static async Task<string> Chat(
        string name,
        KernelArguments args)
    {
        var fileName = name + ".md";

        if (!File.Exists(Path.Combine(ChatPrompt, fileName)))
        {
            throw new FileNotFoundException($"Chat prompt not found name:{fileName}");
        }

        var values = await File.ReadAllTextAsync(Path.Combine(ChatPrompt, fileName));

        return args.Aggregate(values,
            (current, value) =>
                current.Replace("{{$" + value.Key + "}}", value.Value?.ToString(),
                    StringComparison.CurrentCultureIgnoreCase)) + Prompt.Language;
    }

    // 创建一个默认的索引
    public static async Task<string> Warehouse(
        string name,
        KernelArguments args)
    {
        var fileName = name + ".md";

        if (!File.Exists(Path.Combine(WarehousePrompt, fileName)))
        {
            throw new FileNotFoundException($"Warehouse prompt not found name:{fileName}");
        }

        var values = await File.ReadAllTextAsync(Path.Combine(WarehousePrompt, fileName));

        return args.Aggregate(values,
            (current, value) =>
                current.Replace("{{$" + value.Key + "}}", value.Value?.ToString(),
                    StringComparison.CurrentCultureIgnoreCase)) + Prompt.Language;
    }
}