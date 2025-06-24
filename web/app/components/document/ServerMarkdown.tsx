import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeSlug from 'rehype-slug';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';

interface ServerMarkdownProps {
  content: string;
  className?: string;
}

// 服务端渲染 Markdown 组件
export async function ServerMarkdown({ content, className = '' }: ServerMarkdownProps) {
  if (!content) {
    return null;
  }

  try {
    // 使用 unified 处理 Markdown
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeSlug)
      .use(rehypeKatex)
      .use(rehypeStringify);

    const result = await processor.process(content);
    const htmlContent = String(result);

    return (
      <div 
        className={`markdown-content ${className}`}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  } catch (error) {
    console.error('Markdown 渲染错误:', error);
    // 降级处理：直接显示原始内容
    return (
      <div className={`markdown-content ${className}`}>
        <pre>{content}</pre>
      </div>
    );
  }
}

export default ServerMarkdown; 