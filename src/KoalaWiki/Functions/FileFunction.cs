using System.ComponentModel;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using OpenDeepWiki.CodeFoundation;
using OpenDeepWiki.CodeFoundation.Utils;

namespace KoalaWiki.Functions;

public class FileFunction(string gitPath, List<string>? files)
{
    private readonly CodeCompressionService _codeCompressionService = new();
    private int _count;

    /// <summary>
    /// 获取当前仓库压缩结构
    /// </summary>
    public string GetTree()
    {
        var ignoreFiles = DocumentsHelper.GetIgnoreFiles(gitPath);
        var pathInfos = new List<PathInfo>();

        // 递归扫描目录所有文件和目录
        DocumentsHelper.ScanDirectory(gitPath, pathInfos, ignoreFiles);

        var fileTree = FileTreeBuilder.BuildTree(pathInfos, gitPath);
        return FileTreeBuilder.ToCompactString(fileTree);
    }

    public async Task<string> ReadFileAsync(
        [Description("File Path")] string filePath)
    {
        try
        {
            // 检查是否已达到文件读取限制
            if (DocumentOptions.MaxFileReadCount > 0 &&
                _count >= DocumentOptions.MaxFileReadCount)
            {
                int i = _count;
                _count = 0;

                return "🚨 FILE READ LIMIT EXCEEDED 🚨\n" +
                       $"Current attempts: {i}/{DocumentOptions.MaxFileReadCount}\n" +
                       "⛔ STOP reading files immediately and complete analysis with existing da2000ta.";
            }

            files?.Add(filePath);
            filePath = Path.Combine(gitPath, filePath.TrimStart('/'));
            Console.WriteLine($"Reading file: {filePath}");

            var info = new FileInfo(filePath);
            // 判断文件是否存在
            if (!info.Exists)
            {
                return $"File not found: {filePath}";
            }

            // 判断文件大小
            if (info.Length > 1024 * 100)
            {
                return $"File too large: {filePath} ({info.Length / 1024 / 100}KB)";
            }

            // 读取整个文件内容
            string content = await File.ReadAllTextAsync(filePath);

            // 如果启用代码压缩且是代码文件，则应用压缩
            if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
            {
                content = _codeCompressionService.CompressCode(content, filePath);
            }

            _count++;

            return content;
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }

    /// <summary>
    /// 获取指定目录下所有目录和文件
    /// </summary>
    /// <param name="path"></param>
    /// <param name="pattern"></param>
    /// <returns></returns>
    [KernelFunction(name: "Glob"),
     Description(
         """
         - Fast file pattern matching tool for targeted file searches in codebases
         - Use specific patterns like \"*.js\", \"src/**/*.tsx\", \"components/**/*.css\" to find relevant files
         - Avoid broad patterns like \"**/*\" or \"*\" which scan entire directories
         - Focus on searching for files related to specific features, technologies, or file types
         - Returns matching file paths sorted by modification time
         - Best for finding files when you know the general location or file extension
         - When you need open-ended exploration, use the Agent tool instead of broad scanning
         - You have the capability to call multiple tools in a single response for targeted searches
         - Examples: \"pages/**/*.tsx\" (React pages), \"*.config.js\" (config files), \"src/components/**/*.ts\" (TypeScript components)
         """)]
    public string Glob(
        [Description(
            "Specific glob pattern for targeted file search (e.g., '*.tsx', 'src/**/*.ts', 'components/**/*.css'). Avoid broad patterns like '**/*' or '*'.")]
        string pattern,
        [Description(
            """
            The directory to search in. If not specified, the current working directory will be used. IMPORTANT: Omit this field to use the default directory. DO NOT enter "undefined" or "null" - simply omit it for the default behavior. Must be a valid directory path if provided.
            """
        )]
        string? path = null)
    {
        try
        {
            if (pattern == "**/*")
            {
                return
                    "Please use a more specific pattern instead of '**/*'. This pattern is too broad and may cause performance issues. Try using patterns like '*.js', 'src/**/*.tsx', or 'components/**/*.css' to narrow down your search.";
            }

            // 如果没有指定路径，使用根目录
            if (string.IsNullOrEmpty(path))
            {
                path = gitPath;
            }
            else
            {
                path = Path.Combine(gitPath, path.TrimStart('/'));
            }

            // 检查目录是否存在
            if (!Directory.Exists(path))
            {
                return $"Directory not found: {path.Replace(gitPath, "").TrimStart(Path.DirectorySeparatorChar)}";
            }

// 检查目录是否存在
            if (!Directory.Exists(path))
            {
                return $"Directory not found: {path.Replace(gitPath, "").TrimStart(Path.DirectorySeparatorChar)}";
            }

// 获取忽略文件列表
            var ignoreFiles = DocumentsHelper.GetIgnoreFiles(gitPath);

// 使用改进的文件搜索方法
            var matchedFiles = new List<string>();
            SearchFiles(path, pattern, matchedFiles, gitPath);

// 排除忽略文件
            matchedFiles = matchedFiles
                .Where(f => !ignoreFiles.Any(ignore => IsIgnoredFile(f, ignoreFiles)))
                .ToList();

// 按修改时间排序
            var sortedFiles = matchedFiles
                .Select(f => new FileInfo(Path.Combine(gitPath, f.Replace('/', Path.DirectorySeparatorChar))))
                .Where(fi => fi.Exists)
                .OrderByDescending(fi => fi.LastWriteTime)
                .Select(fi => fi.FullName)
                .ToList();

// 处理路径，去掉gitPath前缀
            var relativePaths = sortedFiles
                .Select(f => f.Replace(gitPath, "").TrimStart(Path.DirectorySeparatorChar))
                .Select(f => f.Replace(Path.DirectorySeparatorChar, '/')) // 统一使用正斜杠
                .ToList();

            if (!relativePaths.Any())
            {
                return $"No files found matching pattern: {pattern}";
            }

            return string.Join("\n", relativePaths);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error in Glob: {ex.Message}");
            return $"Error matching files: {ex.Message}";
        }
    }

    /// <summary>
    /// 获取匹配glob模式的文件
    /// </summary>
    private List<string> GetMatchingFiles(string searchPath, string pattern, string[] ignoreFiles)
    {
        var matchedFiles = new List<string>();

        // 处理递归模式 (**)
        bool isRecursive = pattern.Contains("**/") || pattern.Contains("**\\");

        SearchOption searchOption = isRecursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;

        // 如果是简单的扩展名模式（如 *.js, *.ts）
        if (pattern.StartsWith("*.") && !pattern.Contains("/") && !pattern.Contains("\\"))
        {
            string searchPattern = pattern;
            var files = Directory.GetFiles(searchPath, searchPattern, searchOption);
            matchedFiles.AddRange(files.Where(f => !IsIgnoredFile(f, ignoreFiles)));
        }
        // 如果是复杂的glob模式
        else
        {
            // 获取所有文件
            var allFiles = Directory.GetFiles(searchPath, "*.*", searchOption);

            // 创建正则表达式来匹配glob模式
            var regexPattern = ConvertGlobToRegex(pattern);
            var regex = new Regex(regexPattern, RegexOptions.IgnoreCase);

            foreach (var file in allFiles)
            {
                if (IsIgnoredFile(file, ignoreFiles))
                    continue;

                // 获取相对于搜索路径的路径
                var relativePath = Path.GetRelativePath(searchPath, file).Replace(Path.DirectorySeparatorChar, '/');

                if (regex.IsMatch(relativePath))
                {
                    matchedFiles.Add(file);
                }
            }
        }

        return matchedFiles;
    }

    /// <summary>
    /// 将glob模式转换为正则表达式
    /// </summary>
    private string ConvertGlobToRegex(string globPattern)
    {
        var pattern = globPattern.Replace(Path.DirectorySeparatorChar, '/');
        var regexPattern = new StringBuilder();

        for (int i = 0; i < pattern.Length; i++)
        {
            var c = pattern[i];

            switch (c)
            {
                case '*':
                    if (i + 1 < pattern.Length && pattern[i + 1] == '*')
                    {
                        // ** 匹配任意层级目录
                        if (i + 2 < pattern.Length && pattern[i + 2] == '/')
                        {
                            regexPattern.Append("(.*/)");
                            i += 2; // 跳过 **/
                        }
                        else
                        {
                            regexPattern.Append(".*");
                            i++; // 跳过第二个 *
                        }
                    }
                    else
                    {
                        // 单个 * 匹配除路径分隔符外的任意字符
                        regexPattern.Append("[^/]*");
                    }

                    break;
                case '?':
                    regexPattern.Append("[^/]");
                    break;
                case '.':
                case '(':
                case ')':
                case '[':
                case ']':
                case '{':
                case '}':
                case '+':
                case '^':
                case '$':
                case '|':
                case '\\':
                    regexPattern.Append('\\').Append(c);
                    break;
                default:
                    regexPattern.Append(c);
                    break;
            }
        }

        return "^" + regexPattern.ToString() + "$";
    }

    /// <summary>
    /// 检查文件是否应该被忽略
    /// </summary>
    private bool IsIgnoredFile(string filePath, string[] ignoreFiles)
    {
        var filename = Path.GetFileName(filePath);

        foreach (var pattern in ignoreFiles)
        {
            if (string.IsNullOrWhiteSpace(pattern) || pattern.StartsWith("#"))
                continue;

            var trimmedPattern = pattern.Trim();

            // 转换gitignore模式到正则表达式
            if (trimmedPattern.Contains('*'))
            {
                string regexPattern = "^" + Regex.Escape(trimmedPattern).Replace("\\*", ".*") + "$";
                if (Regex.IsMatch(filename, regexPattern, RegexOptions.IgnoreCase))
                    return true;
            }
            else if (filename.Equals(trimmedPattern, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// 从指定行数开始读取文件内容
    /// </summary>
    /// <returns></returns>
    [KernelFunction(name: "Read"),
     Description(
         """
         To read the code files under the repository, note that the current method can only read text files and the path format provided by the user is relative rather than absolute.
         Usage:
         - The filePath must be a relative directory provided by the user
         - By default, it reads up to 200 lines from the beginning of the file
         - You can choose to specify the line offset and limit (particularly useful for long files), but it is recommended not to provide these parameters to read the entire file
         - Any lines exceeding 2000 characters will be truncated
         - You can call multiple tools in a single response. It is best to batch read multiple potentially useful files. It is best to batch read multiple potentially useful files.
         - If the file you read exists but is empty, you will receive a system alert warning instead of the file content.
         - Reading an non-existent file is also fine, and it will return an error.
         """)]
    public async Task<string> ReadFileFromLineAsync(
        [Description(
            "The Read File List.")]
        ReadFileItemInput[] items)
    {
        // 检查是否已达到文件读取限制
        if (DocumentOptions.MaxFileReadCount > 0 &&
            _count >= DocumentOptions.MaxFileReadCount)
        {
            int i = _count;
            _count = 0;

            return JsonSerializer.Serialize(new Dictionary<string, string>
                   {
                       ["system_warning"] =
                           $"File read limit exceeded ({i}/{DocumentOptions.MaxFileReadCount})"
                   }, new JsonSerializerOptions()
                   {
                       Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                       PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                   }) +
                   "\n\n<system-reminder>\n" +
                   "CRITICAL: FILE READ LIMIT EXCEEDED \n" +
                   $"Current attempts: {i}/{DocumentOptions.MaxFileReadCount}\n" +
                   "IMMEDIATE ACTION REQUIRED:\n" +
                   "• STOP reading files NOW\n" +
                   "• Use ONLY the information you have already gathered\n" +
                   "• Complete your analysis with existing data\n" +
                   "• Focus on generating final documentation\n" +
                   "Continued file reading will impact system performance and may violate usage policies.\n" +
                   "</system-reminder>";
        }

        items = items.DistinctBy(item => $"FilePath:{item.FilePath}\noffset:" + item.Offset + "\nlimit" + item.Limit)
            .ToArray();

        var dic = new Dictionary<string, string>();
        foreach (var item in items)
        {
            dic.Add($"FilePath:{item.FilePath}\noffset:" + item.Offset + "\nlimit" + item.Limit,
                await ReadItem(item.FilePath, item.Offset, item.Limit));
        }

        // 如果单次读取文件数量超过5个，每5个算一次
        if (items.Length > 5)
        {
            _count += (int)Math.Ceiling((double)items.Length / 5);
        }
        else
        {
            _count++;
        }

        // 在接近限制时发送警告
        if (DocumentOptions.MaxFileReadCount > 0 &&
            _count >= DocumentOptions.MaxFileReadCount * 0.8)
        {
            return JsonSerializer.Serialize(dic, new JsonSerializerOptions()
                   {
                       Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                       PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                   }) +
                   "\n\n<system-warning>\n" +
                   $"⚠️ Approaching file read limit: {_count}/{DocumentOptions.MaxFileReadCount}\n" +
                   "Consider completing your analysis soon to avoid hitting the limit.\n" +
                   "</system-warning>";
        }

        return JsonSerializer.Serialize(dic, new JsonSerializerOptions()
        {
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });
    }


    public async Task<string> ReadItem(
        string filePath,
        int offset = 0,
        int limit = 200)
    {
        try
        {
            filePath = Path.Combine(gitPath, filePath.TrimStart('/'));
            Console.WriteLine(
                $"Reading file from line {offset}: {filePath} offset={offset}, limit={limit}");

            // 如果<0则读取全部
            if (offset < 0 && limit < 0)
            {
                limit = 2000;
            }

            if (limit > 2000)
            {
                limit = 2000;
            }

            // 如果endLine<0则读取到最后一行
            if (limit < 0)
            {
                limit = int.MaxValue;
            }

            files?.Add(filePath);

            // 先读取整个文件内容
            string fileContent = await File.ReadAllTextAsync(filePath);

            if (string.IsNullOrEmpty(fileContent))
            {
                // 返回警告
                return """
                       <system-warning>
                       The current file contains empty text content.
                       </system-warning>
                       """;
            }

            // 如果启用代码压缩且是代码文件，先对整个文件内容进行压缩
            if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
            {
                fileContent = _codeCompressionService.CompressCode(fileContent, filePath);
            }

            // 将压缩后的内容按行分割
            var lines = fileContent.Split('\n');

            // 如果offset大于文件总行数，则返回空
            if (offset >= lines.Length)
            {
                return $"No content to read from line {offset} in file: {filePath}";
            }

            // 计算实际读取的行数
            int actualLimit = Math.Min(limit, lines.Length - offset);
            // 读取指定行数的内容
            var resultLines = new List<string>();
            for (int i = offset; i < offset + actualLimit && i < lines.Length; i++)
            {
                // 如果行内容超过2000字符，则截断
                if (lines[i].Length > 2000)
                {
                    resultLines.Add(lines[i][..2000]);
                }
                else
                {
                    resultLines.Add(lines[i]);
                }
            }

            // 将结果行号从1开始
            var numberedLines = resultLines.Select((line, index) => $"{index + 1}: {line}").ToList();

            return string.Join("\n", numberedLines);
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }

    /// <summary>
    /// 使用迭代方式搜索文件，避免递归调用栈溢出
    /// </summary>
    private void SearchFiles(string directory, string pattern, List<string> results, string baseDirectory = null)
    {
        // 如果没有指定基础目录，使用当前目录作为基础
        if (baseDirectory == null)
            baseDirectory = directory;

        // 使用栈来实现迭代遍历，避免递归
        var directoriesToSearch = new Stack<string>();
        directoriesToSearch.Push(directory);

        while (directoriesToSearch.Count > 0)
        {
            var currentDir = directoriesToSearch.Pop();

            try
            {
                // 搜索当前目录中的文件
                var files = Directory.GetFiles(currentDir);
                foreach (var file in files)
                {
                    var fileName = Path.GetFileName(file);
                    var relativePath = GetRelativePath(baseDirectory, file).Replace('\\', '/');

                    if (IsMatch(fileName, relativePath, pattern))
                    {
                        results.Add(relativePath);
                    }
                }

                // 将子目录添加到栈中进行后续搜索
                var directories = Directory.GetDirectories(currentDir);
                foreach (var subDir in directories)
                {
                    // 跳过一些常见的不需要搜索的目录
                    var dirName = Path.GetFileName(subDir);
                    if (dirName.StartsWith(".") ||
                        dirName.Equals("bin", StringComparison.OrdinalIgnoreCase) ||
                        dirName.Equals("obj", StringComparison.OrdinalIgnoreCase) ||
                        dirName.Equals("node_modules", StringComparison.OrdinalIgnoreCase) ||
                        dirName.Equals(".git", StringComparison.OrdinalIgnoreCase) ||
                        dirName.Equals(".vs", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    directoriesToSearch.Push(subDir);
                }
            }
            catch (UnauthorizedAccessException)
            {
                // 跳过无权限访问的目录
            }
            catch (Exception)
            {
                // 跳过其他错误的目录
            }
        }
    }

    /// <summary>
    /// 检查文件名或路径是否匹配给定的glob模式
    /// </summary>
    private bool IsMatch(string fileName, string relativePath, string pattern)
    {
        try
        {
            // 如果是简单的文件名模式（如 *.js, *.ts）
            if (pattern.StartsWith("*.") && !pattern.Contains("/") && !pattern.Contains("\\"))
            {
                var extension = pattern.Substring(1); // 去掉 *
                return fileName.EndsWith(extension, StringComparison.OrdinalIgnoreCase);
            }

            // 使用正则表达式匹配复杂的glob模式
            var regexPattern = ConvertGlobToRegex(pattern);
            var regex = new Regex(regexPattern, RegexOptions.IgnoreCase);
            
            // 同时检查文件名和相对路径
            return regex.IsMatch(fileName) || regex.IsMatch(relativePath);
        }
        catch
        {
            // 如果匹配失败，返回false
            return false;
        }
    }

    /// <summary>
    /// 获取相对路径
    /// </summary>
    private string GetRelativePath(string basePath, string fullPath)
    {
        try
        {
            return Path.GetRelativePath(basePath, fullPath);
        }
        catch
        {
            // 如果获取相对路径失败，返回文件名
            return Path.GetFileName(fullPath);
        }
    }
}

public class ReadFileItemInput
{
    [Description(
        "The relative address to be read")]
    [JsonPropertyName("filePath")]
    public string FilePath { get; set; }

    [Description(
        "The line number to start reading from. Only provide if the file is too large to read at once")]
    [JsonPropertyName("offset")]
    public int Offset { get; set; } = 0;

    [Description(
        "The number of lines to read. Only provide if the file is too large to read at once.")]
    [JsonPropertyName("limit")]
    public int Limit { get; set; } = 2000;
}