// 仓库详情管理页面

import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  RefreshCw,
  Settings,
  FileText,
  Code,
  Image,
  Database,
  Search,
  Edit3,
  Trash2,
  Play,
  Pause,
  Calendar,
  Users,
  GitBranch,
  Clock,
  Activity,
  AlertCircle,
  CheckCircle,
  Info,
  Download,
  Upload,
  Shield,
  Cog,
  FileType,
  Eye,
  ExternalLink,
  Copy,
  MoreVertical,
  History
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { warehouseService, type WarehouseInfo, type RepositoryLogDto } from '@/services/admin.service'
import { toast } from 'sonner'

interface TreeNode {
  id: string
  name: string
  title?: string
  key?: string
  isLeaf?: boolean
  type?: 'file' | 'folder'
  path?: string
  children?: TreeNode[]
  size?: number
  lastModified?: string
  content?: string
  catalog?: DocumentCatalog
}

interface DocumentCatalog {
  id: string
  name: string
  url: string
  prompt?: string
  parentId?: string
  order: number
  warehouseId: string
  isDeleted: boolean
  isCompleted: boolean
  createdAt: string
}

interface RepositoryStats {
  totalDocuments: number
  totalFiles: number
  lastSyncTime?: string
  processingStatus: string
  completedDocuments: number
  pendingDocuments: number
  fileTypes: { [key: string]: number }
  syncHistory: SyncRecord[]
}

interface SyncRecord {
  id: string
  timestamp: string
  status: 'success' | 'failed' | 'processing'
  message: string
  filesChanged: number
}

interface PermissionInfo {
  roleId: string
  roleName: string
  isRead: boolean
  isWrite: boolean
  isDelete: boolean
}

interface TaskInfo {
  id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  startTime: string
  endTime?: string
  description: string
  error?: string
}

const RepositoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()

  // 状态管理
  const [repository, setRepository] = useState<WarehouseInfo | null>(null)
  const [treeData, setTreeData] = useState<TreeNode[]>([])
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<RepositoryStats | null>(null)
  const [catalogs, setCatalogs] = useState<DocumentCatalog[]>([])
  const [permissions, setPermissions] = useState<PermissionInfo[]>([])
  const [tasks, setTasks] = useState<TaskInfo[]>([])
  const [logs, setLogs] = useState<RepositoryLogDto[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [syncDialogOpen, setSyncDialogOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 加载仓库数据
  useEffect(() => {
    const loadRepositoryData = async () => {
      if (!id) return

      try {
        setLoading(true)

        // 获取仓库详情
        const repoResponse = await warehouseService.getWarehouseById(id)
        setRepository(repoResponse)

        // 获取文件目录结构
        const filesResponse = await warehouseService.getFiles(id)
        setTreeData(filesResponse || [])

        // 获取文档目录
        const catalogsResponse = await warehouseService.getDocumentCatalogs(id)
        setCatalogs(catalogsResponse || [])

        // 获取仓库统计信息
        loadRepositoryStats(id)

        // 获取操作日志
        loadRepositoryLogs(id)

      } catch (error) {
        console.error('Failed to load repository data:', error)
        toast.error(t('admin.repositories.detail.load_repository_data_failed'))
      } finally {
        setLoading(false)
      }
    }

    loadRepositoryData()
  }, [id])

  const loadRepositoryStats = async (repoId: string) => {
    try {
      // 从API获取统计数据
      const statsResponse = await warehouseService.getRepositoryStatsById(repoId)
      const stats: RepositoryStats = {
        totalDocuments: statsResponse.totalDocuments || 0,
        totalFiles: statsResponse.totalFiles || 0,
        lastSyncTime: statsResponse.lastSyncTime ? new Date(statsResponse.lastSyncTime).toISOString() : undefined,
        processingStatus: statsResponse.processingStatus || 'Pending',
        completedDocuments: statsResponse.completedDocuments || 0,
        pendingDocuments: statsResponse.pendingDocuments || 0,
        fileTypes: {},
        syncHistory: []
      }
      setStats(stats)
    } catch (error) {
      console.error('Failed to load repository stats:', error)
      // 设置默认值
      setStats({
        totalDocuments: 0,
        totalFiles: 0,
        processingStatus: 'Pending',
        completedDocuments: 0,
        pendingDocuments: 0,
        fileTypes: {},
        syncHistory: []
      })
    }
  }

  const loadRepositoryLogs = async (repoId: string) => {
    try {
      const response = await warehouseService.getRepositoryLogs(repoId, 1, 20)
      setLogs(response.items || [])
    } catch (error) {
      console.error('Failed to load repository logs:', error)
    }
  }

  const handleNodeClick = (node: TreeNode) => {
    const nodeId = node.id || node.key || ''
    const isFolder = node.type === 'folder' || (node.isLeaf === false)

    if (isFolder) {
      setExpandedNodes(prev => {
        const newSet = new Set(prev)
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId)
        } else {
          newSet.add(nodeId)
        }
        return newSet
      })
    } else {
      setSelectedNode(node)
      // 如果是文档目录，加载文件内容
      if (node.catalog?.id) {
        loadFileContent(node.catalog.id)
      }
    }
  }

  const loadFileContent = async (catalogId: string) => {
    try {
      const content = await warehouseService.getFileContent(catalogId)
      setSelectedNode(prev => prev ? {...prev, content} : null)
    } catch (error) {
      console.error('Failed to load file content:', error)
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
    try {
      // 调用API保存内容
      await warehouseService.saveFileContent(selectedNode.id, selectedNode.content)
      toast.success(t('admin.repositories.detail.file_save_success'))
    } catch (error) {
      toast.error(t('admin.repositories.detail.file_save_failed'))
    } finally {
      setSaving(false)
    }
  }

  const handleRefresh = async () => {
    if (!id) return

    setRefreshing(true)
    try {
      await warehouseService.refreshWarehouse(id)
      toast.success(t('admin.repositories.detail.repository_refresh_success'))

      // 重新加载数据
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      toast.error(t('admin.repositories.detail.repository_refresh_failed'))
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async () => {
    if (!id) return

    try {
      await warehouseService.deleteWarehouse(id)
      toast.success(t('admin.repositories.detail.repository_delete_success'))
      navigate('/admin/repositories')
    } catch (error) {
      toast.error(t('admin.repositories.detail.repository_delete_failed'))
    }
  }

  const handleSync = async () => {
    if (!id) return

    try {
      await warehouseService.refreshWarehouse(id)
      toast.success(t('admin.repositories.detail.sync_task_started'))
      setSyncDialogOpen(false)

      // 刷新统计信息
      loadRepositoryStats(id)
    } catch (error) {
      toast.error(t('admin.repositories.detail.sync_start_failed'))
    }
  }

  const handleExport = async () => {
    if (!id) return

    try {
      const blob = await warehouseService.exportRepositoryMarkdown(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${repository?.name || 'repository'}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success(t('admin.repositories.detail.export_success'))
    } catch (error) {
      toast.error(t('admin.repositories.detail.export_failed'))
    }
  }


  // 获取文件图标
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

  // 渲染文件树节点
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const nodeId = node.id || node.key || ''
    const nodeName = node.name || node.title || ''
    const isFolder = node.type === 'folder' || (node.isLeaf === false)
    const isExpanded = expandedNodes.has(nodeId)
    const isSelected = selectedNode?.id === nodeId

    return (
      <div key={nodeId}>
        <div
          className={cn(
            "flex items-center space-x-2 py-1 px-2 rounded cursor-pointer hover:bg-accent",
            isSelected && "bg-accent",
            "transition-colors"
          )}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => handleNodeClick({...node, id: nodeId, name: nodeName, type: isFolder ? 'folder' : 'file'})}
        >
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-600" />
            ) : (
              <Folder className="h-4 w-4 text-blue-600" />
            )
          ) : (
            getFileIcon(nodeName)
          )}
          <span className="text-sm">{nodeName}</span>
          {!isFolder && node.size && (
            <span className="text-xs text-muted-foreground">
              ({Math.round(node.size / 1024)}KB)
            </span>
          )}
        </div>

        {isFolder && isExpanded && node.children && Array.isArray(node.children) && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  // 过滤文件树数据
  const filteredTreeData = (nodes: TreeNode[]): TreeNode[] => {
    if (!nodes || !Array.isArray(nodes)) return []
    if (!searchQuery) return nodes

    return nodes.filter(node => {
      const nodeName = node.name || node.title || ''
      if (nodeName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return true
      }
      if (node.children && Array.isArray(node.children)) {
        const filteredChildren = filteredTreeData(node.children)
        if (filteredChildren.length > 0) {
          return true
        }
      }
      return false
    })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Completed': { label: t('admin.common.completed'), variant: 'default' as const, icon: CheckCircle },
      'Processing': { label: t('admin.common.processing'), variant: 'secondary' as const, icon: Activity },
      'Pending': { label: t('admin.common.pending'), variant: 'outline' as const, icon: Clock },
      'Failed': { label: t('admin.common.failed'), variant: 'destructive' as const, icon: AlertCircle }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // 所有render函数
  const renderOverviewTab = () => (
    <div className="grid grid-cols-12 gap-6">
      {/* 基本信息卡片 */}
      <div className="col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">仓库名称</Label>
                <p className="text-sm text-muted-foreground">{repository?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">组织名称</Label>
                <p className="text-sm text-muted-foreground">{repository?.organizationName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">仓库地址</Label>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate">{repository?.address}</p>
                  <Button variant="ghost" size="sm" onClick={() => window.open(repository?.address, '_blank')}>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">分支</Label>
                <p className="text-sm text-muted-foreground">{repository?.branch || 'main'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">仓库类型</Label>
                <p className="text-sm text-muted-foreground">{repository?.type || 'git'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">是否推荐</Label>
                <Badge variant={repository?.isRecommended ? 'default' : 'outline'}>
                  {repository?.isRecommended ? '是' : '否'}
                </Badge>
              </div>
            </div>
            {repository?.description && (
              <div>
                <Label className="text-sm font-medium">描述</Label>
                <p className="text-sm text-muted-foreground">{repository.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 处理状态卡片 */}
        {repository?.status === 'Processing' && (
          <Card>
            <CardHeader>
              <CardTitle>处理进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>文档生成进度</span>
                  <span>75%</span>
                </div>
                <Progress value={75} className="h-2" />
                <p className="text-sm text-muted-foreground">正在处理文档，预计还需要5分钟...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 错误信息卡片 */}
        {repository?.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{repository.error}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* 统计信息卡片 */}
      <div className="col-span-4 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>统计信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">文档总数</span>
                <Badge variant="outline">{stats?.totalDocuments || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">文件总数</span>
                <Badge variant="outline">{stats?.totalFiles || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">已完成文档</span>
                <Badge variant="outline">{stats?.completedDocuments || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">待处理文档</span>
                <Badge variant="outline">{stats?.pendingDocuments || 0}</Badge>
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-sm font-medium">最后同步时间</Label>
              <p className="text-sm text-muted-foreground">
                {stats?.lastSyncTime
                  ? new Date(stats.lastSyncTime).toLocaleString('zh-CN')
                  : '未同步'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 文件类型分布 */}
        {stats?.fileTypes && (
          <Card>
            <CardHeader>
              <CardTitle>文件类型分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(stats.fileTypes).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm capitalize">{type}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )

  const renderDocumentsTab = () => (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
      {/* 文档目录树 */}
      <div className="col-span-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>文档目录</CardTitle>
            <CardDescription>浏览和管理文档结构</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="搜索文档..."
                  className="pl-10"
                />
              </div>
            </div>
            <ScrollArea className="h-[calc(100%-4rem)]">
              <div className="p-4">
                {catalogs && catalogs.length > 0 ? (
                  <div className="space-y-2">
                    {catalogs.map(catalog => (
                      <div
                        key={catalog.id}
                        className="flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{catalog.name}</span>
                        </div>
                        {catalog.isCompleted && (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">暂无文档目录</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 文档内容 */}
      <div className="col-span-8">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>文档内容</CardTitle>
            <CardDescription>查看和编辑文档内容</CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)]">
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>选择一个文档来查看其内容</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderSyncTab = () => (
    <div className="space-y-6">
      {/* 同步操作 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>同步管理</CardTitle>
              <CardDescription>管理仓库的同步设置和历史</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    手动同步
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>手动同步仓库</DialogTitle>
                    <DialogDescription>
                      这将从源仓库拉取最新的文件并重新生成文档。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSync}>
                      开始同步
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>最后同步时间</Label>
              <p className="text-sm text-muted-foreground">
                {stats?.lastSyncTime
                  ? new Date(stats.lastSyncTime).toLocaleString('zh-CN')
                  : '从未同步'
                }
              </p>
            </div>
            <div className="space-y-2">
              <Label>同步状态</Label>
              {getStatusBadge(stats?.processingStatus || 'Pending')}
            </div>
            <div className="space-y-2">
              <Label>自动同步</Label>
              <div className="flex items-center space-x-2">
                <Switch />
                <span className="text-sm text-muted-foreground">启用</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 同步历史 */}
      <Card>
        <CardHeader>
          <CardTitle>同步历史</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.syncHistory?.map((sync) => (
              <div key={sync.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    sync.status === 'success' ? 'bg-green-500' :
                    sync.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  )} />
                  <div>
                    <p className="text-sm font-medium">{sync.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sync.timestamp).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {sync.filesChanged} 个文件
                </Badge>
              </div>
            )) || (
              <p className="text-sm text-muted-foreground text-center py-4">
                暂无同步历史
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderPermissionsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>权限管理</CardTitle>
        <CardDescription>管理用户和角色对此仓库的访问权限</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">权限管理功能开发中...</p>
        </div>
      </CardContent>
    </Card>
  )

  const renderConfigTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>配置管理</CardTitle>
        <CardDescription>管理仓库的各种配置选项</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Cog className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">配置管理功能开发中...</p>
        </div>
      </CardContent>
    </Card>
  )

  const renderTasksTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>任务管理</CardTitle>
        <CardDescription>查看和管理仓库相关的处理任务</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">任务管理功能开发中...</p>
        </div>
      </CardContent>
    </Card>
  )

  const renderLogsTab = () => (
    <Card>
      <CardHeader>
        <CardTitle>操作日志</CardTitle>
        <CardDescription>查看仓库的操作历史记录</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    log.success ? 'bg-green-500' : 'bg-red-500'
                  )} />
                  <div>
                    <p className="text-sm font-medium">{log.operation}</p>
                    <p className="text-sm text-muted-foreground">{log.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {log.userName} • {new Date(log.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                {log.error && (
                  <Badge variant="destructive">
                    有错误
                  </Badge>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">暂无操作日志</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderFilesTab = () => (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-16rem)]">
      {/* 文件树 */}
      <div className="col-span-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t('admin.repositories.detail.tree')}</CardTitle>
            <CardDescription>浏览和管理仓库内容</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
            <ScrollArea className="h-[calc(100%-4rem)]">
              <div className="p-2">
                {treeData && treeData.length > 0 ? (
                  filteredTreeData(treeData).map(node => renderTreeNode(node))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    暂无文件
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* 文件内容编辑器 */}
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
  )

  // 加载状态处理
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
        <p>{t('admin.repositories.detail.repository_not_found')}</p>
        <Button asChild className="mt-4">
          <Link to="/admin/repositories">
            <ChevronLeft className="mr-2 h-4 w-4" />
            {t('admin.repositories.detail.return_to_repository_list')}
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
            <BreadcrumbPage>{repository.organizationName}/{repository.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold tracking-tight">
              {repository.organizationName}/{repository.name}
            </h1>
            {getStatusBadge(repository.status || 'Pending')}
          </div>
          <p className="text-muted-foreground">
            {repository.description || t('admin.repositories.detail.no_description')}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <GitBranch className="h-4 w-4" />
              {repository.branch || 'main'}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t('admin.repositories.detail.created_at')} {new Date(repository.createdAt).toLocaleDateString('zh-CN')}
            </div>
            {repository.updatedAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {t('admin.repositories.detail.updated_at')} {new Date(repository.updatedAt).toLocaleDateString('zh-CN')}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            {refreshing ? t('admin.repositories.detail.refreshing') : t('admin.repositories.detail.refresh')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {t('admin.repositories.detail.export')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            {t('admin.repositories.detail.edit')}
          </Button>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('admin.repositories.detail.delete')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('admin.repositories.detail.confirm_delete_repository')}</DialogTitle>
                <DialogDescription>
                  {t('admin.repositories.detail.delete_repository_warning')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  {t('admin.repositories.detail.cancel')}
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  {t('admin.repositories.detail.confirm_delete')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">{t('admin.repositories.detail.overview')}</TabsTrigger>
          <TabsTrigger value="documents">{t('admin.repositories.detail.documents')}</TabsTrigger>
          <TabsTrigger value="sync">{t('admin.repositories.detail.sync')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('admin.repositories.detail.permissions')}</TabsTrigger>
          <TabsTrigger value="config">{t('admin.repositories.detail.config')}</TabsTrigger>
          <TabsTrigger value="tasks">{t('admin.repositories.detail.tasks')}</TabsTrigger>
          <TabsTrigger value="logs">{t('admin.repositories.detail.logs')}</TabsTrigger>
          <TabsTrigger value="files">{t('admin.repositories.detail.files')}</TabsTrigger>
        </TabsList>

        {/* 概览标签页 */}
        <TabsContent value="overview" className="space-y-6">
          {renderOverviewTab()}
        </TabsContent>

        {/* 文档管理标签页 */}
        <TabsContent value="documents" className="space-y-6">
          {renderDocumentsTab()}
        </TabsContent>

        {/* 同步管理标签页 */}
        <TabsContent value="sync" className="space-y-6">
          {renderSyncTab()}
        </TabsContent>

        {/* 权限管理标签页 */}
        <TabsContent value="permissions" className="space-y-6">
          {renderPermissionsTab()}
        </TabsContent>

        {/* 配置管理标签页 */}
        <TabsContent value="config" className="space-y-6">
          {renderConfigTab()}
        </TabsContent>

        {/* 任务管理标签页 */}
        <TabsContent value="tasks" className="space-y-6">
          {renderTasksTab()}
        </TabsContent>

        {/* 操作日志标签页 */}
        <TabsContent value="logs" className="space-y-6">
          {renderLogsTab()}
        </TabsContent>

        {/* 文件浏览标签页 */}
        <TabsContent value="files" className="space-y-6">
          {renderFilesTab()}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RepositoryDetailPage