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
  GitBranch,
  Code,
  ChevronsUpDown,
  ChevronsDown
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
    // 构建包含分支参数的路径
    const basePath = `/${owner}/${name}/${encodeURIComponent(node.path)}`
    const pathWithBranch = selectedBranch && selectedBranch !== 'main'
      ? `${basePath}?branch=${selectedBranch}`
      : basePath

    return {
      id: node.id,
      label: node.name,
      // 所有节点都可以点击，并包含分支信息
      path: pathWithBranch,
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

  // 获取所有带子节点的节点ID
  const getAllExpandableNodeIds = (nodes: DocumentNode[]): string[] => {
    const ids: string[] = []
    const traverse = (nodeList: DocumentNode[]) => {
      for (const node of nodeList) {
        if (node.children && node.children.length > 0) {
          ids.push(node.id)
          traverse(node.children)
        }
      }
    }
    traverse(nodes)
    return ids
  }

  // 展开/收起所有节点
  const toggleAllNodes = () => {
    const allNodeIds = getAllExpandableNodeIds(documentNodes)
    if (expandedNodes.size === allNodeIds.length) {
      // 如果所有节点都已展开，则收起所有
      setExpandedNodes(new Set())
    } else {
      // 否则展开所有
      setExpandedNodes(new Set(allNodeIds))
    }
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
        <div key={item.id} className="select-none">
          <div className={cn(
            "flex items-center group",
            "hover:bg-accent/60 rounded-md transition-colors",
            isSelected && "bg-accent"
          )}>
            <button
              className={cn(
                "p-1.5 hover:bg-accent/30 rounded transition-colors",
                level === 0 ? "ml-0" : level === 1 ? "ml-4" : level === 2 ? "ml-8" : "ml-12"
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                toggleNode(item.id)
              }}
            >
              <ChevronRight className={cn(
                "h-3.5 w-3.5 transition-transform duration-200 text-muted-foreground",
                isExpanded && "rotate-90"
              )} />
            </button>
            <button
              className={cn(
                "flex-1 px-1 py-1.5 text-sm text-left transition-colors",
                isSelected && "text-accent-foreground font-medium"
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
              <span className="truncate">{item.label}</span>
            </button>
          </div>
          <Collapsible open={isExpanded}>
            <CollapsibleContent className="animate-accordion-down">
              <div className="mt-0.5">
                {item.children?.map(child => renderMenuItem(child, level + 1))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )
    }

    return (
      <button
        key={item.id}
        className={cn(
          "w-full flex items-center px-2 py-1.5 text-sm rounded-md transition-colors",
          "hover:bg-accent/60",
          isSelected && "bg-accent text-accent-foreground font-medium",
          level === 0 ? "pl-6" : level === 1 ? "pl-10" : level === 2 ? "pl-14" : "pl-18"
        )}
        onClick={() => item.path && navigate(item.path)}
      >
        <span className="truncate flex-1 text-left">{item.label}</span>
        {item.badge && (
          <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm font-medium">
            {item.badge}
          </span>
        )}
      </button>
    )
  }


  return (
    <div className={cn(
      "flex flex-col h-full bg-sidebar/50 backdrop-blur-sm border-r border-border/40",
      className
    )}>
      {/* 搜索框 */}
      <div className="p-3 border-b bg-background/95">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('repository.layout.searchDocuments')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-10 h-8 text-sm bg-muted/40 border-muted focus:bg-background"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex h-4 select-none items-center gap-0.5 rounded border bg-muted/60 px-1 font-mono text-[10px] font-medium text-muted-foreground opacity-60">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleAllNodes}
                  disabled={documentNodes.length === 0}
                >
                  {expandedNodes.size === getAllExpandableNodeIds(documentNodes).length ? (
                    <ChevronsDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {expandedNodes.size === getAllExpandableNodeIds(documentNodes).length
                    ? t('repository.layout.collapseAll')
                    : t('repository.layout.expandAll')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* 分支选择器 */}
      <div className="p-3 border-b bg-muted/30">
        <Select
          value={selectedBranch}
          onValueChange={onBranchChange}
          disabled={loading || branches.length === 0}
        >
          <SelectTrigger className="h-8 text-sm bg-background/60 border-muted hover:bg-background transition-colors">
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder={t('repository.layout.selectBranch')} />
            </div>
          </SelectTrigger>
          <SelectContent>
            {branches.map(branch => (
              <SelectItem key={branch} value={branch} className="text-sm">
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 菜单内容 */}
      <ScrollArea className="flex-1 px-2">
        <div className="py-2">
          {/* 文档标题 */}
          <div className="mb-1 px-2 py-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t('repository.layout.documentTree')}
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
              <p className="text-xs text-muted-foreground/60 text-center py-8">
                {t('repository.layout.noDocuments')}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      <div className="p-3 border-t bg-muted/20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground/60 font-medium">
            {owner}/{name}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="p-1 rounded hover:bg-accent/50 transition-colors"
                  onClick={() => window.open(`https://github.com/${owner}/${name}`, '_blank')}
                >
                  <Code className="h-3 w-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="text-xs">{t('common.viewOnGithub')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export default FumadocsSidebar