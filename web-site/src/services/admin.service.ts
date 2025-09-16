import { request } from '@/utils/request'
import {
  SystemSetting,
  SystemSettingGroup,
  SystemSettingUpdateItem,
  BatchUpdateSystemSettings,
  SystemSettingInput,
  ValidationErrors,
  SettingTestResult,
  EmailTestParams,
  APITestParams,
  SystemStatus,
  SettingsExport,
  SettingsImport,
  SettingChangeHistory
} from '@/types/systemSettings'

// 用户管理相关接口
export interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
  role?: string
  createdAt: string
  updatedAt?: string
}

export interface PageDto<T> {
  total: number
  items: T[]
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  avatar?: string
}

export interface UpdateUserDto {
  name: string
  email: string
  avatar?: string
  password?: string
}

export interface ResetPasswordDto {
  newPassword: string
}

export interface AssignUserRoleDto {
  roleIds: string[]
}

export interface BatchDeleteUserDto {
  userIds: string[]
}

// 用户管理API
export const userService = {
  // 获取用户列表
  getUserList: async (page: number = 1, pageSize: number = 10, keyword?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    if (keyword) {
      params.append('keyword', keyword)
    }
    return request.get<PageDto<UserInfo>>(`/api/user/UserList?${params}`)
  },

  // 获取用户详情
  getUser: async (id: string) => {
    return request.get<{ data: UserInfo }>(`/api/user/User?id=${id}`)
  },

  // 创建用户
  createUser: async (data: CreateUserDto) => {
    return request.post<{ data: UserInfo }>('/api/user/CreateUser', data)
  },

  // 更新用户
  updateUser: async (id: string, data: UpdateUserDto) => {
    return request.post<{ data: UserInfo }>(`/api/user/UpdateUser?id=${id}`, data)
  },

  // 删除用户
  deleteUser: async (id: string) => {
    return request.post(`/api/user/DeleteUser?id=${id}`)
  },

  // 重置用户密码
  resetUserPassword: async (id: string, newPassword: string) => {
    return request.post(`/api/user/ResetPassword?id=${id}`, { newPassword })
  },

  // 为用户分配角色
  assignUserRoles: async (id: string, roleIds: string[]) => {
    return request.post(`/api/user/AssignRoles?id=${id}`, { roleIds })
  },

  // 获取用户角色
  getUserRoles: async (id: string) => {
    return request.get<string[]>(`/api/user/UserRoles?id=${id}`)
  },

  // 批量删除用户
  batchDeleteUsers: async (userIds: string[]) => {
    return request.post('/api/user/BatchDelete', { userIds })
  }
}

// 角色管理相关接口
export interface RoleInfo {
  id: string
  name: string
  description?: string
  isActive: boolean
  isSystemRole: boolean
  userCount?: number
  warehousePermissionCount?: number
  createdAt: string
  updatedAt?: string
}

export interface CreateRoleDto {
  name: string
  description?: string
  isActive: boolean
}

export interface UpdateRoleDto {
  name: string
  description?: string
  isActive: boolean
}

export interface RoleDetailDto extends RoleInfo {
  users?: UserInfo[]
  warehousePermissions?: any[]
}

// 角色管理API
export const roleService = {
  // 获取角色列表
  getRoleList: async (page?: number, pageSize?: number, keyword?: string, isActive?: boolean) => {
    const params = new URLSearchParams()
    if (page) params.append('page', page.toString())
    if (pageSize) params.append('pageSize', pageSize.toString())
    if (keyword) params.append('keyword', keyword)
    if (isActive !== undefined) params.append('isActive', isActive.toString())

    return request.get<PageDto<RoleInfo>>(`/api/Role/RoleList?${params}`)
  },

  // 获取角色详情
  getRoleDetail: async (id: string) => {
    return request.get<RoleDetailDto>(`/api/Role/RoleDetail?id=${id}`)
  },

  // 获取所有角色(下拉选择)
  getAllRoles: async () => {
    return request.get<RoleInfo[]>('/api/Role/AllRoles')
  },

  // 创建角色
  createRole: async (data: CreateRoleDto) => {
    return request.post<RoleInfo>('/api/Role/CreateRole', data)
  },

  // 更新角色
  updateRole: async (id: string, data: UpdateRoleDto) => {
    return request.post<RoleInfo>(`/api/Role/UpdateRole?id=${id}`, data)
  },

  // 删除角色
  deleteRole: async (id: string) => {
    return request.post<boolean>(`/api/Role/DeleteRole?id=${id}`)
  },

  // 批量更新角色状态
  batchUpdateRoleStatus: async (ids: string[], isActive: boolean) => {
    return request.post<boolean>('/api/Role/BatchUpdateRoleStatus', {
      ids,
      isActive
    })
  }
}

// 仓库管理相关接口
export interface WarehouseInfo {
  id: string
  name: string
  organizationName: string
  address: string
  branch: string
  description?: string
  status?: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  createdAt: string
  updatedAt?: string
  optimizedDirectoryStructure?: string
  documentCount?: number
  type?: string
  isRecommended?: boolean
  error?: string
  version?: string
  isEmbedded?: boolean
  stars?: number
  forks?: number
  language?: string
  license?: string
  avatarUrl?: string
  ownerUrl?: string
}

export interface CreateGitRepositoryDto {
  address: string
  branch: string
  gitUserName?: string
  gitPassword?: string
  email?: string
}

export interface UpdateRepositoryDto {
  description?: string
  isRecommended?: boolean
  prompt?: string
}

export interface RepositoryStatsDto {
  totalRepositories: number
  completedRepositories: number
  processingRepositories: number
  pendingRepositories: number
  failedRepositories: number
  totalDocuments: number
  recentGrowth?: string
}

export interface RepositoryPermissionDto {
  roleId: string
  roleName: string
  isRead: boolean
  isWrite: boolean
  isDelete: boolean
}

export interface BatchOperationDto {
  ids: string[]
  operation: 'enable' | 'disable' | 'delete' | 'refresh'
}

export interface RepositoryLogDto {
  id: string
  repositoryId: string
  operation: string
  description: string
  userId?: string
  userName?: string
  createdAt: string
  success: boolean
  error?: string
}

export interface BranchInfo {
  name: string
  isDefault: boolean
}

export interface GitBranchListDto {
  branches: string[]
  defaultBranch: string
}

// 仓库管理API
export const warehouseService = {
  // 获取仓库列表
  getWarehouseList: async (page: number = 1, pageSize: number = 10, keyword?: string, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    if (keyword) {
      params.append('keyword', keyword)
    }
    if (status) {
      params.append('status', status)
    }
    return request.get<PageDto<WarehouseInfo>>(`/api/Warehouse/WarehouseList?${params}`)
  },

  // 获取仓库详情
  getWarehouse: async (organizationName: string, name: string) => {
    return request.get<WarehouseInfo>(`/api/Warehouse/${organizationName}/${name}`)
  },

  // 根据ID获取仓库详情
  getWarehouseById: async (id: string) => {
    return request.get<WarehouseInfo>(`/api/Repository/GetRepository?id=${id}`)
  },

  // 创建Git仓库
  createGitRepository: async (data: CreateGitRepositoryDto) => {
    return request.post<WarehouseInfo>('/api/Repository/CreateGitRepository', data)
  },

  // 更新仓库信息
  updateRepository: async (id: string, data: UpdateRepositoryDto) => {
    return request.post<WarehouseInfo>(`/api/Repository/UpdateRepository?id=${id}`, data)
  },

  // 删除仓库
  deleteWarehouse: async (id: string) => {
    return request.post<boolean>(`/api/Repository/DeleteRepository?id=${id}`)
  },

  // 刷新仓库 (重新处理)
  refreshWarehouse: async (id: string) => {
    return request.post<boolean>(`/api/Repository/ResetRepository?id=${id}`)
  },

  // 批量操作仓库
  batchOperateRepositories: async (data: BatchOperationDto) => {
    return request.post<boolean>('/api/Repository/BatchOperate', data)
  },

  // 获取仓库统计信息
  getRepositoryStats: async () => {
    return request.get<RepositoryStatsDto>('/api/Repository/GetRepositoryStats')
  },

  // 获取仓库权限列表
  getRepositoryPermissions: async (repositoryId: string) => {
    return request.get<RepositoryPermissionDto[]>(`/api/Repository/GetRepositoryPermissions?repositoryId=${repositoryId}`)
  },

  // 设置仓库权限
  setRepositoryPermissions: async (repositoryId: string, permissions: RepositoryPermissionDto[]) => {
    return request.post<boolean>(`/api/Repository/SetRepositoryPermissions?repositoryId=${repositoryId}`, permissions)
  },

  // 获取仓库操作日志
  getRepositoryLogs: async (repositoryId: string, page: number = 1, pageSize: number = 10) => {
    const params = new URLSearchParams({
      repositoryId,
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    return request.get<PageDto<RepositoryLogDto>>(`/api/Repository/GetRepositoryLogs?${params}`)
  },

  // 获取Git仓库分支列表
  getGitBranches: async (address: string, gitUserName?: string, gitPassword?: string) => {
    const params = new URLSearchParams({ address })
    if (gitUserName) params.append('gitUserName', gitUserName)
    if (gitPassword) params.append('gitPassword', gitPassword)
    return request.get<GitBranchListDto>(`/api/Warehouse/GetBranchList?${params}`)
  },

  // 导出仓库Markdown
  exportRepositoryMarkdown: async (repositoryId: string) => {
    return request.get(`/api/Warehouse/ExportMarkdownZip?warehouseId=${repositoryId}`, {}, {
      responseType: 'blob'
    })
  }
}

// 统计相关接口
export interface DashboardStats {
  totalUsers: number
  totalRoles: number
  totalWarehouses: number
  activeSessions?: number
  userGrowth?: string
  warehouseGrowth?: string
  roleGrowth?: string
}

// 系统性能数据接口
export interface SystemPerformance {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  totalMemory: number
  usedMemory: number
  totalDiskSpace: number
  usedDiskSpace: number
  systemStartTime: string
  uptimeSeconds: number
  activeConnections: number
}

// 仓库状态分布接口
export interface RepositoryStatusDistribution {
  status: string
  count: number
  percentage: number
}

// 用户活跃度统计接口
export interface UserActivityStats {
  onlineUsers: number
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  activeUserGrowthRate: number
  recentLoginUsers: RecentLoginUser[]
}

export interface RecentLoginUser {
  id: string
  name: string
  avatar?: string
  loginTime: string
  ipAddress?: string
  isOnline: boolean
}

// 系统错误日志接口
export interface SystemErrorLog {
  id: string
  level: string
  message: string
  source: string
  userId?: string
  userName?: string
  createdAt: string
  exception?: string
  path?: string
  method?: string
  statusCode?: number
}

// 健康检查项接口
export interface HealthCheckItem {
  name: string
  status: string
  isHealthy: boolean
  responseTime: number
  error?: string
  lastCheckTime: string
}

// 系统健康度检查接口
export interface SystemHealthCheck {
  overallScore: number
  healthLevel: string
  database: HealthCheckItem
  aiService: HealthCheckItem
  emailService: HealthCheckItem
  fileStorage: HealthCheckItem
  systemPerformance: HealthCheckItem
  checkTime: string
  warnings: string[]
  errors: string[]
}

// 趋势数据接口
export interface TrendData {
  date: string
  value: number
}

// 性能趋势数据接口
export interface PerformanceTrend {
  time: string
  cpuUsage: number
  memoryUsage: number
  activeConnections: number
}

// 仪表板趋势数据接口
export interface DashboardTrends {
  userTrends: TrendData[]
  repositoryTrends: TrendData[]
  documentTrends: TrendData[]
  viewTrends: TrendData[]
  performanceTrends: PerformanceTrend[]
}

// 热门内容接口
export interface PopularContent {
  id: string
  title: string
  type: string
  viewCount: number
  lastViewAt: string
}

// 最近仓库信息接口（来自统计服务）
export interface RecentRepository {
  id: string
  name: string
  organizationName: string
  description: string
  createdAt: string
  status: string
  isRecommended: boolean
  documentCount: number
}

// 最近用户信息接口（来自统计服务）
export interface RecentUser {
  id: string
  name: string
  email: string
  createdAt: string
  lastLoginAt?: string
  roles: string[]
  isOnline: boolean
}

// 完整的仪表板数据接口
export interface ComprehensiveDashboard {
  systemStats: {
    totalUsers: number
    totalRepositories: number
    totalDocuments: number
    totalViews: number
    monthlyNewUsers: number
    monthlyNewRepositories: number
    monthlyNewDocuments: number
    monthlyViews: number
    userGrowthRate: number
    repositoryGrowthRate: number
    documentGrowthRate: number
    viewGrowthRate: number
  }
  performance: SystemPerformance
  repositoryStatusDistribution: RepositoryStatusDistribution[]
  userActivity: UserActivityStats
  recentRepositories: RecentRepository[]
  recentUsers: RecentUser[]
  popularContent: PopularContent[]
  recentErrors: SystemErrorLog[]
  healthCheck: SystemHealthCheck
  trends: DashboardTrends
}

export const statsService = {
  // 获取基础仪表板统计数据
  getDashboardStats: async () => {
    // 这个接口可能需要后端实现，现在使用聚合数据
    const [users, roles] = await Promise.all([
      userService.getUserList(1, 1),
      roleService.getRoleList(1, 1)
    ])

    return {
      totalUsers: users.total,
      totalRoles: roles.total,
      totalWarehouses: 0, // 需要后端接口支持
      activeSessions: 0,
      userGrowth: '+12%',
      warehouseGrowth: '+8%',
      roleGrowth: '0%'
    } as DashboardStats
  },

  // 获取完整的仪表板数据
  getComprehensiveDashboard: async () => {
    return request.get<ComprehensiveDashboard>('/api/Statistics/ComprehensiveDashboard')
  },

  // 获取系统统计数据
  getSystemStatistics: async () => {
    return request.get('/api/Statistics/SystemStatistics')
  },

  // 获取系统性能数据
  getSystemPerformance: async () => {
    return request.get<SystemPerformance>('/api/Statistics/SystemPerformance')
  },

  // 获取仓库状态分布
  getRepositoryStatusDistribution: async () => {
    return request.get<RepositoryStatusDistribution[]>('/api/Statistics/RepositoryStatusDistribution')
  },

  // 获取用户活跃度统计
  getUserActivityStats: async () => {
    return request.get<UserActivityStats>('/api/Statistics/UserActivityStats')
  },

  // 获取最近创建的仓库
  getRecentRepositories: async (count: number = 10) => {
    return request.get<RecentRepository[]>(`/api/Statistics/RecentRepositories?count=${count}`)
  },

  // 获取最近注册的用户
  getRecentUsers: async (count: number = 10) => {
    return request.get<RecentUser[]>(`/api/Statistics/RecentUsers?count=${count}`)
  },

  // 获取用户趋势数据
  getUserTrends: async (days: number = 30) => {
    return request.get<TrendData[]>(`/api/Statistics/UserTrends?days=${days}`)
  },

  // 获取仓库趋势数据
  getRepositoryTrends: async (days: number = 30) => {
    return request.get<TrendData[]>(`/api/Statistics/RepositoryTrends?days=${days}`)
  },

  // 获取文档趋势数据
  getDocumentTrends: async (days: number = 30) => {
    return request.get<TrendData[]>(`/api/Statistics/DocumentTrends?days=${days}`)
  },

  // 获取访问量趋势数据
  getViewTrends: async (days: number = 30) => {
    return request.get<TrendData[]>(`/api/Statistics/ViewTrends?days=${days}`)
  },

  // 获取性能趋势数据
  getPerformanceTrends: async (hours: number = 24) => {
    return request.get<PerformanceTrend[]>(`/api/Statistics/PerformanceTrends?hours=${hours}`)
  },

  // 获取热门内容
  getPopularContent: async (days: number = 7, count: number = 10) => {
    return request.get<PopularContent[]>(`/api/Statistics/PopularContent?days=${days}&count=${count}`)
  },

  // 获取最近错误日志
  getRecentErrorLogs: async (count: number = 10) => {
    return request.get<SystemErrorLog[]>(`/api/Statistics/RecentErrorLogs?count=${count}`)
  },

  // 获取系统健康度检查
  getSystemHealthCheck: async () => {
    return request.get<SystemHealthCheck>('/api/Statistics/SystemHealthCheck')
  },

  // 获取详细统计数据
  getDetailedStatistics: async () => {
    return request.get<ComprehensiveDashboard>('/api/Statistics/DetailedStatistics')
  },

  // 记录访问
  recordAccess: async (resourceType: string, resourceId: string, data?: any) => {
    return request.post('/api/Statistics/RecordAccess', {
      resourceType,
      resourceId,
      ...data
    })
  },

  // 生成每日统计数据
  generateDailyStatistics: async (date?: string) => {
    const params = date ? `?date=${date}` : ''
    return request.post<boolean>(`/api/Statistics/GenerateDailyStatistics${params}`)
  }
}

// 系统设置管理API
export const systemSettingsService = {
  // 获取所有系统设置分组
  getSettingGroups: async () => {
    return request.get<SystemSettingGroup[]>('/api/SystemSetting/groups')
  },

  // 根据分组获取系统设置
  getSettingsByGroup: async (group: string) => {
    return request.get<SystemSetting[]>(`/api/SystemSetting/group/${group}`)
  },

  // 获取单个系统设置
  getSetting: async (key: string) => {
    return request.get<SystemSetting>(`/api/SystemSetting/${key}`)
  },

  // 更新单个系统设置
  updateSetting: async (key: string, value?: string) => {
    return request.put<boolean>(`/api/SystemSetting/${key}`, JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' }
    })
  },

  // 批量更新系统设置
  batchUpdateSettings: async (data: BatchUpdateSystemSettings) => {
    return request.put<boolean>('/api/SystemSetting/batch', data)
  },

  // 创建新的系统设置
  createSetting: async (data: SystemSettingInput) => {
    return request.post<SystemSetting>('/api/SystemSetting/', data)
  },

  // 删除系统设置
  deleteSetting: async (key: string) => {
    return request.delete<boolean>(`/api/SystemSetting/${key}`)
  },

  // 重置设置为默认值
  resetSetting: async (key: string) => {
    return request.post<boolean>(`/api/SystemSetting/${key}/reset`)
  },

  // 清空配置缓存
  clearCache: async () => {
    return request.post('/api/SystemSetting/cache/clear')
  },

  // 获取需要重启的设置项
  getRestartRequiredSettings: async () => {
    return request.get<string[]>('/api/SystemSetting/restart-required')
  },

  // 导出系统设置
  exportSettings: async () => {
    return request.get<SystemSetting[]>('/api/SystemSetting/export')
  },

  // 验证配置值的有效性
  validateSettings: async (data: BatchUpdateSystemSettings) => {
    return request.post<ValidationErrors>('/api/SystemSetting/validate', data)
  },

  // 测试邮件配置
  testEmailSettings: async (params: EmailTestParams) => {
    return request.post<SettingTestResult>('/api/SystemSetting/test/email', params)
  },

  // 测试AI API配置
  testAISettings: async (params: APITestParams) => {
    return request.post<SettingTestResult>('/api/SystemSetting/test/ai', params)
  },

  // 测试数据库连接
  testDatabaseConnection: async () => {
    return request.post<SettingTestResult>('/api/SystemSetting/test/database')
  },

  // 获取系统状态
  getSystemStatus: async () => {
    return request.get<SystemStatus>('/api/SystemSetting/status')
  },

  // 获取设置变更历史
  getChangeHistory: async (settingKey?: string, page: number = 1, pageSize: number = 20) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString()
    })
    if (settingKey) {
      params.append('settingKey', settingKey)
    }
    return request.get<PageDto<SettingChangeHistory>>(`/api/SystemSetting/history?${params}`)
  },

  // 回滚设置到指定版本
  rollbackSetting: async (historyId: string) => {
    return request.post<boolean>(`/api/SystemSetting/rollback/${historyId}`)
  },

  // 导入设置
  importSettings: async (file: File, overwriteExisting: boolean = false, selectedGroups?: string[]) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('overwriteExisting', overwriteExisting.toString())
    if (selectedGroups && selectedGroups.length > 0) {
      formData.append('selectedGroups', JSON.stringify(selectedGroups))
    }
    return request.post<boolean>('/api/SystemSetting/import', formData)
  },

  // 获取配置模板
  getSettingTemplate: async (group: string) => {
    return request.get<SystemSetting[]>(`/api/SystemSetting/template/${group}`)
  },

  // 重启系统服务
  restartSystem: async () => {
    return request.post<boolean>('/api/SystemSetting/restart')
  }
}