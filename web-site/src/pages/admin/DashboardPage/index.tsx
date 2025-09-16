// 管理员仪表板页面

import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Database, Shield, Activity } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()

  // 模拟统计数据
  const stats = [
    {
      title: t('admin.dashboard.stats.total_users'),
      value: '248',
      description: '+12% 相比上月',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: t('admin.dashboard.stats.total_repos'),
      value: '127',
      description: '+8% 相比上月',
      icon: Database,
      color: 'text-green-600'
    },
    {
      title: t('admin.dashboard.stats.total_roles'),
      value: '12',
      description: '活跃角色',
      icon: Shield,
      color: 'text-purple-600'
    },
    {
      title: t('admin.dashboard.stats.active_sessions'),
      value: '42',
      description: '当前在线',
      icon: Activity,
      color: 'text-orange-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('admin.dashboard.title')}</h1>
        <p className="text-muted-foreground">{t('admin.dashboard.overview')}</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.charts.user_growth')}</CardTitle>
            <CardDescription>过去12个月的用户增长趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              图表功能开发中...
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.dashboard.charts.repo_activity')}</CardTitle>
            <CardDescription>仓库活动统计</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              图表功能开发中...
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近活动 */}
      <Card>
        <CardHeader>
          <CardTitle>最近活动</CardTitle>
          <CardDescription>系统最近的重要活动记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">新用户注册</p>
                <p className="text-xs text-muted-foreground">用户 john_doe 刚刚注册了账户</p>
              </div>
              <div className="text-xs text-muted-foreground">2分钟前</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">仓库更新</p>
                <p className="text-xs text-muted-foreground">仓库 OpenDeepWiki/KoalaWiki 已完成分析</p>
              </div>
              <div className="text-xs text-muted-foreground">15分钟前</div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">角色变更</p>
                <p className="text-xs text-muted-foreground">管理员为用户 alice 分配了编辑者角色</p>
              </div>
              <div className="text-xs text-muted-foreground">1小时前</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardPage