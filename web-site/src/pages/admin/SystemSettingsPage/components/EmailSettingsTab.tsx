import React, { useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Card,
  Typography,
  message,
  Modal,
  Alert
} from 'antd'
import {
  MailOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { systemSettingsService } from '@/services/admin.service'
import type { SystemSetting, ValidationErrors, EmailTestParams } from '@/types/systemSettings'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface EmailSettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
}

const EmailSettingsTab: React.FC<EmailSettingsTabProps> = ({
  settings,
  onUpdate,
  validationErrors,
  loading = false
}) => {
  const { t } = useTranslation()
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [testSubject, setTestSubject] = useState('')
  const [testBody, setTestBody] = useState('')

  // 获取设置值的辅助函数
  const getSettingValue = (key: string) => {
    const setting = settings.find(s => s.key === key)
    return setting?.value || setting?.defaultValue || ''
  }

  // 获取布尔值设置
  const getBooleanValue = (key: string) => {
    const value = getSettingValue(key)
    return value === 'true' || value === true
  }

  // 获取数字值设置
  const getNumberValue = (key: string) => {
    const value = getSettingValue(key)
    return value ? parseInt(value, 10) : undefined
  }

  // 测试邮件配置
  const testEmailSettings = async () => {
    if (!testEmail) {
      message.warning(t('settings.email.testEmailRequired'))
      return
    }

    try {
      setTesting(true)

      const params: EmailTestParams = {
        to: testEmail,
        subject: testSubject || t('settings.email.defaultTestSubject'),
        body: testBody || t('settings.email.defaultTestBody')
      }

      const result = await systemSettingsService.testEmailSettings(params)

      if (result.success) {
        message.success(t('settings.email.testSuccess'))
        setTestModalVisible(false)
      } else {
        message.error(result.message || t('settings.email.testFailed'))
      }
    } catch (error) {
      console.error('Email test failed:', error)
      message.error(t('settings.email.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ marginBottom: '8px' }}>
            {t('settings.groups.email')}
          </Title>
          <Text type="secondary">
            {t('settings.emailDescription')}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => setTestModalVisible(true)}
          disabled={loading}
        >
          {t('settings.email.testConnection')}
        </Button>
      </div>

      <Alert
        message={t('settings.email.securityNote')}
        description={t('settings.email.securityNoteDescription')}
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* SMTP服务器 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.email.smtpHost')}
              validateStatus={validationErrors.smtpHost ? 'error' : ''}
              help={validationErrors.smtpHost}
              required
            >
              <Input
                value={getSettingValue('smtpHost')}
                onChange={(e) => onUpdate('smtpHost', e.target.value)}
                placeholder={t('settings.email.smtpHostPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* SMTP端口 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.email.smtpPort')}
              validateStatus={validationErrors.smtpPort ? 'error' : ''}
              help={validationErrors.smtpPort}
              required
            >
              <InputNumber
                style={{ width: '100%' }}
                value={getNumberValue('smtpPort')}
                onChange={(value) => onUpdate('smtpPort', value?.toString() || '')}
                placeholder={t('settings.email.smtpPortPlaceholder')}
                min={1}
                max={65535}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* SMTP用户名 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.email.smtpUser')}
              validateStatus={validationErrors.smtpUser ? 'error' : ''}
              help={validationErrors.smtpUser}
              required
            >
              <Input
                value={getSettingValue('smtpUser')}
                onChange={(e) => onUpdate('smtpUser', e.target.value)}
                placeholder={t('settings.email.smtpUserPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* SMTP密码 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.email.smtpPassword')}
              validateStatus={validationErrors.smtpPassword ? 'error' : ''}
              help={validationErrors.smtpPassword}
              required
            >
              <Input.Password
                value={getSettingValue('smtpPassword')}
                onChange={(e) => onUpdate('smtpPassword', e.target.value)}
                placeholder={t('settings.email.smtpPasswordPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* SSL/TLS设置 */}
          <Col span={24}>
            <Card size="small" title={t('settings.email.securitySettings')}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.email.enableSsl')}
                    help={t('settings.email.enableSslHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('smtpEnableSsl')}
                      onChange={(checked) => onUpdate('smtpEnableSsl', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.email.enableTls')}
                    help={t('settings.email.enableTlsHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('smtpEnableTls')}
                      onChange={(checked) => onUpdate('smtpEnableTls', checked.toString())}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 发件人信息 */}
          <Col span={24}>
            <Card size="small" title={t('settings.email.senderInfo')}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.email.senderName')}
                    validateStatus={validationErrors.senderName ? 'error' : ''}
                    help={validationErrors.senderName}
                  >
                    <Input
                      value={getSettingValue('senderName')}
                      onChange={(e) => onUpdate('senderName', e.target.value)}
                      placeholder={t('settings.email.senderNamePlaceholder')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.email.senderEmail')}
                    validateStatus={validationErrors.senderEmail ? 'error' : ''}
                    help={validationErrors.senderEmail}
                  >
                    <Input
                      type="email"
                      value={getSettingValue('senderEmail')}
                      onChange={(e) => onUpdate('senderEmail', e.target.value)}
                      placeholder={t('settings.email.senderEmailPlaceholder')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.email.replyToEmail')}
                    validateStatus={validationErrors.replyToEmail ? 'error' : ''}
                    help={validationErrors.replyToEmail}
                  >
                    <Input
                      type="email"
                      value={getSettingValue('replyToEmail')}
                      onChange={(e) => onUpdate('replyToEmail', e.target.value)}
                      placeholder={t('settings.email.replyToEmailPlaceholder')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.email.maxEmailsPerHour')}
                    validateStatus={validationErrors.maxEmailsPerHour ? 'error' : ''}
                    help={validationErrors.maxEmailsPerHour || t('settings.email.maxEmailsPerHourHelp')}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('maxEmailsPerHour')}
                      onChange={(value) => onUpdate('maxEmailsPerHour', value?.toString() || '')}
                      placeholder="100"
                      min={1}
                      max={10000}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 邮件模板 */}
          <Col span={24}>
            <Form.Item
              label={t('settings.email.emailTemplate')}
              validateStatus={validationErrors.emailTemplate ? 'error' : ''}
              help={validationErrors.emailTemplate || t('settings.email.emailTemplateHelp')}
            >
              <TextArea
                rows={8}
                value={getSettingValue('emailTemplate')}
                onChange={(e) => onUpdate('emailTemplate', e.target.value)}
                placeholder={t('settings.email.emailTemplatePlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* 测试邮件弹窗 */}
      <Modal
        title={
          <Space>
            <MailOutlined />
            {t('settings.email.testEmailSettings')}
          </Space>
        }
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTestModalVisible(false)}>
            {t('common.cancel')}
          </Button>,
          <Button
            key="test"
            type="primary"
            icon={<SendOutlined />}
            loading={testing}
            onClick={testEmailSettings}
          >
            {t('settings.email.sendTestEmail')}
          </Button>
        ]}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item
            label={t('settings.email.testEmailAddress')}
            required
          >
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder={t('settings.email.testEmailPlaceholder')}
              size="large"
            />
          </Form.Item>

          <Form.Item label={t('settings.email.testSubject')}>
            <Input
              value={testSubject}
              onChange={(e) => setTestSubject(e.target.value)}
              placeholder={t('settings.email.defaultTestSubject')}
            />
          </Form.Item>

          <Form.Item label={t('settings.email.testBody')}>
            <TextArea
              rows={4}
              value={testBody}
              onChange={(e) => setTestBody(e.target.value)}
              placeholder={t('settings.email.defaultTestBody')}
            />
          </Form.Item>
        </Form>

        <Alert
          message={t('settings.email.testNote')}
          description={t('settings.email.testNoteDescription')}
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Modal>
    </div>
  )
}

export default EmailSettingsTab