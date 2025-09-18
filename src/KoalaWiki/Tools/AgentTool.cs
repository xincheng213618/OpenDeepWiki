using System.ComponentModel;

namespace KoalaWiki.Tools;

public class AgentTool
{
    [KernelFunction, Description("Tool for internal thinking and reasoning without taking any external action. Use this tool when you need to work through a complex problem, organize your thoughts, engaging in multi-step reasoning, or evaluate the quality of different sources and results. Especially use this tool to reflect and critically think about next steps after receiving results from other tools. Your thought will be logged but no action will be taken.")]
    public string DeepThinking(
        [Description("A thought to think about")]
        string thought)
    {
        Console.WriteLine("深入思考：\n" + thought);
        return thought;
    }
}