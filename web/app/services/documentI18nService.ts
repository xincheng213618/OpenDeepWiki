import { fetchApi, ApiResponse } from './api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// 文档目录多语言数据
interface DocumentCatalogI18n {
  id: string;
  documentCatalogId: string;
  languageCode: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 文档文件多语言数据
interface DocumentFileItemI18n {
  id: string;
  documentFileItemId: string;
  languageCode: string;
  title: string;
  description: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 创建或更新目录多语言数据的请求
interface CreateOrUpdateCatalogI18nRequest {
  documentCatalogId: string;
  languageCode: string;
  name: string;
  description: string;
}

// 创建或更新文件多语言数据的请求
interface CreateOrUpdateFileItemI18nRequest {
  documentFileItemId: string;
  languageCode: string;
  title: string;
  description: string;
  content: string;
}

/**
 * 获取文档目录的多语言数据
 */
export async function getCatalogI18n(
  catalogId: string,
  languageCode: string
): Promise<ApiResponse<DocumentCatalogI18n | null>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/GetCatalogI18n?catalogId=${encodeURIComponent(catalogId)}&languageCode=${encodeURIComponent(languageCode)}`);
}

/**
 * 获取文档目录支持的所有语言
 */
export async function getCatalogSupportedLanguages(
  catalogId: string
): Promise<ApiResponse<string[]>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/GetCatalogSupportedLanguages?catalogId=${encodeURIComponent(catalogId)}`);
}

/**
 * 获取文档文件的多语言数据
 */
export async function getFileItemI18n(
  fileItemId: string,
  languageCode: string
): Promise<ApiResponse<DocumentFileItemI18n | null>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/GetFileItemI18n?fileItemId=${encodeURIComponent(fileItemId)}&languageCode=${encodeURIComponent(languageCode)}`);
}

/**
 * 获取文档文件支持的所有语言
 */
export async function getFileItemSupportedLanguages(
  fileItemId: string
): Promise<ApiResponse<string[]>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/GetFileItemSupportedLanguages?fileItemId=${encodeURIComponent(fileItemId)}`);
}

/**
 * 创建或更新文档目录的多语言数据
 */
export async function createOrUpdateCatalogI18n(
  request: CreateOrUpdateCatalogI18nRequest
): Promise<ApiResponse<boolean>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/CreateOrUpdateCatalogI18n`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 创建或更新文档文件的多语言数据
 */
export async function createOrUpdateFileItemI18n(
  request: CreateOrUpdateFileItemI18nRequest
): Promise<ApiResponse<boolean>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/CreateOrUpdateFileItemI18n`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * 删除文档目录的多语言数据
 */
export async function deleteCatalogI18n(
  catalogId: string,
  languageCode: string
): Promise<ApiResponse<boolean>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/DeleteCatalogI18n?catalogId=${encodeURIComponent(catalogId)}&languageCode=${encodeURIComponent(languageCode)}`, {
    method: 'DELETE',
  });
}

/**
 * 删除文档文件的多语言数据
 */
export async function deleteFileItemI18n(
  fileItemId: string,
  languageCode: string
): Promise<ApiResponse<boolean>> {
  return fetchApi(`${API_URL}/api/DocumentI18n/DeleteFileItemI18n?fileItemId=${encodeURIComponent(fileItemId)}&languageCode=${encodeURIComponent(languageCode)}`, {
    method: 'DELETE',
  });
}

export type {
  DocumentCatalogI18n,
  DocumentFileItemI18n,
  CreateOrUpdateCatalogI18nRequest,
  CreateOrUpdateFileItemI18nRequest
}; 