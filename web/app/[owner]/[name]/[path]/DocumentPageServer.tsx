'use server'

import React from 'react';
import 'katex/dist/katex.min.css';

// 导入类型
import { DocumentPageClientProps, DocumentData } from './types';

// 简化的服务端组件，主要用于SEO优化
export default async function DocumentPageServer({
  document,
  error,
  headings,
  anchorItems,
  owner,
  name,
  path,
  branch
}: DocumentPageClientProps) {
  
  // 如果有错误，显示错误信息
  if (error) {
    return (
      <main className="doc-page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          backgroundColor: '#fff2f0', 
          border: '1px solid #ffccc7', 
          borderRadius: '6px', 
          padding: '16px',
          color: '#a8071a'
        }}>
          <h2>加载文档时出错</h2>
          <p>{error}</p>
          <p>请检查文档路径是否正确，或稍后重试。</p>
        </div>
      </main>
    );
  }

  // 如果没有文档数据
  if (!document) {
    return (
      <main className="doc-page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <h2>文档加载中...</h2>
          <p>正在获取文档内容，请稍候。</p>
        </div>
      </main>
    );
  }

  return (
    <main className="doc-page-container" style={{ 
      backgroundColor: '#f5f5f5', 
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        
        {/* 源文件信息 */}
        {document.fileSource && document.fileSource.length > 0 && (
          <div style={{ 
            backgroundColor: '#fafafa', 
            borderBottom: '1px solid #d9d9d9',
            padding: '16px 24px'
          }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#262626' }}>
              源文件
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {document.fileSource.map((file) => (
                <span 
                  key={file.id}
                  style={{
                    backgroundColor: '#e6f7ff',
                    color: '#1890ff',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    border: '1px solid #91d5ff'
                  }}
                >
                  {file.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 主要内容区域 */}
        <div style={{ display: 'flex', gap: '24px' }}>
          
          {/* 文档内容 */}
          <article style={{ 
            flex: '1',
            padding: '24px',
            lineHeight: '1.6'
          }}>
            {/* 文档标题 */}
            <header style={{ marginBottom: '24px', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px' }}>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: '600', 
                color: '#262626',
                margin: '0 0 8px 0'
              }}>
                {document.title || path}
              </h1>
              {document.description && (
                <p style={{ 
                  color: '#8c8c8c', 
                  fontSize: '14px',
                  margin: '0'
                }}>
                  {document.description}
                </p>
              )}
            </header>

            {/* 文档内容 - 使用预编译的 HTML */}
            <section 
              className="compiled-markdown-content"
              style={{ 
                fontSize: '14px',
                color: '#595959',
                wordBreak: 'break-word'
              }}
              dangerouslySetInnerHTML={{ __html: document.content || '' }}
            />
          </article>

          {/* 目录侧边栏 */}
          {anchorItems.length > 0 && (
            <nav style={{ 
              width: '240px',
              padding: '24px 16px',
              backgroundColor: '#fafafa',
              borderLeft: '1px solid #f0f0f0'
            }}>
              <h3 style={{ 
                fontSize: '14px', 
                fontWeight: '600', 
                color: '#262626',
                margin: '0 0 16px 0'
              }}>
                目录
              </h3>
              <div style={{ fontSize: '12px' }}>
                {anchorItems.map((item) => (
                  <div key={item.key} style={{ marginBottom: '8px' }}>
                    <a 
                      href={item.href}
                      style={{ 
                        color: '#595959',
                        textDecoration: 'none',
                        display: 'block',
                        padding: '4px 0',
                        borderLeft: '2px solid transparent'
                      }}
                    >
                      {item.title}
                    </a>
                    {item.children.length > 0 && (
                      <div style={{ marginLeft: '12px', marginTop: '4px' }}>
                        {item.children.map((child) => (
                          <a
                            key={child.key}
                            href={child.href}
                            style={{
                              color: '#8c8c8c',
                              textDecoration: 'none',
                              display: 'block',
                              padding: '2px 0',
                              fontSize: '11px'
                            }}
                          >
                            {child.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </nav>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .doc-page-container h1, .doc-page-container h2, .doc-page-container h3,
          .doc-page-container h4, .doc-page-container h5, .doc-page-container h6 {
            font-weight: 600;
            line-height: 1.4;
            margin: 1.5em 0 0.5em 0;
          }
          
          .doc-page-container p {
            margin: 0.8em 0;
            line-height: 1.6;
          }
          
          .doc-page-container code {
            background-color: #f6f8fa;
            border-radius: 3px;
            font-size: 85%;
            margin: 0;
            padding: 0.2em 0.4em;
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          }
          
          .doc-page-container pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;
            padding: 16px;
            margin: 1em 0;
          }
          
          .doc-page-container blockquote {
            border-left: 4px solid #ddd;
            margin: 0 0 1em 0;
            padding: 0 1em;
            color: #666;
          }
          
          .doc-page-container table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
          }
          
          .doc-page-container th, .doc-page-container td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          
          .doc-page-container th {
            background-color: #f8f9fa;
            font-weight: 600;
          }

          /* 编译后的 Markdown 内容专属样式 */
          .compiled-markdown-content {
            line-height: 1.8;
          }
          
          .compiled-markdown-content h1,
          .compiled-markdown-content h2,
          .compiled-markdown-content h3,
          .compiled-markdown-content h4,
          .compiled-markdown-content h5,
          .compiled-markdown-content h6 {
            font-weight: 600;
            line-height: 1.4;
            margin: 2em 0 1em 0;
            color: #262626;
            scroll-margin-top: 80px;
          }
          
          .compiled-markdown-content h1:first-child,
          .compiled-markdown-content h2:first-child,
          .compiled-markdown-content h3:first-child {
            margin-top: 0;
          }
          
          .compiled-markdown-content h1 {
            font-size: 2em;
            border-bottom: 2px solid #eaecef;
            padding-bottom: 0.3em;
          }
          
          .compiled-markdown-content h2 {
            font-size: 1.5em;
            border-bottom: 1px solid #eaecef;
            padding-bottom: 0.3em;
          }
          
          .compiled-markdown-content h3 {
            font-size: 1.25em;
          }
          
          .compiled-markdown-content h4 {
            font-size: 1em;
          }
          
          .compiled-markdown-content h5 {
            font-size: 0.875em;
          }
          
          .compiled-markdown-content h6 {
            font-size: 0.85em;
            color: #6a737d;
          }
          
          .compiled-markdown-content p {
            margin: 1em 0;
            line-height: 1.8;
          }
          
          .compiled-markdown-content a {
            color: #1890ff;
            text-decoration: none;
            transition: color 0.3s;
          }
          
          .compiled-markdown-content a:hover {
            color: #40a9ff;
            text-decoration: underline;
          }
          
          .compiled-markdown-content ul,
          .compiled-markdown-content ol {
            padding-left: 2em;
            margin: 1em 0;
          }
          
          .compiled-markdown-content li {
            margin: 0.5em 0;
            line-height: 1.6;
          }
          
          .compiled-markdown-content li p {
            margin: 0.5em 0;
          }
          
          .compiled-markdown-content blockquote {
            border-left: 4px solid #dfe2e5;
            margin: 1.5em 0;
            padding: 0 1em;
            color: #6a737d;
            background-color: #f8f9fa;
            border-radius: 0 6px 6px 0;
          }
          
          .compiled-markdown-content blockquote p {
            margin: 1em 0;
          }
          
          .compiled-markdown-content code {
            background-color: rgba(175, 184, 193, 0.2);
            border-radius: 6px;
            font-size: 85%;
            margin: 0;
            padding: 0.2em 0.4em;
            font-family: 'SFMono-Regular', 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
            color: #e36209;
          }
          
          .compiled-markdown-content pre {
            background-color: #f6f8fa;
            border-radius: 6px;
            font-size: 85%;
            line-height: 1.45;
            overflow: auto;
            padding: 16px;
            margin: 1.5em 0;
            border: 1px solid #e1e4e8;
          }
          
          .compiled-markdown-content pre code {
            background-color: transparent;
            border-radius: 0;
            font-size: 100%;
            margin: 0;
            padding: 0;
            word-break: normal;
            word-wrap: normal;
            color: inherit;
          }
          
          .compiled-markdown-content table {
            border-collapse: collapse;
            width: 100%;
            margin: 1.5em 0;
            border-spacing: 0;
            border: 1px solid #d0d7de;
            border-radius: 6px;
            overflow: hidden;
          }
          
          .compiled-markdown-content th,
          .compiled-markdown-content td {
            border: 1px solid #d0d7de;
            padding: 12px 16px;
            text-align: left;
            line-height: 1.4;
          }
          
          .compiled-markdown-content th {
            background-color: #f6f8fa;
            font-weight: 600;
            color: #24292f;
          }
          
          .compiled-markdown-content tr:nth-child(even) {
            background-color: #f6f8fa;
          }
          
          .compiled-markdown-content img {
            max-width: 100%;
            height: auto;
            margin: 1em 0;
            border-radius: 6px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .compiled-markdown-content hr {
            height: 0.25em;
            padding: 0;
            margin: 2em 0;
            background-color: #e1e4e8;
            border: 0;
            border-radius: 2px;
          }
          
          /* KaTeX 数学公式样式 */
          .compiled-markdown-content .katex {
            font-size: 1.1em;
          }
          
          .compiled-markdown-content .katex-display {
            margin: 1.5em 0;
            text-align: center;
          }
          
          /* 代码高亮样式 */
          .compiled-markdown-content .hljs {
            background: #f6f8fa !important;
          }
          
          .compiled-markdown-content .hljs-comment,
          .compiled-markdown-content .hljs-quote {
            color: #6a737d;
            font-style: italic;
          }
          
          .compiled-markdown-content .hljs-keyword,
          .compiled-markdown-content .hljs-selector-tag,
          .compiled-markdown-content .hljs-type {
            color: #d73a49;
          }
          
          .compiled-markdown-content .hljs-string,
          .compiled-markdown-content .hljs-attr {
            color: #032f62;
          }
          
          .compiled-markdown-content .hljs-number,
          .compiled-markdown-content .hljs-literal {
            color: #005cc5;
          }
          
          .compiled-markdown-content .hljs-function,
          .compiled-markdown-content .hljs-title {
            color: #6f42c1;
          }
          
          /* 任务列表样式 */
          .compiled-markdown-content .task-list-item {
            list-style-type: none;
            margin-left: -1.5em;
          }
          
          .compiled-markdown-content .task-list-item input[type="checkbox"] {
            margin-right: 0.5em;
          }
          
          /* 响应式设计 */
          @media (max-width: 768px) {
            .compiled-markdown-content {
              font-size: 16px;
            }
            
            .compiled-markdown-content h1 {
              font-size: 1.8em;
            }
            
            .compiled-markdown-content h2 {
              font-size: 1.4em;
            }
            
            .compiled-markdown-content h3 {
              font-size: 1.2em;
            }
            
            .compiled-markdown-content pre {
              padding: 12px;
              font-size: 14px;
            }
            
            .compiled-markdown-content table {
              font-size: 14px;
            }
            
            .compiled-markdown-content th,
            .compiled-markdown-content td {
              padding: 8px 12px;
            }
          }
        `
      }} />
    </main>
  );
}
