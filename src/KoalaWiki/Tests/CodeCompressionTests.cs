using System;
using System.IO;
using System.Threading.Tasks;
using KoalaWiki.Options;
using KoalaWiki.Services;
using KoalaWiki.Utils;
using Xunit;

namespace KoalaWiki.Tests;

/// <summary>
/// 代码压缩功能测试
/// </summary>
public class CodeCompressionTests
{
    private readonly CodeCompressionService _compressionService;

    public CodeCompressionTests()
    {
        _compressionService = new CodeCompressionService();
    }

    [Fact]
    public void CodeFileDetector_ShouldDetectCSharpFiles()
    {
        // Arrange
        var csharpFile = "test.cs";
        var textFile = "test.txt";

        // Act & Assert
        Assert.True(CodeFileDetector.IsCodeFile(csharpFile));
        Assert.False(CodeFileDetector.IsCodeFile(textFile));
        Assert.Equal("csharp", CodeFileDetector.GetLanguageType(csharpFile));
    }

    [Fact]
    public void CodeFileDetector_ShouldDetectJavaScriptFiles()
    {
        // Arrange
        var jsFile = "test.js";
        var tsFile = "test.ts";

        // Act & Assert
        Assert.True(CodeFileDetector.IsCodeFile(jsFile));
        Assert.True(CodeFileDetector.IsCodeFile(tsFile));
        Assert.Equal("javascript", CodeFileDetector.GetLanguageType(jsFile));
        Assert.Equal("typescript", CodeFileDetector.GetLanguageType(tsFile));
    }

    [Fact]
    public void CodeFileDetector_ShouldDetectSpecialFiles()
    {
        // Arrange
        var dockerfile = "Dockerfile";
        var makefile = "Makefile";

        // Act & Assert
        Assert.True(CodeFileDetector.IsCodeFile(dockerfile));
        Assert.True(CodeFileDetector.IsCodeFile(makefile));
        Assert.Equal("dockerfile", CodeFileDetector.GetLanguageType(dockerfile));
        Assert.Equal("makefile", CodeFileDetector.GetLanguageType(makefile));
    }

    [Fact]
    public void CodeCompressionService_ShouldCompressCSharpCode()
    {
        // Arrange
        var csharpCode = @"
using System;
using System.Collections.Generic;

namespace TestNamespace
{
    /// <summary>
    /// 测试类
    /// </summary>
    public class TestClass
    {
        // 这是一个重要的注释
        private string _field;

        /// <summary>
        /// 测试方法
        /// </summary>
        public void TestMethod()
        {
            // 方法实现
            Console.WriteLine(""Hello World"");
        }

        public string Property { get; set; }
    }
}
";

        // Act
        var compressed = _compressionService.CompressCode(csharpCode, "test.cs");

        // Assert
        Assert.NotNull(compressed);
        Assert.Contains("using System;", compressed);
        Assert.Contains("namespace TestNamespace", compressed);
        Assert.Contains("public class TestClass", compressed);
        Assert.Contains("// 这是一个重要的注释", compressed);
        Assert.Contains("public void TestMethod()", compressed);
        Assert.Contains("public string Property { get; set; }", compressed);
        
        // 压缩后的代码应该更短
        Assert.True(compressed.Length < csharpCode.Length);
    }

    [Fact]
    public void CodeCompressionService_ShouldCompressJavaScriptCode()
    {
        // Arrange
        var jsCode = @"
// 重要的注释
import React from 'react';

/**
 * 组件说明
 */
function MyComponent() {
    // 函数实现
    const handleClick = () => {
        console.log('clicked');
    };

    return (
        <div onClick={handleClick}>
            Hello World
        </div>
    );
}

export default MyComponent;
";

        // Act
        var compressed = _compressionService.CompressCode(jsCode, "test.js");

        // Assert
        Assert.NotNull(compressed);
        Assert.Contains("// 重要的注释", compressed);
        Assert.Contains("import React from 'react';", compressed);
        Assert.Contains("function MyComponent()", compressed);
        Assert.Contains("export default MyComponent;", compressed);
    }

    [Fact]
    public void CodeCompressionService_ShouldPreservePythonIndentation()
    {
        // Arrange
        var pythonCode = @"
# 重要的注释
import os
import sys

class TestClass:
    """"""测试类""""""
    
    def __init__(self):
        # 初始化方法
        self.value = 0
    
    def test_method(self):
        """"""测试方法""""""
        if self.value > 0:
            print(""Positive value"")
        else:
            print(""Non-positive value"")
";

        // Act
        var compressed = _compressionService.CompressCode(pythonCode, "test.py");

        // Assert
        Assert.NotNull(compressed);
        Assert.Contains("# 重要的注释", compressed);
        Assert.Contains("import os", compressed);
        Assert.Contains("class TestClass:", compressed);
        Assert.Contains("def __init__(self):", compressed);
        Assert.Contains("def test_method(self):", compressed);
        
        // Python 代码应该保持缩进结构
        Assert.Contains("    def __init__(self):", compressed);
        Assert.Contains("        self.value = 0", compressed);
    }

    [Fact]
    public void CodeCompressionService_ShouldNotCompressNonCodeFiles()
    {
        // Arrange
        var textContent = @"
This is a regular text file.
It should not be compressed.

Line 1
Line 2
Line 3
";

        // Act
        var result = _compressionService.CompressCode(textContent, "test.txt");

        // Assert
        Assert.Equal(textContent, result); // 非代码文件应该保持原样
    }

    [Fact]
    public void CodeCompressionService_ShouldHandleEmptyContent()
    {
        // Arrange
        var emptyContent = "";
        string? nullContent = null;

        // Act & Assert
        Assert.Equal("", _compressionService.CompressCode(emptyContent, "test.cs"));
        Assert.Equal(nullContent, _compressionService.CompressCode(nullContent, "test.cs"));
    }

    [Fact]
    public void CodeFileDetector_ShouldIdentifySpecialHandlingFiles()
    {
        // Arrange & Act & Assert
        Assert.True(CodeFileDetector.RequiresSpecialHandling("test.py"));
        Assert.True(CodeFileDetector.RequiresSpecialHandling("config.yaml"));
        Assert.True(CodeFileDetector.RequiresSpecialHandling("Dockerfile"));
        Assert.True(CodeFileDetector.RequiresSpecialHandling("Makefile"));
        
        Assert.False(CodeFileDetector.RequiresSpecialHandling("test.cs"));
        Assert.False(CodeFileDetector.RequiresSpecialHandling("test.js"));
    }
}
