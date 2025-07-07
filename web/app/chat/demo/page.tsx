'use client';

import React from 'react';
import FloatingChat from '../index';
import { Toaster } from '@/components/ui/toaster';

export default function ChatDemo() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              聊天组件演示
            </h1>
            <p className="text-muted-foreground text-lg">
              基于 shadcn/ui 优化的聊天组件，采用简约设计风格
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 悬浮模式演示 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                悬浮模式
              </h2>
              <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] relative">
                <p className="text-muted-foreground text-center">
                  点击右下角的悬浮按钮打开聊天窗口
                </p>
                <FloatingChat 
                  organizationName="demo"
                  repositoryName="project"
                  title="AI 助手"
                />
              </div>
            </div>

            {/* 嵌入模式演示 */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                嵌入模式
              </h2>
              <div className="bg-card rounded-lg border h-[400px]">
                <FloatingChat 
                  organizationName="demo"
                  repositoryName="project"
                  title="AI 助手"
                  embedded={true}
                />
              </div>
            </div>
          </div>

          {/* 特性说明 */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a4 4 0 004-4V5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">简约设计</h3>
              <p className="text-sm text-muted-foreground">
                采用 shadcn/ui 默认风格，简洁而现代
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">高性能</h3>
              <p className="text-sm text-muted-foreground">
                使用 Tailwind CSS，优化的渲染性能
              </p>
            </div>

            <div className="text-center p-6 bg-card rounded-lg border">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="font-semibold text-foreground mb-2">可定制</h3>
              <p className="text-sm text-muted-foreground">
                支持多种模式和主题配置
              </p>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
