using System.ComponentModel;
using System.Text.Json.Serialization;

namespace KoalaWiki.Functions.Model;

public sealed class TodoInputItem
{
    public required string Content { get; set; }

    public required TodoInputItemStatus Status { get; set; }

    public required Priority Priority { get; set; }

    public required string Id { get; set; }
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum TodoInputItemStatus
{
    [Description("pending")] Pending,

    [Description("in_progress")] InProgress,

    [Description("completed")] Completed,
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum Priority
{
    [Description("low")] Low,

    [Description("medium")] Medium,

    [Description("high")] High,
}