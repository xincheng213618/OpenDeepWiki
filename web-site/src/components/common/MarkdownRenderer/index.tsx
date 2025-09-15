import { lazy, Suspense } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkFootnotes from 'remark-footnotes'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import { cn } from '@/lib/utils'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

const MermaidBlock = lazy(() => import('../MermaidBlock'))

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, [remarkFootnotes, { inlineNotes: true }]]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          // 自定义标题渲染，添加锚点
          h1: ({ children, ...props }) => {
            const text = String(children).replace(/[^\w\s]/gi, '')
            const id = text.toLowerCase().replace(/\s+/g, '-')
            return (
              <h1 id={id} {...props} className="group relative">
                <a href={`#${id}`} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-muted-foreground">#</span>
                </a>
                {children}
              </h1>
            )
          },
          h2: ({ children, ...props }) => {
            const text = String(children).replace(/[^\w\s]/gi, '')
            const id = text.toLowerCase().replace(/\s+/g, '-')
            return (
              <h2 id={id} {...props} className="group relative">
                <a href={`#${id}`} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-muted-foreground">#</span>
                </a>
                {children}
              </h2>
            )
          },
          h3: ({ children, ...props }) => {
            const text = String(children).replace(/[^\w\s]/gi, '')
            const id = text.toLowerCase().replace(/\s+/g, '-')
            return (
              <h3 id={id} {...props} className="group relative">
                <a href={`#${id}`} className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-muted-foreground">#</span>
                </a>
                {children}
              </h3>
            )
          },
          // 自定义代码块
          pre: ({ children, ...props }) => {
            // 检查是否是 Mermaid 代码块
            const codeElement = (children as any)?.props
            const className = codeElement?.className || ''
            const isMermaid = className.includes('language-mermaid')

            if (isMermaid && codeElement?.children) {
              const mermaidCode = String(codeElement.children).replace(/\n$/, '')
              return (
                <Suspense fallback={<div className="flex justify-center p-8"><span className="text-muted-foreground">加载图表...</span></div>}>
                  <MermaidBlock chart={mermaidCode} />
                </Suspense>
              )
            }

            return (
              <pre {...props} className="relative group">
                <button
                  onClick={() => {
                    const code = codeElement?.children
                    if (code) {
                      navigator.clipboard.writeText(String(code))
                    }
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                {children}
              </pre>
            )
          },
          // 自定义链接
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-primary hover:underline"
              {...props}
            >
              {children}
              {href?.startsWith('http') && (
                <svg className="inline-block w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </a>
          ),
          // 自定义表格
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table className="min-w-full divide-y divide-border" {...props}>
                {children}
              </table>
            </div>
          ),
          // 自定义引用块
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 italic my-4" {...props}>
              {children}
            </blockquote>
          ),
          // 自定义图片
          img: ({ src, alt, ...props }) => (
            <figure className="my-6">
              <img
                src={src}
                alt={alt}
                className="rounded-lg shadow-md"
                loading="lazy"
                {...props}
              />
              {alt && (
                <figcaption className="text-center text-sm text-muted-foreground mt-2">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
          // 自定义列表
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-inside space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-inside space-y-1" {...props}>
              {children}
            </ol>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}