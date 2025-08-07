import { TOCItemType } from "fumadocs-core/server";
import ThemedMarkdown from "./ThemedMarkdown";
import { ensureUniqueSlug, generateSlug } from "../utils/slug";

interface RenderMarkdownResult {
    body: any;
    toc: TOCItemType[];
}

// 手动解析markdown，提取标题作为TOC
function extractTOC(markdown: string): TOCItemType[] {
    const toc: TOCItemType[] = [];
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const existingSlugs = new Set<string>();

    let match;
    while ((match = headingRegex.exec(markdown)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const baseSlug = generateSlug(text);
        const slug = ensureUniqueSlug(baseSlug, existingSlugs);

        toc.push({
            title: text,
            url: `#${slug}`,
            depth: level
        });
    }

    return toc;
}

export default function RenderMarkdown(props: {
    markdown: string;
}): RenderMarkdownResult {
    if (!props.markdown) return { body: <></>, toc: [] };

    try {
        const toc = extractTOC(props.markdown);
        return {
            body: <ThemedMarkdown>{props.markdown}</ThemedMarkdown>,
            toc: toc
        };
    } catch (error) {
        console.error("Markdown处理错误:", error);
        // 如果整个处理过程出错，至少显示原始文本
        return {
            body: <></>,
            toc: []
        };
    }
}

