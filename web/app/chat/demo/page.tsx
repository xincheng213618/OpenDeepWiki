'use client';

import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Switch, Select, Space, Divider, Typography, Row, Col, Alert, Tag } from 'antd';
import { createStyles } from 'antd-style';
import FloatingChat from '../index';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const useStyles = createStyles(({ css, token }) => ({
  demoPage: css`
    min-height: 100vh;
    background: ${token.colorBgLayout};
    padding: ${token.paddingLG}px;
  `,
  
  container: css`
    max-width: 1400px;
    margin: 0 auto;
  `,
  
  section: css`
    margin-bottom: ${token.marginXL}px;
  `,
  
  configPanel: css`
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingLG}px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  `,
  
  previewArea: css`
    background: ${token.colorBgContainer};
    border-radius: ${token.borderRadiusLG}px;
    min-height: 600px;
    position: relative;
    overflow: hidden;
    border: 2px dashed ${token.colorBorder};
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.active {
      border-color: ${token.colorPrimary};
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
    }
  `,
  
  previewPlaceholder: css`
    text-align: center;
    color: ${token.colorTextSecondary};
  `,
  
  codeBlock: css`
    background: ${token.colorBgElevated};
    border: 1px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
    padding: ${token.paddingMD}px;
    font-family: ${token.fontFamilyCode};
    font-size: ${token.fontSizeSM}px;
    margin: ${token.marginMD}px 0;
    overflow-x: auto;
    
    pre {
      margin: 0;
      white-space: pre-wrap;
    }
  `,
  
  featureCard: css`
    text-align: center;
    height: 100%;
    
    .feature-icon {
      font-size: 32px;
      color: ${token.colorPrimary};
      margin-bottom: ${token.marginMD}px;
    }
    
    .feature-title {
      font-size: ${token.fontSizeLG}px;
      font-weight: 600;
      margin-bottom: ${token.marginSM}px;
    }
    
    .feature-description {
      color: ${token.colorTextSecondary};
      line-height: 1.6;
    }
  `
}));

const ChatDemo: React.FC = () => {
  const { styles } = useStyles();
  
  // 配置状态
  const [config, setConfig] = useState({
    organizationName: 'demo',
    repositoryName: 'test',
    title: 'AI 助手演示',
    theme: 'light' as 'light' | 'dark',
    enableDomainValidation: false,
    allowedDomains: '',
  });
  
  const [showDemo, setShowDemo] = useState(false);
  const [form] = Form.useForm();

  // 处理配置变更
  const handleConfigChange = (values: any) => {
    setConfig({
      ...config,
      ...values
    });
  };

  // 生成集成代码
  const generateCode = () => {
    const allowedDomains = config.allowedDomains
      ? config.allowedDomains.split(',').map(d => d.trim()).filter(Boolean)
      : [];
    
    return `<!-- 引入 KoalaWiki AI 聊天组件 -->
<script src="https://your-domain.com/koala-chat-widget.js"></script>

<!-- 初始化配置 -->
<script>
KoalaChatWidget.init({
  appId: 'your-app-id',
  organizationName: '${config.organizationName}',
  repositoryName: '${config.repositoryName}',
  title: '${config.title}',
  theme: '${config.theme}',
  enableDomainValidation: ${config.enableDomainValidation},
  allowedDomains: ${JSON.stringify(allowedDomains)},
  onError: (error) => {
    console.error('Chat widget error:', error);
  },
  onValidationFailed: (domain) => {
    console.error('Domain validation failed:', domain);
  }
});
</script>`;
  };

  // 功能特性数据
  const features = [
    {
      icon: '🤖',
      title: 'AI 智能对话',
      description: '基于先进的大语言模型，提供智能、准确的问答体验'
    },
    {
      icon: '💭',
      title: '思考过程展示',
      description: '实时显示 AI 的思考过程，让对话更加透明和可信'
    },
    {
      icon: '🔧',
      title: '工具调用',
      description: '支持工具调用功能，可以执行复杂的任务和查询'
    },
    {
      icon: '📱',
      title: '响应式设计',
      description: '完美适配桌面和移动端，提供一致的用户体验'
    },
    {
      icon: '🎨',
      title: '主题切换',
      description: '支持亮色和暗色主题，适应不同的使用场景'
    },
    {
      icon: '🔒',
      title: '域名验证',
      description: '支持域名白名单验证，确保服务的安全使用'
    }
  ];

  return (
    <div className={styles.demoPage}>
      <div className={styles.container}>
        {/* 标题区域 */}
        <div className={styles.section}>
          <Title level={1} style={{ textAlign: 'center', marginBottom: '8px' }}>
            KoalaWiki AI 聊天悬浮球
          </Title>
          <Paragraph style={{ textAlign: 'center', fontSize: '18px', color: '#666' }}>
            一个功能完整的 AI 聊天悬浮球组件，轻松集成到任何网站
          </Paragraph>
        </div>

        {/* 功能特性 */}
        <div className={styles.section}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
            ✨ 核心特性
          </Title>
          <Row gutter={[24, 24]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} md={8} key={index}>
                <Card className={styles.featureCard}>
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-description">{feature.description}</div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        <Divider />

        {/* 演示区域 */}
        <div className={styles.section}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            🎮 在线演示
          </Title>
          
          <Row gutter={[24, 24]}>
            {/* 配置面板 */}
            <Col xs={24} lg={8}>
              <div className={styles.configPanel}>
                <Title level={4} style={{ marginBottom: '16px' }}>配置选项</Title>
                
                <Form
                  form={form}
                  layout="vertical"
                  initialValues={config}
                  onValuesChange={handleConfigChange}
                >
                  <Form.Item
                    name="organizationName"
                    label="组织名称"
                  >
                    <Input placeholder="组织或用户名" />
                  </Form.Item>
                  
                  <Form.Item
                    name="repositoryName"
                    label="仓库名称"
                  >
                    <Input placeholder="仓库名称" />
                  </Form.Item>
                  
                  <Form.Item
                    name="title"
                    label="标题"
                  >
                    <Input placeholder="聊天窗口标题" />
                  </Form.Item>
                  
                  <Form.Item
                    name="theme"
                    label="主题"
                  >
                    <Select>
                      <Select.Option value="light">亮色主题</Select.Option>
                      <Select.Option value="dark">暗色主题</Select.Option>
                    </Select>
                  </Form.Item>
                  
                  <Form.Item
                    name="enableDomainValidation"
                    label="启用域名验证"
                    valuePropName="checked"
                  >
                    <Switch />
                  </Form.Item>
                  
                  {config.enableDomainValidation && (
                    <Form.Item
                      name="allowedDomains"
                      label="允许的域名"
                    >
                      <TextArea 
                        rows={3} 
                        placeholder="请输入允许的域名，用逗号分隔"
                      />
                    </Form.Item>
                  )}
                </Form>
                
                <Divider />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    onClick={() => setShowDemo(!showDemo)}
                  >
                    {showDemo ? '关闭演示' : '开启演示'}
                  </Button>
                  
                  <Alert
                    type="info"
                    showIcon
                    message="演示说明"
                    description="点击开启演示查看悬浮球效果。在实际使用中，悬浮球会出现在页面右下角。"
                    style={{ fontSize: '12px' }}
                  />
                </Space>
              </div>
            </Col>
            
            {/* 预览区域 */}
            <Col xs={24} lg={16}>
              <div className={`${styles.previewArea} ${showDemo ? 'active' : ''}`}>
                {!showDemo ? (
                  <div className={styles.previewPlaceholder}>
                    <Title level={4} type="secondary">预览区域</Title>
                    <Text type="secondary">点击左侧的"开启演示"按钮查看悬浮球效果</Text>
                  </div>
                ) : (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <div style={{ 
                      position: 'absolute', 
                      top: '50%', 
                      left: '50%', 
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center'
                    }}>
                      <Title level={4}>演示页面</Title>
                      <Text type="secondary">悬浮球已在右下角显示</Text>
                      <br />
                      <Tag color="green" style={{ marginTop: '8px' }}>演示模式</Tag>
                    </div>
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 集成代码 */}
        <div className={styles.section}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            📝 集成代码
          </Title>
          
          <Card>
            <Title level={4} style={{ marginBottom: '16px' }}>HTML 集成</Title>
            <Paragraph>
              将以下代码添加到您的网站页面中：
            </Paragraph>
            
            <div className={styles.codeBlock}>
              <pre>{generateCode()}</pre>
            </div>
            
            <Button
              onClick={() => navigator.clipboard.writeText(generateCode())}
              style={{ marginTop: '8px' }}
            >
              复制代码
            </Button>
          </Card>
        </div>

        {/* 演示组件 */}
        {showDemo && (
          <FloatingChat
            appId="demo-app"
            organizationName={config.organizationName}
            repositoryName={config.repositoryName}
            title={config.title}
            theme={config.theme}
            enableDomainValidation={config.enableDomainValidation}
            allowedDomains={config.allowedDomains.split(',').map(d => d.trim()).filter(Boolean)}
            onError={(error) => {
              console.error('Demo chat error:', error);
            }}
            onValidationFailed={(domain) => {
              console.error('Demo validation failed:', domain);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ChatDemo; 