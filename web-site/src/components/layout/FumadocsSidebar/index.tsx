// Fumadocs风格的侧边栏组件

import React, { useState } from 'react'
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  Search,
  GitBranch,
  Code,
  PanelLeftClose,
  PanelLeftOpen,
  Hash
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
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
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
  className,
  sidebarOpen = true,
  onSidebarToggle
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')


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


  // 渲染菜单项 - 简化版本，总是展开
  const renderMenuItem = (item: MenuItem, level: number = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0
    const isSelected = item.path === selectedPath ||
      item.path === window.location.pathname ||
      window.location.pathname.includes(item.path + '/')

    // Fumadocs 风格的缩进，增大字体和间距
    const indent = level * 16 + 16 // 基础16px + 每级16px

    if (hasChildren) {
      return (
        <div key={item.id} className="group">
          <button
            className={cn(
              "flex items-center w-full py-2 px-3 text-sm transition-all duration-150 rounded-md",
              "hover:bg-accent/50 hover:text-accent-foreground",
              isSelected && "bg-accent text-accent-foreground font-medium"
            )}
            style={{ paddingLeft: `${indent}px` }}
            onClick={() => {
              if (item.path) {
                navigate(item.path)
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
            <span className="truncate flex-1 text-left font-normal">{item.label}</span>
            {item.badge && (
              <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                {item.badge}
              </span>
            )}
          </button>
          <div className="pb-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        </div>
      )
    }

    return (
      <button
        key={item.id}
        className={cn(
          "flex items-center w-full py-2 px-3 text-sm transition-all duration-150 rounded-md group",
          "hover:bg-accent/50 hover:text-accent-foreground",
          isSelected ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"
        )}
        style={{ paddingLeft: `${indent + 16}px` }} // 叶节点额外缩进
        onClick={() => {
          if (item.path) {
            navigate(item.path)
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
        <span className="truncate flex-1 text-left font-normal">{item.label}</span>
        {item.badge && (
          <span className="ml-2 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
            {item.badge}
          </span>
        )}
      </button>
    )
  }



  return (
    <div className={cn(
      "flex flex-col h-full bg-background border-r border-border",
      className
    )}>
      {/* 品牌头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 flex items-center justify-center shadow-sm">
              <Hash className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-background"></div>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-foreground">{name}</span>
            <span className="text-xs text-muted-foreground">{owner}</span>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-accent/50"
                onClick={onSidebarToggle}
                disabled={!onSidebarToggle}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-3.5 w-3.5" />
                ) : (
                  <PanelLeftOpen className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">
                {sidebarOpen
                  ? t('repository.layout.collapseSidebar')
                  : t('repository.layout.expandSidebar')}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 搜索框 */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="搜索文档..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-14 h-8 text-sm bg-accent/30 border-0 focus:bg-accent/50 transition-colors placeholder:text-muted-foreground/60"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border/50 bg-background px-1 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </div>
      </div>

      {/* 导航内容 */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-1 space-y-1">
          {/* 仓库概览 */}
          <button
            className="w-full flex items-center px-3 py-1.5 text-sm text-muted-foreground hover:text-accent-foreground hover:bg-accent/50 rounded-md transition-all duration-150"
            onClick={() => navigate(`/${owner}/${name}`)}
          >
            {t('repository.layout.overview')}
          </button>

          {/* 思维导图 */}
          <button
            className="w-full flex items-center px-3 py-1.5 text-sm text-muted-foreground hover:text-accent-foreground hover:bg-accent/50 rounded-md transition-all duration-150"
            onClick={() => navigate(`/${owner}/${name}/mindmap`)}
          >
            {t('repository.layout.mindMap')}
          </button>

          {/* 分支选择器 */}
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <GitBranch className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <Select value={selectedBranch} onValueChange={onBranchChange} disabled={loading || branches.length === 0}>
                <SelectTrigger className="h-7 text-sm bg-accent/30 border-0 hover:bg-accent/50 transition-colors">
                  <SelectValue placeholder={t('repository.layout.selectBranch')} />
                </SelectTrigger>
                <SelectContent>
                  {branches.map(branch => (
                    <SelectItem key={branch} value={branch} className="text-sm">{branch}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="h-px bg-border/30 mx-2 my-3" />

          {/* 文档部分 */}
          <div className="space-y-0.5">
            {documentNodes.length > 0 ? (
              documentNodes
                .filter(node => !searchQuery ||
                  node.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map(node => renderMenuItem(convertToMenuItem(node)))
            ) : (
              <p className="text-xs text-muted-foreground/60 text-center py-4 px-6">
                {t('repository.layout.noDocuments')}
              </p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* 底部信息 */}
      <div className="px-3 py-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground/70 font-mono">
            {owner}/{name}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-accent/50"
                  onClick={() => window.open(`https://github.com/${owner}/${name}`, '_blank')}
                >
                  <Code className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
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