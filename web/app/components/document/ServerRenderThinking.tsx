import React from 'react';

interface ServerRenderThinkingProps {
  think: string;
}

// 服务端渲染的 Thinking 组件
export function ServerRenderThinking({ think }: ServerRenderThinkingProps) {
  if (!think) {
    return null;
  }

  return (
    <div className="server-thinking-container" style={{
      width: '100%',
      marginBottom: '16px',
      border: '1px solid #e2e8f0',
      borderRadius: '6px',
      overflow: 'hidden'
    }}>
      <div className="thinking-header" style={{
        padding: '12px 16px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        fontWeight: 500,
        color: '#1e293b'
      }}>
        深入思考
      </div>
      <div className="thinking-content" style={{
        padding: '16px',
        maxHeight: '280px',
        overflowY: 'auto',
        whiteSpace: 'pre-wrap',
        fontSize: '14px',
        lineHeight: '1.6',
        color: '#374151'
      }}>
        {think}
      </div>
    </div>
  );
}

export default ServerRenderThinking; 