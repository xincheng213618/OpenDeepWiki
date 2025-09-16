import React, { useState } from 'react'
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
  message,
  Modal,
  Alert,
  Slider,
  Tooltip
} from 'antd'
import {
  RobotOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { systemSettingsService } from '@/services/admin.service'
import type { SystemSetting, ValidationErrors, APITestParams } from '@/types/systemSettings'

const { Title, Text, Paragraph } = Typography
const { Option } = Select

interface AISettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
}

const AISettingsTab: React.FC<AISettingsTabProps> = ({
  settings,
  onUpdate,
  validationErrors,
  loading = false
}) => {
  const { t } = useTranslation()
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [testing, setTesting] = useState(false)

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
    return value ? parseFloat(value) : undefined
  }

  // 获取整数值设置
  const getIntValue = (key: string) => {
    const value = getSettingValue(key)
    return value ? parseInt(value, 10) : undefined
  }

  // 测试AI API连接
  const testAIConnection = async () => {
    const endpoint = getSettingValue('Endpoint')
    const apiKey = getSettingValue('ChatApiKey')
    const model = getSettingValue('ChatModel')

    if (!endpoint || !apiKey) {
      message.warning(t('settings.ai.testRequiredFields'))
      return
    }

    try {
      setTesting(true)

      const params: APITestParams = {
        endpoint,
        apiKey,
        model
      }

      const result = await systemSettingsService.testAISettings(params)

      if (result.success) {
        message.success(t('settings.ai.testSuccess'))
        setTestModalVisible(false)
      } else {
        message.error(result.message || t('settings.ai.testFailed'))
      }
    } catch (error) {
      console.error('AI API test failed:', error)
      message.error(t('settings.ai.testFailed'))
    } finally {
      setTesting(false)
    }
  }

  // 模型提供商选项
  const modelProviders = [
    { value: 'OpenAI', label: 'OpenAI' },
    { value: 'Azure', label: 'Azure OpenAI' },
    { value: 'Anthropic', label: 'Anthropic' },
    { value: 'Google', label: 'Google AI' },
    { value: 'Custom', label: t('settings.ai.customProvider') }
  ]

  // 常用模型选项
  const commonModels = {
    OpenAI: [
      'gpt-4',
      'gpt-4-turbo',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k'
    ],
    Anthropic: [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ],
    Google: [
      'gemini-pro',
      'gemini-pro-vision'
    ]
  }

  const currentProvider = getSettingValue('ModelProvider')
  const providerModels = commonModels[currentProvider as keyof typeof commonModels] || []

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Title level={4} style={{ marginBottom: '8px' }}>
            {t('settings.groups.ai')}
          </Title>
          <Text type="secondary">
            {t('settings.aiDescription')}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ApiOutlined />}
          onClick={() => setTestModalVisible(true)}
          disabled={loading}
        >
          {t('settings.ai.testConnection')}
        </Button>
      </div>

      <Alert
        message={t('settings.ai.apiKeyNote')}
        description={t('settings.ai.apiKeyNoteDescription')}
        type="warning"
        showIcon
        icon={<ExclamationCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* 模型提供商 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.ai.modelProvider')}
              validateStatus={validationErrors.ModelProvider ? 'error' : ''}
              help={validationErrors.ModelProvider}
              required
            >
              <Select
                value={getSettingValue('ModelProvider')}
                onChange={(value) => onUpdate('ModelProvider', value)}
                placeholder={t('settings.ai.modelProviderPlaceholder')}
                size="large"
              >
                {modelProviders.map(provider => (
                  <Option key={provider.value} value={provider.value}>
                    {provider.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* API端点 */}
          <Col span={12}>
            <Form.Item
              label={
                <Space>
                  {t('settings.ai.endpoint')}
                  <Tooltip title={t('settings.ai.endpointHelp')}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
              validateStatus={validationErrors.Endpoint ? 'error' : ''}
              help={validationErrors.Endpoint}
              required
            >
              <Input
                value={getSettingValue('Endpoint')}
                onChange={(e) => onUpdate('Endpoint', e.target.value)}
                placeholder={t('settings.ai.endpointPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* API密钥 */}
          <Col span={24}>
            <Form.Item
              label={t('settings.ai.apiKey')}
              validateStatus={validationErrors.ChatApiKey ? 'error' : ''}
              help={validationErrors.ChatApiKey}
              required
            >
              <Input.Password
                value={getSettingValue('ChatApiKey')}
                onChange={(e) => onUpdate('ChatApiKey', e.target.value)}
                placeholder={t('settings.ai.apiKeyPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* 模型配置 */}
          <Col span={24}>
            <Card size="small" title={t('settings.ai.modelConfiguration')}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.ai.chatModel')}
                    validateStatus={validationErrors.ChatModel ? 'error' : ''}
                    help={validationErrors.ChatModel}
                  >
                    <Select
                      value={getSettingValue('ChatModel')}
                      onChange={(value) => onUpdate('ChatModel', value)}
                      placeholder={t('settings.ai.chatModelPlaceholder')}
                      showSearch
                      allowClear
                      mode="combobox"
                    >
                      {providerModels.map(model => (
                        <Option key={model} value={model}>
                          {model}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.ai.analysisModel')}
                    validateStatus={validationErrors.AnalysisModel ? 'error' : ''}
                    help={validationErrors.AnalysisModel}
                  >
                    <Select
                      value={getSettingValue('AnalysisModel')}
                      onChange={(value) => onUpdate('AnalysisModel', value)}
                      placeholder={t('settings.ai.analysisModelPlaceholder')}
                      showSearch
                      allowClear
                      mode="combobox"
                    >
                      {providerModels.map(model => (
                        <Option key={model} value={model}>
                          {model}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.ai.deepResearchModel')}
                    validateStatus={validationErrors.DeepResearchModel ? 'error' : ''}
                    help={validationErrors.DeepResearchModel}
                  >
                    <Select
                      value={getSettingValue('DeepResearchModel')}
                      onChange={(value) => onUpdate('DeepResearchModel', value)}
                      placeholder={t('settings.ai.deepResearchModelPlaceholder')}
                      showSearch
                      allowClear
                      mode="combobox"
                    >
                      {providerModels.map(model => (
                        <Option key={model} value={model}>
                          {model}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.ai.maxFileLimit')}
                    validateStatus={validationErrors.MaxFileLimit ? 'error' : ''}
                    help={validationErrors.MaxFileLimit}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getIntValue('MaxFileLimit')}
                      onChange={(value) => onUpdate('MaxFileLimit', value?.toString() || '')}
                      placeholder="10"
                      min={1}
                      max={100}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 模型参数配置 */}
          <Col span={24}>
            <Card size="small" title={t('settings.ai.modelParameters')}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.ai.temperature')}
                        <Tooltip title={t('settings.ai.temperatureHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.Temperature ? 'error' : ''}
                    help={validationErrors.Temperature}
                  >
                    <Slider
                      value={getNumberValue('Temperature') || 0.7}
                      onChange={(value) => onUpdate('Temperature', value.toString())}
                      min={0}
                      max={2}
                      step={0.1}
                      marks={{
                        0: '0',
                        0.7: '0.7',
                        1: '1',
                        2: '2'
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.ai.topP')}
                        <Tooltip title={t('settings.ai.topPHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.TopP ? 'error' : ''}
                    help={validationErrors.TopP}
                  >
                    <Slider
                      value={getNumberValue('TopP') || 1.0}
                      onChange={(value) => onUpdate('TopP', value.toString())}
                      min={0}
                      max={1}
                      step={0.1}
                      marks={{
                        0: '0',
                        0.5: '0.5',
                        1: '1'
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.ai.maxTokens')}
                    validateStatus={validationErrors.MaxTokens ? 'error' : ''}
                    help={validationErrors.MaxTokens}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getIntValue('MaxTokens')}
                      onChange={(value) => onUpdate('MaxTokens', value?.toString() || '')}
                      placeholder="4000"
                      min={100}
                      max={100000}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.ai.frequencyPenalty')}
                        <Tooltip title={t('settings.ai.frequencyPenaltyHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.FrequencyPenalty ? 'error' : ''}
                    help={validationErrors.FrequencyPenalty}
                  >
                    <Slider
                      value={getNumberValue('FrequencyPenalty') || 0.0}
                      onChange={(value) => onUpdate('FrequencyPenalty', value.toString())}
                      min={-2}
                      max={2}
                      step={0.1}
                      marks={{
                        '-2': '-2',
                        0: '0',
                        2: '2'
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.ai.presencePenalty')}
                        <Tooltip title={t('settings.ai.presencePenaltyHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.PresencePenalty ? 'error' : ''}
                    help={validationErrors.PresencePenalty}
                  >
                    <Slider
                      value={getNumberValue('PresencePenalty') || 0.0}
                      onChange={(value) => onUpdate('PresencePenalty', value.toString())}
                      min={-2}
                      max={2}
                      step={0.1}
                      marks={{
                        '-2': '-2',
                        0: '0',
                        2: '2'
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* Mem0配置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  {t('settings.ai.mem0Configuration')}
                  <Tooltip title={t('settings.ai.mem0Help')}>
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Form.Item label={t('settings.ai.enableMem0')}>
                    <Switch
                      checked={getBooleanValue('EnableMem0')}
                      onChange={(checked) => onUpdate('EnableMem0', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                {getBooleanValue('EnableMem0') && (
                  <>
                    <Col span={12}>
                      <Form.Item
                        label={t('settings.ai.mem0ApiKey')}
                        validateStatus={validationErrors.Mem0ApiKey ? 'error' : ''}
                        help={validationErrors.Mem0ApiKey}
                      >
                        <Input.Password
                          value={getSettingValue('Mem0ApiKey')}
                          onChange={(e) => onUpdate('Mem0ApiKey', e.target.value)}
                          placeholder={t('settings.ai.mem0ApiKeyPlaceholder')}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label={t('settings.ai.mem0Endpoint')}
                        validateStatus={validationErrors.Mem0Endpoint ? 'error' : ''}
                        help={validationErrors.Mem0Endpoint}
                      >
                        <Input
                          value={getSettingValue('Mem0Endpoint')}
                          onChange={(e) => onUpdate('Mem0Endpoint', e.target.value)}
                          placeholder={t('settings.ai.mem0EndpointPlaceholder')}
                        />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>

      {/* 测试API连接弹窗 */}
      <Modal
        title={
          <Space>
            <RobotOutlined />
            {t('settings.ai.testAPIConnection')}
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
            icon={<ApiOutlined />}
            loading={testing}
            onClick={testAIConnection}
          >
            {t('settings.ai.testConnection')}
          </Button>
        ]}
        width={600}
      >
        <div>
          <Paragraph>
            {t('settings.ai.testDescription')}
          </Paragraph>

          <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
            <Text strong>{t('settings.ai.currentConfiguration')}:</Text>
            <div style={{ marginTop: '8px' }}>
              <Text type="secondary">{t('settings.ai.endpoint')}: </Text>
              <Text code>{getSettingValue('Endpoint') || t('common.notSet')}</Text>
            </div>
            <div>
              <Text type="secondary">{t('settings.ai.model')}: </Text>
              <Text code>{getSettingValue('ChatModel') || t('common.notSet')}</Text>
            </div>
            <div>
              <Text type="secondary">{t('settings.ai.apiKey')}: </Text>
              <Text code>{getSettingValue('ChatApiKey') ? '***' + getSettingValue('ChatApiKey').slice(-4) : t('common.notSet')}</Text>
            </div>
          </div>

          <Alert
            message={t('settings.ai.testNote')}
            description={t('settings.ai.testNoteDescription')}
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  )
}

export default AISettingsTab