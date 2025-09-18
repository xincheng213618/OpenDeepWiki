// 仓库卡片组件

import React, { useCallback, useMemo } from 'react'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Star, GitBranch, Calendar, AlertCircle } from 'lucide-react'
import { WarehouseStatus, type RepositoryInfo } from '@/types/repository'
import { formatDistanceToNow } from '@/utils/date'

interface RepositoryCardProps {
  repository: RepositoryInfo
  onClick?: (repository: RepositoryInfo) => void
}

const statusConfig: Record<WarehouseStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  [WarehouseStatus.Pending]: { label: '待处理', variant: 'secondary' },
  [WarehouseStatus.Processing]: { label: '处理中', variant: 'default' },
  [WarehouseStatus.Completed]: { label: '已完成', variant: 'success' },
  [WarehouseStatus.Failed]: { label: '失败', variant: 'destructive' },
  [WarehouseStatus.Canceled]: { label: '已取消', variant: 'destructive' },
  [WarehouseStatus.Unauthorized]: { label: '未授权', variant: 'destructive' },
}

export const RepositoryCard: React.FC<RepositoryCardProps> = React.memo(({ repository, onClick }) => {
  // 缓存状态信息
  const statusInfo = useMemo(() => statusConfig[repository.status], [repository.status])

  // 缓存头像显示文本
  const avatarText = useMemo(() =>
    repository.organizationName.substring(0, 2).toUpperCase(),
    [repository.organizationName]
  )

  // 缓存时间格式化
  const formattedTime = useMemo(() =>
    formatDistanceToNow(repository.createdAt),
    [repository.createdAt]
  )

  // 缓存点击处理器
  const handleClick = useCallback(() => {
    onClick?.(repository)
  }, [onClick, repository])

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{avatarText}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">
                {repository.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {repository.organizationName}
              </p>
            </div>
          </div>
          {repository.isRecommended && (
            <Badge variant="secondary" className="ml-2">
              推荐
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {repository.description || '暂无描述'}
        </p>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge >
            {statusInfo.label}
          </Badge>
          
          {repository.branch && (
            <div className="flex items-center text-xs text-muted-foreground">
              <GitBranch className="h-3 w-3 mr-1" />
              {repository.branch}
            </div>
          )}
        </div>
        
        {repository.error && (
          <div className="mt-2 flex items-start text-xs text-destructive">
            <AlertCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{repository.error}</span>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              <span>0</span>
            </div>
            <div className="flex items-center">
              <GitBranch className="h-4 w-4 mr-1" />
              <span>0</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{formattedTime}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
})

RepositoryCard.displayName = 'RepositoryCard'

export default RepositoryCard