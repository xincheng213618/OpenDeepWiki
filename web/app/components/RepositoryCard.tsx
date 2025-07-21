'use client'

import React, { useMemo } from 'react';
import { Repository } from '../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '../i18n/client';
import { formatRelativeTime } from '../utils/timeFormat';
import {
  Github,
  GitFork,
  Calendar,
  ExternalLink,
  FileText,
  Star,
  GitBranch
} from 'lucide-react';

interface RepositoryCardProps {
  repository: Repository;
}

const RepositoryCard: React.FC<RepositoryCardProps> = ({ repository }) => {

  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language;

  // 根据地址获取头像
  const getAvatarUrl = () => {
    if (repository?.avatarUrl) {
      return repository.avatarUrl;
    }

    if (repository.address?.includes('github.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://github.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitee.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitee.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitea.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitea.com/${owner}.png`;
      }
    } else if (repository.address?.includes('gitlab.com')) {
      const owner = repository.organizationName;
      if (owner) {
        return `https://gitlab.com/${owner}.png`;
      }
    } else {
      return null;
    }
    return null;
  };

  const avatarUrl = useMemo(() => getAvatarUrl(), [repository.address, repository.organizationName]);

  const getStatusNumber = (status: string | number): number => {
    if (typeof status === 'number') return status;
    return parseInt(status, 10) || 0;
  };

  // 获取状态配置
  const getStatusConfig = (status: string | number) => {
    const statusNumber = getStatusNumber(status);
    switch (statusNumber) {
      case 0: return {
        variant: 'secondary' as const,
        color: '#6c757d',
        text: t('repository.status.pending', '待处理')
      };
      case 1: return {
        variant: 'default' as const,
        color: '#007bff',
        text: t('repository.status.processing', '处理中')
      };
      case 2: return {
        variant: 'success' as const,
        color: '#28a745',
        text: t('repository.status.completed', '已完成')
      };
      case 3: return {
        variant: 'outline' as const,
        color: '#6c757d',
        text: t('repository.status.cancelled', '已取消')
      };
      case 4: return {
        variant: 'secondary' as const,
        color: '#ffc107',
        text: t('repository.status.unauthorized', '未授权')
      };
      case 99: return {
        variant: 'destructive' as const,
        color: '#dc3545',
        text: t('repository.status.failed', '已失败')
      };
      default: return {
        variant: 'outline' as const,
        color: '#6c757d',
        text: t('repository.status.unknown', '未知状态')
      };
    }
  };

  const formatDate = (dateString: string) => {
    return formatRelativeTime(dateString, currentLocale);
  };

  const getRepoIcon = () => {
    if (repository.address?.includes('github.com')) {
      return <Github className="h-4 w-4" />;
    } else if (repository.address?.includes('gitee.com')) {
      return <div className="h-4 w-4 bg-foreground rounded-sm flex items-center justify-center">
        <span className="text-background text-xs font-bold">G</span>
      </div>;
    } else {
      return <FileText className="h-4 w-4" />;
    }
  };

  const statusConfig = getStatusConfig(repository.status);

  const handleCardClick = () => {
    window.location.href = `/${repository.organizationName}/${repository.name}`;
  };

  return (
    <Card
      className="cursor-pointer transition-all duration-200 hover:shadow-lg border-border/40 hover:border-border/80 bg-card/50 hover:bg-card/80 backdrop-blur-sm w-80 h-52 group flex flex-col"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3 pt-4 px-4 flex-shrink-0">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-border/20 group-hover:ring-border/40 transition-all">
            <AvatarImage src={avatarUrl || ''} alt={repository.organizationName} />
            <AvatarFallback className="bg-muted/80 text-muted-foreground text-sm font-medium">
              {repository.organizationName?.slice(0, 2)?.toUpperCase() || 'RE'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0 flex-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-semibold text-foreground text-base leading-tight cursor-pointer truncate group-hover:text-primary transition-colors">
                        {repository.name || t('repository.unknown_name', '未知仓库名称')}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{repository.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Badge
                color={statusConfig.color}
                variant={statusConfig.variant}
                className="shrink-0 text-xs px-2 py-0.5 font-medium"
              >
                {statusConfig.text}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              {getRepoIcon()}
              <span className="text-sm text-muted-foreground/80 truncate font-medium">
                {repository.organizationName}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 px-4 pb-3 flex-1 flex flex-col justify-between">
        <div className="flex-1">
          {repository.description && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm text-muted-foreground/90 line-clamp-2 cursor-pointer leading-relaxed">
                    {repository.description || t('repository.no_description', '暂无描述')}
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{repository.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 flex-1 min-w-0 text-sm text-muted-foreground/80">
            {repository.branch && (
              <div className="flex items-center gap-1.5 min-w-0">
                <GitBranch className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-16 font-mono text-xs">{repository.branch}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 min-w-0">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate text-xs">{formatDate(repository.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Star className="h-3.5 w-3.5" fill="currentColor" />
                <span className="font-medium">{repository.stars}</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                <GitFork className="h-3.5 w-3.5" />
                <span className="font-medium">{repository.forks}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted/80 transition-all opacity-60 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                window.open(repository.address, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepositoryCard; 