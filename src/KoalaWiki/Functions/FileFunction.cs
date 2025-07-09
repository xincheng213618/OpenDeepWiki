using System.ComponentModel;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using Microsoft.SemanticKernel;
using KoalaWiki.Options;
using KoalaWiki.Services;
using KoalaWiki.Utils;

namespace KoalaWiki.Functions;

public class FileFunction(string gitPath)
{
    private readonly CodeCompressionService _codeCompressionService = new();
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
    
    /// <summary>
    /// 获取文件基本信息
    /// </summary>
    /// <returns></returns>
    [KernelFunction(name: "FileInfo"), Description(
         "Before accessing or reading any file content, always use this method to retrieve the basic information for all specified files. Batch as many file paths as possible into a single call to maximize efficiency. Provide file paths as an array. The function returns a JSON object where each key is the file path and each value contains the file's name, size, extension, creation time, last write time, and last access time. Ensure this information is obtained and reviewed before proceeding to any file content operations."
     )]
    [return:
        Description(
            "Return a JSON object with file paths as keys and file information as values. The information includes file name, size, extension, creation time, last write time, and last access time."
        )]
    public string GetFileInfoAsync(
        [Description("File Path")] string[] filePath)
    {
        try
        {
            var dic = new Dictionary<string, string>();

            filePath = filePath.Distinct().ToArray();

            if (DocumentContext.DocumentStore?.Files != null)
            {
                DocumentContext.DocumentStore.Files.AddRange(filePath);
            }

            foreach (var item in filePath)
            {
                var fullPath = Path.Combine(gitPath, item.TrimStart('/'));
                if (!File.Exists(fullPath))
                {
                    dic[item] = "File not found";
                    continue;
                }

                Console.WriteLine($"Getting file info: {fullPath}");
                var info = new FileInfo(fullPath);

                // 获取文件信息
                dic[item] = JsonSerializer.Serialize(new
                {
                    info.Name,
                    info.Length,
                    info.Extension,
                    // 返回总行数
                    TotalLine = File.ReadAllLines(fullPath).Length,
                }, JsonSerializerOptions.Web);
            }

            return JsonSerializer.Serialize(dic, JsonSerializerOptions.Web);
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error getting file info: {ex.Message}");
            return $"Error getting file info: {ex.Message}";
        }
    }

    // [KernelFunction, Description(
    //      "Read the specified file content. Always batch as many file paths as possible into a single call to minimize the number of invocations. Provide file paths as an array for maximum efficiency. The function returns a JSON object where each key is the file path and the value is the file content. If a file exceeds 100KB, instead of its content, return: 'If the file exceeds 100KB, you should use ReadFileFromLineAsync to read the file content line by line.' If the file size exceeds 10k, only 10k content will be returned."
    //  )]
    // [return:
    //     Description(
    //         "Return a JSON object with file paths as keys and file contents as values. For files over 100KB, return: 'If the file exceeds 100KB, you should use ReadFileFromLineAsync to read the file content line by line.' If the file size exceeds 10k, only 10k content will be returned."
    //     )]
    public async Task<string> ReadFilesAsync(
        [Description("File Path array. Always batch multiple file paths to reduce the number of function calls.")]
        string[] filePaths)
    {
        try
        {
            filePaths = filePaths.Distinct().ToArray();

            if (DocumentContext.DocumentStore?.Files != null)
            {
                DocumentContext.DocumentStore.Files.AddRange(filePaths);
            }

            var dic = new Dictionary<string, string>();
            foreach (var filePath in filePaths)
            {
                var item = Path.Combine(gitPath, filePath.TrimStart('/'));
                if (!File.Exists(item))
                {
                    continue;
                }

                Console.WriteLine($"Reading file: {item}");

                var info = new FileInfo(item);

                // 判断文件大小
                if (info.Length > 1024 * 100)
                {
                    dic[filePath] =
                        "If the file exceeds 100KB, you should use ReadFileFromLineAsync to read the file content line by line";
                }
                else
                {
                    // 读取整个文件内容
                    string content = await File.ReadAllTextAsync(item);

                    // 如果启用代码压缩且是代码文件，则应用压缩
                    if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
                    {
                        content = _codeCompressionService.CompressCode(content, filePath);
                    }

                    dic[filePath] = content;
                }
            }

            return JsonSerializer.Serialize(dic, new JsonSerializerOptions()
            {
                Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
                WriteIndented = true,
            });
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            throw new Exception($"Error reading file: {ex.Message}");
        }
    }

    public async Task<string> ReadFileAsync(
        [Description("File Path")] string filePath)
    {
        try
        {
            if (DocumentContext.DocumentStore?.Files != null)
            {
                DocumentContext.DocumentStore.Files.Add(filePath);
            }

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

            return content;
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }

    public class ReadFileInput
    {
        [Description(
            "An array of file items to read. Each item contains the file path and the start and end line numbers for reading. The file must exist and be readable. If the path is invalid or the file does not exist, an exception will be thrown.")]
        public ReadFileItemInput[] Items { get; set; } = [];
    }

    /// <summary>
    /// 从指定行数开始读取文件内容
    /// </summary>
    /// <returns></returns>
    [KernelFunction(name: "FileFromLine"),
     Description(
         "Asynchronously reads the specified file and only returns the text content from the starting line to the ending line (inclusive). Suitable for efficiently handling large files, ensuring performance and data security.")]
    [return:
        Description(
            "Returns the file content from the specified starting line to the ending line (inclusive). If the total output length exceeds 10,000 characters, only the first 10,000 characters are returned, the content order is consistent with the original file, and the original line breaks are retained.")]
    public async Task<string> ReadFileFromLineAsync(
        [Description(
            "An array of file items to read. Each item contains the file path and the start and end line numbers for reading. The file must exist and be readable. If the path is invalid or the file does not exist, an exception will be thrown.")]
        ReadFileItemInput[] items)
    {
        var dic = new Dictionary<string, string>();
        foreach (var item in items)
        {
            dic.Add($"fileName:{item.FilePath}\nstartLine:{item.StartLine}\nendLine:{item.EndLine}",
                await ReadItem(item.FilePath, item.StartLine, item.EndLine));
        }

        return JsonSerializer.Serialize(dic, JsonSerializerOptions.Web);
    }


    public async Task<string> ReadItem(
        [Description(
            "The absolute or relative path of the target file. The file must exist and be readable. If the path is invalid or the file does not exist, an exception will be thrown.")]
        string filePath,
        [Description(
            "The starting line number for reading (starting from 0), must be less than or equal to the ending line number, and must be within the actual number of lines in the file.")]
        int startLine = 0,
        [Description(
            "The ending line number for reading (including this line), must be greater than or equal to the starting line number, and must not exceed the total number of lines in the file.")]
        int endLine = 200)
    {
        try
        {
            filePath = Path.Combine(gitPath, filePath.TrimStart('/'));
            Console.WriteLine(
                $"Reading file from line {startLine}: {filePath} startLine={startLine}, endLine={endLine}");

            // 如果<0则读取全部
            if (startLine < 0 && endLine < 0)
            {
                return await ReadFileAsync(filePath);
            }

            // 如果endLine<0则读取到最后一行
            if (endLine < 0)
            {
                endLine = int.MaxValue;
            }

            // 先读取整个文件内容
            string fileContent = await File.ReadAllTextAsync(filePath);
            
            // 如果启用代码压缩且是代码文件，先对整个文件内容进行压缩
            if (DocumentOptions.EnableCodeCompression && CodeFileDetector.IsCodeFile(filePath))
            {
                fileContent = _codeCompressionService.CompressCode(fileContent, filePath);
            }
            
            // 将压缩后的内容按行分割
            var lines = fileContent.Split('\n');

            // 验证行号范围
            if (startLine < 0 || startLine >= lines.Length)
            {
                return $"Invalid start line: {startLine}";
            }

            if (endLine < startLine || endLine >= lines.Length)
            {
                endLine = lines.Length - 1;
            }

            // 提取指定范围的行
            var result = new StringBuilder();
            for (var i = startLine; i <= endLine; i++)
            {
                result.AppendLine(lines[i].TrimEnd('\r'));
            }

            return result.ToString();
        }
        catch (Exception ex)
        {
            // 处理异常
            Console.WriteLine($"Error reading file: {ex.Message}");
            return $"Error reading file: {ex.Message}";
        }
    }
}

public class ReadFileItemInput
{
    [Description(
        "The absolute or relative path of the target file. The file must exist and be readable. If the path is invalid or the file does not exist, an exception will be thrown.")]
    public string FilePath { get; set; }

    [Description(
        "The starting line number for reading (starting from 0), must be less than or equal to the ending line number, and must be within the actual number of lines in the file.")]
    public int StartLine { get; set; } = 0;

    [Description(
        "The ending line number for reading (including this line), must be greater than or equal to the starting line number, and must not exceed the total number of lines in the file.")]
    public int EndLine { get; set; } = 200;
}