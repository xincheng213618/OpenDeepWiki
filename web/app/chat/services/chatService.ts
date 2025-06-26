import { API_URL } from '../../services/api';

export interface Base64Content {
  data: string;
  mimeType: string;
}

export interface ResponsesMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageContents?: Base64Content[];
}

export interface ResponsesInput {
  organizationName: string;
  name: string;
  messages: ResponsesMessage[];
}

export interface StreamEvent {
  type: 'reasoning_start' | 'reasoning_content' | 'reasoning_end' | 'tool_call' | 'message_start' | 'message_content' | 'message_end' | 'done';
  content?: string;
  tool_call_id?: string;
  function_name?: string;
  function_arguments?: string;
}

export class ChatService {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  // SSE 辅助函数
  async* fetchSSE(url: string, data: any): AsyncIterableIterator<StreamEvent> {
    const token = localStorage.getItem("userToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
      method: "POST",
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userInfo");
      localStorage.setItem("redirectPath", window.location.pathname);
      window.location.href = "/login";
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const json = JSON.parse(errorText);
        throw new Error(json.message || 'API请求失败');
      } catch {
        throw new Error(errorText || '网络请求失败');
      }
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder("utf-8");

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk.split("\n\n");

        for (const event of events) {
          if (event.trim()) {
            const dataLine = event.split("\n").find(line => line.startsWith("data:"));
            if (dataLine) {
              const jsonData = dataLine.replace("data:", "").trim();
              if (jsonData === "[done]" || jsonData === '{"type":"done"}') {
                yield { type: 'done' };
                break;
              }
              try {
                const parsedData = JSON.parse(jsonData);
                yield parsedData as StreamEvent;
              } catch (error) {
                console.warn('Failed to parse SSE data:', jsonData);
              }
            }
          }
        }
      }
    } finally {
      reader.cancel();
    }
  }

  async* sendMessage(input: ResponsesInput): AsyncIterableIterator<StreamEvent> {
    const url = `${this.baseUrl}/api/Responses`;
    yield* this.fetchSSE(url, input);
  }

  // 验证域名权限
  async validateDomain(appId: string, domain: string): Promise<{ isValid: boolean; reason?: string; appConfig?: any }> {
    try {
      const token = localStorage.getItem("userToken");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/api/AppConfig/validate-domain`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          appId,
          domain
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Domain validation request failed:', errorText);
        return { isValid: false, reason: 'ValidationRequestFailed' };
      }

      const result = await response.json();
      return {
        isValid: result.isValid,
        reason: result.reason,
        appConfig: result.appConfig
      };
    } catch (error) {
      console.error('Domain validation failed:', error);
      return { isValid: false, reason: 'NetworkError' };
    }
  }

  // 获取应用配置
  async getAppConfig(appId: string): Promise<{ 
    organizationName: string; 
    repositoryName: string; 
    name: string;
    enableDomainValidation: boolean;
    allowedDomains: string[];
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/AppConfig/public/${appId}`, {
        method: 'GET',
        headers: {
          "Content-Type": "application/json",
        }
      });

      if (!response.ok) {
        console.error('Failed to get app config:', response.status);
        return null;
      }

      const appConfig = await response.json();
      if (!appConfig) {
        return null;
      }

      return {
        organizationName: appConfig.organizationName,
        repositoryName: appConfig.repositoryName,
        name: appConfig.name,
        enableDomainValidation: appConfig.enableDomainValidation,
        allowedDomains: appConfig.allowedDomains || []
      };
    } catch (error) {
      console.error('Failed to get app config:', error);
      return null;
    }
  }
}

export const chatService = new ChatService(); 