import { fetchService } from './fetch'

export interface DocumentResponse {
  data: {
    content: string
    path: string
    name: string
  }
}

class DocumentService {
  // 获取文档内容
  async getDocument(owner: string, repo: string, path: string): Promise<DocumentResponse> {
    try {
      const response = await fetchService.get<DocumentResponse>(
        `/api/repositories/${owner}/${repo}/documents/${encodeURIComponent(path)}`
      )
      return response
    } catch (error) {
      console.error('Failed to fetch document:', error)
      throw error
    }
  }

  // 获取文档树
  async getDocumentTree(owner: string, repo: string, branch?: string) {
    try {
      const params = branch ? { branch } : {}
      const response = await fetchService.get(
        `/api/repositories/${owner}/${repo}/tree`,
        { params }
      )
      return response
    } catch (error) {
      console.error('Failed to fetch document tree:', error)
      throw error
    }
  }
}

export const documentService = new DocumentService()