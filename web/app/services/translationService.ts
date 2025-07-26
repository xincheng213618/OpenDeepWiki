import { ApiResponse } from './types';

// 翻译任务状态
export type TranslationTaskStatus = 'Pending' | 'Running' | 'Completed' | 'Failed' | 'Cancelled';

// 翻译任务类型  
export type TranslationTaskType = 'Repository' | 'Catalog';

// 语言状态信息
export interface LanguageStatusInfo {
  code: string;
  name: string;
  status: 'none' | 'generating' | 'completed' | 'failed';
  exists: boolean;
  lastGenerated?: string;
  progress: number;
}

// 翻译任务信息
export interface TranslationTask {
  taskId: string;
  taskType: TranslationTaskType;
  targetLanguage: string;
  sourceLanguage: string;
  status: TranslationTaskStatus;
  progress: number;
  catalogsTranslated: number;
  filesTranslated: number;
  totalCatalogs: number;
  totalFiles: number;
  startedAt: string;
  completedAt?: string;
  duration: string;
  errorMessage?: string;
}

// 启动翻译任务请求
export interface StartTranslationRequest {
  warehouseId: string;
  targetLanguage: string;
  sourceLanguage?: string;
}

// 启动目录翻译任务请求
export interface StartCatalogTranslationRequest extends StartTranslationRequest {
  catalogId: string;
}

// 支持的语言
export interface SupportedLanguage {
  code: string;
  name: string;
}

/**
 * 启动仓库翻译任务
 */
export async function startRepositoryTranslation(request: StartTranslationRequest): Promise<ApiResponse<{ taskId: string; message: string }>> {
  const response = await fetch('/api/translation/repository', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '启动翻译任务失败');
  }

  return await response.json();
}

/**
 * 启动目录翻译任务
 */
export async function startCatalogTranslation(request: StartCatalogTranslationRequest): Promise<ApiResponse<{ taskId: string; message: string }>> {
  const response = await fetch('/api/translation/catalog', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '启动翻译任务失败');
  }

  return await response.json();
}

/**
 * 获取翻译任务状态
 */
export async function getTranslationTaskStatus(taskId: string): Promise<ApiResponse<TranslationTask>> {
  const response = await fetch(`/api/translation/task/${taskId}`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取任务状态失败');
  }

  return await response.json();
}

/**
 * 获取仓库的翻译任务列表
 */
export async function getRepositoryTranslationTasks(
  warehouseId: string, 
  targetLanguage?: string
): Promise<ApiResponse<TranslationTask[]>> {
  const params = new URLSearchParams();
  if (targetLanguage) {
    params.append('targetLanguage', targetLanguage);
  }

  const url = `/api/translation/repository/${warehouseId}/tasks${params.toString() ? '?' + params.toString() : ''}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取任务列表失败');
  }

  return await response.json();
}

/**
 * 获取仓库语言状态
 */
export async function getRepositoryLanguageStatus(warehouseId: string): Promise<ApiResponse<LanguageStatusInfo[]>> {
  const response = await fetch(`/api/translation/repository/${warehouseId}/languages`);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取语言状态失败');
  }

  return await response.json();
}

/**
 * 获取支持的语言列表
 */
export async function getSupportedLanguages(): Promise<ApiResponse<SupportedLanguage[]>> {
  const response = await fetch('/api/translation/languages');

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || '获取语言列表失败');
  }

  return await response.json();
}