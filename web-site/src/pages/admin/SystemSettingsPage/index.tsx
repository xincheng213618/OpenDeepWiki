import React, { useState, useEffect, useCallback } from 'react'
import {
  Card,
  Tabs,
  message,
  Button,
  Space,
  Modal,
  Spin,
  Alert,
  Badge,
  Typography,
  Tooltip,
  Divider
} from 'antd'
import {
  SettingOutlined,
  SaveOutlined,
  ReloadOutlined,
  ExportOutlined,
  ImportOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { systemSettingsService } from '@/services/admin.service'
import type {
  SystemSettingGroup,
  SystemSetting,
  SettingGroupType,
  ValidationErrors,
  SystemStatus
} from '@/types/systemSettings'

// 导入各个设置组件
import BasicSettingsTab from './components/BasicSettingsTab'
import EmailSettingsTab from './components/EmailSettingsTab'
import AISettingsTab from './components/AISettingsTab'
import StorageSettingsTab from './components/StorageSettingsTab'
import SecuritySettingsTab from './components/SecuritySettingsTab'
import ThirdPartySettingsTab from './components/ThirdPartySettingsTab'
import DocumentSettingsTab from './components/DocumentSettingsTab'
import SystemStatusCard from './components/SystemStatusCard'
import SettingsImportExport from './components/SettingsImportExport'

const { TabPane } = Tabs
const { Title, Text } = Typography

interface SystemSettingsPageProps {}

const SystemSettingsPage: React.FC<SystemSettingsPageProps> = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('basic')
  const [settingGroups, setSettingGroups] = useState<SystemSettingGroup[]>([])
  const [settings, setSettings] = useState<Record<string, SystemSetting[]>>({})
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [restartRequired, setRestartRequired] = useState<string[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [importExportVisible, setImportExportVisible] = useState(false)

  // 加载设置组
  const loadSettingGroups = useCallback(async () => {
    try {
      setLoading(true)
      const response = await systemSettingsService.getSettingGroups()
      setSettingGroups(response)

      // 为每个组创建设置映射
      const settingsMap: Record<string, SystemSetting[]> = {}
      response.forEach(group => {
        settingsMap[group.group] = group.settings
      })
      setSettings(settingsMap)
    } catch (error) {
      console.error('Failed to load setting groups:', error)
      message.error(t('settings.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  // 加载需要重启的设置
  const loadRestartRequired = useCallback(async () => {
    try {
      const response = await systemSettingsService.getRestartRequiredSettings()
      setRestartRequired(response)
    } catch (error) {
      console.error('Failed to load restart required settings:', error)
    }
  }, [])

  // 加载系统状态
  const loadSystemStatus = useCallback(async () => {
    try {
      const response = await systemSettingsService.getSystemStatus()
      setSystemStatus(response)
    } catch (error) {
      console.error('Failed to load system status:', error)
    }
  }, [])

  // 初始化加载
  useEffect(() => {
    loadSettingGroups()
    loadRestartRequired()
    loadSystemStatus()
  }, [loadSettingGroups, loadRestartRequired, loadSystemStatus])

  // 监听页面离开事件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // 更新设置值
  const updateSetting = useCallback((group: string, key: string, value: any) => {
    setSettings(prev => {
      const newSettings = { ...prev }
      if (newSettings[group]) {
        newSettings[group] = newSettings[group].map(setting =>
          setting.key === key ? { ...setting, value: String(value) } : setting
        )
      }
      return newSettings
    })
    setHasUnsavedChanges(true)

    // 清除该字段的验证错误
    if (validationErrors[key]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }, [validationErrors])

  // 保存所有更改
  const saveAllSettings = useCallback(async () => {
    try {
      setSaving(true)

      // 准备批量更新数据
      const updateItems = Object.values(settings)
        .flat()
        .map(setting => ({
          key: setting.key,
          value: setting.value
        }))

      // 先验证设置
      const errors = await systemSettingsService.validateSettings({ settings: updateItems })
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        message.error(t('settings.validationFailed'))
        return
      }

      // 保存设置
      await systemSettingsService.batchUpdateSettings({ settings: updateItems })

      message.success(t('settings.saveSuccess'))
      setHasUnsavedChanges(false)
      setValidationErrors({})

      // 重新加载需要重启的设置
      await loadRestartRequired()

      // 如果有需要重启的设置，显示提示
      if (restartRequired.length > 0) {
        Modal.confirm({
          title: t('settings.restartRequired'),
          content: t('settings.restartRequiredMessage'),
          okText: t('common.restart'),
          cancelText: t('common.later'),
          onOk: async () => {
            try {
              await systemSettingsService.restartSystem()
              message.info(t('settings.restartInitiated'))
            } catch (error) {
              message.error(t('settings.restartFailed'))
            }
          }
        })
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      message.error(t('settings.saveFailed'))
    } finally {
      setSaving(false)
    }
  }, [settings, t, loadRestartRequired, restartRequired.length])

  // 重置当前组的设置
  const resetCurrentGroup = useCallback(async () => {
    const currentGroupSettings = settings[activeTab]
    if (!currentGroupSettings) return

    Modal.confirm({
      title: t('settings.resetGroup'),
      content: t('settings.resetGroupConfirm'),
      okText: t('common.reset'),
      okType: 'danger',
      cancelText: t('common.cancel'),
      onOk: async () => {
        try {
          setLoading(true)

          // 重置每个设置到默认值
          for (const setting of currentGroupSettings) {
            await systemSettingsService.resetSetting(setting.key)
          }

          message.success(t('settings.resetSuccess'))
          await loadSettingGroups()
          setHasUnsavedChanges(false)
        } catch (error) {
          console.error('Failed to reset settings:', error)
          message.error(t('settings.resetFailed'))
        } finally {
          setLoading(false)
        }
      }
    })
  }, [activeTab, settings, t, loadSettingGroups])

  // 清空缓存
  const clearCache = useCallback(async () => {
    try {
      await systemSettingsService.clearCache()
      message.success(t('settings.cacheCleared'))
    } catch (error) {
      console.error('Failed to clear cache:', error)
      message.error(t('settings.cacheClearFailed'))
    }
  }, [t])

  // 渲染设置标签页
  const renderTabContent = (group: SettingGroupType) => {
    const groupSettings = settings[group] || []
    const commonProps = {
      settings: groupSettings,
      onUpdate: (key: string, value: any) => updateSetting(group, key, value),
      validationErrors,
      loading: loading || saving
    }

    switch (group) {
      case 'Basic':
        return <BasicSettingsTab {...commonProps} />
      case 'Email':
        return <EmailSettingsTab {...commonProps} />
      case 'OpenAI':
        return <AISettingsTab {...commonProps} />
      case 'Storage':
        return <StorageSettingsTab {...commonProps} />
      case 'Security':
        return <SecuritySettingsTab {...commonProps} />
      case 'GitHub':
      case 'Gitee':
        return <ThirdPartySettingsTab {...commonProps} group={group} />
      case 'Document':
        return <DocumentSettingsTab {...commonProps} />
      default:
        return <div>Coming soon...</div>
    }
  }

  // 获取标签页标题和图标
  const getTabInfo = (group: SettingGroupType) => {
    const baseInfo = {
      Basic: { title: t('settings.groups.basic'), icon: <SettingOutlined /> },
      Email: { title: t('settings.groups.email'), icon: <SettingOutlined /> },
      OpenAI: { title: t('settings.groups.ai'), icon: <SettingOutlined /> },
      Storage: { title: t('settings.groups.storage'), icon: <SettingOutlined /> },
      Security: { title: t('settings.groups.security'), icon: <SettingOutlined /> },
      GitHub: { title: t('settings.groups.github'), icon: <SettingOutlined /> },
      Gitee: { title: t('settings.groups.gitee'), icon: <SettingOutlined /> },
      Document: { title: t('settings.groups.document'), icon: <SettingOutlined /> },
      JWT: { title: t('settings.groups.jwt'), icon: <SettingOutlined /> },
      Backup: { title: t('settings.groups.backup'), icon: <SettingOutlined /> },
      Logging: { title: t('settings.groups.logging'), icon: <SettingOutlined /> }
    }[group] || { title: group, icon: <SettingOutlined /> }

    // 检查是否有需要重启的设置
    const groupSettings = settings[group] || []
    const hasRestartRequired = groupSettings.some(setting =>
      setting.requiresRestart && restartRequired.includes(setting.key)
    )

    return {
      ...baseInfo,
      badge: hasRestartRequired
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingOutlined />
            {t('settings.title')}
          </Title>
          <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
            {t('settings.description')}
          </Text>
        </div>

        <Space>
          {hasUnsavedChanges && (
            <Alert
              message={t('settings.unsavedChanges')}
              type="warning"
              showIcon
              style={{ marginRight: '16px' }}
            />
          )}

          <Button
            icon={<ReloadOutlined />}
            onClick={clearCache}
            title={t('settings.clearCache')}
          >
            {t('settings.clearCache')}
          </Button>

          <Button
            icon={<ImportOutlined />}
            onClick={() => setImportExportVisible(true)}
          >
            {t('settings.importExport')}
          </Button>

          <Button
            icon={<ReloadOutlined />}
            onClick={resetCurrentGroup}
            disabled={loading}
          >
            {t('settings.resetGroup')}
          </Button>

          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!hasUnsavedChanges || loading}
            onClick={saveAllSettings}
          >
            {t('settings.saveAll')}
          </Button>
        </Space>
      </div>

      {/* 系统状态卡片 */}
      {systemStatus && (
        <SystemStatusCard
          status={systemStatus}
          restartRequired={restartRequired}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* 重启提醒 */}
      {restartRequired.length > 0 && (
        <Alert
          message={t('settings.restartRequired')}
          description={t('settings.restartRequiredMessage')}
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
          action={
            <Button
              size="small"
              type="primary"
              danger
              onClick={async () => {
                Modal.confirm({
                  title: t('settings.restartConfirm'),
                  content: t('settings.restartConfirmMessage'),
                  okText: t('common.restart'),
                  okType: 'danger',
                  cancelText: t('common.cancel'),
                  onOk: async () => {
                    try {
                      await systemSettingsService.restartSystem()
                      message.info(t('settings.restartInitiated'))
                    } catch (error) {
                      message.error(t('settings.restartFailed'))
                    }
                  }
                })
              }}
            >
              {t('common.restart')}
            </Button>
          }
        />
      )}

      <Card>
        <Spin spinning={loading}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            type="card"
            size="large"
          >
            {settingGroups.map(group => {
              const tabInfo = getTabInfo(group.group as SettingGroupType)
              return (
                <TabPane
                  key={group.group}
                  tab={
                    <span>
                      {tabInfo.icon}
                      <span style={{ marginLeft: '8px' }}>{tabInfo.title}</span>
                      {tabInfo.badge && (
                        <Badge
                          dot
                          status="warning"
                          style={{ marginLeft: '8px' }}
                          title={t('settings.requiresRestart')}
                        />
                      )}
                    </span>
                  }
                >
                  {renderTabContent(group.group as SettingGroupType)}
                </TabPane>
              )
            })}
          </Tabs>
        </Spin>
      </Card>

      {/* 导入导出弹窗 */}
      <Modal
        title={t('settings.importExport')}
        open={importExportVisible}
        onCancel={() => setImportExportVisible(false)}
        footer={null}
        width={600}
      >
        <SettingsImportExport onClose={() => setImportExportVisible(false)} />
      </Modal>
    </div>
  )
}

export default SystemSettingsPage