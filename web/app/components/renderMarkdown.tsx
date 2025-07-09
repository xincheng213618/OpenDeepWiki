import { compileMDX } from "@fumadocs/mdx-remote";
import remarkGfm from "remark-gfm";
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import { remarkStructure } from 'fumadocs-core/mdx-plugins';
import { remarkImage } from 'fumadocs-core/mdx-plugins';
import fs from 'fs';

export default async function RenderMarkdown(props: { markdown: string }) {
    if (!props.markdown) return null;
    
    try {
        // 先处理mermaid图表
        let processedMarkdown = props.markdown.replace(/```mermaid\s*(\n?)([\s\S]*?)```/g, (match, p1, p2) => {
            return `<Mermaid chart={\`${p2}\`}/>`;
        });

        // 1. 将不是```包括的{}替换为`{`和`}`
        processedMarkdown = processedMarkdown.replace(/(?<!```[\s\S]*?)({)(?![\s\S]*?```)/g, '`{');
        processedMarkdown = processedMarkdown.replace(/(?<!```[\s\S]*?)(})(?![\s\S]*?```)/g, '}`');

        try {
            const compiled = await compileMDX({
                source: processedMarkdown,
                components: {},
                mdxOptions: {
                    remarkPlugins: [
                        remarkGfm,
                        remarkStructure,
                        remarkImage,
                    ],
                    rehypePlugins: [rehypeCode],
                    // 设置为false以允许继续编译，即使存在错误
                    development: false,
                },
            });
            return compiled;
        } catch (mdxError) {
            console.error("MDX编译错误:", mdxError);
            
            // 重新处理markdown，首先保证mermaid图表被正确处理
            const mermaidBlocks = [];
            let mermaidIndex = 0;
            
            // 1. 先提取mermaid代码块，并用占位符替换
            let safeMdForProcessing = props.markdown.replace(/```mermaid\s*(\n?)([\s\S]*?)```/g, (match, p1, p2) => {
                const placeholder = `___MERMAID_PLACEHOLDER_${mermaidIndex}___`;
                mermaidBlocks.push({ placeholder, content: p2 });
                mermaidIndex++;
                return placeholder;
            });
            
            // 2. 对其余内容进行转义处理
            // 识别并转义所有看起来像HTML/JSX标签的内容，但排除Mermaid占位符
            safeMdForProcessing = safeMdForProcessing.replace(
                /<(?!___MERMAID_PLACEHOLDER)([A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)([^>]*?)(\/>|>)/g, 
                '&lt;$1$2$3'
            );
            
            // 转义可能的闭合标签
            safeMdForProcessing = safeMdForProcessing.replace(
                /<\/(?!___MERMAID_PLACEHOLDER)([A-Z][A-Za-z0-9]*|[a-z][A-Za-z0-9]*[A-Z][A-Za-z0-9]*)>/g, 
                '&lt;/$1>'
            );
            
            // 处理所有的花括号表达式
            safeMdForProcessing = safeMdForProcessing.replace(/(?<!___MERMAID_PLACEHOLDER)(\{[\s\S]*?\})/g, '`$1`');
            
            // 额外处理常见的会导致MDX错误的HTML标签
            const problematicTags = [
                'div', 'span', 'p', 'a', 'button', 'input', 'textarea',
                'select', 'option', 'form', 'table', 'tr', 'td', 'th',
                'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
            ];
            
            // 创建一个正则表达式来匹配这些标签
            const tagPattern = new RegExp(`<(/?)(${problematicTags.join('|')})([^>]*?)>`, 'g');
            safeMdForProcessing = safeMdForProcessing.replace(tagPattern, (match, slash, tag, attrs) => {
                return `&lt;${slash}${tag}${attrs}>`;
            });
            
            // 3. 将Mermaid占位符替换回<Mermaid>组件
            for (const { placeholder, content } of mermaidBlocks) {
                safeMdForProcessing = safeMdForProcessing.replace(
                    placeholder,
                    `<Mermaid chart={\`${content}\`}/>`
                );
            }
            
            // 再次尝试编译
            try {
                const compiled = await compileMDX({
                    source: safeMdForProcessing,
                    components: {},
                    mdxOptions: {
                        remarkPlugins: [remarkGfm],
                        rehypePlugins: [rehypeCode],
                        development: false,
                    },
                });
                return compiled;
            } catch (fallbackError) {
                console.error("备用MDX编译也失败:", fallbackError);
                
                // 最后的后备方案：尝试更极端的处理，但保留Mermaid图表
                try {
                    // 重新提取mermaid块
                    const finalMermaidBlocks = [];
                    let finalMermaidIndex = 0;
                    let finalSafeMd = props.markdown.replace(/```mermaid\s*(\n?)([\s\S]*?)```/g, (match, p1, p2) => {
                        const placeholder = `___FINAL_MERMAID_${finalMermaidIndex}___`;
                        finalMermaidBlocks.push({ placeholder, content: p2 });
                        finalMermaidIndex++;
                        return placeholder;
                    });
                    
                    // 转义所有HTML标签
                    finalSafeMd = finalSafeMd.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    
                    // 恢复Mermaid块
                    for (const { placeholder, content } of finalMermaidBlocks) {
                        finalSafeMd = finalSafeMd.replace(
                            placeholder,
                            `<Mermaid chart={\`${content}\`}/>`
                        );
                    }
                    
                    const finalCompiled = await compileMDX({
                        source: finalSafeMd,
                        components: {},
                        mdxOptions: {
                            remarkPlugins: [remarkGfm],
                            rehypePlugins: [],
                            development: false,
                        },
                    });
                    return finalCompiled;
                } catch (finalError) {
                    console.error("所有MDX编译尝试均失败:", finalError);
                    
                    // 绝对的后备方案：尝试至少显示Mermaid图表
                    try {
                        let htmlContent = '<div>';
                        
                        // 提取并处理mermaid块为HTML元素
                        const rawMermaidBlocks = [];
                        let rawMermaidIndex = 0;
                        let plainText = props.markdown.replace(/```mermaid\s*(\n?)([\s\S]*?)```/g, (match, p1, p2) => {
                            const id = `mermaid-${rawMermaidIndex}`;
                            rawMermaidBlocks.push({ id, content: p2 });
                            rawMermaidIndex++;
                            return `<div id="${id}" class="mermaid-placeholder">[Mermaid图表 #${rawMermaidIndex}]</div>`;
                        });
                        
                        // 转义其他HTML
                        plainText = plainText.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                        
                        // 恢复mermaid占位符
                        for (const { id } of rawMermaidBlocks) {
                            plainText = plainText.replace(
                                `&lt;div id="${id}" class="mermaid-placeholder"&gt;[Mermaid图表 #${rawMermaidIndex}]&lt;/div&gt;`,
                                `<div id="${id}" class="mermaid-placeholder">[Mermaid图表]</div>`
                            );
                        }
                        
                        htmlContent += `<pre style="white-space: pre-wrap; word-break: break-word">${plainText}</pre>`;
                        
                        // 为每个mermaid块添加script
                        for (const { id, content } of rawMermaidBlocks) {
                            htmlContent += `
                                <script type="module">
                                import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
                                mermaid.initialize({ startOnLoad: true });
                                document.getElementById('${id}').innerHTML = \`${content}\`;
                                mermaid.init(undefined, document.getElementById('${id}'));
                                </script>
                            `;
                        }
                        
                        htmlContent += '</div>';
                        
                        // 返回HTML内容
                        return {
                            content: <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                        };
                    } catch (e) {
                        // 最终后备：纯文本展示
                        return {
                            content: <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{props.markdown}</pre>
                        };
                    }
                }
            }
        }
    } catch (error) {
        console.error("Markdown处理错误:", error);
        // 如果整个处理过程出错，至少显示原始文本
        return {
            content: <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{props.markdown}</pre>
        };
    }
}