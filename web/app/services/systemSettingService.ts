import { API_URL } from './api';
import { fetchApi, ApiResponse } from './fetchApi';

// 系统设置相关接口定义
export interface SystemSettingOutput {
  id: string;
  key: string;
  value?: string;
  group: string;
  valueType: string;
  description?: string;
  isSensitive: boolean;
  requiresRestart: boolean;
  defaultValue?: string;
  order: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SystemSettingGroupOutput {
  group: string;
  settings: SystemSettingOutput[];
}

export interface SystemSettingInput {
  key: string;
  value?: string;
  group: string;
  valueType: string;
  description?: string;
  isSensitive: boolean;
  requiresRestart: boolean;
  defaultValue?: string;
  order: number;
}

export interface BatchUpdateSystemSettingsInput {
  settings: { key: string; value?: string }[];
}

/**
 * 获取所有系统设置分组
 */
export async function getSettingGroups(): Promise<ApiResponse<SystemSettingGroupOutput[]>> {
  return fetchApi<SystemSettingGroupOutput[]>(`${API_URL}/api/SystemSetting/groups`);
}

/**
 * 根据分组获取系统设置
 */
export async function getSettingsByGroup(group: string): Promise<ApiResponse<SystemSettingOutput[]>> {
  return fetchApi<SystemSettingOutput[]>(`${API_URL}/api/SystemSetting/group/${encodeURIComponent(group)}`);
}

/**
 * 获取单个系统设置
 */
export async function getSetting(key: string): Promise<ApiResponse<SystemSettingOutput | null>> {
  return fetchApi<SystemSettingOutput | null>(`${API_URL}/api/SystemSetting/${encodeURIComponent(key)}`);
}

/**
 * 更新单个系统设置
 */
export async function updateSetting(key: string, value?: string): Promise<ApiResponse<boolean>> {
  return fetchApi<boolean>(`${API_URL}/api/SystemSetting/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(value),
  });
}

/**
 * 批量更新系统设置
 */
export async function batchUpdateSettings(input: BatchUpdateSystemSettingsInput): Promise<ApiResponse<boolean>> {
  return fetchApi<boolean>(`${API_URL}/api/SystemSetting/batch`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/**
 * 创建新的系统设置
 */
export async function createSetting(input: SystemSettingInput): Promise<ApiResponse<SystemSettingOutput>> {
  return fetchApi<SystemSettingOutput>(`${API_URL}/api/SystemSetting`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * 删除系统设置
 */
export async function deleteSetting(key: string): Promise<ApiResponse<boolean>> {
  return fetchApi<boolean>(`${API_URL}/api/SystemSetting/${encodeURIComponent(key)}`, {
    method: 'DELETE',
  });
}

/**
 * 重置设置为默认值
 */
export async function resetSetting(key: string): Promise<ApiResponse<boolean>> {
  return fetchApi<boolean>(`${API_URL}/api/SystemSetting/${encodeURIComponent(key)}/reset`, {
    method: 'POST',
  });
}

/**
 * 清空配置缓存
 */
export async function clearCache(): Promise<ApiResponse<any>> {
  return fetchApi(`${API_URL}/api/SystemSetting/cache/clear`, {
    method: 'POST',
  });
}

/**
 * 获取需要重启的设置项
 */
export async function getRestartRequiredSettings(): Promise<ApiResponse<string[]>> {
  return fetchApi<string[]>(`${API_URL}/api/SystemSetting/restart-required`);
}

/**
 * 导出系统设置
 */
export async function exportSettings(): Promise<ApiResponse<SystemSettingOutput[]>> {
  return fetchApi<SystemSettingOutput[]>(`${API_URL}/api/SystemSetting/export`);
}

/**
 * 验证配置值的有效性
 */
export async function validateSettings(input: BatchUpdateSystemSettingsInput): Promise<ApiResponse<Record<string, string>>> {
  return fetchApi<Record<string, string>>(`${API_URL}/api/SystemSetting/validate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
} 