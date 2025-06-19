using System.ComponentModel;
using KoalaWiki.CodeMap;
using Mem0.NET;
using Microsoft.KernelMemory;
using Microsoft.SemanticKernel;

namespace KoalaWiki.Functions;

public class RagFunction(string warehouseId)
{
    private readonly Mem0Client _mem0Client = new(OpenAIOptions.Mem0ApiKey, OpenAIOptions.Mem0Endpoint, null, null,
        new HttpClient()
        {
            Timeout = TimeSpan.FromMinutes(600),
            DefaultRequestHeaders =
            {
                UserAgent = { new System.Net.Http.Headers.ProductInfoHeaderValue("KoalaWiki", "1.0") }
            }
        });


    [KernelFunction, Description("检索当前仓库文档和代码相关索引内容，通过搜索关键词来获取相关的代码或文档内容。")]
    public async Task<string> SearchdeAsync(
        [Description("更接近需要的代码或文档的描述，例如：搜索一个函数，或者搜索一个类")]
        string query, double minRelevance = 0.3)
    {
        

        return "";
    }
}