import { compileMDX } from "@fumadocs/mdx-remote";
import remarkGfm from "remark-gfm";
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import { remarkStructure } from 'fumadocs-core/mdx-plugins';
import { remarkImage } from 'fumadocs-core/mdx-plugins';
import fs from 'fs';

export default async function RenderMarkdown(props: { markdown: string }) {
    if (props.markdown) {

        // 先处理mermaid图表
        props.markdown = props.markdown.replace(/```mermaid\s*(\n?)([\s\S]*?)```/g, (match, p1, p2) => {
            return `<Mermaid chart={\`${p2}\`}/>`;
        });

        // 1. 将不是```包括的{}替换为`{`和`}`
        props.markdown = props.markdown.replace(/(?<!```[\s\S]*?)({)(?![\s\S]*?```)/g, '`{');
        props.markdown = props.markdown.replace(/(?<!```[\s\S]*?)(})(?![\s\S]*?```)/g, '}`');

        const compiled = await compileMDX({
            source: props.markdown,
            components: {},
            mdxOptions: {
                remarkPlugins: [
                    remarkGfm,
                    remarkStructure,
                    remarkImage,
                ],
                rehypePlugins: [rehypeCode],
            },
        });
        return compiled;
    }
    return null;

}