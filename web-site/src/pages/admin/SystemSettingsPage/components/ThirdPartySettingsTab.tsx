import React from 'react'
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
  Alert,
  Tag,
  Divider,
  Tooltip,
  Select
} from 'antd'
import {
  GithubOutlined,
  GitlabOutlined,
  UserOutlined,
  LinkOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined,
  KeyOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { SystemSetting, ValidationErrors, SettingGroupType } from '@/types/systemSettings'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface ThirdPartySettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
  group: SettingGroupType
}

const ThirdPartySettingsTab: React.FC<ThirdPartySettingsTabProps> = ({
  settings,
  onUpdate,
  validationErrors,
  loading = false,
  group
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

  // 根据group获取配置
  const getGroupConfig = () => {
    switch (group) {
      case 'GitHub':
        return {
          title: t('settings.groups.github'),
          icon: <GithubOutlined />,
          color: '#24292e',
          keyPrefix: 'GitHub.',
          fields: [
            { key: 'ClientId', label: t('settings.github.clientId'), required: true, sensitive: false },
            { key: 'ClientSecret', label: t('settings.github.clientSecret'), required: true, sensitive: true },
            { key: 'Token', label: t('settings.github.token'), required: false, sensitive: true },
            { key: 'webhookSecret', label: t('settings.github.webhookSecret'), required: false, sensitive: true },
          ],
          oauthUrl: 'https://github.com/settings/developers',
          docsUrl: 'https://docs.github.com/en/developers/apps/building-oauth-apps/creating-an-oauth-app'
        }
      case 'Gitee':
        return {
          title: t('settings.groups.gitee'),
          icon: <GitlabOutlined />,
          color: '#c71d23',
          keyPrefix: 'Gitee.',
          fields: [
            { key: 'ClientId', label: t('settings.gitee.clientId'), required: true, sensitive: false },
            { key: 'ClientSecret', label: t('settings.gitee.clientSecret'), required: true, sensitive: true },
            { key: 'Token', label: t('settings.gitee.token'), required: false, sensitive: true },
            { key: 'webhookSecret', label: t('settings.gitee.webhookSecret'), required: false, sensitive: true },
          ],
          oauthUrl: 'https://gitee.com/oauth/applications',
          docsUrl: 'https://gitee.com/api/v5/oauth_doc'
        }
      default:
        return null
    }
  }

  const config = getGroupConfig()
  if (!config) return null

  // 同步间隔选项
  const syncIntervalOptions = [
    { value: 5, label: t('settings.thirdParty.every5Minutes') },
    { value: 15, label: t('settings.thirdParty.every15Minutes') },
    { value: 30, label: t('settings.thirdParty.every30Minutes') },
    { value: 60, label: t('settings.thirdParty.everyHour') },
    { value: 360, label: t('settings.thirdParty.every6Hours') },
    { value: 720, label: t('settings.thirdParty.every12Hours') },
    { value: 1440, label: t('settings.thirdParty.everyDay') }
  ]

  return (
    <div style={{ maxWidth: '800px' }}>
      <Title level={4} style={{ marginBottom: '8px', color: config.color }}>
        <Space>
          {config.icon}
          {config.title}
        </Space>
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        {t('settings.thirdPartyDescription', { platform: config.title })}
      </Text>

      <Alert
        message={t('settings.thirdParty.setupNote')}
        description={
          <div>
            <Paragraph>
              {t('settings.thirdParty.setupNoteDescription', { platform: config.title })}
            </Paragraph>
            <Space>
              <Button
                type="link"
                icon={<LinkOutlined />}
                href={config.oauthUrl}
                target="_blank"
              >
                {t('settings.thirdParty.createApp')}
              </Button>
              <Button
                type="link"
                icon={<InfoCircleOutlined />}
                href={config.docsUrl}
                target="_blank"
              >
                {t('settings.thirdParty.viewDocs')}
              </Button>
            </Space>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* OAuth 配置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <UserOutlined />
                  {t('settings.thirdParty.oauthConfiguration')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                {config.fields.map(field => (
                  <Col span={12} key={field.key}>
                    <Form.Item
                      label={
                        <Space>
                          {field.sensitive && <KeyOutlined />}
                          {field.label}
                          {field.required && <Text type="danger">*</Text>}
                        </Space>
                      }
                      validateStatus={validationErrors[config.keyPrefix + field.key] ? 'error' : ''}
                      help={validationErrors[config.keyPrefix + field.key]}
                      required={field.required}
                    >
                      {field.sensitive ? (
                        <Input.Password
                          value={getSettingValue(config.keyPrefix + field.key)}
                          onChange={(e) => onUpdate(config.keyPrefix + field.key, e.target.value)}
                          placeholder={t('settings.thirdParty.inputPlaceholder', { field: field.label })}
                          size="large"
                        />
                      ) : (
                        <Input
                          value={getSettingValue(config.keyPrefix + field.key)}
                          onChange={(e) => onUpdate(config.keyPrefix + field.key, e.target.value)}
                          placeholder={t('settings.thirdParty.inputPlaceholder', { field: field.label })}
                          size="large"
                        />
                      )}
                    </Form.Item>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>

          {/* OAuth 设置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <GlobalOutlined />
                  {t('settings.thirdParty.oauthSettings')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.thirdParty.enableOAuth')}
                    help={t('settings.thirdParty.enableOAuthHelp', { platform: config.title })}
                  >
                    <Switch
                      checked={getBooleanValue('enableOAuth')}
                      onChange={(checked) => onUpdate('enableOAuth', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.thirdParty.allowedOrganizations')}
                        <Tooltip title={t('settings.thirdParty.allowedOrganizationsHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    help={t('settings.thirdParty.allowedOrganizationsDescription')}
                  >
                    <Select
                      mode="tags"
                      value={getArrayValue('allowedOrganizations')}
                      onChange={(value) => updateArrayValue('allowedOrganizations', value)}
                      placeholder={t('settings.thirdParty.allowedOrganizationsPlaceholder')}
                      tokenSeparators={[',']}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 仓库同步设置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <SyncOutlined />
                  {t('settings.thirdParty.repositorySync')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <Form.Item
                    label={t('settings.thirdParty.enableAutoSync')}
                    help={t('settings.thirdParty.enableAutoSyncHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('enableAutoSync')}
                      onChange={(checked) => onUpdate('enableAutoSync', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                {getBooleanValue('enableAutoSync') && (
                  <Col span={16}>
                    <Form.Item
                      label={t('settings.thirdParty.syncInterval')}
                      validateStatus={validationErrors.syncInterval ? 'error' : ''}
                      help={validationErrors.syncInterval}
                    >
                      <Select
                        value={getNumberValue('syncInterval')}
                        onChange={(value) => onUpdate('syncInterval', value?.toString() || '')}
                        placeholder={t('settings.thirdParty.syncIntervalPlaceholder')}
                      >
                        {syncIntervalOptions.map(option => (
                          <Option key={option.value} value={option.value}>
                            {option.label}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                )}
                <Col span={24}>
                  <Form.Item
                    label={t('settings.thirdParty.defaultRepository')}
                    validateStatus={validationErrors.defaultRepository ? 'error' : ''}
                    help={validationErrors.defaultRepository || t('settings.thirdParty.defaultRepositoryHelp')}
                  >
                    <Input
                      value={getSettingValue('defaultRepository')}
                      onChange={(e) => onUpdate('defaultRepository', e.target.value)}
                      placeholder={t('settings.thirdParty.defaultRepositoryPlaceholder')}
                      addonBefore={group === 'GitHub' ? 'github.com/' : 'gitee.com/'}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 回调URL信息 */}
          <Col span={24}>
            <Alert
              message={t('settings.thirdParty.callbackUrls')}
              description={
                <div>
                  <Paragraph>
                    {t('settings.thirdParty.callbackUrlsDescription')}
                  </Paragraph>
                  <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '6px', fontFamily: 'monospace' }}>
                    <div><strong>OAuth Callback URL:</strong></div>
                    <div>https://yourdomain.com/api/auth/{group.toLowerCase()}/callback</div>
                    <div style={{ marginTop: '8px' }}><strong>Webhook URL:</strong></div>
                    <div>https://yourdomain.com/api/webhooks/{group.toLowerCase()}</div>
                  </div>
                </div>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>

          {/* 连接状态 */}
          <Col span={24}>
            <Card size="small" title={t('settings.thirdParty.connectionStatus')}>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color={getSettingValue(config.keyPrefix + 'ClientId') ? 'green' : 'red'}>
                      {getSettingValue(config.keyPrefix + 'ClientId') ? t('common.configured') : t('common.notConfigured')}
                    </Tag>
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      {t('settings.thirdParty.oauthStatus')}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color={getSettingValue(config.keyPrefix + 'Token') ? 'green' : 'orange'}>
                      {getSettingValue(config.keyPrefix + 'Token') ? t('common.configured') : t('common.optional')}
                    </Tag>
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      {t('settings.thirdParty.apiTokenStatus')}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Tag color={getBooleanValue('enableAutoSync') ? 'blue' : 'default'}>
                      {getBooleanValue('enableAutoSync') ? t('common.enabled') : t('common.disabled')}
                    </Tag>
                    <div style={{ marginTop: '4px', fontSize: '12px' }}>
                      {t('settings.thirdParty.autoSyncStatus')}
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 配置指南 */}
          <Col span={24}>
            <Card size="small" title={t('settings.thirdParty.configurationGuide')}>
              <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>{t('settings.thirdParty.step1', { platform: config.title })}</li>
                <li>{t('settings.thirdParty.step2')}</li>
                <li>{t('settings.thirdParty.step3')}</li>
                <li>{t('settings.thirdParty.step4')}</li>
                <li>{t('settings.thirdParty.step5')}</li>
              </ol>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default ThirdPartySettingsTab