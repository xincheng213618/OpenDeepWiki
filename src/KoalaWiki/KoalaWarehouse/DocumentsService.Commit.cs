using System.Text.RegularExpressions;
using LibGit2Sharp;
using Microsoft.SemanticKernel;
using Newtonsoft.Json;

namespace KoalaWiki.KoalaWarehouse;

public partial class DocumentsService
{
    /// <summary>
    /// 生成更新日志
    /// </summary>
    public static async Task<List<CommitResultDto>> GenerateUpdateLogAsync(string gitPath,
        string readme, string gitRepositoryUrl, string branch, Kernel kernel, int maxCommits = 30)
    {
        using var repo = new Repository(gitPath, new RepositoryOptions());

        var commits = repo.Commits
            .OrderByDescending(x => x.Committer.When)
            .Take(maxCommits)
            .OrderBy(x => x.Committer.When)
            .ToList();

        var commitMessages = new System.Text.StringBuilder();
        foreach (var commit in commits)
        {
            commitMessages.AppendLine($"Committer: {commit.Committer.Name}");
            commitMessages.AppendLine($"Date: {commit.Committer.When:yyyy-MM-dd HH:mm:ss}");
            commitMessages.AppendLine($"Message: {commit.Message}");
            commitMessages.AppendLine("---");
        }

        var plugin = kernel.Plugins["CodeAnalysis"]["CommitAnalyze"];

        var responseBuilder = new System.Text.StringBuilder();
        await foreach (var item in kernel.InvokeStreamingAsync(plugin, new KernelArguments()
                       {
                           ["readme"] = readme,
                           ["git_repository"] = gitRepositoryUrl,
                           ["commit_message"] = commitMessages.ToString(),
                           ["branch"] = branch
                       }))
        {
            responseBuilder.Append(item);
        }

        var response = responseBuilder.ToString();
        var changelogMatch = Regex.Match(response, @"<changelog>(.*?)</changelog>", RegexOptions.Singleline);
        
        if (!changelogMatch.Success)
        {
            throw new InvalidOperationException("AI response did not contain valid changelog format");
        }

        try
        {
            var result = JsonConvert.DeserializeObject<List<CommitResultDto>>(changelogMatch.Groups[1].Value);
            return result ?? new List<CommitResultDto>();
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException($"Failed to parse changelog JSON: {ex.Message}", ex);
        }
    }

    public class CommitResultDto
    {
        public DateTime date { get; set; }

        public string title { get; set; }

        public string description { get; set; }
    }
}