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
  Tooltip,
  Divider
} from 'antd'
import {
  FileTextOutlined,
  FilterOutlined,
  CodeOutlined,
  CompressOutlined,
  SettingOutlined,
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

interface DocumentSettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
}

const DocumentSettingsTab: React.FC<DocumentSettingsTabProps> = ({
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

  // 目录格式选项
  const catalogueFormatOptions = [
    { value: 'compact', label: t('settings.document.formatCompact') },
    { value: 'detailed', label: t('settings.document.formatDetailed') },
    { value: 'tree', label: t('settings.document.formatTree') },
    { value: 'flat', label: t('settings.document.formatFlat') }
  ]

  // 支持的编程语言
  const supportedLanguages = [
    'javascript', 'typescript', 'python', 'java', 'csharp', 'cpp', 'c',
    'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'r',
    'matlab', 'shell', 'bash', 'powershell', 'sql', 'html', 'css',
    'json', 'xml', 'yaml', 'markdown', 'dockerfile', 'terraform'
  ]

  // 文件扩展名输入组件
  const FileExtensionList = ({ value = [], onChange, placeholder }: {
    value?: string[]
    onChange?: (value: string[]) => void
    placeholder?: string
  }) => {
    const [inputValue, setInputValue] = React.useState('')

    const addExtension = () => {
      if (inputValue && !value.includes(inputValue)) {
        onChange?.([...value, inputValue])
        setInputValue('')
      }
    }

    const removeExtension = (ext: string) => {
      onChange?.(value.filter(item => item !== ext))
    }

    return (
      <div>
        <Space.Compact style={{ display: 'flex', marginBottom: '8px' }}>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            onPressEnter={addExtension}
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={addExtension}
            disabled={!inputValue}
          >
            {t('common.add')}
          </Button>
        </Space.Compact>
        {value.length > 0 && (
          <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', padding: '8px', maxHeight: '120px', overflowY: 'auto' }}>
            {value.map((ext, index) => (
              <Tag
                key={index}
                closable
                onClose={() => removeExtension(ext)}
                style={{ marginBottom: '4px' }}
              >
                {ext}
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
        {t('settings.groups.document')}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        {t('settings.documentDescription')}
      </Text>

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* 基本文档设置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <FileTextOutlined />
                  {t('settings.document.basicSettings')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableIncrementalUpdate')}
                    help={t('settings.document.enableIncrementalUpdateHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableIncrementalUpdate')}
                      onChange={(checked) => onUpdate('EnableIncrementalUpdate', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.catalogueFormat')}
                    validateStatus={validationErrors.CatalogueFormat ? 'error' : ''}
                    help={validationErrors.CatalogueFormat}
                  >
                    <Select
                      value={getSettingValue('CatalogueFormat')}
                      onChange={(value) => onUpdate('CatalogueFormat', value)}
                      placeholder={t('settings.document.catalogueFormatPlaceholder')}
                    >
                      {catalogueFormatOptions.map(option => (
                        <Option key={option.value} value={option.value}>
                          {option.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.maxFileReadCount')}
                    validateStatus={validationErrors.MaxFileReadCount ? 'error' : ''}
                    help={validationErrors.MaxFileReadCount || t('settings.document.maxFileReadCountHelp')}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      value={getNumberValue('MaxFileReadCount')}
                      onChange={(value) => onUpdate('MaxFileReadCount', value?.toString() || '')}
                      placeholder="15"
                      min={1}
                      max={1000}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.defaultLanguage')}
                    help={t('settings.document.defaultLanguageHelp')}
                  >
                    <Select
                      value={getSettingValue('defaultLanguage')}
                      onChange={(value) => onUpdate('defaultLanguage', value)}
                      placeholder={t('settings.document.defaultLanguagePlaceholder')}
                      showSearch
                    >
                      {supportedLanguages.map(lang => (
                        <Option key={lang} value={lang}>
                          {lang}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 文件过滤设置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <FilterOutlined />
                  {t('settings.document.fileFiltering')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={8}>
                  <Form.Item
                    label={t('settings.document.enableSmartFilter')}
                    help={t('settings.document.enableSmartFilterHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableSmartFilter')}
                      onChange={(checked) => onUpdate('EnableSmartFilter', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={16}>
                  <Alert
                    message={t('settings.document.smartFilterNote')}
                    type="info"
                    showIcon
                    style={{ marginTop: '8px' }}
                  />
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.document.excludedFiles')}
                        <Tooltip title={t('settings.document.excludedFilesHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    help={t('settings.document.excludedFilesDescription')}
                  >
                    <FileExtensionList
                      value={getArrayValue('ExcludedFiles')}
                      onChange={(value) => updateArrayValue('ExcludedFiles', value)}
                      placeholder={t('settings.document.excludedFilesPlaceholder')}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={
                      <Space>
                        {t('settings.document.excludedFolders')}
                        <Tooltip title={t('settings.document.excludedFoldersHelp')}>
                          <QuestionCircleOutlined />
                        </Tooltip>
                      </Space>
                    }
                    help={t('settings.document.excludedFoldersDescription')}
                  >
                    <FileExtensionList
                      value={getArrayValue('ExcludedFolders')}
                      onChange={(value) => updateArrayValue('ExcludedFolders', value)}
                      placeholder={t('settings.document.excludedFoldersPlaceholder')}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 代码分析设置 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <CodeOutlined />
                  {t('settings.document.codeAnalysis')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableCodeDependencyAnalysis')}
                    help={t('settings.document.enableCodeDependencyAnalysisHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableCodeDependencyAnalysis')}
                      onChange={(checked) => onUpdate('EnableCodeDependencyAnalysis', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableCodeCompression')}
                    help={t('settings.document.enableCodeCompressionHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableCodeCompression')}
                      onChange={(checked) => onUpdate('EnableCodeCompression', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label={t('settings.document.supportedLanguages')}
                    help={t('settings.document.supportedLanguagesHelp')}
                  >
                    <Select
                      mode="multiple"
                      value={getArrayValue('supportedLanguages')}
                      onChange={(value) => updateArrayValue('supportedLanguages', value)}
                      placeholder={t('settings.document.supportedLanguagesPlaceholder')}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {supportedLanguages.map(lang => (
                        <Option key={lang} value={lang}>
                          {lang}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 仓库处理任务 */}
          <Col span={24}>
            <Card
              size="small"
              title={
                <Space>
                  <SettingOutlined />
                  {t('settings.document.warehouseTasks')}
                </Space>
              }
            >
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableWarehouseFunctionPromptTask')}
                    help={t('settings.document.enableWarehouseFunctionPromptTaskHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableWarehouseFunctionPromptTask')}
                      onChange={(checked) => onUpdate('EnableWarehouseFunctionPromptTask', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableWarehouseDescriptionTask')}
                    help={t('settings.document.enableWarehouseDescriptionTaskHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableWarehouseDescriptionTask')}
                      onChange={(checked) => onUpdate('EnableWarehouseDescriptionTask', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableFileCommit')}
                    help={t('settings.document.enableFileCommitHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableFileCommit')}
                      onChange={(checked) => onUpdate('EnableFileCommit', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label={t('settings.document.enableWarehouseCommit')}
                    help={t('settings.document.enableWarehouseCommitHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('EnableWarehouseCommit')}
                      onChange={(checked) => onUpdate('EnableWarehouseCommit', checked.toString())}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    label={t('settings.document.refineAndEnhanceQuality')}
                    help={t('settings.document.refineAndEnhanceQualityHelp')}
                  >
                    <Switch
                      checked={getBooleanValue('RefineAndEnhanceQuality')}
                      onChange={(checked) => onUpdate('RefineAndEnhanceQuality', checked.toString())}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 文档处理统计 */}
          <Col span={24}>
            <Alert
              message={t('settings.document.processingStats')}
              description={
                <div>
                  <Paragraph>
                    {t('settings.document.processingStatsDescription')}
                  </Paragraph>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <Tag color="blue">{t('settings.document.totalRepositories')}: 45</Tag>
                    <Tag color="green">{t('settings.document.processedFiles')}: 12,350</Tag>
                    <Tag color="orange">{t('settings.document.avgProcessingTime')}: 2.5s</Tag>
                    <Tag color="purple">{t('settings.document.successRate')}: 98.7%</Tag>
                  </div>
                </div>
              }
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
            />
          </Col>

          {/* 文档处理优化建议 */}
          <Col span={24}>
            <Card size="small" title={t('settings.document.optimizationTips')}>
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>{t('settings.document.tip1')}</li>
                <li>{t('settings.document.tip2')}</li>
                <li>{t('settings.document.tip3')}</li>
                <li>{t('settings.document.tip4')}</li>
                <li>{t('settings.document.tip5')}</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default DocumentSettingsTab