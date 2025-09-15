// 仓库详情状态管理Store

import { create } from 'zustand'
import { warehouseService } from '@/services/warehouse.service'
import type { DocumentNode } from '@/components/repository/DocumentTree'

interface RepositoryInfo {
  id: string
  organizationName: string
  name: string
  description?: string
  address: string
  branch: string
  status: any
  createdAt: string
  updatedAt?: string
  isRecommended?: boolean
  error?: string
}

interface RepositoryDetailState {
  // 仓库基本信息
  repository: RepositoryInfo | null
  owner: string
  name: string

  // 分支相关
  branches: string[]
  selectedBranch: string
  defaultBranch: string
  loadingBranches: boolean

  // 文档树相关
  documentNodes: DocumentNode[]
  selectedNode: DocumentNode | null
  loadingDocuments: boolean

  // 文档内容
  documentContent: string
  loadingContent: boolean

  // UI状态
  sidebarOpen: boolean
  mobileMenuOpen: boolean

  // 错误状态
  error: string | null

  // Actions
  setRepository: (owner: string, name: string) => void
  fetchRepositoryInfo: () => Promise<void>
  fetchBranches: () => Promise<void>
  fetchDocumentCatalog: (branch?: string) => Promise<void>
  fetchDocumentContent: (path: string) => Promise<void>
  selectBranch: (branch: string) => Promise<void>
  selectNode: (node: DocumentNode) => void
  setSidebarOpen: (open: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  clearError: () => void
  reset: () => void
}

const initialState = {
  repository: null,
  owner: '',
  name: '',
  branches: [],
  selectedBranch: 'main',
  defaultBranch: 'main',
  loadingBranches: false,
  documentNodes: [],
  selectedNode: null,
  loadingDocuments: false,
  documentContent: '',
  loadingContent: false,
  sidebarOpen: true,
  mobileMenuOpen: false,
  error: null,
}

export const useRepositoryDetailStore = create<RepositoryDetailState>((set, get) => ({
  ...initialState,

  setRepository: (owner: string, name: string) => {
    set({ owner, name })
  },

  fetchRepositoryInfo: async () => {
    const { owner, name, selectedBranch } = get()
    if (!owner || !name) return

    try {
      const response = await warehouseService.getWarehouseOverview(owner, name, selectedBranch)
      set({ repository: response, error: null })
    } catch (error: any) {
      set({ error: error?.message || 'Failed to fetch repository info' })
    }
  },

  fetchBranches: async () => {
    const { owner, name } = get()
    if (!owner || !name) return

    set({ loadingBranches: true, error: null })

    try {
      // 先获取文档目录，它会返回分支列表
      const response = await warehouseService.getDocumentCatalog(owner, name)

      if (response) {
        // 从DocumentCatalogs接口提取分支列表
        const branchList = response.branchs || response.branchs || []
        if (branchList.length > 0) {
          // 使用返回的分支列表
          const defaultBranch = branchList[0]
          set({
            branches: branchList,
            selectedBranch: defaultBranch,
            defaultBranch: defaultBranch,
            loadingBranches: false,
          })

          // 处理文档目录
          if (response.items) {
            const nodes = convertToTreeNodes(response.items)
            set({
              documentNodes: nodes,
              loadingDocuments: false
            })

            // 自动选择第一个文件节点
            if (nodes.length > 0) {
              const firstFileNode = findFirstFileNode(nodes)
              if (firstFileNode) {
                get().selectNode(firstFileNode)
              }
            }
          }
        } else {
          // 使用默认分支
          set({
            branches: ['main', 'master'],
            selectedBranch: 'main',
            defaultBranch: 'main',
            loadingBranches: false,
          })

          // 处理文档目录
          if (response.items) {
            const nodes = convertToTreeNodes(response.items)
            set({ documentNodes: nodes, loadingDocuments: false })
          }
        }
      } else {
        // 如果没有响应，使用默认值
        set({
          branches: ['main', 'master'],
          selectedBranch: 'main',
          defaultBranch: 'main',
          loadingBranches: false,
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch branches:', error)
      set({
        branches: ['main', 'master'],
        selectedBranch: 'main',
        defaultBranch: 'main',
        loadingBranches: false,
        error: error?.message || 'Failed to fetch branches',
      })
    }
  },

  fetchDocumentCatalog: async (branch?: string) => {
    const { owner, name, selectedBranch } = get()
    if (!owner || !name) return

    const targetBranch = branch || selectedBranch

    set({ loadingDocuments: true })

    try {
      const response = await warehouseService.getDocumentCatalog(owner, name, targetBranch)

      if (response && response.items) {
        const nodes = convertToTreeNodes(response.items)
        set({
          documentNodes: nodes,
          loadingDocuments: false
        })

        // 自动选择第一个文件节点
        if (nodes.length > 0) {
          const firstFileNode = findFirstFileNode(nodes)
          if (firstFileNode) {
            get().selectNode(firstFileNode)
          }
        }
      } else {
        set({
          documentNodes: [],
          loadingDocuments: false
        })
      }
    } catch (error: any) {
      console.error('Failed to fetch document catalog:', error)
      set({
        documentNodes: [],
        loadingDocuments: false,
      })
    }
  },

  fetchDocumentContent: async (path: string) => {
    const { owner, name, selectedBranch } = get()
    if (!owner || !name || !path) return

    set({ loadingContent: true })

    try {
      const response = await warehouseService.getDocumentById(owner, name, path, selectedBranch)
      set({
        documentContent: response?.content || '',
        loadingContent: false,
      })
    } catch (error: any) {
      console.error('Failed to fetch document content:', error)
      set({
        documentContent: '',
        loadingContent: false,
        error: error?.message || 'Failed to fetch document content',
      })
    }
  },

  selectBranch: async (branch: string) => {
    set({ selectedBranch: branch })
    await get().fetchDocumentCatalog(branch)
    await get().fetchRepositoryInfo()
  },

  selectNode: (node: DocumentNode) => {
    set({ selectedNode: node })
    if (node.type === 'file') {
      get().fetchDocumentContent(node.path)
    }
  },

  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open })
  },

  setMobileMenuOpen: (open: boolean) => {
    set({ mobileMenuOpen: open })
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set(initialState)
  },
}))

// 辅助函数：转换文档数据为树形节点
function convertToTreeNodes(items: any[]): DocumentNode[] {
  if (!items || !Array.isArray(items)) return []

  // 递归转换节点
  const convertNode = (item: any): DocumentNode => {
    const hasChildren = item.children && item.children.length > 0

    return {
      id: item.key || item.id || Math.random().toString(),
      name: item.label || item.name || item.title || 'Untitled',
      type: hasChildren ? 'folder' : 'file',
      path: item.url || item.path || '',
      description: item.description,
      lastUpdate: item.lastUpdate,
      children: hasChildren ? item.children.map(convertNode) : []
    }
  }

  // 转换所有根节点
  return items.map(convertNode)
}

// 辅助函数：查找第一个文件节点
function findFirstFileNode(nodes: DocumentNode[]): DocumentNode | null {
  for (const node of nodes) {
    if (node.type === 'file') {
      return node
    }
    if (node.children) {
      const found = findFirstFileNode(node.children)
      if (found) return found
    }
  }
  return null
}

export default useRepositoryDetailStore