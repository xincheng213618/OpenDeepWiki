'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Brain, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface EmptyStateProps {
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ className }) => {
  return (
    <div className={cn(
      "flex items-center justify-center min-h-[400px] p-6",
      className
    )}>
      <Card className="max-w-md w-full border-dashed">
        <CardHeader className="pb-3 flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-center">
            欢迎使用 AI 智能助手
          </h3>
        </CardHeader>
        
        <CardContent className="text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            OpenDeepWiki 基于先进的 AI 技术，为您的项目提供智能代码分析和问答服务。
            <br />
            开始对话，探索更多可能性！
          </p>
        </CardContent>
        
        <div className="flex justify-center px-6 pb-4">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2"
          >
            <a
              href="https://github.com/AIDotNet/OpenDeepWiki"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-4 h-4" />
              了解更多
            </a>
          </Button>
        </div>
        
        <CardFooter className="pt-2 pb-4 px-6">
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground w-full text-center">
            💡 提示：您可以询问代码问题、请求解释或寻求开发建议
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EmptyState;
