import React, { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Button,
  Upload,
  Select,
  Switch,
  Space,
  Typography,
  Alert,
  message,
  Progress,
  Table,
  Tag,
  Divider,
  Modal
} from 'antd'
import {
  DownloadOutlined,
  UploadOutlined,
  ExportOutlined,
  ImportOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { systemSettingsService } from '@/services/admin.service'
import type {
  SystemSetting,
  SettingsExport,
  SettingGroupType
} from '@/types/systemSettings'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { Dragger } = Upload

interface SettingsImportExportProps {
  onClose: () => void
}

const SettingsImportExport: React.FC<SettingsImportExportProps> = ({
  onClose
}) => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export')
  const [exportLoading, setExportLoading] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [selectedGroups, setSelectedGroups] = useState<SettingGroupType[]>([])
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<SystemSetting[]>([])
  const [importProgress, setImportProgress] = useState(0)

  // 设置分组选项
  const settingGroups: { value: SettingGroupType; label: string }[] = [
    { value: 'Basic', label: t('settings.groups.basic') },
    { value: 'Email', label: t('settings.groups.email') },
    { value: 'OpenAI', label: t('settings.groups.ai') },
    { value: 'Storage', label: t('settings.groups.storage') },
    { value: 'Security', label: t('settings.groups.security') },
    { value: 'GitHub', label: t('settings.groups.github') },
    { value: 'Gitee', label: t('settings.groups.gitee') },
    { value: 'Document', label: t('settings.groups.document') },
    { value: 'JWT', label: t('settings.groups.jwt') },
    { value: 'Backup', label: t('settings.groups.backup') },
    { value: 'Logging', label: t('settings.groups.logging') }
  ]

  // 导出设置
  const handleExport = async () => {
    try {
      setExportLoading(true)

      const settings = await systemSettingsService.exportSettings()

      // 过滤选中的分组
      const filteredSettings = selectedGroups.length > 0
        ? settings.filter(setting => selectedGroups.includes(setting.group as SettingGroupType))
        : settings

      const exportData: SettingsExport = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        settings: filteredSettings,
        groups: selectedGroups.length > 0 ? selectedGroups : [...new Set(settings.map(s => s.group))]
      }

      // 创建下载链接
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `koala-wiki-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      message.success(t('settings.importExport.exportSuccess'))
    } catch (error) {
      console.error('Export failed:', error)
      message.error(t('settings.importExport.exportFailed'))
    } finally {
      setExportLoading(false)
    }
  }

  // 处理文件上传
  const handleFileUpload = (file: File) => {
    setImportFile(file)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as SettingsExport

        if (!data.settings || !Array.isArray(data.settings)) {
          throw new Error('Invalid file format')
        }

        setImportPreview(data.settings)
        message.success(t('settings.importExport.fileLoaded', { count: data.settings.length }))
      } catch (error) {
        console.error('File parsing failed:', error)
        message.error(t('settings.importExport.invalidFile'))
        setImportFile(null)
        setImportPreview([])
      }
    }
    reader.readAsText(file)

    return false // 阻止自动上传
  }

  // 导入设置
  const handleImport = async () => {
    if (!importFile) {
      message.warning(t('settings.importExport.selectFileFirst'))
      return
    }

    try {
      setImportLoading(true)
      setImportProgress(0)

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await systemSettingsService.importSettings(
        importFile,
        overwriteExisting,
        selectedGroups
      )

      clearInterval(progressInterval)
      setImportProgress(100)

      message.success(t('settings.importExport.importSuccess'))

      // 延迟关闭弹窗，让用户看到成功状态
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Import failed:', error)
      message.error(t('settings.importExport.importFailed'))
      setImportProgress(0)
    } finally {
      setImportLoading(false)
    }
  }

  // 预览表格列定义
  const previewColumns = [
    {
      title: t('settings.importExport.key'),
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (text: string) => <Text code>{text}</Text>
    },
    {
      title: t('settings.importExport.group'),
      dataIndex: 'group',
      key: 'group',
      width: 120,
      render: (text: string) => (
        <Tag color="blue">{settingGroups.find(g => g.value === text)?.label || text}</Tag>
      )
    },
    {
      title: t('settings.importExport.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: t('settings.importExport.sensitive'),
      dataIndex: 'isSensitive',
      key: 'isSensitive',
      width: 80,
      render: (sensitive: boolean) => (
        sensitive ? (
          <Tag color="red" icon={<ExclamationCircleOutlined />}>
            {t('common.yes')}
          </Tag>
        ) : (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            {t('common.no')}
          </Tag>
        )
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <Space size="large">
          <Button
            type={activeTab === 'export' ? 'primary' : 'default'}
            icon={<ExportOutlined />}
            onClick={() => setActiveTab('export')}
          >
            {t('settings.importExport.export')}
          </Button>
          <Button
            type={activeTab === 'import' ? 'primary' : 'default'}
            icon={<ImportOutlined />}
            onClick={() => setActiveTab('import')}
          >
            {t('settings.importExport.import')}
          </Button>
        </Space>
      </div>

      {activeTab === 'export' && (
        <div>
          <Alert
            message={t('settings.importExport.exportNote')}
            description={t('settings.importExport.exportNoteDescription')}
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Card size="small" title={t('settings.importExport.exportSettings')}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>{t('settings.importExport.selectGroups')}</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                    {t('settings.importExport.selectGroupsDescription')}
                  </Text>
                </div>
                <Select
                  mode="multiple"
                  value={selectedGroups}
                  onChange={setSelectedGroups}
                  placeholder={t('settings.importExport.selectGroupsPlaceholder')}
                  style={{ width: '100%' }}
                  allowClear
                >
                  {settingGroups.map(group => (
                    <Option key={group.value} value={group.value}>
                      {group.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={24}>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  loading={exportLoading}
                  onClick={handleExport}
                  size="large"
                  block
                >
                  {t('settings.importExport.downloadSettings')}
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      )}

      {activeTab === 'import' && (
        <div>
          <Alert
            message={t('settings.importExport.importNote')}
            description={t('settings.importExport.importNoteDescription')}
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card size="small" title={t('settings.importExport.uploadFile')}>
                <Dragger
                  accept=".json"
                  beforeUpload={handleFileUpload}
                  showUploadList={false}
                  disabled={importLoading}
                >
                  <p className="ant-upload-drag-icon">
                    <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">
                    {importFile ? importFile.name : t('settings.importExport.dragFileHere')}
                  </p>
                  <p className="ant-upload-hint">
                    {t('settings.importExport.supportedFormats')}
                  </p>
                </Dragger>
              </Card>
            </Col>

            {importPreview.length > 0 && (
              <>
                <Col span={24}>
                  <Card size="small" title={t('settings.importExport.importOptions')}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <div style={{ marginBottom: '16px' }}>
                          <Text strong>{t('settings.importExport.selectImportGroups')}</Text>
                          <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                            {t('settings.importExport.selectImportGroupsDescription')}
                          </Text>
                        </div>
                        <Select
                          mode="multiple"
                          value={selectedGroups}
                          onChange={setSelectedGroups}
                          placeholder={t('settings.importExport.selectGroupsPlaceholder')}
                          style={{ width: '100%' }}
                          allowClear
                        >
                          {[...new Set(importPreview.map(s => s.group))].map(group => (
                            <Option key={group} value={group}>
                              {settingGroups.find(g => g.value === group)?.label || group}
                            </Option>
                          ))}
                        </Select>
                      </Col>
                      <Col span={12}>
                        <div style={{ marginBottom: '16px' }}>
                          <Text strong>{t('settings.importExport.overwriteExisting')}</Text>
                          <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                            {t('settings.importExport.overwriteExistingDescription')}
                          </Text>
                        </div>
                        <Switch
                          checked={overwriteExisting}
                          onChange={setOverwriteExisting}
                          checkedChildren={t('common.yes')}
                          unCheckedChildren={t('common.no')}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>

                <Col span={24}>
                  <Card size="small" title={t('settings.importExport.previewSettings', { count: importPreview.length })}>
                    <Table
                      columns={previewColumns}
                      dataSource={importPreview}
                      rowKey="key"
                      size="small"
                      scroll={{ y: 300 }}
                      pagination={{
                        pageSize: 10,
                        showSizeChanger: false,
                        showQuickJumper: true
                      }}
                    />
                  </Card>
                </Col>

                {importLoading && (
                  <Col span={24}>
                    <Card size="small">
                      <div style={{ textAlign: 'center' }}>
                        <Progress
                          type="circle"
                          percent={importProgress}
                          status={importProgress === 100 ? 'success' : 'active'}
                        />
                        <div style={{ marginTop: '16px' }}>
                          <Text strong>
                            {importProgress === 100
                              ? t('settings.importExport.importComplete')
                              : t('settings.importExport.importInProgress')
                            }
                          </Text>
                        </div>
                      </div>
                    </Card>
                  </Col>
                )}

                <Col span={24}>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    loading={importLoading}
                    onClick={handleImport}
                    size="large"
                    block
                    disabled={importProgress === 100}
                  >
                    {t('settings.importExport.importSettings')}
                  </Button>
                </Col>
              </>
            )}
          </Row>
        </div>
      )}

      <Divider />

      <Row>
        <Col span={24}>
          <Alert
            message={t('settings.importExport.securityWarning')}
            description={
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>{t('settings.importExport.securityTip1')}</li>
                <li>{t('settings.importExport.securityTip2')}</li>
                <li>{t('settings.importExport.securityTip3')}</li>
                <li>{t('settings.importExport.securityTip4')}</li>
              </ul>
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
          />
        </Col>
      </Row>
    </div>
  )
}

export default SettingsImportExport