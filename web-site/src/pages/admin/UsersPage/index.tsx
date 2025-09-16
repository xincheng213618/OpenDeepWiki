// 用户管理页面

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Plus, MoreHorizontal, Edit, Trash2, UserPlus } from 'lucide-react'

interface User {
  id: string
  username: string
  email: string
  role: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: string
  lastLogin?: string
  avatar?: string
}

const UsersPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟用户数据
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-15',
        lastLogin: '2024-01-16T10:30:00Z'
      },
      {
        id: '2',
        username: 'john_doe',
        email: 'john@example.com',
        role: 'user',
        status: 'active',
        createdAt: '2024-01-14',
        lastLogin: '2024-01-16T09:15:00Z'
      },
      {
        id: '3',
        username: 'jane_smith',
        email: 'jane@example.com',
        role: 'moderator',
        status: 'active',
        createdAt: '2024-01-13',
        lastLogin: '2024-01-15T14:20:00Z'
      },
      {
        id: '4',
        username: 'bob_wilson',
        email: 'bob@example.com',
        role: 'user',
        status: 'inactive',
        createdAt: '2024-01-12',
        lastLogin: '2024-01-14T16:45:00Z'
      }
    ]

    setTimeout(() => {
      setUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusBadge = (status: User['status']) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    } as const

    return (
      <Badge variant={variants[status]}>
        {t(`admin.users.status.${status}`)}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      moderator: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800'
    } as const

    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '从未登录'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('admin.users.title')}</h1>
          <p className="text-muted-foreground">{t('admin.users.subtitle')}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('admin.users.create')}
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>管理系统中的所有用户账户</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={t('admin.users.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              筛选
            </Button>
          </div>

          {/* 用户表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.users.table.username')}</TableHead>
                  <TableHead>{t('admin.users.table.email')}</TableHead>
                  <TableHead>{t('admin.users.table.role')}</TableHead>
                  <TableHead>{t('admin.users.table.status')}</TableHead>
                  <TableHead>{t('admin.users.table.created_at')}</TableHead>
                  <TableHead>{t('admin.users.table.last_login')}</TableHead>
                  <TableHead className="text-right">{t('admin.users.table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('admin.messages.loading')}
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      {t('admin.messages.no_data')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>{formatDateTime(user.lastLogin)}</TableCell>
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
                              {t('admin.users.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserPlus className="mr-2 h-4 w-4" />
                              {t('admin.users.assign_roles')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('admin.users.delete')}
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

export default UsersPage