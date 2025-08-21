using System.ComponentModel;

namespace KoalaWiki.KoalaWarehouse.DocumentPending;

public class DocsFunction
{
    /// <summary>
    /// 写入内容
    /// </summary>
    /// <returns></returns>
    [KernelFunction("Write"), Description("""
                                          Generate the content for the document.
                                          Usage:
                                          - This tool will overwrite the existing content.
                                          - Always edit the existing content first. Do not overwrite it unless explicitly required. 
                                          - Use emojis only when the user explicitly requests it. Avoid adding emojis to the document unless specifically asked to do so.
                                          """)]
    public string Write(
        [Description("The content to write")] string content)
    {
        Content = content;
        if (string.IsNullOrEmpty(Content))
        {
            return "<system-reminder>Content cannot be empty.</system-reminder>";
        }

        Content = Content.Trim();
        return @$"<system-reminder>Write successful</system-reminder>";
    }

    [KernelFunction("Edit"), Description("""
                                         Perform precise string replacement operations in the generated document.
                                         Usage:
                                         - Before making any edits, you must use the `Read` tool at least once in the conversation. If you attempt to edit without reading the file, the tool will report an error.
                                         - When editing the text output from the `Read` tool, make sure to retain its exact indentation (tabs/spaces), that is, the form that appears after the line number prefix. The line number prefix format is: space + line number + tab. Everything after that tab is the actual file content and must match it. Do not include any components of the line number prefix in the old string or new string.
                                         - Always prioritize editing existing files in the code repository. Do not overwrite the content unless explicitly required.
                                         - Use emojis only when the user explicitly requests it. Do not add emojis to the file unless required.
                                         - If the `oldString` is not unique in the file, the edit will fail. Either provide a longer string with more context to make it unique, or use `replaceAll` to change all instances of the "old string".
                                         - Use `replaceAll` to replace and rename strings throughout the file. This parameter is very useful when renaming variables, etc.
                                         """)]
    public string Edit(
        [Description("The text to replace")]
        string oldString,
        [Description("The text to replace it with (must be different from old_string)")]
        string newString,
        [Description("Replace all occurences of old_string (default false)")]
        bool replaceAll = false)
    {
        if (string.IsNullOrEmpty(Content))
        {
            return "<system-reminder>Document content is empty, please write content first.</system-reminder>";
        }

        if (string.IsNullOrEmpty(oldString))
        {
            return "<system-reminder>Old string cannot be empty.</system-reminder>";
        }

        if (oldString == newString)
        {
            return "<system-reminder>New string must be different from old string.</system-reminder>";
        }

        if (!Content.Contains(oldString))
        {
            return "<system-reminder>Old string not found in document.</system-reminder>";
        }

        if (!replaceAll && Content.Split(new[] { oldString }, StringSplitOptions.None).Length > 2)
        {
            return "<system-reminder>Old string is not unique in the document. Use replaceAll=true to replace all occurrences or provide a longer string with more context.</system-reminder>";
        }

        if (replaceAll)
        {
            Content = Content.Replace(oldString, newString);
        }
        else
        {
            int index = Content.IndexOf(oldString);
            Content = Content.Substring(0, index) + newString + Content.Substring(index + oldString.Length);
        }
        
        return @$"<system-reminder>Edit successful</system-reminder>";
    }

    [KernelFunction("Read"), Description("""
                                         To read the current generated document content, please note that this method can only read the content of the generated document.
                                         Usage:
                                         - By default, it reads up to 2000 lines from the beginning of the file.
                                         - You can choose to specify the line offset and limit, but it is recommended not to provide these parameters to read the entire file.
                                         - Any lines exceeding 2000 characters will be truncated.
                                         - If the file you are reading exists but is empty, you will receive a system warning instead of the file content.
                                         """)]
    public string Read(
        [Description("The line number to start reading from. Only provide if the file is too large to read at once")]
        int offset,
        [Description("The number of lines to read. Only provide if the file is too large to read at once.")]
        int limit = 2000)
    {
        var lines = Content.Split(new[] { '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries);

        if (offset < 0 || offset >= lines.Length)
        {
            // 读取所有
            return string.Join("\n", lines);
        }

        if (limit <= 0 || offset + limit > lines.Length)
        {
            // 读取到结尾
            return string.Join("\n", lines.Skip(offset));
        }

        // 读取指定范围
        return string.Join("\n", lines.Skip(offset).Take(limit));
    }

    /// <summary>
    /// 内容
    /// </summary>
    public string? Content { get; private set; }
}