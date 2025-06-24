import React from 'react';
import { ServerMarkdown } from './ServerMarkdown';
import { ServerRenderThinking } from './ServerRenderThinking';

interface ServerDocumentContentProps {
  document: any;
  owner: string;
  name: string;
  think?: string;
  token?: any;
}

// 服务端渲染的文档内容组件
export async function ServerDocumentContent({
  document,
  owner,
  name,
  token,
  think
}: ServerDocumentContentProps) {
  // 默认样式对象，避免依赖 token
  const defaultStyles = {
    background: '#ffffff',
    padding: '24px 32px',
    borderRadius: '0px',
    color: '#1e293b'
  };

  return (
    <div style={token ? {
      background: token.colorBgContainer,
      padding: '24px 32px',
      borderRadius: '0px',
      color: token.colorText
    } : defaultStyles}>
      {think && (
        <ServerRenderThinking think={think} />
      )}
      <div className="markdown-content" itemProp="articleBody">
        <ServerMarkdown content={document?.content || ''} />
      </div>


    </div>
  );
}

export default ServerDocumentContent; 