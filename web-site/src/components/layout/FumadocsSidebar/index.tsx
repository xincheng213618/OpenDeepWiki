// Fumadocs风格的侧边栏组件

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Search,
  ChevronRight,
  FileText,
  Folder,
  GitBranch,
  Code
} from 'lucide-react'
import type { DocumentNode } from '@/components/repository/DocumentTree'

interface MenuItem {
  id: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  badge?: string
}

interface FumadocsSidebarProps {
  owner: string
  name: string
  branches: string[]
  selectedBranch: string
  onBranchChange: (branch: string) => void
  documentNodes: DocumentNode[]
  selectedPath?: string
  onSelectNode?: (node: DocumentNode) => void
  loading?: boolean
  className?: string
}

export const FumadocsSidebar: React.FC<FumadocsSidebarProps> = ({
  owner,
  name,
  branches,
  selectedBranch,
  onBranchChange,
  documentNodes,
  selectedPath,
  onSelectNode,
  loading,
  className
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // 将DocumentNode转换为MenuItem
  const convertToMenuItem = (node: DocumentNode): MenuItem => {
    const hasChildren = node.children && node.children.length > 0
    const icon = hasChildren || node.type === 'folder' ?
      <Folder className="h-4 w-4" /> :
      <FileText className="h-4 w-4" />

    return {
      id: node.id,
      label: node.name,
      icon,
      // 所有节点都可以点击
      path: `/${owner}/${name}/docs/${encodeURIComponent(node.path)}`,
      children: node.children?.map(convertToMenuItem)
    }
  }

  // 切换节点展开状态
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  // 渲染菜单项
  const renderMenuItem = (item: MenuItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedNodes.has(item.id)
    const isSelected = item.path === selectedPath ||
      item.path === window.location.pathname ||
      window.location.pathname.includes(item.path + '/')

    if (hasChildren) {
      return (
        <div key={item.id}>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 p-0 hover:bg-accent/50",
                level > 0 && "ml-2"
              )}
              onClick={(e) => {
                e.stopPropagation()
                toggleNode(item.id)
              }}
            >
              <ChevronRight className={cn(
                "h-3 w-3 transition-transform",
                isExpanded && "rotate-90"
              )} />
            </Button>
            <Button
              variant={isSelected ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 justify-start gap-2 px-2 h-8 font-normal",
                "hover:bg-accent/50 transition-colors",
                isSelected && "bg-accent font-medium"
              )}
              onClick={() => {
                if (item.path) {
                  navigate(item.path)
                  // 查找并通知父组件选中的节点
                  const findNode = (nodes: DocumentNode[], id: string): DocumentNode | null => {
                    for (const node of nodes) {
                      if (node.id === id) return node
                      if (node.children) {
                        const found = findNode(node.children, id)
                        if (found) return found
                      }
                    }
                    return null
                  }
                  const node = findNode(documentNodes, item.id)
                  if (node && onSelectNode) {
                    onSelectNode(node)
                  }
                }
              }}
            >
              {item.icon}
              <span className="truncate">{item.label}</span>
            </Button>
          </div>
          {isExpanded && (
            <div className="space-y-0.5 ml-2">
              {item.children?.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Button
        key={item.id}
        variant={isSelected ? "secondary" : "ghost"}
        size="sm"
        className={cn(
          "w-full justify-start gap-2 px-2 h-8 font-normal",
          "hover:bg-accent/50 transition-colors",
          isSelected && "bg-accent font-medium",
          level > 0 && "ml-4",
          !hasChildren && "ml-7"
        )}
        onClick={() => item.path && navigate(item.path)}
      >
        {item.icon}
        <span className="truncate">{item.label}</span>
        {item.badge && (
          <span className="ml-auto text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">
            {item.badge}
          </span>
        )}
      </Button>
    )
  }


  return (
    <div className={cn(
      "flex flex-col h-full bg-background border-r",
      className
    )}>
      {/* 搜索框 */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t('repository.layout.searchDocuments')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-12 h-9 bg-muted/50"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* 分支选择器 */}
      <div className="p-3 border-b">
        <Select
          value={selectedBranch}
          onValueChange={onBranchChange}
          disabled={loading || branches.length === 0}
        >
          <SelectTrigger className="h-9 bg-muted/50">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              <SelectValue placeholder={t('repository.layout.selectBranch')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {branches.map(branch => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 菜单内容 */}
      <ScrollArea className="flex-1">
        <div className="p-3">
          {/* 文档标题 */}
          <div className="mb-2 px-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('repository.nav.documents')}
            </span>
          </div>

          {/* 文档树 */}
          <div className="space-y-0.5">
            {documentNodes.length > 0 ? (
              documentNodes
                .filter(node => !searchQuery ||
                  node.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(node => renderMenuItem(convertToMenuItem(node)))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                {t('repository.layout.noDocuments')}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      <div className="p-3 border-t">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{owner}/{name}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => window.open(`https://github.com/${owner}/${name}`, '_blank')}
                >
                  <Code className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('common.viewOnGithub')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export default FumadocsSidebar