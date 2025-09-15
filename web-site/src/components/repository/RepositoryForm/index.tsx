'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { warehouseService } from '@/services/warehouse.service'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Github,
  GitBranch,
  RefreshCw,
  Link,
  Upload,
  Settings,
  User,
  Lock,
  File,
  Info,
  Loader2
} from 'lucide-react'

export interface RepositoryFormValues {
  address: string
  type: string
  branch: string
  prompt?: string
  model?: string
  openAIKey?: string
  openAIEndpoint?: string
  enableGitAuth?: boolean
  gitUserName?: string
  gitPassword?: string
  email?: string
  submitType?: 'git' | 'file' | 'custom'
  uploadMethod?: 'url' | 'file'
  fileUpload?: File
  organizationName?: string
  repositoryName?: string
}

interface RepositoryFormProps {
  open: boolean
  onCancel: () => void
  onSubmit: (values: RepositoryFormValues) => Promise<void>
  initialValues?: Partial<RepositoryFormValues>
  disabledFields?: string[]
}

export const RepositoryForm: React.FC<RepositoryFormProps> = ({
  open,
  onCancel,
  onSubmit,
  initialValues,
  disabledFields = []
}) => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<RepositoryFormValues>({
    address: '',
    type: 'git',
    branch: 'main',
    enableGitAuth: false,
    submitType: 'git',
    uploadMethod: 'url',
    ...initialValues
  })
  const [branches, setBranches] = useState<string[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [lastAddress, setLastAddress] = useState<string>('')
  const [defaultBranch, setDefaultBranch] = useState<string>('')



  const handleSubmit = async () => {
    try {
      setLoading(true)

      if (formData.submitType === 'git') {
        // Git仓库提交验证
        if (!formData.address) {
          alert(t('repository.form.validation.addressRequired'))
          return
        }
        if (!formData.branch) {
          alert(t('repository.form.validation.branchRequired'))
          return
        }
      } else if (formData.submitType === 'custom') {
        // 自定义仓库验证
        if (!formData.organizationName) {
          alert(t('repository.form.validation.organizationNameRequired'))
          return
        }
        if (!formData.repositoryName) {
          alert(t('repository.form.validation.repositoryNameRequired'))
          return
        }
        if (!formData.address) {
          alert(t('repository.form.validation.addressRequired'))
          return
        }
        if (!formData.branch) {
          alert(t('repository.form.validation.branchRequired'))
          return
        }
      } else {
        // 文件上传验证
        if (!formData.organizationName) {
          alert(t('repository.form.validation.organizationNameRequired'))
          return
        }
        if (!formData.repositoryName) {
          alert(t('repository.form.validation.repositoryNameRequired'))
          return
        }
        if (formData.uploadMethod === 'file' && !formData.fileUpload) {
          alert(t('repository.form.validation.fileRequired'))
          return
        }
        if (formData.uploadMethod === 'url' && !formData.address) {
          alert(t('repository.form.validation.fileUrlRequired'))
          return
        }
      }

      await onSubmit(formData)
      onCancel()
    } catch (error) {
      console.error(t('repository.form.submitError'), error)
      alert(t('repository.form.submitFailed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    if (!formData.address || formData.address === lastAddress) {
      return
    }

    setLoadingBranches(true)
    try {
      const response = await warehouseService.getBranchList(
        formData.address,
        formData.gitUserName,
        formData.gitPassword
      )

      if (response.data?.branches && response.data.branches.length > 0) {
        setBranches(response.data.branches)
        if (response.data.defaultBranch) {
          setFormData(prev => ({ ...prev, branch: response.data.defaultBranch }))
          setDefaultBranch(response.data.defaultBranch)
        }
        setLastAddress(formData.address)
      } else if (response.branches && response.branches.length > 0) {
        // Handle alternate response structure
        setBranches(response.branches)
        if (response.defaultBranch) {
          setFormData(prev => ({ ...prev, branch: response.defaultBranch }))
          setDefaultBranch(response.defaultBranch)
        }
        setLastAddress(formData.address)
      } else {
        setBranches(['main', 'master'])
        console.error(response.error || t('repository.form.fetchBranchesFailed'))
      }
    } catch (error) {
      console.error(t('repository.form.fetchBranchesError'), error)
      setBranches(['main', 'master'])
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddressBlur = () => {
    if (formData.address && formData.address.trim() !== '') {
      fetchBranches()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, fileUpload: file }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            {t('repository.form.title')}
          </DialogTitle>
          <DialogDescription>
            {t('repository.form.description')}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={formData.submitType}
          onValueChange={(value) => handleFieldChange('submitType', value)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="git" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              {t('repository.form.gitRepository')}
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              {t('repository.form.fileUpload')}
            </TabsTrigger>
            <TabsTrigger value="custom" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {t('repository.form.customRepository')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="git" className="space-y-4 mt-4">
            {/* Git仓库地址 */}
            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                {t('repository.form.repositoryAddress')}
              </Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleFieldChange('address', e.target.value)}
                onBlur={handleAddressBlur}
                placeholder="https://github.com/username/repository"
                disabled={disabledFields.includes('address')}
              />
            </div>

            {/* 分支选择 */}
            <div className="space-y-2">
              <Label htmlFor="branch" className="flex items-center gap-2">
                <GitBranch className="h-4 w-4" />
                {t('repository.form.branch')}
              </Label>
              <div className="flex gap-2">
                <Select
                  value={formData.branch}
                  onValueChange={(value) => handleFieldChange('branch', value)}
                  disabled={disabledFields.includes('branch') || branches.length === 0}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={t('repository.form.branchPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.length > 0 ? (
                      branches.map(branch => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                          {branch === defaultBranch && ` (${t('repository.form.default')})`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="main">main</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={fetchBranches}
                  disabled={loadingBranches || !formData.address}
                  title={t('repository.form.refreshBranches')}
                >
                  {loadingBranches ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {branches.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {t('repository.form.availableBranches')}: {branches.join(', ')}
                </div>
              )}
            </div>

            {/* Git认证 */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableGitAuth" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      {t('repository.form.enableAuth')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('repository.form.authDescription')}
                    </p>
                  </div>
                  <Switch
                    id="enableGitAuth"
                    checked={formData.enableGitAuth}
                    onCheckedChange={(checked) => handleFieldChange('enableGitAuth', checked)}
                  />
                </div>

                {formData.enableGitAuth && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="gitUserName" className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {t('repository.form.username')}
                        </Label>
                        <Input
                          id="gitUserName"
                          value={formData.gitUserName || ''}
                          onChange={(e) => handleFieldChange('gitUserName', e.target.value)}
                          placeholder={t('repository.form.usernamePlaceholder')}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gitPassword" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {t('repository.form.password')}
                        </Label>
                        <Input
                          id="gitPassword"
                          type="password"
                          value={formData.gitPassword || ''}
                          onChange={(e) => handleFieldChange('gitPassword', e.target.value)}
                          placeholder={t('repository.form.passwordPlaceholder')}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('repository.form.fileUploadDescription')}
              </AlertDescription>
            </Alert>

            {/* 组织名和仓库名 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileOrgName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('repository.form.organizationName')}
                </Label>
                <Input
                  id="fileOrgName"
                  value={formData.organizationName || ''}
                  onChange={(e) => handleFieldChange('organizationName', e.target.value)}
                  placeholder={t('repository.form.organizationNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fileRepoName" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  {t('repository.form.repositoryName')}
                </Label>
                <Input
                  id="fileRepoName"
                  value={formData.repositoryName || ''}
                  onChange={(e) => handleFieldChange('repositoryName', e.target.value)}
                  placeholder={t('repository.form.repositoryNamePlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                {t('repository.form.uploadMethod')}
              </Label>
              <Select
                value={formData.uploadMethod}
                onValueChange={(value) => handleFieldChange('uploadMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">
                    {t('repository.form.urlUpload')}
                  </SelectItem>
                  <SelectItem value="file">
                    {t('repository.form.localFile')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.uploadMethod === 'url' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fileUrl" className="flex items-center gap-2">
                    <Link className="h-4 w-4" />
                    {t('repository.form.fileUrl')}
                  </Label>
                  <Input
                    id="fileUrl"
                    value={formData.address}
                    onChange={(e) => handleFieldChange('address', e.target.value)}
                    onBlur={handleAddressBlur}
                    placeholder="https://example.com/file.zip"
                  />
                </div>

                {/* Git认证 */}
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="fileEnableGitAuth" className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          {t('repository.form.enableAuth')}
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          {t('repository.form.authDescription')}
                        </p>
                      </div>
                      <Switch
                        id="fileEnableGitAuth"
                        checked={formData.enableGitAuth}
                        onCheckedChange={(checked) => handleFieldChange('enableGitAuth', checked)}
                      />
                    </div>

                    {formData.enableGitAuth && (
                      <>
                        <Separator />
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="fileGitUserName" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {t('repository.form.username')}
                            </Label>
                            <Input
                              id="fileGitUserName"
                              value={formData.gitUserName || ''}
                              onChange={(e) => handleFieldChange('gitUserName', e.target.value)}
                              placeholder={t('repository.form.usernamePlaceholder')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fileGitPassword" className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              {t('repository.form.password')}
                            </Label>
                            <Input
                              id="fileGitPassword"
                              type="password"
                              value={formData.gitPassword || ''}
                              onChange={(e) => handleFieldChange('gitPassword', e.target.value)}
                              placeholder={t('repository.form.passwordPlaceholder')}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="fileEmail" className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {t('repository.form.email')}
                            </Label>
                            <Input
                              id="fileEmail"
                              type="email"
                              value={formData.email || ''}
                              onChange={(e) => handleFieldChange('email', e.target.value)}
                              placeholder={t('repository.form.emailPlaceholder')}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fileUpload" className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  {t('repository.form.selectFile')}
                </Label>
                <Input
                  id="fileUpload"
                  type="file"
                  accept=".zip,.tar,.tar.gz"
                  onChange={handleFileChange}
                />
                {formData.fileUpload && (
                  <p className="text-sm text-muted-foreground">
                    {t('repository.form.selectedFile')}: {formData.fileUpload.name}
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t('repository.form.customDescription')}
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('repository.form.organizationName')}
                </Label>
                <Input
                  id="organizationName"
                  value={formData.organizationName || ''}
                  onChange={(e) => handleFieldChange('organizationName', e.target.value)}
                  placeholder={t('repository.form.organizationNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repositoryName" className="flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  {t('repository.form.repositoryName')}
                </Label>
                <Input
                  id="repositoryName"
                  value={formData.repositoryName || ''}
                  onChange={(e) => handleFieldChange('repositoryName', e.target.value)}
                  placeholder={t('repository.form.repositoryNamePlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customAddress" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  {t('repository.form.repositoryAddress')}
                </Label>
                <Input
                  id="customAddress"
                  value={formData.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  onBlur={handleAddressBlur}
                  placeholder={t('repository.form.customAddressPlaceholder')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customBranch" className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  {t('repository.form.branch')}
                </Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.branch}
                    onValueChange={(value) => handleFieldChange('branch', value)}
                    disabled={branches.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder={t('repository.form.branchPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.length > 0 ? (
                        branches.map(branch => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                            {branch === defaultBranch && ` (${t('repository.form.default')})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="main">main</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={fetchBranches}
                    disabled={loadingBranches || !formData.address}
                    title={t('repository.form.refreshBranches')}
                  >
                    {loadingBranches ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {branches.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {t('repository.form.availableBranches')}: {branches.join(', ')}
                  </div>
                )}
              </div>

              {/* Git认证 */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="customEnableGitAuth" className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        {t('repository.form.enableAuth')}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {t('repository.form.authDescription')}
                      </p>
                    </div>
                    <Switch
                      id="customEnableGitAuth"
                      checked={formData.enableGitAuth}
                      onCheckedChange={(checked) => handleFieldChange('enableGitAuth', checked)}
                    />
                  </div>

                  {formData.enableGitAuth && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="customGitUserName" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('repository.form.username')}
                          </Label>
                          <Input
                            id="customGitUserName"
                            value={formData.gitUserName || ''}
                            onChange={(e) => handleFieldChange('gitUserName', e.target.value)}
                            placeholder={t('repository.form.usernamePlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customGitPassword" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            {t('repository.form.password')}
                          </Label>
                          <Input
                            id="customGitPassword"
                            type="password"
                            value={formData.gitPassword || ''}
                            onChange={(e) => handleFieldChange('gitPassword', e.target.value)}
                            placeholder={t('repository.form.passwordPlaceholder')}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customEmail" className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {t('repository.form.email')}
                          </Label>
                          <Input
                            id="customEmail"
                            type="email"
                            value={formData.email || ''}
                            onChange={(e) => handleFieldChange('email', e.target.value)}
                            placeholder={t('repository.form.emailPlaceholder')}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.submitting')}
              </>
            ) : (
              t('common.submit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default RepositoryForm