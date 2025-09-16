// 仓库详情管理页面

import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ChevronLeft,
  File,
  Folder,
  FolderOpen,
  Save,
  Refresh,
  Settings,
  FileText,
  Code,
  Image,
  Database,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreeNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  children?: TreeNode[]
  size?: number
  lastModified?: string
  content?: string
}

interface Repository {
  id: string
  name: string
  organization: string
  status: string
  documentsCount: number
  createdAt: string
  updatedAt: string
}

const RepositoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const [repository, setRepository] = useState<Repository | null>(null)
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // 模拟数据加载
  useEffect(() => {
    const mockRepository: Repository = {
      id: id || '1',
      name: 'OpenDeepWiki',
      organization: 'AIDotNet',
      status: 'completed',
      documentsCount: 42,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16'
    }

    const mockTreeData: TreeNode[] = [
      {
        id: '1',
        name: 'docs',
        type: 'folder',
        path: 'docs',
        children: [
          {
            id: '2',
            name: 'README.md',
            type: 'file',
            path: 'docs/README.md',
            size: 2048,
            lastModified: '2024-01-16',
            content: '# OpenDeepWiki 文档\n\n这是 OpenDeepWiki 项目的主要文档。\n\n## 快速开始\n\n...'
          },
          {
            id: '3',
            name: 'installation.md',
            type: 'file',
            path: 'docs/installation.md',
            size: 1024,
            lastModified: '2024-01-15',
            content: '# 安装指南\n\n## 系统要求\n\n- .NET 9.0\n- Node.js 18+\n\n## 安装步骤\n\n...'
          }
        ]
      },
      {
        id: '4',
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            id: '5',
            name: 'KoalaWiki',
            type: 'folder',
            path: 'src/KoalaWiki',
            children: [
              {
                id: '6',
                name: 'Program.cs',
                type: 'file',
                path: 'src/KoalaWiki/Program.cs',
                size: 512,
                lastModified: '2024-01-16',
                content: 'using Microsoft.AspNetCore.Hosting;\n\nnamespace KoalaWiki\n{\n    public class Program\n    {\n        // Main entry point\n    }\n}'
              }
            ]
          }
        ]
      },
      {
        id: '7',
        name: 'README.md',
        type: 'file',
        path: 'README.md',
        size: 4096,
        lastModified: '2024-01-16',
        content: '# OpenDeepWiki\n\nAI-driven code knowledge base supporting code analysis, document generation, and knowledge graph creation.\n\n## Features\n\n- Code analysis\n- Document generation\n- Knowledge graphs\n\n## Getting Started\n\n...'
      }
    ]

    setTimeout(() => {
      setRepository(mockRepository)
      setTreeData(mockTreeData)
      setExpandedNodes(new Set(['1', '4', '5']))
      setLoading(false)
    }, 1000)
  }, [id])

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'folder') {
      setExpandedNodes(prev => {
        const newSet = new Set(prev)
        if (newSet.has(node.id)) {
          newSet.delete(node.id)
        } else {
          newSet.add(node.id)
        }
        return newSet
      })
    } else {
      setSelectedNode(node)
    }
  }

  const handleContentChange = (content: string) => {
    if (selectedNode) {
      setSelectedNode({ ...selectedNode, content })
    }
  }

  const handleSave = async () => {
    if (!selectedNode || !selectedNode.content) return

    setSaving(true)
    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)

    // 这里应该调用API保存内容
    console.log('Saving content for:', selectedNode.path, selectedNode.content)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'md':
        return <FileText className="h-4 w-4 text-blue-600" />
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'cs':
      case 'py':
      case 'java':
        return <Code className="h-4 w-4 text-green-600" />
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
        return <Image className="h-4 w-4 text-purple-600" />
      case 'json':
      case 'xml':
      case 'yml':
      case 'yaml':
        return <Database className="h-4 w-4 text-orange-600" />
      default:
        return <File className="h-4 w-4 text-muted-foreground" />
    }
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const isSelected = selectedNode?.id === node.id

    return (
      <div key={node.id}>
        <div
          className={cn(
            "flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-accent",
            isSelected && "bg-accent",
            "transition-colors"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleNodeClick(node)}
        >
          {node.type === 'folder' ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            getFileIcon(node.name)
          )}
          <span className="text-sm">{node.name}</span>
          {node.type === 'file' && node.size && (
            <span className="text-xs text-muted-foreground">
              ({Math.round(node.size / 1024)}KB)
            </span>
          )}
        </div>

        {node.type === 'folder' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const filteredTreeData = (nodes: TreeNode[]): TreeNode[] => {
    if (!searchQuery) return nodes

    return nodes.filter(node => {
      if (node.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true
      }
      if (node.children) {
        const filteredChildren = filteredTreeData(node.children)
        if (filteredChildren.length > 0) {
          return true
        }
      }
      return false
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>{t('admin.messages.loading')}</p>
        </div>
      </div>
    )
  }

  if (!repository) {
    return (
      <div className="text-center py-8">
        <p>仓库不存在</p>
        <Button asChild className="mt-4">
          <Link to="/admin/repositories">
            <ChevronLeft className="mr-2 h-4 w-4" />
            返回仓库列表
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 面包屑导航 */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin/repositories">{t('admin.repositories.title')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{repository.organization}/{repository.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {repository.organization}/{repository.name}
          </h1>
          <p className="text-muted-foreground">{t('admin.repositories.detail.title')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Refresh className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            设置
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
        {/* 左侧树结构 */}
        <div className="col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{t('admin.repositories.detail.tree')}</CardTitle>
              <CardDescription>浏览和管理仓库内容</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* 搜索框 */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="搜索文件..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 文件树 */}
              <ScrollArea className="h-[calc(100%-4rem)]">
                <div className="p-2">
                  {filteredTreeData(treeData).map(node => renderTreeNode(node))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* 右侧内容编辑器 */}
        <div className="col-span-8">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedNode ? (
                      <div className="flex items-center space-x-2">
                        {getFileIcon(selectedNode.name)}
                        <span>{selectedNode.name}</span>
                      </div>
                    ) : (
                      t('admin.repositories.detail.editor')
                    )}
                  </CardTitle>
                  {selectedNode && (
                    <CardDescription>
                      {selectedNode.path} • {selectedNode.lastModified && `修改于 ${new Date(selectedNode.lastModified).toLocaleDateString('zh-CN')}`}
                    </CardDescription>
                  )}
                </div>
                {selectedNode && (
                  <Button onClick={handleSave} disabled={saving} size="sm">
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedNode ? (
                <div className="h-[calc(100%-5rem)]">
                  <Textarea
                    value={selectedNode.content || ''}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="h-full resize-none border-0 focus-visible:ring-0 font-mono text-sm"
                    placeholder="文件内容..."
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[calc(100%-5rem)] text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>选择一个文件来编辑其内容</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default RepositoryDetailPage