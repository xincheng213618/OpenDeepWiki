'use client'

import React, { useMemo } from 'react';
import { Repository } from '../types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTranslation } from '../i18n/client';
import {
  Github,
  GitFork,
  Calendar,
  ExternalLink,
  FileText
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
        text: t('repository.status.pending', '待处理')
      };
      case 1: return {
        variant: 'default' as const,
        text: t('repository.status.processing', '处理中')
      };
      case 2: return {
        variant: 'secondary' as const,
        text: t('repository.status.completed', '已完成')
      };
      case 3: return {
        variant: 'outline' as const,
        text: t('repository.status.cancelled', '已取消')
      };
      case 4: return {
        variant: 'secondary' as const,
        text: t('repository.status.unauthorized', '未授权')
      };
      case 99: return {
        variant: 'destructive' as const,
        text: t('repository.status.failed', '已失败')
      };
      default: return {
        variant: 'outline' as const,
        text: t('repository.status.unknown', '未知状态')
      };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
      className="cursor-pointer transition-all hover:shadow-md border-border/50 hover:border-border"
      style={{
        height: '230px',
        minHeight: '230px',
        maxHeight: '230px',
      }}
      onClick={handleCardClick}
    >
      <CardHeader style={{
        height: '140px',
        minHeight: '140px',
        maxHeight: '140px',
      }} className="pb-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 mt-1">
            <AvatarImage src={avatarUrl || ''} alt={repository.organizationName} />
            <AvatarFallback className="bg-muted text-muted-foreground text-sm">
              {repository.organizationName?.slice(0, 2)?.toUpperCase() || 'RE'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 style={{
                  maxWidth: '60%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }} className="font-semibold text-foreground truncate">
                  {repository.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  {getRepoIcon()}
                  <span style={{
                    maxWidth: '60%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }} className="text-sm text-muted-foreground truncate">
                    {repository.organizationName}
                  </span>
                </div>
              </div>

              <Badge variant={statusConfig.variant} className="shrink-0">
                {statusConfig.text}
              </Badge>
            </div>

            {repository.description && (
              <p style={{
                maxWidth: '60%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }} className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {repository.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            {repository.branch && (
              <div className="flex items-center gap-1">
                <GitFork className="h-3 w-3" />
                <span>{repository.branch}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(repository.createdAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-muted"
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