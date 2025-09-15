// Warehouse仓库相关API服务

import { fetchService } from './fetch'
import type {
  RepositoryInfo,
  ApiResponse,
  WarehouseListResponse
} from '@/types/repository'

/**
 * Repository submission interface
 */
export interface WarehouseSubmitRequest {
  address: string
  type: string
  branch: string
  prompt: string
  model: string
  openAIKey: string
  openAIEndpoint: string
}

/**
 * 自定义仓库提交接口
 */
export interface CustomWarehouseSubmitRequest {
  organization: string
  repositoryName: string
  address: string
  branch?: string
  gitUserName?: string
  gitPassword?: string
  email?: string
}

/**
 * 获取仓库分支列表的返回结构
 */
export interface BranchListResponse {
  success: boolean
  data: string[]
  defaultBranch?: string
  error?: string
}

class WarehouseService {
  private basePath = '/api/Warehouse'

  /**
   * 获取仓库列表
   */
  async getWarehouseList(
    page: number,
    pageSize: number,
    keyword?: string
  ): Promise<WarehouseListResponse> {
    const params: any = { page, pageSize }
    if (keyword && keyword !== 'undefined') {
      params.keyword = keyword
    }

    return fetchService.get<WarehouseListResponse>(
      `${this.basePath}/WarehouseList`,
      { params }
    )
  }

  /**
   * 提交新仓库
   */
  async submitWarehouse(data: WarehouseSubmitRequest): Promise<ApiResponse<RepositoryInfo>> {
    return fetchService.post<ApiResponse<RepositoryInfo>>(
      `${this.basePath}/SubmitWarehouse`,
      data
    )
  }

  /**
   * 获取仓库概览信息
   */
  async getWarehouseOverview(
    owner: string,
    name: string,
    branch?: string
  ): Promise<any> {
    const params: any = { owner, name }
    if (branch) {
      params.branch = branch
    }

    return fetchService.get<any>(
      `${this.basePath}/WarehouseOverview`,
      { params }
    )
  }

  /**
   * 获取文档目录
   */
  async getDocumentCatalog(
    organizationName: string,
    name: string,
    branch?: string,
    languageCode?: string
  ): Promise<any> {
    const params: any = { organizationName, name }
    if (branch) params.branch = branch
    if (languageCode) params.languageCode = languageCode

    return fetchService.get<any>(
      '/api/DocumentCatalog/DocumentCatalogs',
      { params }
    )
  }

  /**
   * 根据ID获取文档
   */
  async getDocumentById(
    owner: string,
    name: string,
    path: string,
    branch?: string,
    languageCode?: string
  ): Promise<any> {
    const params: any = { owner, name, path }
    if (branch) params.branch = branch
    if (languageCode) params.languageCode = languageCode

    return fetchService.get<any>(
      '/api/DocumentCatalog/DocumentById',
      { params }
    )
  }

  /**
   * 获取仓库分支列表 - 通过仓库地址
   */
  async getBranchList(
    repoUrl: string,
    username?: string,
    password?: string
  ): Promise<BranchListResponse> {
    try {
      // 构建查询参数
      const params = new URLSearchParams({
        address: repoUrl
      })
      
      if (username) {
        params.append('gitUserName', username)
      }
      if (password) {
        params.append('gitPassword', password)
      }

      const response = await fetchService.get<any>(
        `${this.basePath}/BranchList?${params.toString()}`
      )

      if (response.success && response.data) {
        return {
          success: true,
          data: response.data.branches || [],
          defaultBranch: response.data.defaultBranch
        }
      } else {
        return {
          success: false,
          data: ['main', 'master'],
          defaultBranch: 'main',
          error: response.message || '获取分支列表失败'
        }
      }
    } catch (error) {
      console.error('获取分支列表失败:', error)
      return {
        success: false,
        data: ['main', 'master'],
        defaultBranch: 'main',
        error: '网络请求失败'
      }
    }
  }

  /**
   * 获取仓库分支列表 - 通过组织名和仓库名
   */
  async getRepositoryBranches(
    owner: string,
    name: string
  ): Promise<BranchListResponse> {
    // 先获取仓库信息来获取仓库地址
    try {
      const overview = await this.getWarehouseOverview(owner, name)
      if (overview && overview.address) {
        return this.getBranchList(overview.address)
      }
      return {
        success: false,
        data: ['main', 'master'],
        defaultBranch: 'main',
        error: 'Failed to get repository address'
      }
    } catch (error) {
      return {
        success: false,
        data: ['main', 'master'],
        defaultBranch: 'main',
        error: 'Failed to get branches'
      }
    }
  }

  /**
   * 获取最近的仓库信息
   */
  async getLastWarehouse(address: string): Promise<any> {
    return fetchService.get<any>(
      `${this.basePath}/LastWarehouse`,
      { params: { address } }
    )
  }

  /**
   * 获取更新日志
   */
  async getChangeLog(
    owner: string,
    name: string,
    branch?: string
  ): Promise<any> {
    const params: any = { owner, name }
    if (branch) params.branch = branch

    return fetchService.get<any>(
      `${this.basePath}/ChangeLog`,
      { params }
    )
  }

  /**
   * 获取文件内容
   */
  async getFileContent(warehouseId: string, path: string): Promise<any> {
    return fetchService.get<any>(
      `${this.basePath}/FileContent`,
      { params: { warehouseId, path } }
    )
  }

  /**
   * 获取文件内容（按行）
   */
  async getFileContentByLine(
    organizationName: string,
    name: string,
    filePath: string
  ): Promise<any> {
    return fetchService.get<any>(
      `${this.basePath}/filecontentLine`,
      { params: { organizationName, name, filePath } }
    )
  }

  /**
   * 上传并提交仓库
   */
  async uploadAndSubmitWarehouse(formData: FormData): Promise<any> {
    // FormData不需要设置Content-Type，让浏览器自动设置
    return fetch(`${this.basePath}/UploadAndSubmitWarehouse`, {
      method: 'POST',
      body: formData
    }).then(res => res.json())
  }

  /**
   * 导出仓库的Markdown文件为ZIP
   */
  async exportMarkdownZip(warehouseId: string): Promise<any> {
    return fetchService.post<any>(
      `${this.basePath}/ExportMarkdownZip`,
      null,
      { params: { warehouseId } }
    )
  }

  /**
   * 自定义提交仓库
   */
  async customSubmitWarehouse(data: CustomWarehouseSubmitRequest): Promise<ApiResponse<RepositoryInfo>> {
    return fetchService.post<ApiResponse<RepositoryInfo>>(
      `${this.basePath}/CustomSubmitWarehouse`,
      data
    )
  }

  /**
   * 获取仓库知识图谱
   */
  async getMiniMap(
    owner: string,
    name: string,
    branch?: string
  ): Promise<any> {
    const params: any = { owner, name }
    if (branch) params.branch = branch

    return fetchService.get<any>(
      `${this.basePath}/minimap`,
      { params }
    )
  }
}

// 导出单例实例
export const warehouseService = new WarehouseService()

export default WarehouseService