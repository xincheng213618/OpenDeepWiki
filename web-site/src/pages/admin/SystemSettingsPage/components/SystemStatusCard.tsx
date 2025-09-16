import React from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Typography,
  Space,
  Tooltip,
  Badge,
  Divider
} from 'antd'
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  SafetyOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { SystemStatus } from '@/types/systemSettings'

const { Text, Title } = Typography

interface SystemStatusCardProps {
  status: SystemStatus
  restartRequired: string[]
  style?: React.CSSProperties
}

const SystemStatusCard: React.FC<SystemStatusCardProps> = ({
  status,
  restartRequired,
  style
}) => {
  const { t } = useTranslation()

  // 获取状态颜色和图标
  const getStatusIndicator = (configured: boolean, hasIssue?: boolean) => {
    if (hasIssue) {
      return { color: 'error', icon: <CloseCircleOutlined />, text: t('common.error') }
    }
    if (configured) {
      return { color: 'success', icon: <CheckCircleOutlined />, text: t('common.configured') }
    }
    return { color: 'warning', icon: <ExclamationCircleOutlined />, text: t('common.notConfigured') }
  }

  // 格式化运行时间
  const formatUptime = (uptime: string) => {
    // 假设uptime是类似 "2d 5h 30m" 的格式
    return uptime || t('common.unknown')
  }

  // 格式化最后重启时间
  const formatLastRestart = (lastRestart: string) => {
    if (!lastRestart) return t('common.unknown')
    return new Date(lastRestart).toLocaleString()
  }

  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          {t('settings.systemStatus.title')}
          {restartRequired.length > 0 && (
            <Badge
              count={restartRequired.length}
              size="small"
              title={t('settings.systemStatus.restartRequiredCount', { count: restartRequired.length })}
            />
          )}
        </Space>
      }
      style={style}
    >
      <Row gutter={[24, 16]}>
        {/* 系统信息 */}
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title={t('settings.systemStatus.version')}
              value={status.systemInfo.version}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title={t('settings.systemStatus.environment')}
              value={status.systemInfo.environment}
              prefix={<CloudServerOutlined />}
              valueStyle={{
                color: status.systemInfo.environment === 'Production' ? '#cf1322' : '#1890ff'
              }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Tooltip title={formatLastRestart(status.systemInfo.lastRestart)}>
              <Statistic
                title={t('settings.systemStatus.uptime')}
                value={formatUptime(status.systemInfo.uptime)}
                prefix={<ClockCircleOutlined />}
              />
            </Tooltip>
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Statistic
              title={t('settings.systemStatus.activeConnections')}
              value={status.performance.activeConnections}
              prefix={<CloudServerOutlined />}
            />
          </Card>
        </Col>

        {/* 性能指标 */}
        <Col span={24}>
          <Divider orientation="left">{t('settings.systemStatus.performance')}</Divider>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text strong>{t('settings.systemStatus.cpuUsage')}</Text>
              <Progress
                type="circle"
                percent={status.performance.cpuUsage}
                size={80}
                status={status.performance.cpuUsage > 80 ? 'exception' : 'normal'}
                style={{ marginTop: '8px' }}
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text strong>{t('settings.systemStatus.memoryUsage')}</Text>
              <Progress
                type="circle"
                percent={status.performance.memoryUsage}
                size={80}
                status={status.performance.memoryUsage > 90 ? 'exception' : 'normal'}
                style={{ marginTop: '8px' }}
              />
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <div style={{ textAlign: 'center' }}>
              <Text strong>{t('settings.systemStatus.diskUsage')}</Text>
              <Progress
                type="circle"
                percent={status.performance.diskUsage}
                size={80}
                status={status.performance.diskUsage > 85 ? 'exception' : 'normal'}
                style={{ marginTop: '8px' }}
              />
            </div>
          </Card>
        </Col>

        {/* 功能模块状态 */}
        <Col span={24}>
          <Divider orientation="left">{t('settings.systemStatus.features')}</Divider>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              {React.createElement(
                getStatusIndicator(status.features.emailConfigured).icon,
                { style: { fontSize: '24px', color: getStatusIndicator(status.features.emailConfigured).color === 'success' ? '#52c41a' : getStatusIndicator(status.features.emailConfigured).color === 'error' ? '#ff4d4f' : '#faad14' } }
              )}
            </div>
            <Text strong>{t('settings.systemStatus.emailService')}</Text>
            <div>
              <Tag color={getStatusIndicator(status.features.emailConfigured).color}>
                {getStatusIndicator(status.features.emailConfigured).text}
              </Tag>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              {React.createElement(
                getStatusIndicator(status.features.aiConfigured).icon,
                { style: { fontSize: '24px', color: getStatusIndicator(status.features.aiConfigured).color === 'success' ? '#52c41a' : getStatusIndicator(status.features.aiConfigured).color === 'error' ? '#ff4d4f' : '#faad14' } }
              )}
            </div>
            <Text strong>{t('settings.systemStatus.aiService')}</Text>
            <div>
              <Tag color={getStatusIndicator(status.features.aiConfigured).color}>
                {getStatusIndicator(status.features.aiConfigured).text}
              </Tag>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              {React.createElement(
                getStatusIndicator(status.features.backupConfigured).icon,
                { style: { fontSize: '24px', color: getStatusIndicator(status.features.backupConfigured).color === 'success' ? '#52c41a' : getStatusIndicator(status.features.backupConfigured).color === 'error' ? '#ff4d4f' : '#faad14' } }
              )}
            </div>
            <Text strong>{t('settings.systemStatus.backupService')}</Text>
            <div>
              <Tag color={getStatusIndicator(status.features.backupConfigured).color}>
                {getStatusIndicator(status.features.backupConfigured).text}
              </Tag>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '8px' }}>
              {React.createElement(
                getStatusIndicator(status.features.securityConfigured).icon,
                { style: { fontSize: '24px', color: getStatusIndicator(status.features.securityConfigured).color === 'success' ? '#52c41a' : getStatusIndicator(status.features.securityConfigured).color === 'error' ? '#ff4d4f' : '#faad14' } }
              )}
            </div>
            <Text strong>{t('settings.systemStatus.securityService')}</Text>
            <div>
              <Tag color={getStatusIndicator(status.features.securityConfigured).color}>
                {getStatusIndicator(status.features.securityConfigured).text}
              </Tag>
            </div>
          </div>
        </Col>

        {/* 重启提醒 */}
        {restartRequired.length > 0 && (
          <Col span={24}>
            <Card
              size="small"
              style={{
                border: '1px solid #faad14',
                backgroundColor: '#fffbf0'
              }}
            >
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <Text strong>{t('settings.systemStatus.restartRequired')}</Text>
                <Text type="secondary">
                  {t('settings.systemStatus.restartRequiredDescription', { count: restartRequired.length })}
                </Text>
              </Space>
              <div style={{ marginTop: '8px' }}>
                {restartRequired.slice(0, 5).map(key => (
                  <Tag key={key} color="warning" style={{ marginBottom: '4px' }}>
                    {key}
                  </Tag>
                ))}
                {restartRequired.length > 5 && (
                  <Tag color="default">
                    +{restartRequired.length - 5} {t('common.more')}
                  </Tag>
                )}
              </div>
            </Card>
          </Col>
        )}

        {/* 系统健康度评分 */}
        <Col span={24}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              {t('settings.systemStatus.healthScore')}
            </Title>
            <div style={{ marginTop: '16px' }}>
              <Progress
                type="dashboard"
                percent={calculateHealthScore(status, restartRequired)}
                gapDegree={30}
                size={120}
                strokeColor={{
                  '0%': '#ff4d4f',
                  '30%': '#faad14',
                  '70%': '#52c41a',
                  '100%': '#52c41a'
                }}
              />
            </div>
            <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
              {getHealthDescription(calculateHealthScore(status, restartRequired))}
            </Text>
          </Card>
        </Col>
      </Row>
    </Card>
  )

  // 计算系统健康度评分
  function calculateHealthScore(status: SystemStatus, restartRequired: string[]): number {
    let score = 100

    // 性能指标扣分
    if (status.performance.cpuUsage > 80) score -= 20
    else if (status.performance.cpuUsage > 60) score -= 10

    if (status.performance.memoryUsage > 90) score -= 20
    else if (status.performance.memoryUsage > 70) score -= 10

    if (status.performance.diskUsage > 85) score -= 15
    else if (status.performance.diskUsage > 70) score -= 5

    // 功能模块配置扣分
    if (!status.features.emailConfigured) score -= 10
    if (!status.features.aiConfigured) score -= 15
    if (!status.features.backupConfigured) score -= 10
    if (!status.features.securityConfigured) score -= 15

    // 重启需求扣分
    if (restartRequired.length > 0) score -= Math.min(restartRequired.length * 5, 20)

    return Math.max(0, score)
  }

  // 获取健康度描述
  function getHealthDescription(score: number): string {
    if (score >= 90) return t('settings.systemStatus.healthExcellent')
    if (score >= 70) return t('settings.systemStatus.healthGood')
    if (score >= 50) return t('settings.systemStatus.healthFair')
    return t('settings.systemStatus.healthPoor')
  }
}

export default SystemStatusCard