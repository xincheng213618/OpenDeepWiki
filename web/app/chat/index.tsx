'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button, Card, Typography, notification, Tooltip, Modal } from 'antd';
import { MessageOutlined, CloseOutlined, MinusOutlined, ExpandOutlined, CompressOutlined, RobotOutlined } from '@ant-design/icons';
import { createStyles } from 'antd-style';
import ChatMessages, { type ChatMessageItem } from './components/ChatMessages';
import ChatInput from './components/ChatInput';
import { chatService, type ResponsesInput, type StreamEvent, type Base64Content } from './services/chatService';
import { chatDB, type ChatMessage, type Conversation } from './utils/indexedDB';

const { Title } = Typography;

const useStyles = createStyles(({ css, token }) => ({
  // 悬浮球按钮
  floatingButton: css`
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 20px rgba(24, 144, 255, 0.25);
    z-index: 1000;
    font-size: 24px;
    border: none;
    background: linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive});
    color: white;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 24px rgba(24, 144, 255, 0.35);
    }
    
    &:active {
      transform: scale(0.95);
    }
  `,
  
  // 聊天窗口容器
  chatContainer: css`
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    height: 600px;
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadiusLG}px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    border: 1px solid ${token.colorBorderSecondary};
    
    &.minimized {
      height: 60px;
      border-radius: ${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusSM}px ${token.borderRadiusSM}px;
    }
    
    &.maximized {
      width: 480px;
      height: 720px;
    }
    
    &.embedded {
      position: relative !important;
      bottom: auto !important;
      right: auto !important;
      width: 100% !important;
      height: 100% !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
    }
  `,
  
  // 聊天窗口头部
  chatHeader: css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${token.paddingMD}px ${token.paddingLG}px;
    border-bottom: 1px solid ${token.colorBorderSecondary};
    background: linear-gradient(to right, ${token.colorBgContainer}, ${token.colorBgLayout});
    min-height: 60px;
  `,
  
  headerTitle: css`
    display: flex;
    align-items: center;
    gap: ${token.marginSM}px;
    flex: 1;
    
    .title-icon {
      color: ${token.colorPrimary};
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: ${token.colorBgContainer};
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    }
    
    .title-text {
      font-size: ${token.fontSizeLG}px;
      font-weight: 600;
      margin: 0;
      color: ${token.colorTextHeading};
    }
  `,
  
  headerActions: css`
    display: flex;
    gap: ${token.marginSM}px;
    
    .ant-btn {
      border: none;
      background: transparent;
      color: ${token.colorTextSecondary};
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
      
      &:hover {
        background: ${token.colorBgTextHover};
        color: ${token.colorText};
      }
    }
  `,
  
  // 聊天内容区域
  chatContent: css`
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: ${token.colorBgLayout};
  `,
  
  messagesContainer: css`
    flex: 1;
    overflow: hidden;
  `,
  
  inputContainer: css`
    border-top: 1px solid ${token.colorBorderSecondary};
    background: ${token.colorBgContainer};
  `,
  
  // 空状态
  emptyState: css`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: ${token.paddingLG}px;
    text-align: center;
    color: ${token.colorTextSecondary};
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: ${token.marginMD}px;
      color: ${token.colorPrimary};
      opacity: 0.8;
    }
    
    .empty-title {
      font-size: ${token.fontSizeLG}px;
      margin-bottom: ${token.marginSM}px;
      color: ${token.colorText};
      font-weight: 600;
    }
    
    .empty-description {
      font-size: ${token.fontSize}px;
      line-height: 1.6;
      max-width: 280px;
      margin: 0 auto;
    }
    
    .empty-button {
      margin-top: ${token.marginMD}px;
      border-radius: ${token.borderRadiusLG}px;
    }
  `
}));

interface FloatingChatProps {
  // 应用配置
  appId?: string;
  organizationName?: string;
  repositoryName?: string;
  
  // 外观配置
  expandIcon?: string; // base64 图标
  closeIcon?: string; // base64 图标
  title?: string;
  theme?: 'light' | 'dark';
  
  // 功能配置
  enableDomainValidation?: boolean;
  allowedDomains?: string[];
  embedded?: boolean; // 嵌入式模式
  
  // 回调函数
  onError?: (error: string) => void;
  onValidationFailed?: (domain: string) => void;
}

const FloatingChat: React.FC<FloatingChatProps> = ({
  appId,
  organizationName = 'default',
  repositoryName = 'default',
  expandIcon,
  closeIcon,
  title = 'AI 助手',
  theme = 'light',
  enableDomainValidation = false,
  allowedDomains = [],
  embedded = false,
  onError,
  onValidationFailed,
}) => {
  const { styles } = useStyles();
  
  // 状态管理
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string>('');
  const [domainValidated, setDomainValidated] = useState(false);
  
  // 引用
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessageItem[]>([]);
  const processingRef = useRef<boolean>(false);
  messagesRef.current = messages;

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        // 初始化数据库
        await chatDB.init();
        
        // 域名验证（嵌入式模式下跳过）
        if (!embedded && enableDomainValidation && allowedDomains.length > 0) {
          const currentDomain = window.location.hostname;
          const isValidDomain = allowedDomains.some(domain => 
            currentDomain === domain || currentDomain.endsWith('.' + domain)
          );
          
          if (!isValidDomain) {
            onValidationFailed?.(currentDomain);
            return;
          }
        }
        
        setDomainValidated(true);
        
        // 加载或创建会话
        await loadOrCreateConversation();
        
        // 嵌入式模式下自动展开
        if (embedded) {
          setTimeout(() => {
            setIsExpanded(true);
          }, 100);
        }
        
      } catch (error) {
        console.error('初始化失败:', error);
        onError?.('初始化失败');
      }
    };
    
    init();
  }, [organizationName, repositoryName, enableDomainValidation, allowedDomains, embedded]);

  // 加载或创建会话
  const loadOrCreateConversation = async () => {
    try {
      const conversations = await chatDB.getConversations(organizationName, repositoryName);
      
      let conversationId: string;
      if (conversations.length > 0) {
        // 使用最新的会话
        conversationId = conversations[0].id;
      } else {
        // 创建新会话
        conversationId = Date.now().toString();
        const conversation: Conversation = {
          id: conversationId,
          title: '新对话',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          organizationName,
          repositoryName,
        };
        await chatDB.saveConversation(conversation);
      }
      
      setCurrentConversationId(conversationId);
      
      // 加载历史消息
      const chatMessages = await chatDB.getMessages(conversationId);
      const formattedMessages: ChatMessageItem[] = chatMessages.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.timestamp,
        thinking: msg.metadata?.thinking,
        toolCalls: msg.metadata?.toolCalls,
        imageContents: msg.metadata?.imageContents,
        status: 'complete',
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('加载会话失败:', error);
      onError?.('加载会话失败');
    }
  };

  // 发送消息
  const handleSendMessage = useCallback(async (content: string, imageContents?: Base64Content[]) => {
    if (!currentConversationId || !domainValidated) {
      return;
    }

    // 防止重复发送
    if (processingRef.current) {
      console.log('消息处理中，请等待...');
      return;
    }

    processingRef.current = true;

    const userMessageId = Date.now().toString();
    const userMessage: ChatMessageItem = {
      id: userMessageId,
      role: 'user',
      content,
      timestamp: Date.now(),
      imageContents,
      status: 'complete',
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      // 保存用户消息到数据库
      const userChatMessage: ChatMessage = {
        id: userMessageId,
        type: 'message_content',
        content,
        role: 'user',
        timestamp: Date.now(),
        conversationId: currentConversationId,
        metadata: {
          imageContents
        }
      };
      await chatDB.saveMessage(userChatMessage);

      // 准备发送给 API 的消息
      const requestMessages = messagesRef.current.map(msg => ({
        role: msg.role,
        content: msg.content,
        imageContents: msg.imageContents
      }));

      // 创建助手消息
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantMessage: ChatMessageItem = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        status: 'loading',
      };

      setMessages(prev => [...prev, assistantMessage]);

      // 用于累积响应内容
      let thinking = '';
      let toolCalls: Array<{ id: string; functionName: string; arguments: string; }> = [];
      let messageContent = '';

      // 处理 SSE 流
      abortControllerRef.current = new AbortController();
      
      const requestData: ResponsesInput = {
        organizationName,
        name: repositoryName,
        messages: requestMessages,
      };
      
      for await (const event of chatService.sendMessage(requestData)) {
        if (abortControllerRef.current?.signal.aborted) {
          break;
        }

        switch (event.type) {
          case 'reasoning_content':
            thinking += event.content || '';
            break;
            
          case 'tool_call':
            if (event.tool_call_id && event.function_name) {
              toolCalls.push({
                id: event.tool_call_id,
                functionName: event.function_name,
                arguments: event.function_arguments || '',
              });
            }
            break;
            
          case 'message_content':
            messageContent += event.content || '';
            break;
            
          case 'done':
            // 流结束，更新最终状态
            assistantMessage = {
              ...assistantMessage,
              content: messageContent,
              thinking: thinking || undefined,
              toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              status: 'complete',
            };
            
            setMessages(prev => 
              prev.map(msg => 
                msg.id === assistantMessageId ? assistantMessage : msg
              )
            );
            
            // 保存助手消息到数据库
            const assistantChatMessage: ChatMessage = {
              id: assistantMessageId,
              type: 'message_content',
              content: messageContent,
              role: 'assistant',
              timestamp: Date.now(),
              conversationId: currentConversationId,
              metadata: {
                thinking: thinking || undefined,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
              },
            };
            await chatDB.saveMessage(assistantChatMessage);
            
            // 更新会话
            await chatDB.updateConversation(currentConversationId, {
              lastMessage: messageContent.substring(0, 100),
            });
            break;
        }

        // 实时更新消息显示
        if (event.type !== 'done') {
          const updatedMessage: ChatMessageItem = {
            ...assistantMessage,
            content: messageContent,
            thinking: thinking || undefined,
            toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          };
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId ? updatedMessage : msg
            )
          );
        }
      }
      
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 更新错误状态
      setMessages(prev => 
        prev.map(msg => 
          msg.id === (Date.now() + 1).toString() 
            ? { ...msg, status: 'error' as const, content: '发送失败，请重试' }
            : msg
        )
      );
      
      onError?.('发送消息失败');
      notification.error({
        message: '发送失败',
        description: error instanceof Error ? error.message : '未知错误',
      });
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      processingRef.current = false;
    }
  }, [currentConversationId, organizationName, repositoryName, domainValidated]);

  // 停止生成
  const handleStopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    processingRef.current = false;
  }, []);

  // 重新生成消息
  const handleRegenerateMessage = useCallback(async (messageId: string) => {
    if (processingRef.current) {
      return;
    }

    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;

    // 获取上一条用户消息
    const previousMessage = messages[messageIndex - 1];
    if (previousMessage.role !== 'user') return;

    // 删除当前助手消息及之后的所有消息
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // 从数据库中也删除这些消息
    try {
      await chatDB.deleteMessageAndFollowing(currentConversationId, messages[messageIndex].timestamp);
    } catch (error) {
      console.error('删除消息失败:', error);
    }

    // 重新发送
    await handleSendMessage(previousMessage.content, previousMessage.imageContents);
  }, [messages, handleSendMessage, currentConversationId]);

  // 删除消息
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex === -1) return;

      // 如果是助手消息，则同时删除前面的用户消息和后面所有消息
      if (messages[messageIndex].role === 'assistant' && messageIndex > 0) {
        // 检查前一条是否为用户消息
        if (messages[messageIndex - 1].role === 'user') {
          // 删除用户消息和当前消息及之后的所有消息
          const newMessages = messages.slice(0, messageIndex - 1);
          setMessages(newMessages);
          
          // 从数据库中删除
          await chatDB.deleteMessage(messages[messageIndex - 1].id);
          await chatDB.deleteMessageAndFollowing(currentConversationId, messages[messageIndex].timestamp);
          return;
        }
      }
      
      // 如果是用户消息，检查后面是否紧跟着助手消息
      if (messages[messageIndex].role === 'user' && messageIndex + 1 < messages.length) {
        if (messages[messageIndex + 1].role === 'assistant') {
          // 删除用户消息和助手消息
          const newMessages = [...messages.slice(0, messageIndex), ...messages.slice(messageIndex + 2)];
          setMessages(newMessages);
          
          // 从数据库中删除
          await chatDB.deleteMessage(messageId);
          await chatDB.deleteMessage(messages[messageIndex + 1].id);
          return;
        }
      }
      
      // 默认情况：只删除当前消息
      const newMessages = [...messages.slice(0, messageIndex), ...messages.slice(messageIndex + 1)];
      setMessages(newMessages);
      
      // 从数据库中删除
      await chatDB.deleteMessage(messageId);
      
    } catch (error) {
      console.error('删除消息失败:', error);
      onError?.('删除消息失败');
    }
  }, [messages, currentConversationId]);

  // 切换展开状态
  const toggleExpanded = () => {
    if (!domainValidated) {
      notification.error({
        message: '域名验证失败',
        description: '当前域名未被授权使用此功能',
      });
      return;
    }
    
    setIsExpanded(!isExpanded);
    setIsMinimized(false);
  };

  // 最小化
  const minimize = () => {
    setIsMinimized(true);
  };

  // 最大化/还原
  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  // 关闭
  const close = () => {
    setIsExpanded(false);
    setIsMinimized(false);
    setIsMaximized(false);
  };

  // 如果域名验证失败，不渲染组件
  if (enableDomainValidation && !domainValidated) {
    return null;
  }

  return (
    <>
      {/* 悬浮球按钮 - 嵌入式模式下隐藏 */}
      {!embedded && !isExpanded && domainValidated && (
        <Button
          type="primary"
          className={styles.floatingButton}
          onClick={toggleExpanded}
          aria-label="打开聊天"
        >
          <MessageOutlined />
        </Button>
      )}
      
      {/* 聊天窗口 */}
      {(isExpanded || embedded) && domainValidated && (
        <div
          className={`${styles.chatContainer} ${isMinimized ? 'minimized' : ''} ${isMaximized ? 'maximized' : ''} ${embedded ? 'embedded' : ''}`}
        >
          {/* 聊天窗口头部 */}
          <div className={styles.chatHeader}>
            <div className={styles.headerTitle}>
              <div className="title-icon">
                <RobotOutlined />
              </div>
              <h3 className="title-text">{title}</h3>
            </div>
            
            {!embedded && (
              <div className={styles.headerActions}>
                {!isMinimized ? (
                  <>
                    <Tooltip title={isMaximized ? '恢复大小' : '最大化'}>
                      <Button
                        type="text"
                        icon={isMaximized ? <CompressOutlined /> : <ExpandOutlined />}
                        onClick={toggleMaximize}
                        aria-label={isMaximized ? '恢复大小' : '最大化'}
                      />
                    </Tooltip>
                    <Tooltip title="最小化">
                      <Button
                        type="text"
                        icon={<MinusOutlined />}
                        onClick={minimize}
                        aria-label="最小化"
                      />
                    </Tooltip>
                  </>
                ) : (
                  <Tooltip title="展开">
                    <Button
                      type="text"
                      icon={<ExpandOutlined />}
                      onClick={minimize}
                      aria-label="展开"
                    />
                  </Tooltip>
                )}
                <Tooltip title="关闭">
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={close}
                    aria-label="关闭"
                  />
                </Tooltip>
              </div>
            )}
          </div>
          
          {/* 聊天内容区域 - 最小化时隐藏 */}
          {!isMinimized && (
            <div className={styles.chatContent}>
              {/* 消息列表 */}
              <div className={styles.messagesContainer}>
                {messages.length > 0 ? (
                  <ChatMessages
                    messages={messages}
                    loading={loading}
                    onRegenerateMessage={handleRegenerateMessage}
                    onDeleteMessage={handleDeleteMessage}
                  />
                ) : (
                  <div className={styles.emptyState}>
                    <div className="empty-icon">
                      <RobotOutlined />
                    </div>
                    <h3 className="empty-title">欢迎使用 AI 助手</h3>
                    <p className="empty-description">
                      您可以向我询问任何问题，我会尽力为您提供帮助和解答。
                    </p>
                    <Button 
                      type="primary" 
                      className="empty-button"
                      onClick={() => {
                        handleSendMessage('你好，请介绍一下你自己！');
                      }}
                    >
                      开始对话
                    </Button>
                  </div>
                )}
              </div>
              
              {/* 输入框 */}
              <div className={styles.inputContainer}>
                <ChatInput
                  loading={loading}
                  onSend={handleSendMessage}
                  onStop={handleStopGeneration}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FloatingChat;
