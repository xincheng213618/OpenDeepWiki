using System.ComponentModel;
using Microsoft.SemanticKernel;
using Octokit;

namespace KoalaWiki.Functions;

public class GithubFunction(
    string owner,
    string name,
    string branch,
    string? username,
    string? password
)
{
    public string? Password { get; } = password;

    /// <summary>
    /// 搜索相关issue内容
    /// </summary>
    /// <param name="query">搜索关键词</param>
    /// <param name="status"></param>
    /// <param name="maxResults">最大返回数量</param>
    /// <returns>搜索结果字符串</returns>
    [Description("搜索相关 Issue 内容")]
    [KernelFunction("SearchIssues")]
    public async Task<string> SearchIssuesAsync(
        [Description("搜索关键词")] string query,
        int maxResults = 5)
    {
        // 使用 Octokit 进行 GitHub Issue 搜索
        var client = new GitHubClient(new ProductHeaderValue("KoalaWiki"));
        if (!string.IsNullOrEmpty(Password))
        {
            var tokenAuth = new Credentials(Password); // Password 作为 token
            client.Credentials = tokenAuth;
        }


        var request = new SearchIssuesRequest(query)
        {
            Repos = new RepositoryCollection()
            {
                { owner, name }
            },
            Type = IssueTypeQualifier.Issue
        };

        var result = await client.Search.SearchIssues(request);
        var issues = result.Items.Take(maxResults).ToList();
        if (!issues.Any()) return "未找到相关 Issue。";
        var sb = new System.Text.StringBuilder();
        foreach (var issue in issues)
        {
            sb.AppendLine($"[{issue.Title}]({issue.HtmlUrl}) # {issue.Number}");
        }

        return sb.ToString();
    }
}