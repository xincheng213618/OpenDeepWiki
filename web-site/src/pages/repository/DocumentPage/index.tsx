import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { documentService, DocumentResponse } from '@/services/documentService'
import { useRepositoryDetailStore } from '@/stores/repositoryDetail.store'
import { cn } from '@/lib/utils'
import MarkdownRenderer from '@/components/common/MarkdownRenderer'
import TableOfContents from '@/components/common/TableOfContents'

interface DocumentPageProps {
  className?: string
  branch?: string
}

export default function DocumentPage({ className, branch }: DocumentPageProps) {
  const { owner, name, '*': path } = useParams<{ owner: string; name: string; '*': string }>()
  const [searchParams] = useSearchParams()
  const { i18n } = useTranslation()
  const { selectedBranch } = useRepositoryDetailStore()
  const [loading, setLoading] = useState(true)
  const [documentData, setDocumentData] = useState<DocumentResponse | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!owner || !name || !path) return

    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError('')

        // 获取分支参数（优先级：URL 参数 > store 中的 selectedBranch > props > 默认 main）
        const urlBranch = searchParams.get('branch')
        const currentBranch = urlBranch || selectedBranch || branch || 'main'

        // 调用文档服务获取内容 - 使用 GetDocumentByIdAsync
        const response = await documentService.getDocument(
          owner,
          name,
          path,
          currentBranch,
          i18n.language
        )

        if (response) {
          setDocumentData(response)
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
  }, [owner, name, path, branch, selectedBranch, searchParams, i18n.language])

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
          {/* 显示文档标题 */}
          {documentData?.title && (
            <h1 className="text-3xl font-bold mb-4">{documentData.title}</h1>
          )}
          {/* 显示文档描述 */}
          {documentData?.description && (
            <p className="text-muted-foreground mb-6">{documentData.description}</p>
          )}
          {/* 渲染 Markdown 内容 */}
          <MarkdownRenderer content={documentData?.content || ''} />
          {/* 显示源文件信息 */}
          {documentData?.fileSource && documentData.fileSource.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-sm font-medium mb-2">源文件</h3>
              <div className="space-y-1">
                {documentData.fileSource.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block"
                  >
                    {source.name}
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
      <aside className="w-64 border-l border-border/40 px-4 py-8 overflow-y-auto hidden lg:block">
        <TableOfContents />
      </aside>
    </div>
  )
}