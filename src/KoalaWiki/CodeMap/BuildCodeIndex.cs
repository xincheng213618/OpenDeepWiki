using KoalaWiki.Core.DataAccess;
using KoalaWiki.Domains.Warehouse;
using KoalaWiki.Entities;
using KoalaWiki.KoalaWarehouse;
using KoalaWiki.Options;
using KoalaWiki.Prompts;
using Mem0.NET;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using Serilog;

namespace KoalaWiki.CodeMap;

public class BuildCodeIndex(IServiceProvider service) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Delay(100, stoppingToken);

        if (OpenAIOptions.EnableMem0 == false)
        {
            Log.Logger.Warning("Mem0功能未启用,");
            return;
        }


        while (!stoppingToken.IsCancellationRequested)
        {
            // 读取现有的仓库
            await using var scope = service.CreateAsyncScope();
            var dbContext = scope.ServiceProvider.GetService<IKoalaWikiContext>();

            var warehouse = await dbContext!.Warehouses
                .Where(x => x.Status == WarehouseStatus.Completed && x.IsEmbedded == false)
                .FirstOrDefaultAsync(stoppingToken);

            if (warehouse == null)
            {
                // 如果没有仓库，等待一段时间
                await Task.Delay(1000 * 30, stoppingToken);
                continue;
            }

            var documents = await dbContext.Documents
                .Where(x => x.WarehouseId == warehouse.Id)
                .FirstOrDefaultAsync(stoppingToken);

            var files = DocumentsService.GetCatalogueFiles(documents.GitPath);

            var client = new Mem0Client(OpenAIOptions.Mem0ApiKey, OpenAIOptions.Mem0Endpoint, null, null,
                new HttpClient()
                {
                    Timeout = TimeSpan.FromMinutes(600),
                    DefaultRequestHeaders =
                    {
                        UserAgent = { new System.Net.Http.Headers.ProductInfoHeaderValue("KoalaWiki", "1.0") }
                    }
                });

            var catalogs = await dbContext.DocumentCatalogs
                .Where(x => x.DucumentId == documents.Id && x.IsCompleted == true && x.IsDeleted == false)
                .ToListAsync(stoppingToken);

            // 将目录索引到Mem0
            foreach (var catalog in catalogs)
            {
                try
                {
                    var content = await dbContext.DocumentFileItems.Where(x => x.DocumentCatalogId == catalog.Id)
                        .FirstOrDefaultAsync(cancellationToken: stoppingToken);

                    if (content == null || string.IsNullOrWhiteSpace(content.Content))
                    {
                        Log.Logger.Warning("目录 {Catalog} 内容为空，跳过", catalog);
                        continue;
                    }

                    // 获取依赖文件
                    var dependentFiles = await dbContext.DocumentFileItemSources
                        .Where(x => x.DocumentFileItemId == content.Id)
                        .ToListAsync(cancellationToken: stoppingToken);

                    // 处理目录内容
                    await client.AddAsync([
                            new Message
                            {
                                Role = "system",
                                Content = await PromptContext.Mem0(nameof(PromptConstant.Mem0.DocsSystem),
                                    new KernelArguments(), OpenAIOptions.ChatModel)
                            },
                            new Message
                            {
                                Role = "user",
                                Content = $"""
                                           # {catalog.Name}
                                           <file name="{catalog.Url}">
                                           {content.Content}
                                           </file>
                                           """
                            }
                        ], userId: warehouse.Id, metadata: new Dictionary<string, object>()
                        {
                            {
                                "id", catalog.Id
                            },
                            {
                                "name", catalog.Name
                            },
                            {
                                "url", catalog.Url
                            },
                            {
                                "documentId", documents.Id
                            },
                            {
                                "reference", dependentFiles
                            }
                        },
                        memoryType: "procedural_memory", cancellationToken: stoppingToken);
                }
                catch (Exception ex)
                {
                    Log.Logger.Error(ex, "处理目录 {Catalog} 时发生错误", catalog);
                }
            }

            // 将代码索引到Mem0
            foreach (var file in files)
            {
                try
                {
                    // 读取文件内容
                    var content = await File.ReadAllTextAsync(file.Path, stoppingToken);

                    if (string.IsNullOrWhiteSpace(content))
                    {
                        Log.Logger.Warning("文件 {File} 内容为空，跳过", file.Path);
                        continue;
                    }

                    // 处理文件内容
                    await client.AddAsync([
                        new Message()
                        {
                            Role = "system",
                            Content = await PromptContext.Mem0(nameof(PromptConstant.Mem0.CodeSystem),
                                new KernelArguments(), OpenAIOptions.ChatModel)
                        },
                        new Message
                        {
                            Role = "user",
                            Content = $"""
                                       ```{file.Path.Replace(documents.GitPath, "").TrimStart("/").TrimStart('\\')}
                                       {content}
                                       ```
                                       """
                        }
                    ], userId: warehouse.Id, cancellationToken: stoppingToken);
                }
                catch (Exception ex)
                {
                    Log.Logger.Error(ex, "处理文件 {File} 时发生错误", file);
                }
            }


            await dbContext.Warehouses
                .Where(x => x.Id == warehouse.Id)
                .ExecuteUpdateAsync(x => x.SetProperty(a => a.IsEmbedded, true), stoppingToken);
        }
    }
}