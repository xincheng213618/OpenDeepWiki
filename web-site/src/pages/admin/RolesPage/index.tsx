// 角色管理页面

import React, { useState, useEffect } from 'react'
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Shield, Settings } from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
  usersCount: number
  permissionsCount: number
  status: 'active' | 'inactive'
  createdAt: string
  isSystemRole: boolean
}

const RolesPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟角色数据
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'admin',
        description: '系统管理员，拥有所有权限',
        usersCount: 2,
        permissionsCount: 25,
        status: 'active',
        createdAt: '2024-01-01',
        isSystemRole: true
      },
      {
        id: '2',
        name: 'moderator',
        description: '版主，可以管理内容和用户',
        usersCount: 5,
        permissionsCount: 12,
        status: 'active',
        createdAt: '2024-01-01',
        isSystemRole: true
      },
      {
        id: '3',
        name: 'user',
        description: '普通用户，基本访问权限',
        usersCount: 241,
        permissionsCount: 5,
        status: 'active',
        createdAt: '2024-01-01',
        isSystemRole: true
      },
      {
        id: '4',
        name: 'editor',
        description: '编辑者，可以编辑和发布内容',
        usersCount: 15,
        permissionsCount: 8,
        status: 'active',
        createdAt: '2024-01-10',
        isSystemRole: false
      },
      {
        id: '5',
        name: 'guest',
        description: '访客，只读权限',
        usersCount: 0,
        permissionsCount: 2,
        status: 'inactive',
        createdAt: '2024-01-15',
        isSystemRole: false
      }
    ]

    setTimeout(() => {
      setRoles(mockRoles)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: Role['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary'
    } as const

    return (
      <Badge variant={variants[status]}>
        {status === 'active' ? '启用' : '禁用'}
      </Badge>
    )
  }

  const getRoleTypeBadge = (isSystemRole: boolean) => {
    return isSystemRole ? (
      <Badge variant="outline" className="text-blue-600 border-blue-600">
        系统角色
      </Badge>
    ) : (
      <Badge variant="outline">
        自定义角色
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.roles.title')}</h1>
          <p className="text-muted-foreground">{t('admin.roles.subtitle')}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.roles.create')}
        </Button>
      </div>

      {/* 角色统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总角色数</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">包含系统和自定义角色</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃角色</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.filter(r => r.status === 'active').length}</div>
            <p className="text-xs text-muted-foreground">当前启用的角色</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">分配用户数</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.reduce((sum, role) => sum + role.usersCount, 0)}</div>
            <p className="text-xs text-muted-foreground">已分配角色的用户总数</p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>角色列表</CardTitle>
          <CardDescription>管理系统中的所有角色和权限</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('admin.roles.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              筛选
            </Button>
          </div>

          {/* 角色表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.roles.table.name')}</TableHead>
                  <TableHead>{t('admin.roles.table.description')}</TableHead>
                  <TableHead className="text-center">{t('admin.roles.table.users_count')}</TableHead>
                  <TableHead className="text-center">{t('admin.roles.table.permissions_count')}</TableHead>
                  <TableHead>{t('admin.roles.table.status')}</TableHead>
                  <TableHead>{t('admin.roles.table.created_at')}</TableHead>
                  <TableHead className="text-right">{t('admin.roles.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('admin.messages.loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredRoles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('admin.messages.no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{role.name}</span>
                            {getRoleTypeBadge(role.isSystemRole)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <span className="text-sm text-muted-foreground">{role.description}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{role.usersCount}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{role.permissionsCount}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(role.status)}</TableCell>
                      <TableCell>{formatDate(role.createdAt)}</TableCell>
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
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('admin.roles.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              {t('admin.roles.permissions')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {!role.isSystemRole && (
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('admin.roles.delete')}
                              </DropdownMenuItem>
                            )}
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

export default RolesPage