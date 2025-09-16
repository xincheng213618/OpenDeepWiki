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
  Tooltip
} from 'antd'
import {
  FolderOutlined,
  CloudOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { SystemSetting, ValidationErrors } from '@/types/systemSettings'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input

interface StorageSettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
}

const StorageSettingsTab: React.FC<StorageSettingsTabProps> = ({
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

  // 文件类型选项
  const fileTypeOptions = [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg',
    'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
    'txt', 'md', 'json', 'xml', 'csv',
    'zip', 'rar', '7z', 'tar', 'gz',
    'mp3', 'mp4', 'avi', 'mov', 'wmv'
  ]

  // 存储提供商选项
  const storageProviders = [
    { value: 'local', label: t('settings.storage.local') },
    { value: 'aws-s3', label: 'AWS S3' },
    { value: 'azure-blob', label: 'Azure Blob Storage' },
    { value: 'google-cloud', label: 'Google Cloud Storage' },
    { value: 'aliyun-oss', label: t('settings.storage.aliyunOSS') },
    { value: 'tencent-cos', label: t('settings.storage.tencentCOS') },
    { value: 'custom', label: t('settings.storage.custom') }
  ]

  // 存储层级选项
  const storageTierOptions = [
    { value: 'standard', label: t('settings.storage.standard') },
    { value: 'cold', label: t('settings.storage.cold') },
    { value: 'archive', label: t('settings.storage.archive') }
  ]

  return (
    <div style={{ maxWidth: '800px' }}>
      <Title level={4} style={{ marginBottom: '8px' }}>
        {t('settings.groups.storage')}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        {t('settings.storageDescription')}
      </Text>

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* 本地存储配置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <FolderOutlined />
                  {t('settings.storage.localStorage')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.storage.fileStoragePath')}
                    validateStatus={validationErrors.fileStoragePath ? 'error' : ''}
                    help={validationErrors.fileStoragePath || t('settings.storage.fileStoragePathHelp')}
                    required
                  >
                    <Input
                      value={getSettingValue('fileStoragePath')}
                      onChange={(e) => onUpdate('fileStoragePath', e.target.value)}
                      placeholder={t('settings.storage.fileStoragePathPlaceholder')}
                      addonBefore={<FolderOutlined />}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.storage.backupStoragePath')}
                    validateStatus={validationErrors.backupStoragePath ? 'error' : ''}
                    help={validationErrors.backupStoragePath}
                  >
                    <Input
                      value={getSettingValue('backupStoragePath')}
                      onChange={(e) => onUpdate('backupStoragePath', e.target.value)}
                      placeholder={t('settings.storage.backupStoragePathPlaceholder')}
                      addonBefore={<SafetyOutlined />}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 文件上传限制 */}
          <Col span={24}>
            <Card size="small" title={t('settings.storage.uploadLimits')}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.storage.maxFileSize')}
                        <Tooltip title={t('settings.storage.maxFileSizeHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.maxFileSize ? 'error' : ''}
                    help={validationErrors.maxFileSize}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('maxFileSize')}
                      onChange={(value) => onUpdate('maxFileSize', value?.toString() || '')}
                      placeholder="10"
                      min={1}
                      max={1024}
                      addonAfter="MB"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.storage.allowedFileTypes')}
                    help={t('settings.storage.allowedFileTypesHelp')}
                  >
                    <Select
                      mode="multiple"
                      value={getArrayValue('allowedFileTypes')}
                      onChange={(value) => updateArrayValue('allowedFileTypes', value)}
                      placeholder={t('settings.storage.allowedFileTypesPlaceholder')}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {fileTypeOptions.map(type => (
                        <Option key={type} value={type}>
                          {type}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 文件压缩设置 */}
          <Col span={24}>
            <Card size="small" title={t('settings.storage.compression')}>
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <Form.Item label={t('settings.storage.enableCompression')}>
                    <Switch
                      checked={getBooleanValue('enableCompression')}
                      onChange={(checked) => onUpdate('enableCompression', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                {getBooleanValue('enableCompression') && (
                  <Col span={16}>
                    <Form.Item
                      label={
                        <Space>
                          {t('settings.storage.compressionQuality')}
                          <Tooltip title={t('settings.storage.compressionQualityHelp')}>
                            <QuestionCircleOutlined />
                          </Tooltip>
                        </Space>
                      }
                      validateStatus={validationErrors.compressionQuality ? 'error' : ''}
                      help={validationErrors.compressionQuality}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        value={getNumberValue('compressionQuality')}
                        onChange={(value) => onUpdate('compressionQuality', value?.toString() || '')}
                        placeholder="85"
                        min={1}
                        max={100}
                        addonAfter="%"
                      />
                    </Form.Item>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>

          {/* 存储层级设置 */}
          <Col span={24}>
            <Card size="small" title={t('settings.storage.storageTiers')}>
              <Row gutter={[24, 16]}>
                <Col span={24}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.storage.defaultStorageTier')}
                        <Tooltip title={t('settings.storage.storageTiersHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    validateStatus={validationErrors.storageTiers ? 'error' : ''}
                    help={validationErrors.storageTiers}
                  >
                    <Select
                      value={getSettingValue('storageTiers')}
                      onChange={(value) => onUpdate('storageTiers', value)}
                      placeholder={t('settings.storage.storageTiersPlaceholder')}
                    >
                      {storageTierOptions.map(tier => (
                        <Option key={tier.value} value={tier.value}>
                          {tier.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 云存储配置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <CloudOutlined />
                  {t('settings.storage.cloudStorage')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <Form.Item label={t('settings.storage.enableCloudStorage')}>
                    <Switch
                      checked={getBooleanValue('enableCloudStorage')}
                      onChange={(checked) => onUpdate('enableCloudStorage', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                {getBooleanValue('enableCloudStorage') && (
                  <>
                    <Col span={16}>
                      <Form.Item
                        label={t('settings.storage.cloudStorageProvider')}
                        validateStatus={validationErrors.cloudStorageProvider ? 'error' : ''}
                        help={validationErrors.cloudStorageProvider}
                      >
                        <Select
                          value={getSettingValue('cloudStorageProvider')}
                          onChange={(value) => onUpdate('cloudStorageProvider', value)}
                          placeholder={t('settings.storage.cloudStorageProviderPlaceholder')}
                        >
                          {storageProviders.map(provider => (
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
                            {t('settings.storage.cloudStorageConfig')}
                            <Tooltip title={t('settings.storage.cloudStorageConfigHelp')}>
                              <QuestionCircleOutlined />
                            </Tooltip>
                          </Space>
                        }
                        validateStatus={validationErrors.cloudStorageConfig ? 'error' : ''}
                        help={validationErrors.cloudStorageConfig}
                      >
                        <TextArea
                          rows={6}
                          value={getSettingValue('cloudStorageConfig')}
                          onChange={(e) => onUpdate('cloudStorageConfig', e.target.value)}
                          placeholder={t('settings.storage.cloudStorageConfigPlaceholder')}
                        />
                      </Form.Item>
                    </Col>
                  </>
                )}
              </Row>
            </Card>
          </Col>

          {/* 存储使用情况显示 */}
          <Col span={24}>
            <Alert
              message={t('settings.storage.storageUsage')}
              description={
                <div>
                  <Paragraph>
                    {t('settings.storage.storageUsageDescription')}
                  </Paragraph>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Tag color="blue">{t('settings.storage.totalSpace')}: 100 GB</Tag>
                    <Tag color="green">{t('settings.storage.usedSpace')}: 25 GB</Tag>
                    <Tag color="orange">{t('settings.storage.freeSpace')}: 75 GB</Tag>
                  </div>
                </div>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>

          {/* 存储优化建议 */}
          <Col span={24}>
            <Card size="small" title={t('settings.storage.optimizationTips')}>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>{t('settings.storage.tip1')}</li>
                <li>{t('settings.storage.tip2')}</li>
                <li>{t('settings.storage.tip3')}</li>
                <li>{t('settings.storage.tip4')}</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default StorageSettingsTab