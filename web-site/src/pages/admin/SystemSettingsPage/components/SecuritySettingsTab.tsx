import React from 'react'
import {
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Button,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Alert,
  Tag,
  Divider,
  Tooltip,
  List
} from 'antd'
import {
  SecurityScanOutlined,
  LockOutlined,
  UserOutlined,
  GlobalOutlined,
  ShieldOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { SystemSetting, ValidationErrors } from '@/types/systemSettings'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

interface SecuritySettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
}

const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({
  settings,
  onUpdate,
  validationErrors,
  loading = false
}) => {
  const { t } = useTranslation()

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

  // 获取数组设置
  const getArrayValue = (key: string) => {
    const value = getSettingValue(key)
    try {
      return value ? JSON.parse(value) : []
    } catch {
      return []
    }
  }

  // 更新数组设置
  const updateArrayValue = (key: string, value: string[]) => {
    onUpdate(key, JSON.stringify(value))
  }

  // 验证码提供商选项
  const captchaProviders = [
    { value: 'recaptcha', label: 'Google reCAPTCHA' },
    { value: 'hcaptcha', label: 'hCaptcha' },
    { value: 'turnstile', label: 'Cloudflare Turnstile' },
    { value: 'custom', label: t('settings.security.customCaptcha') }
  ]

  // IP地址输入组件
  const IPAddressList = ({ value = [], onChange, placeholder }: {
    value?: string[]
    onChange?: (value: string[]) => void
    placeholder?: string
  }) => {
    const [inputValue, setInputValue] = React.useState('')

    const addIP = () => {
      if (inputValue && !value.includes(inputValue)) {
        onChange?.([...value, inputValue])
        setInputValue('')
      }
    }

    const removeIP = (ip: string) => {
      onChange?.(value.filter(item => item !== ip))
    }

    return (
      <div>
        <Space.Compact style={{ display: 'flex', marginBottom: '8px' }}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            onPressEnter={addIP}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addIP}
            disabled={!inputValue}
          >
            {t('common.add')}
          </Button>
        </Space.Compact>
        {value.length > 0 && (
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px', maxHeight: '120px', overflowY: 'auto' }}>
            {value.map((ip, index) => (
              <Tag
                key={index}
                closable
                onClose={() => removeIP(ip)}
                style={{ marginBottom: '4px' }}
              >
                {ip}
              </Tag>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <Title level={4} style={{ marginBottom: '8px' }}>
        {t('settings.groups.security')}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        {t('settings.securityDescription')}
      </Text>

      <Alert
        message={t('settings.security.securityNote')}
        description={t('settings.security.securityNoteDescription')}
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* 密码策略 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <LockOutlined />
                  {t('settings.security.passwordPolicy')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.security.passwordMinLength')}
                    validateStatus={validationErrors.passwordMinLength ? 'error' : ''}
                    help={validationErrors.passwordMinLength}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('passwordMinLength')}
                      onChange={(value) => onUpdate('passwordMinLength', value?.toString() || '')}
                      placeholder="8"
                      min={6}
                      max={128}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <Form.Item label={t('settings.security.requireNumbers')}>
                      <Switch
                        checked={getBooleanValue('passwordRequireNumbers')}
                        onChange={(checked) => onUpdate('passwordRequireNumbers', checked.toString())}
                      />
                    </Form.Item>
                    <Form.Item label={t('settings.security.requireSymbols')}>
                      <Switch
                        checked={getBooleanValue('passwordRequireSymbols')}
                        onChange={(checked) => onUpdate('passwordRequireSymbols', checked.toString())}
                      />
                    </Form.Item>
                    <Form.Item label={t('settings.security.requireUppercase')}>
                      <Switch
                        checked={getBooleanValue('passwordRequireUppercase')}
                        onChange={(checked) => onUpdate('passwordRequireUppercase', checked.toString())}
                      />
                    </Form.Item>
                    <Form.Item label={t('settings.security.requireLowercase')}>
                      <Switch
                        checked={getBooleanValue('passwordRequireLowercase')}
                        onChange={(checked) => onUpdate('passwordRequireLowercase', checked.toString())}
                      />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 会话管理 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <UserOutlined />
                  {t('settings.security.sessionManagement')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.security.sessionTimeout')}
                        <Tooltip title={t('settings.security.sessionTimeoutHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.sessionTimeoutMinutes ? 'error' : ''}
                    help={validationErrors.sessionTimeoutMinutes}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('sessionTimeoutMinutes')}
                      onChange={(value) => onUpdate('sessionTimeoutMinutes', value?.toString() || '')}
                      placeholder="1440"
                      min={5}
                      max={43200}
                      addonAfter={t('common.minutes')}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={t('settings.security.maxLoginAttempts')}
                    validateStatus={validationErrors.maxLoginAttempts ? 'error' : ''}
                    help={validationErrors.maxLoginAttempts}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('maxLoginAttempts')}
                      onChange={(value) => onUpdate('maxLoginAttempts', value?.toString() || '')}
                      placeholder="5"
                      min={1}
                      max={20}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    label={t('settings.security.lockoutDuration')}
                    validateStatus={validationErrors.lockoutDurationMinutes ? 'error' : ''}
                    help={validationErrors.lockoutDurationMinutes}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('lockoutDurationMinutes')}
                      onChange={(value) => onUpdate('lockoutDurationMinutes', value?.toString() || '')}
                      placeholder="30"
                      min={1}
                      max={1440}
                      addonAfter={t('common.minutes')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 双因素认证 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <ShieldOutlined />
                  {t('settings.security.twoFactorAuth')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Form.Item
                    label={t('settings.security.enableTwoFactorAuth')}
                    help={t('settings.security.twoFactorAuthHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('enableTwoFactorAuth')}
                      onChange={(checked) => onUpdate('enableTwoFactorAuth', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                {getBooleanValue('enableTwoFactorAuth') && (
                  <Col span={24}>
                    <Alert
                      message={t('settings.security.twoFactorAuthEnabled')}
                      description={t('settings.security.twoFactorAuthEnabledDescription')}
                      type="info"
                      showIcon
                    />
                  </Col>
                )}
              </Row>
            </Card>
          </Col>

          {/* IP访问控制 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <GlobalOutlined />
                  {t('settings.security.ipAccessControl')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.security.allowedIpAddresses')}
                        <Tooltip title={t('settings.security.allowedIpHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    help={t('settings.security.allowedIpDescription')}
                  >
                    <IPAddressList
                      value={getArrayValue('allowedIpAddresses')}
                      onChange={(value) => updateArrayValue('allowedIpAddresses', value)}
                      placeholder={t('settings.security.ipAddressPlaceholder')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.security.blockedIpAddresses')}
                        <Tooltip title={t('settings.security.blockedIpHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    help={t('settings.security.blockedIpDescription')}
                  >
                    <IPAddressList
                      value={getArrayValue('blockedIpAddresses')}
                      onChange={(value) => updateArrayValue('blockedIpAddresses', value)}
                      placeholder={t('settings.security.ipAddressPlaceholder')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 验证码设置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <SecurityScanOutlined />
                  {t('settings.security.captchaSettings')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <Form.Item label={t('settings.security.enableCaptcha')}>
                    <Switch
                      checked={getBooleanValue('enableCaptcha')}
                      onChange={(checked) => onUpdate('enableCaptcha', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                {getBooleanValue('enableCaptcha') && (
                  <>
                    <Col span={16}>
                      <Form.Item
                        label={t('settings.security.captchaProvider')}
                        validateStatus={validationErrors.captchaProvider ? 'error' : ''}
                        help={validationErrors.captchaProvider}
                      >
                        <Select
                          value={getSettingValue('captchaProvider')}
                          onChange={(value) => onUpdate('captchaProvider', value)}
                          placeholder={t('settings.security.captchaProviderPlaceholder')}
                        >
                          {captchaProviders.map(provider => (
                            <Option key={provider.value} value={provider.value}>
                              {provider.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        label={
                          <Space>
                            {t('settings.security.captchaConfig')}
                            <Tooltip title={t('settings.security.captchaConfigHelp')}>
                              <QuestionCircleOutlined />
                            </Tooltip>
                          </Space>
                        }
                        validateStatus={validationErrors.captchaConfig ? 'error' : ''}
                        help={validationErrors.captchaConfig}
                      >
                        <TextArea
                          rows={4}
                          value={getSettingValue('captchaConfig')}
                          onChange={(e) => onUpdate('captchaConfig', e.target.value)}
                          placeholder={t('settings.security.captchaConfigPlaceholder')}
                        />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </Col>

          {/* 安全建议 */}
          <Col span={24}>
            <Alert
              message={t('settings.security.securityTips')}
              description={
                <List
                  size="small"
                  dataSource={[
                    t('settings.security.tip1'),
                    t('settings.security.tip2'),
                    t('settings.security.tip3'),
                    t('settings.security.tip4'),
                    t('settings.security.tip5')
                  ]}
                  renderItem={(item) => (
                    <List.Item style={{ border: 'none', padding: '4px 0' }}>
                      <Text>{item}</Text>
                    </List.Item>
                  )}
                />
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default SecuritySettingsTab