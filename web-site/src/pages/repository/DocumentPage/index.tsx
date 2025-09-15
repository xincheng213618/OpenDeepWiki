import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { documentService } from '@/services/documentService'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import TableOfContents from '@/components/common/TableOfContents'

interface DocumentPageProps {
  className?: string
}

export default function DocumentPage({ className }: DocumentPageProps) {
  const { owner, name, '*': path } = useParams<{ owner: string; name: string; '*': string }>()
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState<string>('')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!owner || !name || !path) return

    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError('')

        // 调用文档服务获取内容
        const response = await documentService.getDocument(owner, name, path)

        if (response.data) {
          setContent(response.data.content || '')
        } else {
          setError('文档不存在')
        }
      } catch (err) {
        console.error('Failed to fetch document:', err)
        setError('加载文档失败')
      } finally {
        setLoading(false)
      }
    }

    fetchDocument()
  }, [owner, name, path])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-lg text-muted-foreground">{error}</p>
        <p className="text-sm text-muted-foreground">
          {owner}/{name}/{path}
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex-1 flex overflow-hidden", className)}>
      <div className="flex-1 overflow-auto">
        <article className="max-w-4xl mx-auto px-6 py-8">
          <MarkdownRenderer content={content} />
        </article>
      </div>
      <aside className="w-64 border-l border-border/40 px-4 py-8 overflow-y-auto hidden lg:block">
        <TableOfContents />
      </aside>
    </div>
  )
}