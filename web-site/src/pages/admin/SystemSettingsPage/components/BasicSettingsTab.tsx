import React from 'react'
import {
  Form,
  Input,
  Upload,
  Button,
  Space,
  Row,
  Col,
  Card,
  Typography,
  Image,
  message
} from 'antd'
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import type { SystemSetting, ValidationErrors } from '@/types/systemSettings'

const { TextArea } = Input
const { Title, Text } = Typography

interface BasicSettingsTabProps {
  settings: SystemSetting[]
  onUpdate: (key: string, value: any) => void
  validationErrors: ValidationErrors
  loading?: boolean
}

const BasicSettingsTab: React.FC<BasicSettingsTabProps> = ({
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

  // 处理文件上传
  const handleFileUpload = (key: string, info: any) => {
    if (info.file.status === 'done') {
      // 这里应该处理文件上传成功后的逻辑
      // 通常会返回文件的URL或路径
      const fileUrl = info.file.response?.url || info.file.response?.data?.url
      if (fileUrl) {
        onUpdate(key, fileUrl)
        message.success(t('settings.uploadSuccess'))
      }
    } else if (info.file.status === 'error') {
      message.error(t('settings.uploadFailed'))
    }
  }

  // 获取上传属性
  const getUploadProps = (key: string) => ({
    name: 'file',
    action: '/api/upload/image', // 假设的上传接口
    showUploadList: false,
    accept: 'image/*',
    onChange: (info: any) => handleFileUpload(key, info),
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/')
      if (!isImage) {
        message.error(t('settings.onlyImageAllowed'))
        return false
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error(t('settings.imageTooLarge'))
        return false
      }
      return true
    }
  })

  return (
    <div style={{ maxWidth: '800px' }}>
      <Title level={4} style={{ marginBottom: '24px' }}>
        {t('settings.groups.basic')}
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>
        {t('settings.basicDescription')}
      </Text>

      <Form layout="vertical" disabled={loading}>
        <Row gutter={[24, 16]}>
          {/* 站点名称 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.siteName')}
              validateStatus={validationErrors.siteName ? 'error' : ''}
              help={validationErrors.siteName}
            >
              <Input
                value={getSettingValue('siteName')}
                onChange={(e) => onUpdate('siteName', e.target.value)}
                placeholder={t('settings.basic.siteNamePlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* 站点描述 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.siteDescription')}
              validateStatus={validationErrors.siteDescription ? 'error' : ''}
              help={validationErrors.siteDescription}
            >
              <Input
                value={getSettingValue('siteDescription')}
                onChange={(e) => onUpdate('siteDescription', e.target.value)}
                placeholder={t('settings.basic.siteDescriptionPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Col>

          {/* 站点Logo */}
          <Col span={24}>
            <Form.Item
              label={t('settings.basic.siteLogo')}
              validateStatus={validationErrors.siteLogo ? 'error' : ''}
              help={validationErrors.siteLogo}
            >
              <Card size="small" style={{ background: '#fafafa' }}>
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Input
                      value={getSettingValue('siteLogo')}
                      onChange={(e) => onUpdate('siteLogo', e.target.value)}
                      placeholder={t('settings.basic.siteLogoPlaceholder')}
                      addonBefore={t('settings.basic.logoUrl')}
                    />
                  </Col>
                  <Col>
                    <Space>
                      <Upload {...getUploadProps('siteLogo')}>
                        <Button icon={<UploadOutlined />}>
                          {t('common.upload')}
                        </Button>
                      </Upload>
                      {getSettingValue('siteLogo') && (
                        <>
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => {
                              // 预览图片
                              Image.PreviewGroup._currentPreview = {
                                current: 0,
                                urls: [getSettingValue('siteLogo')]
                              }
                            }}
                          />
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            onClick={() => onUpdate('siteLogo', '')}
                          />
                        </>
                      )}
                    </Space>
                  </Col>
                </Row>
                {getSettingValue('siteLogo') && (
                  <div style={{ marginTop: '12px' }}>
                    <Image
                      src={getSettingValue('siteLogo')}
                      alt="Site Logo"
                      style={{ maxHeight: '80px', maxWidth: '200px' }}
                      fallback="data:image/png;base64,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)"
                    />
                  </div>
                )}
              </Card>
            </Form.Item>
          </Col>

          {/* 网站图标 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.favicon')}
              validateStatus={validationErrors.favicon ? 'error' : ''}
              help={validationErrors.favicon}
            >
              <Input
                value={getSettingValue('favicon')}
                onChange={(e) => onUpdate('favicon', e.target.value)}
                placeholder={t('settings.basic.faviconPlaceholder')}
                addonAfter={
                  <Upload {...getUploadProps('favicon')}>
                    <Button icon={<UploadOutlined />} size="small" />
                  </Upload>
                }
              />
            </Form.Item>
          </Col>

          {/* 版权信息 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.copyright')}
              validateStatus={validationErrors.copyRight ? 'error' : ''}
              help={validationErrors.copyRight}
            >
              <Input
                value={getSettingValue('copyRight')}
                onChange={(e) => onUpdate('copyRight', e.target.value)}
                placeholder={t('settings.basic.copyrightPlaceholder')}
              />
            </Form.Item>
          </Col>

          {/* 关键词 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.keywords')}
              validateStatus={validationErrors.siteKeywords ? 'error' : ''}
              help={validationErrors.siteKeywords}
            >
              <Input
                value={getSettingValue('siteKeywords')}
                onChange={(e) => onUpdate('siteKeywords', e.target.value)}
                placeholder={t('settings.basic.keywordsPlaceholder')}
              />
            </Form.Item>
          </Col>

          {/* 联系邮箱 */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.contactEmail')}
              validateStatus={validationErrors.contactEmail ? 'error' : ''}
              help={validationErrors.contactEmail}
            >
              <Input
                type="email"
                value={getSettingValue('contactEmail')}
                onChange={(e) => onUpdate('contactEmail', e.target.value)}
                placeholder={t('settings.basic.contactEmailPlaceholder')}
              />
            </Form.Item>
          </Col>

          {/* 支持URL */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.supportUrl')}
              validateStatus={validationErrors.supportUrl ? 'error' : ''}
              help={validationErrors.supportUrl}
            >
              <Input
                type="url"
                value={getSettingValue('supportUrl')}
                onChange={(e) => onUpdate('supportUrl', e.target.value)}
                placeholder={t('settings.basic.supportUrlPlaceholder')}
              />
            </Form.Item>
          </Col>

          {/* 隐私政策URL */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.privacyPolicyUrl')}
              validateStatus={validationErrors.privacyPolicyUrl ? 'error' : ''}
              help={validationErrors.privacyPolicyUrl}
            >
              <Input
                type="url"
                value={getSettingValue('privacyPolicyUrl')}
                onChange={(e) => onUpdate('privacyPolicyUrl', e.target.value)}
                placeholder={t('settings.basic.privacyPolicyUrlPlaceholder')}
              />
            </Form.Item>
          </Col>

          {/* 服务条款URL */}
          <Col span={12}>
            <Form.Item
              label={t('settings.basic.termsOfServiceUrl')}
              validateStatus={validationErrors.termsOfServiceUrl ? 'error' : ''}
              help={validationErrors.termsOfServiceUrl}
            >
              <Input
                type="url"
                value={getSettingValue('termsOfServiceUrl')}
                onChange={(e) => onUpdate('termsOfServiceUrl', e.target.value)}
                placeholder={t('settings.basic.termsOfServiceUrlPlaceholder')}
              />
            </Form.Item>
          </Col>

          {/* 统计代码 */}
          <Col span={24}>
            <Form.Item
              label={t('settings.basic.analyticsCode')}
              validateStatus={validationErrors.analyticsCode ? 'error' : ''}
              help={validationErrors.analyticsCode || t('settings.basic.analyticsCodeHelp')}
            >
              <TextArea
                rows={6}
                value={getSettingValue('analyticsCode')}
                onChange={(e) => onUpdate('analyticsCode', e.target.value)}
                placeholder={t('settings.basic.analyticsCodePlaceholder')}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  )
}

export default BasicSettingsTab