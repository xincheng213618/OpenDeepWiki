// 仓库管理页面

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, MoreHorizontal, Edit, Trash2, ExternalLink, FileText, Database } from 'lucide-react'

interface Repository {
  id: string
  name: string
  organization: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  documentsCount: number
  createdAt: string
  updatedAt: string
  gitUrl?: string
}

const RepositoriesPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟仓库数据
  useEffect(() => {
    const mockRepositories: Repository[] = [
      {
        id: '1',
        name: 'OpenDeepWiki',
        organization: 'AIDotNet',
        status: 'completed',
        documentsCount: 42,
        createdAt: '2024-01-15',
        updatedAt: '2024-01-16',
        gitUrl: 'https://github.com/AIDotNet/OpenDeepWiki'
      },
      {
        id: '2',
        name: 'KoalaWiki',
        organization: 'OpenDeepWiki',
        status: 'processing',
        documentsCount: 18,
        createdAt: '2024-01-14',
        updatedAt: '2024-01-16',
        gitUrl: 'https://github.com/OpenDeepWiki/KoalaWiki'
      },
      {
        id: '3',
        name: 'react-admin',
        organization: 'marmelab',
        status: 'completed',
        documentsCount: 156,
        createdAt: '2024-01-13',
        updatedAt: '2024-01-15',
        gitUrl: 'https://github.com/marmelab/react-admin'
      },
      {
        id: '4',
        name: 'next.js',
        organization: 'vercel',
        status: 'failed',
        documentsCount: 0,
        createdAt: '2024-01-12',
        updatedAt: '2024-01-12',
        gitUrl: 'https://github.com/vercel/next.js'
      },
      {
        id: '5',
        name: 'vue',
        organization: 'vuejs',
        status: 'pending',
        documentsCount: 0,
        createdAt: '2024-01-16',
        updatedAt: '2024-01-16',
        gitUrl: 'https://github.com/vuejs/vue'
      }
    ]

    setTimeout(() => {
      setRepositories(mockRepositories)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.organization.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: Repository['status']) => {
    const variants = {
      pending: { variant: 'secondary' as const, text: '待处理', color: 'text-gray-600' },
      processing: { variant: 'default' as const, text: '处理中', color: 'text-blue-600' },
      completed: { variant: 'default' as const, text: '已完成', color: 'text-green-600' },
      failed: { variant: 'destructive' as const, text: '失败', color: 'text-red-600' }
    }

    const config = variants[status]
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.text}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getStatusStats = () => {
    const stats = repositories.reduce((acc, repo) => {
      acc[repo.status] = (acc[repo.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: repositories.length,
      completed: stats.completed || 0,
      processing: stats.processing || 0,
      pending: stats.pending || 0,
      failed: stats.failed || 0
    }
  }

  const stats = getStatusStats()

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.repositories.title')}</h1>
          <p className="text-muted-foreground">{t('admin.repositories.subtitle')}</p>
        </div>
        <Button asChild>
          <Link to="/">
            <ExternalLink className="mr-2 h-4 w-4" />
            添加仓库
          </Link>
        </Button>
      </div>

      {/* 仓库统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总仓库数</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">所有仓库</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">分析完成</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">处理中</CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">正在分析</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <Database className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">等待分析</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>仓库列表</CardTitle>
          <CardDescription>管理系统中的所有代码仓库</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('admin.repositories.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              筛选
            </Button>
          </div>

          {/* 仓库表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.repositories.table.name')}</TableHead>
                  <TableHead>{t('admin.repositories.table.organization')}</TableHead>
                  <TableHead>{t('admin.repositories.table.status')}</TableHead>
                  <TableHead className="text-center">{t('admin.repositories.table.documents')}</TableHead>
                  <TableHead>{t('admin.repositories.table.created_at')}</TableHead>
                  <TableHead>{t('admin.repositories.table.updated_at')}</TableHead>
                  <TableHead className="text-right">{t('admin.repositories.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('admin.messages.loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredRepositories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('admin.messages.no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRepositories.map((repo) => (
                    <TableRow key={repo.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{repo.name}</div>
                          {repo.gitUrl && (
                            <a
                              href={repo.gitUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              GitHub
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{repo.organization}</TableCell>
                      <TableCell>{getStatusBadge(repo.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{repo.documentsCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(repo.createdAt)}</TableCell>
                      <TableCell>{formatDate(repo.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">打开菜单</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/repositories/${repo.id}`}>
                                <Edit className="mr-2 h-4 w-4" />
                                管理内容
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/${repo.organization}/${repo.name}`}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                查看仓库
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除仓库
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RepositoriesPage