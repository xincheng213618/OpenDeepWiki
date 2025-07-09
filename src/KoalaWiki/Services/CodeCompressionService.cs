using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using KoalaWiki.Utils;

namespace KoalaWiki.Services;

/// <summary>
/// 代码压缩服务
/// 提供对不同编程语言的代码压缩功能，保留注释、方法名等关键信息
/// </summary>
public class CodeCompressionService
{
    /// <summary>
    /// 压缩代码内容
    /// </summary>
    /// <param name="content">原始代码内容</param>
    /// <param name="filePath">文件路径（用于确定语言类型）</param>
    /// <returns>压缩后的代码内容</returns>
    public string CompressCode(string content, string filePath)
    {
        if (string.IsNullOrEmpty(content))
            return content;

        var languageType = CodeFileDetector.GetLanguageType(filePath);
        if (languageType == null)
            return content; // 不是代码文件，不进行压缩

        // 根据语言类型选择压缩方法
        return languageType switch
        {
            "csharp" => CompressCSharp(content),
            "javascript" or "typescript" => CompressJavaScript(content),
            "python" => CompressPython(content),
            "java" or "kotlin" or "scala" => CompressJava(content),
            "c" or "cpp" => CompressCpp(content),
            "go" => CompressGo(content),
            "rust" => CompressRust(content),
            "php" => CompressPhp(content),
            "ruby" => CompressRuby(content),
            "swift" => CompressSwift(content),
            "bash" or "zsh" or "fish" or "powershell" => CompressShell(content),
            "sql" => CompressSql(content),
            "html" => CompressHtml(content),
            "css" or "scss" or "sass" or "less" => CompressCss(content),
            "json" => CompressJson(content),
            "xml" => CompressXml(content),
            "yaml" or "yml" => CompressYaml(content),
            "markdown" => CompressMarkdown(content),
            _ => CompressGeneric(content) // 对于其他语言使用通用压缩方法
        };
    }

    /// <summary>
    /// 压缩 C# 代码
    /// </summary>
    private string CompressCSharp(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine; // 保留原始缩进用于 later use
            var trimmedLine = line.Trim();

            // 跳过空行
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释开始/结束
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行/文档注释
            if (trimmedLine.StartsWith("//"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构行并对其进行规范化
            if (IsImportantCSharpLine(trimmedLine))
            {
                result.Add(NormalizeCSharpLine(line));
                continue;
            }

            // 保留独立的大括号以维持语法结构
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(trimmedLine);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 规范化 C# 重要代码行：
    /// 1. 移除表达式主体成员 (=>) 的实现
    /// 2. 移除字段/属性赋值右侧表达式
    /// </summary>
    private string NormalizeCSharpLine(string line)
    {
        var working = line.TrimEnd();

        // 处理表达式主体成员 =>
        var arrowIndex = working.IndexOf("=>");
        if (arrowIndex >= 0)
        {
            var prefix = working.Substring(0, arrowIndex).TrimEnd();
            // 替换为空方法体
            return prefix + " { }";
        }

        // 处理字段/属性赋值
        // 排除 ==
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            if (!prefix.EndsWith(";"))
                prefix += ";";
            return prefix;
        }

        return line.TrimEnd();
    }

    /// <summary>
    /// 判断是否为重要的 C# 代码行
    /// </summary>
    private bool IsImportantCSharpLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*using\s+",                    // using 语句
            @"^\s*namespace\s+",                // namespace 声明
            @"^\s*(public|private|protected|internal|static|abstract|virtual|override|sealed|partial)\s+.*class\s+", // 类声明
            @"^\s*(public|private|protected|internal|static|abstract|virtual|override|sealed|partial)\s+.*interface\s+", // 接口声明
            @"^\s*(public|private|protected|internal|static|abstract|virtual|override|sealed|partial)\s+.*enum\s+", // 枚举声明
            @"^\s*(public|private|protected|internal|static|abstract|virtual|override|sealed|partial)\s+.*struct\s+", // 结构体声明
            @"^\s*\[.*\]",                      // 特性
            @"^\s*(public|private|protected|internal|static|abstract|virtual|override|sealed|async)\s+.*\(",  // 方法声明
            @"^\s*(public|private|protected|internal|static|readonly|const)\s+.*\s+\w+\s*[{;=]", // 属性/字段声明
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
            @"^\s*#region",                     // region 指令
            @"^\s*#endregion",                  // endregion 指令
            @"^\s*#if",                         // 条件编译指令
            @"^\s*#endif"                       // 条件编译结束指令
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
    }

    /// <summary>
    /// 压缩 JavaScript/TypeScript 代码
    /// </summary>
    private string CompressJavaScript(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留注释
            if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("/*"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构并进行规范化
            if (IsImportantJavaScriptLine(trimmedLine))
            {
                result.Add(NormalizeJavaScriptLine(line));
                continue;
            }

            // 保留独立的大括号
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(trimmedLine);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 规范化 JavaScript/TypeScript 重要代码行：
    /// 1. 移除箭头函数/表达式主体实现
    /// 2. 移除变量赋值右侧表达式
    /// </summary>
    private string NormalizeJavaScriptLine(string line)
    {
        var working = line.TrimEnd();

        // 处理箭头函数 =>
        var arrowIndex = working.IndexOf("=>");
        if (arrowIndex >= 0)
        {
            var prefix = working.Substring(0, arrowIndex).TrimEnd();
            return prefix + " => {}";
        }

        // 处理赋值 =
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("==") && !working.Contains("=>"))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            if (!prefix.EndsWith(";"))
                prefix += ";";
            return prefix;
        }

        return working;
    }

    /// <summary>
    /// 判断是否为重要的 JavaScript 代码行
    /// </summary>
    private bool IsImportantJavaScriptLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*import\s+",                   // import 语句
            @"^\s*export\s+",                   // export 语句
            @"^\s*function\s+",                 // 函数声明
            @"^\s*class\s+",                    // 类声明
            @"^\s*interface\s+",                // 接口声明（TypeScript）
            @"^\s*type\s+",                     // 类型声明（TypeScript）
            @"^\s*enum\s+",                     // 枚举声明（TypeScript）
            @"^\s*const\s+\w+\s*=\s*\(",       // 箭头函数
            @"^\s*let\s+\w+\s*=\s*\(",         // 函数表达式
            @"^\s*var\s+\w+\s*=\s*\(",         // 函数表达式
            @"^\s*\w+\s*:\s*function",          // 对象方法
            @"^\s*\w+\s*\(",                    // 方法调用
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 压缩 Python 代码（保持缩进结构）
    /// </summary>
    private string CompressPython(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var trimmedLine = line.TrimEnd();

            // 保留注释
            if (trimmedLine.Trim().StartsWith("#"))
            {
                result.Add(trimmedLine);
                continue;
            }

            // 保留重要结构
            if (IsImportantPythonLine(line))
            {
                result.Add(trimmedLine);

                // 对于 def/class，插入占位 pass 保持语法有效
                if (Regex.IsMatch(trimmedLine, @"^\s*(def|class)\s+", RegexOptions.IgnoreCase))
                {
                    var indent = Regex.Match(trimmedLine, @"^\s*").Value;
                    result.Add(indent + "    pass");
                }
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Python 代码行（去除变量赋值条目）
    /// </summary>
    private bool IsImportantPythonLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*import\s+",                   // import 语句
            @"^\s*from\s+.*import",             // from import 语句
            @"^\s*def\s+",                      // 函数定义
            @"^\s*class\s+",                    // 类定义
            @"^\s*@\w+",                        // 装饰器
            @"^\s*if\s+__name__\s*==",          // 主程序入口
            @"^\s*(if|elif|else|for|while|try|except|finally|with)[\s:]", // 控制结构
            @"^\s*return\s+",                   // return
            @"^\s*print\s*\("                  // print
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 通用代码压缩方法优化
    /// </summary>
    private string CompressGeneric(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            
            // 跳过空行
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留注释行
            if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#") || 
                trimmedLine.StartsWith("/*") || trimmedLine.StartsWith("*") ||
                trimmedLine.StartsWith("'''") || trimmedLine.StartsWith("\"\"\""))
            {
                result.Add(line);
                continue;
            }

            // 保留结构性行（如函数声明、类声明等）
            if (IsStructuralLine(trimmedLine))
            {
                result.Add(NormalizeStructuralLine(line));
                continue;
            }

            // 保留非空行但移除实现细节
            var normalizedLine = NormalizeImplementationLine(line);
            if (!string.IsNullOrWhiteSpace(normalizedLine))
                result.Add(normalizedLine);
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为结构性代码行（如函数声明、类声明等）
    /// </summary>
    private bool IsStructuralLine(string line)
    {
        // 检查常见的结构性关键字
        var structuralPatterns = new[]
        {
            @"^\s*(class|interface|enum|struct|namespace|import|using|include|require|from|package)\s+",
            @"^\s*(public|private|protected|internal|static|final|abstract|override|virtual|extern|const)\s+",
            @"^\s*(function|def|func|sub|proc|method|procedure|fn|fun|async|await|export)\s+",
            @"^\s*(var|let|const|dim|int|string|bool|float|double|void|auto|val|char)\s+",
            @"^\s*(@|\[|#)\w+",  // 装饰器、特性、注解
            @"^\s*<\w+",         // XML/HTML标签
            @"^\s*\w+\s*\(",     // 函数调用
            @"^\s*\{|\}|\(|\)|\[|\]", // 括号
            @"^\s*#\w+",         // 预处理指令
        };

        return structuralPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
    }

    /// <summary>
    /// 规范化结构性代码行
    /// </summary>
    private string NormalizeStructuralLine(string line)
    {
        // 保留函数/方法声明，但移除函数体
        if (Regex.IsMatch(line, @"^\s*(\w+\s+)*\w+\s*\([^)]*\)\s*(\{|\=>)"))
        {
            var match = Regex.Match(line, @"^(.*?\([^)]*\))");
            if (match.Success)
                return match.Groups[1].Value + " { }";
        }

        // 保留变量声明，但移除初始化表达式
        if (Regex.IsMatch(line, @"^\s*(\w+\s+)*\w+\s*="))
        {
            var match = Regex.Match(line, @"^(.*?)=");
            if (match.Success)
                return match.Groups[1].Value + ";";
        }

        return line;
    }

    /// <summary>
    /// 规范化实现代码行（移除实现细节）
    /// </summary>
    private string NormalizeImplementationLine(string line)
    {
        // 移除赋值表达式右侧
        if (line.Contains("=") && !line.Contains("==") && !line.Contains("!=") && !line.Contains("<=") && !line.Contains(">="))
        {
            var parts = line.Split('=', 2);
            if (parts.Length > 1)
                return parts[0] + ";";
        }

        // 移除函数调用参数
        if (Regex.IsMatch(line, @"\w+\s*\("))
        {
            return Regex.Replace(line, @"(\w+\s*)\([^)]*\)", "$1();");
        }

        return line;
    }

    /// <summary>
    /// 压缩 Go 代码
    /// </summary>
    private string CompressGo(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行注释
            if (trimmedLine.StartsWith("//"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构
            if (IsImportantGoLine(trimmedLine))
            {
                result.Add(NormalizeGoLine(line));
                continue;
            }

            // 保留独立的大括号
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(line);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Go 代码行
    /// </summary>
    private bool IsImportantGoLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*package\s+",                  // package 声明
            @"^\s*import\s+",                   // import 语句
            @"^\s*import\s+\(",                 // 多行 import 开始
            @"^\s*type\s+\w+\s+",               // 类型声明
            @"^\s*func\s+\(",                   // 方法接收器
            @"^\s*func\s+\w+\s*\(",             // 函数声明
            @"^\s*interface\s+",                // 接口声明
            @"^\s*struct\s+",                   // 结构体声明
            @"^\s*const\s+",                    // 常量声明
            @"^\s*var\s+",                      // 变量声明
            @"^\s*go\s+",                       // goroutine
            @"^\s*defer\s+",                    // defer
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 规范化 Go 代码行
    /// </summary>
    private string NormalizeGoLine(string line)
    {
        var working = line.TrimEnd();

        // 处理变量赋值
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            if (!prefix.EndsWith(";"))
                prefix += ";";
            return prefix;
        }

        // 处理函数声明，保留签名但移除实现
        if (Regex.IsMatch(working, @"^\s*func\s+.*\)\s*{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " {";
        }

        return working;
    }

    /// <summary>
    /// 压缩 Rust 代码
    /// </summary>
    private string CompressRust(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行注释
            if (trimmedLine.StartsWith("//"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构
            if (IsImportantRustLine(trimmedLine))
            {
                result.Add(NormalizeRustLine(line));
                continue;
            }

            // 保留独立的大括号
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(line);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Rust 代码行
    /// </summary>
    private bool IsImportantRustLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*use\s+",                      // use 语句
            @"^\s*mod\s+",                      // mod 声明
            @"^\s*pub\s+",                      // pub 修饰符
            @"^\s*fn\s+",                       // 函数声明
            @"^\s*struct\s+",                   // 结构体声明
            @"^\s*enum\s+",                     // 枚举声明
            @"^\s*trait\s+",                    // trait 声明
            @"^\s*impl\s+",                     // impl 实现块
            @"^\s*type\s+",                     // 类型别名
            @"^\s*const\s+",                    // 常量声明
            @"^\s*static\s+",                   // 静态变量
            @"^\s*let\s+",                      // 变量声明
            @"^\s*#\[",                         // 属性宏
            @"^\s*macro_rules!\s+",             // 宏定义
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 规范化 Rust 代码行
    /// </summary>
    private string NormalizeRustLine(string line)
    {
        var working = line.TrimEnd();

        // 处理变量赋值
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            if (!prefix.EndsWith(";"))
                prefix += ";";
            return prefix;
        }

        // 处理函数声明，保留签名但移除实现
        if (Regex.IsMatch(working, @"^\s*fn\s+.*\)\s*-?>?\s*\w*\s*{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " {";
        }

        return working;
    }

    /// <summary>
    /// 压缩 PHP 代码
    /// </summary>
    private string CompressPhp(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留 PHP 开始/结束标签
            if (trimmedLine.StartsWith("<?php") || trimmedLine.StartsWith("<?") || trimmedLine.StartsWith("?>"))
            {
                result.Add(line);
                continue;
            }

            // 处理多行注释
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行注释
            if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构
            if (IsImportantPhpLine(trimmedLine))
            {
                result.Add(NormalizePhpLine(line));
                continue;
            }

            // 保留独立的大括号
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(line);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 PHP 代码行
    /// </summary>
    private bool IsImportantPhpLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*namespace\s+",                // 命名空间声明
            @"^\s*use\s+",                      // use 语句
            @"^\s*require\s+",                  // require 语句
            @"^\s*require_once\s+",             // require_once 语句
            @"^\s*include\s+",                  // include 语句
            @"^\s*include_once\s+",             // include_once 语句
            @"^\s*class\s+",                    // 类声明
            @"^\s*interface\s+",                // 接口声明
            @"^\s*trait\s+",                    // trait 声明
            @"^\s*abstract\s+",                 // abstract 类/方法
            @"^\s*final\s+",                    // final 类/方法
            @"^\s*(public|private|protected)\s+", // 访问修饰符
            @"^\s*function\s+",                 // 函数声明
            @"^\s*\$\w+\s*=",                   // 变量赋值
            @"^\s*define\s*\(",                 // 常量定义
            @"^\s*const\s+",                    // 类常量
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 规范化 PHP 代码行
    /// </summary>
    private string NormalizePhpLine(string line)
    {
        var working = line.TrimEnd();

        // 处理变量赋值
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            if (!prefix.EndsWith(";"))
                prefix += ";";
            return prefix;
        }

        // 处理函数声明，保留签名但移除实现
        if (Regex.IsMatch(working, @"^\s*function\s+.*\)\s*{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " {";
        }

        return working;
    }

    /// <summary>
    /// 压缩 Ruby 代码
    /// </summary>
    private string CompressRuby(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            if (string.IsNullOrWhiteSpace(line))
                continue;

            var trimmedLine = line.TrimEnd();

            // 处理多行注释 =begin/=end
            if (trimmedLine.StartsWith("=begin"))
            {
                inMultiLineComment = true;
                result.Add(line);
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.StartsWith("=end"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行注释
            if (trimmedLine.Trim().StartsWith("#"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构
            if (IsImportantRubyLine(line))
            {
                result.Add(line);
                // 对于 def/class，插入占位 end 保持语法有效
                if (Regex.IsMatch(trimmedLine, @"^\s*(def|class|module)\s+", RegexOptions.IgnoreCase) && 
                    !trimmedLine.Contains(";") && !trimmedLine.EndsWith("end"))
                {
                    var indent = Regex.Match(trimmedLine, @"^\s*").Value;
                    result.Add(indent + "  # 占位符");
                    result.Add(indent + "end");
                }
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Ruby 代码行
    /// </summary>
    private bool IsImportantRubyLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*require\s+",                  // require 语句
            @"^\s*require_relative\s+",         // require_relative 语句
            @"^\s*load\s+",                     // load 语句
            @"^\s*include\s+",                  // include 模块
            @"^\s*extend\s+",                   // extend 模块
            @"^\s*class\s+",                    // 类声明
            @"^\s*module\s+",                   // 模块声明
            @"^\s*def\s+",                      // 方法定义
            @"^\s*attr_\w+\s+",                 // 属性方法
            @"^\s*alias\s+",                    // 别名
            @"^\s*private\s+",                  // 私有方法
            @"^\s*protected\s+",                // 保护方法
            @"^\s*public\s+",                   // 公共方法
            @"^\s*end\s*$",                     // end 关键字
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 压缩 Swift 代码
    /// </summary>
    private string CompressSwift(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();

            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行注释
            if (trimmedLine.StartsWith("//"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构
            if (IsImportantSwiftLine(trimmedLine))
            {
                result.Add(NormalizeSwiftLine(line));
                continue;
            }

            // 保留独立的大括号
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(line);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Swift 代码行
    /// </summary>
    private bool IsImportantSwiftLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*import\s+",                   // import 语句
            @"^\s*@\w+",                        // 属性/装饰器
            @"^\s*class\s+",                    // 类声明
            @"^\s*struct\s+",                   // 结构体声明
            @"^\s*enum\s+",                     // 枚举声明
            @"^\s*protocol\s+",                 // 协议声明
            @"^\s*extension\s+",                // 扩展声明
            @"^\s*func\s+",                     // 函数声明
            @"^\s*var\s+",                      // 变量声明
            @"^\s*let\s+",                      // 常量声明
            @"^\s*typealias\s+",                // 类型别名
            @"^\s*init\s*\(",                   // 初始化器
            @"^\s*deinit\s*\{",                 // 反初始化器
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 规范化 Swift 代码行
    /// </summary>
    private string NormalizeSwiftLine(string line)
    {
        var working = line.TrimEnd();

        // 处理变量赋值
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            return prefix;
        }

        // 处理函数声明，保留签名但移除实现
        if (Regex.IsMatch(working, @"^\s*func\s+.*\)\s*-?>?\s*\w*\s*{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " {";
        }

        return working;
    }

    /// <summary>
    /// 压缩 Shell 脚本代码
    /// </summary>
    private string CompressShell(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留注释
            if (trimmedLine.StartsWith("#"))
            {
                result.Add(line);
                continue;
            }

            // 保留 shebang
            if (trimmedLine.StartsWith("#!/"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构
            if (IsImportantShellLine(trimmedLine))
            {
                result.Add(NormalizeShellLine(line));
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Shell 脚本代码行
    /// </summary>
    private bool IsImportantShellLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*function\s+\w+\s*\(\)",       // 函数声明
            @"^\s*\w+\s*\(\)\s*{",              // 函数声明（另一种形式）
            @"^\s*if\s+",                       // if 语句
            @"^\s*elif\s+",                     // elif 语句
            @"^\s*else\s*",                     // else 语句
            @"^\s*fi\s*",                       // if 结束
            @"^\s*for\s+",                      // for 循环
            @"^\s*while\s+",                    // while 循环
            @"^\s*until\s+",                    // until 循环
            @"^\s*do\s*",                       // do 关键字
            @"^\s*done\s*",                     // 循环结束
            @"^\s*case\s+",                     // case 语句
            @"^\s*esac\s*",                     // case 结束
            @"^\s*\w+\s*=",                     // 变量赋值
            @"^\s*export\s+",                   // 导出变量
            @"^\s*source\s+",                   // 引入其他脚本
            @"^\s*\.\s+",                       // 引入其他脚本（简写）
            @"^\s*alias\s+",                    // 别名定义
            @"^\s*trap\s+",                     // 信号捕获
            @"^\s*\{\s*",                       // 开始大括号
            @"^\s*\}\s*",                       // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern));
    }

    /// <summary>
    /// 规范化 Shell 脚本代码行
    /// </summary>
    private string NormalizeShellLine(string line)
    {
        var working = line.TrimEnd();

        // 处理变量赋值
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex + 1);
            return prefix;
        }

        // 处理函数声明，保留签名但移除实现
        if (Regex.IsMatch(working, @"^\s*function\s+\w+\s*\(\)\s*{?\s*$") || 
            Regex.IsMatch(working, @"^\s*\w+\s*\(\)\s*{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " {";
        }

        return working;
    }

    /// <summary>
    /// 压缩 SQL 代码
    /// </summary>
    private string CompressSql(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留单行注释
            if (trimmedLine.StartsWith("--"))
            {
                result.Add(line);
                continue;
            }

            // 保留多行注释
            if (trimmedLine.StartsWith("/*"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要的 SQL 结构
            if (IsImportantSqlLine(trimmedLine))
            {
                result.Add(line);
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 SQL 代码行
    /// </summary>
    private bool IsImportantSqlLine(string line)
    {
        // 转换为大写以进行不区分大小写的比较
        var upperLine = line.ToUpper();
        
        var importantKeywords = new[]
        {
            "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", 
            "FULL", "CROSS", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "OFFSET",
            "INSERT", "UPDATE", "DELETE", "CREATE", "ALTER", "DROP", "TRUNCATE",
            "TABLE", "VIEW", "INDEX", "PROCEDURE", "FUNCTION", "TRIGGER", "SCHEMA",
            "DATABASE", "GRANT", "REVOKE", "COMMIT", "ROLLBACK", "BEGIN", "TRANSACTION",
            "WITH", "UNION", "INTERSECT", "EXCEPT", "CASE", "WHEN", "THEN", "ELSE", "END"
        };

        return importantKeywords.Any(keyword => upperLine.Contains(keyword));
    }

    /// <summary>
    /// 压缩 HTML 代码
    /// </summary>
    private string CompressHtml(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理 HTML 注释
            if (trimmedLine.StartsWith("<!--"))
            {
                inComment = true;
                result.Add(line);
                if (trimmedLine.Contains("-->"))
                    inComment = false;
                continue;
            }
            if (inComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("-->"))
                    inComment = false;
                continue;
            }

            // 保留重要的 HTML 标签结构
            if (IsImportantHtmlLine(trimmedLine))
            {
                result.Add(line);
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 HTML 代码行
    /// </summary>
    private bool IsImportantHtmlLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*<!DOCTYPE",                   // DOCTYPE 声明
            @"^\s*<html",                       // html 标签
            @"^\s*</html>",                     // html 结束标签
            @"^\s*<head",                       // head 标签
            @"^\s*</head>",                     // head 结束标签
            @"^\s*<body",                       // body 标签
            @"^\s*</body>",                     // body 结束标签
            @"^\s*<meta",                       // meta 标签
            @"^\s*<title",                      // title 标签
            @"^\s*<link",                       // link 标签
            @"^\s*<script",                     // script 标签
            @"^\s*</script>",                   // script 结束标签
            @"^\s*<style",                      // style 标签
            @"^\s*</style>",                    // style 结束标签
            @"^\s*<div",                        // div 标签
            @"^\s*</div>",                      // div 结束标签
            @"^\s*<span",                       // span 标签
            @"^\s*<p",                          // p 标签
            @"^\s*<h[1-6]",                     // 标题标签
            @"^\s*<a",                          // 链接标签
            @"^\s*<img",                        // 图片标签
            @"^\s*<form",                       // 表单标签
            @"^\s*<input",                      // 输入标签
            @"^\s*<button",                     // 按钮标签
            @"^\s*<table",                      // 表格标签
            @"^\s*<tr",                         // 表格行标签
            @"^\s*<td",                         // 表格单元格标签
            @"^\s*<ul",                         // 无序列表标签
            @"^\s*<ol",                         // 有序列表标签
            @"^\s*<li",                         // 列表项标签
            @"^\s*</?[a-z][a-z0-9]*",           // 任何其他 HTML 标签
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
    }

    /// <summary>
    /// 压缩 CSS 代码
    /// </summary>
    private string CompressCss(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理 CSS 注释
            if (trimmedLine.StartsWith("/*"))
            {
                inComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inComment = false;
                continue;
            }
            if (inComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inComment = false;
                continue;
            }

            // 保留选择器和属性声明
            if (IsImportantCssLine(trimmedLine))
            {
                result.Add(NormalizeCssLine(line));
                continue;
            }

            // 保留大括号
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(line);
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 CSS 代码行
    /// </summary>
    private bool IsImportantCssLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*@import\s+",                  // @import 规则
            @"^\s*@media\s+",                   // @media 规则
            @"^\s*@font-face\s+",               // @font-face 规则
            @"^\s*@keyframes\s+",               // @keyframes 规则
            @"^\s*@supports\s+",                // @supports 规则
            @"^\s*@charset\s+",                 // @charset 规则
            @"^\s*@page\s+",                    // @page 规则
            @"^\s*@namespace\s+",               // @namespace 规则
            @"^\s*@counter-style\s+",           // @counter-style 规则
            @"^\s*@document\s+",                // @document 规则
            @"^\s*@viewport\s+",                // @viewport 规则
            @"^\s*[.#]?[a-z][a-z0-9_-]*",       // 选择器
            @"^\s*\[",                          // 属性选择器
            @"^\s*:",                           // 伪类选择器
            @"^\s*::",                          // 伪元素选择器
            @"^\s*>",                           // 子选择器
            @"^\s*\+",                          // 相邻兄弟选择器
            @"^\s*~",                           // 一般兄弟选择器
            @"^\s*\*",                          // 通用选择器
            @"^\s*[a-z-]+\s*:",                 // 属性声明
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
    }

    /// <summary>
    /// 规范化 CSS 代码行
    /// </summary>
    private string NormalizeCssLine(string line)
    {
        var working = line.TrimEnd();

        // 处理属性声明，移除值部分
        var colonIndex = working.IndexOf(':');
        if (colonIndex >= 0 && !working.StartsWith("@") && !working.StartsWith(":"))
        {
            var prefix = working.Substring(0, colonIndex + 1);
            return prefix;
        }

        return working;
    }

    /// <summary>
    /// 压缩 XML 代码
    /// </summary>
    private string CompressXml(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理 XML 注释
            if (trimmedLine.StartsWith("<!--"))
            {
                inComment = true;
                result.Add(line);
                if (trimmedLine.Contains("-->"))
                    inComment = false;
                continue;
            }
            if (inComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("-->"))
                    inComment = false;
                continue;
            }

            // 保留 XML 声明和 DOCTYPE
            if (trimmedLine.StartsWith("<?xml") || trimmedLine.StartsWith("<!DOCTYPE"))
            {
                result.Add(line);
                continue;
            }

            // 保留标签结构
            if (trimmedLine.StartsWith("<") && !trimmedLine.StartsWith("</"))
            {
                // 处理开始标签，保留标签名和属性名，但移除属性值
                var processed = NormalizeXmlLine(line);
                result.Add(processed);
                continue;
            }

            // 保留结束标签
            if (trimmedLine.StartsWith("</"))
            {
                result.Add(line);
                continue;
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 规范化 XML 代码行
    /// </summary>
    private string NormalizeXmlLine(string line)
    {
        // 如果是自闭合标签或结束标签，保持不变
        if (line.Contains("/>") || line.StartsWith("</"))
            return line;

        // 对于属性，保留属性名但移除属性值
        var result = Regex.Replace(line, @"(\w+)=""[^""]*""", "$1=\"\"");
        return result;
    }

    /// <summary>
    /// 压缩 JSON 代码
    /// </summary>
    private string CompressJson(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留注释
            if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("/*"))
            {
                result.Add(line);
                continue;
            }

            // 保留非空行
            result.Add(trimmedLine);
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 压缩 YAML 代码
    /// </summary>
    private string CompressYaml(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留注释
            if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#") || trimmedLine.StartsWith("---"))
            {
                result.Add(line);
                continue;
            }

            // 保留非空行
            result.Add(trimmedLine);
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 压缩 Markdown 代码
    /// </summary>
    private string CompressMarkdown(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();
            
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 保留注释
            if (trimmedLine.StartsWith("//") || trimmedLine.StartsWith("#") || trimmedLine.StartsWith("---"))
            {
                result.Add(line);
                continue;
            }

            // 保留非空行
            result.Add(trimmedLine);
        }

        return string.Join("\n", result);
    }

    // Java和C++使用专门的压缩方法实现

    /// <summary>
    /// 压缩 Java 代码
    /// </summary>
    private string CompressJava(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();

            // 跳过空行
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释开始/结束
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行/文档注释
            if (trimmedLine.StartsWith("//"))
            {
                result.Add(line);
                continue;
            }

            // 保留重要结构行并对其进行规范化
            if (IsImportantJavaLine(trimmedLine))
            {
                result.Add(NormalizeJavaLine(line));
                continue;
            }

            // 保留独立的大括号以维持语法结构
            if (trimmedLine == "{" || trimmedLine == "}")
            {
                result.Add(line);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 Java 代码行
    /// </summary>
    private bool IsImportantJavaLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*package\s+",                  // package 声明
            @"^\s*import\s+",                   // import 语句
            @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*class\s+", // 类声明
            @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*interface\s+", // 接口声明
            @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*enum\s+", // 枚举声明
            @"^\s*@\w+",                        // 注解
            @"^\s*(public|private|protected|static|abstract|final|native|synchronized|transient|volatile)\s+.*\(",  // 方法声明
            @"^\s*(public|private|protected|static|final|volatile|transient)\s+.*\s+\w+\s*[{;=]", // 属性/字段声明
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
            @"^\s*throws\s+",                   // 异常声明
            @"^\s*extends\s+",                  // 继承声明
            @"^\s*implements\s+",               // 接口实现声明
            @"^\s*@Override",                   // 重写注解
            @"^\s*@Deprecated",                 // 弃用注解
            @"^\s*@SuppressWarnings",           // 忽略警告注解
            @"^\s*@FunctionalInterface",        // 函数式接口注解
            @"^\s*record\s+",                   // Java 16+ record 声明
            @"^\s*sealed\s+",                   // Java 17+ sealed 类声明
            @"^\s*permits\s+",                  // Java 17+ permits 声明
            @"^\s*non-sealed\s+"                // Java 17+ non-sealed 声明
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
    }

    /// <summary>
    /// 规范化 Java 重要代码行
    /// </summary>
    private string NormalizeJavaLine(string line)
    {
        var working = line.TrimEnd();

        // 处理 lambda 表达式
        var arrowIndex = working.IndexOf("->");
        if (arrowIndex >= 0)
        {
            var prefix = working.Substring(0, arrowIndex).TrimEnd();
            // 替换为空方法体
            return prefix + " -> { }";
        }

        // 处理字段/属性赋值
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("=="))
        {
            var prefix = working.Substring(0, equalIndex).TrimEnd();
            if (!prefix.EndsWith(";"))
                prefix += ";";
            return prefix;
        }

        // 处理方法声明，确保方法体为空
        if (Regex.IsMatch(working, @"^\s*(public|private|protected|static|abstract|final|native|synchronized)\s+.*\)\s*\{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " { }";
            else
                return working;
        }

        return working;
    }

    /// <summary>
    /// 压缩 C++ 代码
    /// </summary>
    private string CompressCpp(string content)
    {
        var lines = content.Split('\n');
        var result = new List<string>();
        var inMultiLineComment = false;
        var inPreprocessor = false;

        foreach (var rawLine in lines)
        {
            var line = rawLine;
            var trimmedLine = line.Trim();

            // 跳过空行
            if (string.IsNullOrWhiteSpace(trimmedLine))
                continue;

            // 处理多行注释开始/结束
            if (trimmedLine.StartsWith("/*"))
            {
                inMultiLineComment = true;
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }
            if (inMultiLineComment)
            {
                result.Add(line);
                if (trimmedLine.Contains("*/"))
                    inMultiLineComment = false;
                continue;
            }

            // 保留单行注释
            if (trimmedLine.StartsWith("//"))
            {
                result.Add(line);
                continue;
            }

            // 处理预处理指令
            if (trimmedLine.StartsWith("#"))
            {
                result.Add(line);
                inPreprocessor = trimmedLine.EndsWith("\\");
                continue;
            }
            if (inPreprocessor)
            {
                result.Add(line);
                inPreprocessor = trimmedLine.EndsWith("\\");
                continue;
            }

            // 保留重要结构行并对其进行规范化
            if (IsImportantCppLine(trimmedLine))
            {
                result.Add(NormalizeCppLine(line));
                continue;
            }

            // 保留独立的大括号以维持语法结构
            if (trimmedLine == "{" || trimmedLine == "}" || trimmedLine == "};")
            {
                result.Add(line);
            }
        }

        return string.Join("\n", result);
    }

    /// <summary>
    /// 判断是否为重要的 C++ 代码行
    /// </summary>
    private bool IsImportantCppLine(string line)
    {
        var importantPatterns = new[]
        {
            @"^\s*#include\s+",                 // 头文件包含
            @"^\s*#define\s+",                  // 宏定义
            @"^\s*#if",                         // 条件编译开始
            @"^\s*#else",                       // 条件编译else
            @"^\s*#elif",                       // 条件编译elif
            @"^\s*#endif",                      // 条件编译结束
            @"^\s*#pragma",                     // 编译器指令
            @"^\s*namespace\s+",                // 命名空间声明
            @"^\s*using\s+",                    // using 声明
            @"^\s*template\s*<",                // 模板声明
            @"^\s*(class|struct|union|enum)\s+", // 类型声明
            @"^\s*(public|private|protected):",  // 访问修饰符
            @"^\s*(virtual|static|explicit|inline|constexpr|friend|extern|mutable)\s+", // 函数修饰符
            @"^\s*(const|volatile|noexcept|throw|final|override|delete|default)\s+", // 函数特性
            @"^\s*\w+::\w+\s*\(",               // 类方法实现
            @"^\s*\w+\s*\([^)]*\)\s*(\{|const|override|final|noexcept|throw|->|=|;)", // 函数声明/定义
            @"^\s*typedef\s+",                  // 类型定义
            @"^\s*using\s+\w+\s*=",             // 类型别名
            @"^\s*friend\s+",                   // 友元声明
            @"^\s*operator\s*",                 // 运算符重载
            @"^\s*~\w+\s*\(",                   // 析构函数
            @"^\s*\w+\s*\(\)\s*:\s*",           // 构造函数初始化列表
            @"^\s*static_assert\s*\(",          // 静态断言
            @"^\s*concept\s+",                  // C++20 概念
            @"^\s*requires\s+",                 // C++20 约束
            @"^\s*export\s+",                   // 模块导出
            @"^\s*import\s+",                   // 模块导入
            @"^\s*{",                           // 开始大括号
            @"^\s*}",                           // 结束大括号
            @"^\s*};",                          // 类/结构体定义结束
        };

        return importantPatterns.Any(pattern => Regex.IsMatch(line, pattern, RegexOptions.IgnoreCase));
    }

    /// <summary>
    /// 规范化 C++ 重要代码行
    /// </summary>
    private string NormalizeCppLine(string line)
    {
        var working = line.TrimEnd();

        // 处理 lambda 表达式
        var lambdaIndex = working.IndexOf("](");
        if (lambdaIndex >= 0 && working.Contains("->"))
        {
            var arrowIndex = working.IndexOf("->");
            if (arrowIndex > lambdaIndex)
            {
                var prefix = working.Substring(0, arrowIndex).TrimEnd();
                return prefix + " -> { }";
            }
        }

        // 处理变量初始化
        var equalIndex = working.IndexOf('=');
        if (equalIndex >= 0 && !working.Contains("==") && !working.Contains("<=") && !working.Contains(">=") && !working.Contains("!="))
        {
            // 检查是否是类型别名或宏定义
            if (!Regex.IsMatch(working.Substring(0, equalIndex), @"^\s*(using|#define)"))
            {
                var prefix = working.Substring(0, equalIndex).TrimEnd();
                if (!prefix.EndsWith(";"))
                    prefix += ";";
                return prefix;
            }
        }

        // 处理函数声明，确保函数体为空
        if (Regex.IsMatch(working, @"^\s*\w+\s*\([^)]*\)\s*(const|override|final|noexcept|throw)?\s*\{?\s*$"))
        {
            if (!working.EndsWith("{"))
                return working + " { }";
            else
                return working;
        }

        // 处理模板特化
        if (Regex.IsMatch(working, @"^\s*template\s*<.*>\s*$"))
        {
            return working;
        }

        return working;
    }
}
