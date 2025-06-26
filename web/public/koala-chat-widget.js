/**
 * KoalaWiki AI Chat Widget
 * 第三方网站引用的聊天悬浮球脚本
 * 
 * 使用方式:
 * <script src="https://your-domain.com/koala-chat-widget.js"></script>
 * <script>
 *   KoalaChatWidget.init({
 *     appId: 'your-app-id',
 *     organizationName: 'your-org',
 *     repositoryName: 'your-repo',
 *     title: '我的 AI 助手',
 *     expandIcon: 'base64-icon-data',
 *     closeIcon: 'base64-icon-data',
 *     apiUrl: 'https://your-api-domain.com',
 *     allowedDomains: ['example.com', 'subdomain.example.com'],
 *     enableDomainValidation: true
 *   });
 * </script>
 */

(function() {
  'use strict';

  // 全局配置
  let config = {
    appId: '',
    organizationName: 'default',
    repositoryName: 'default',
    title: 'AI 助手',
    expandIcon: '',
    closeIcon: '',
    apiUrl: '',
    allowedDomains: [],
    enableDomainValidation: false,
    theme: 'light'
  };

  // 验证域名（异步）
  async function validateDomain() {
    if (!config.appId) {
      return { isValid: false, reason: 'AppId is required' };
    }

    try {
      const apiUrl = config.apiUrl || window.location.origin;
      const currentDomain = window.location.hostname;
      
      const response = await fetch(`${apiUrl}/api/AppConfig/validate-domain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: config.appId,
          domain: currentDomain
        })
      });

      if (!response.ok) {
        console.error('Domain validation request failed:', response.status);
        return { isValid: false, reason: 'ValidationRequestFailed' };
      }

      const result = await response.json();
      return {
        isValid: result.isValid,
        reason: result.reason,
        appConfig: result.appConfig
      };
    } catch (error) {
      console.error('Domain validation error:', error);
      return { isValid: false, reason: 'NetworkError' };
    }
  }

  // 获取应用配置
  async function getAppConfig() {
    if (!config.appId) {
      return null;
    }

    try {
      const apiUrl = config.apiUrl || window.location.origin;
      
      const response = await fetch(`${apiUrl}/api/AppConfig/public/${config.appId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        console.error('Failed to get app config:', response.status);
        return null;
      }

      const appConfig = await response.json();
      return appConfig;
    } catch (error) {
      console.error('Failed to get app config:', error);
      return null;
    }
  }

  // 创建样式
  function createStyles() {
    const styles = `
      .koala-chat-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        direction: ltr;
      }

      .koala-floating-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: #1677ff;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
        transition: transform 0.2s ease;
      }

      .koala-floating-button:hover {
        transform: scale(1.05);
      }

      .koala-chat-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 380px;
        height: 600px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        z-index: 10001;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid #d9d9d9;
      }

      .koala-chat-container.visible {
        display: flex;
      }

      .koala-chat-container.minimized {
        height: 56px;
      }

      .koala-chat-container.maximized {
        width: 480px;
        height: 720px;
      }

      .koala-chat-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #d9d9d9;
        background: white;
        min-height: 56px;
      }

      .koala-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        font-size: 16px;
        font-weight: 600;
        margin: 0;
        color: #262626;
      }

      .koala-header-actions {
        display: flex;
        gap: 4px;
      }

      .koala-header-btn {
        width: 24px;
        height: 24px;
        border: none;
        background: none;
        cursor: pointer;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #8c8c8c;
        transition: background-color 0.2s;
      }

      .koala-header-btn:hover {
        background-color: #f5f5f5;
        color: #595959;
      }

      .koala-chat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .koala-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        padding: 24px;
        text-align: center;
        color: #8c8c8c;
      }

      .koala-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .koala-empty-title {
        font-size: 18px;
        margin-bottom: 8px;
        color: #262626;
        font-weight: 500;
      }

      .koala-empty-description {
        font-size: 14px;
        line-height: 1.6;
        color: #8c8c8c;
      }

      .koala-iframe-container {
        flex: 1;
        border: none;
        width: 100%;
        height: 100%;
      }

      .koala-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #8c8c8c;
      }

      .koala-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 20px;
        color: #ff4d4f;
        text-align: center;
      }

      .koala-error-title {
        font-weight: 500;
        margin-bottom: 8px;
      }

      .koala-error-description {
        font-size: 14px;
        color: #8c8c8c;
      }

      @media (max-width: 768px) {
        .koala-chat-container {
          bottom: 0;
          right: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .koala-chat-container.maximized {
          width: 100%;
          height: 100%;
        }

        .koala-floating-button {
          bottom: 20px;
          right: 20px;
        }
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.textContent = styles;
    document.head.appendChild(styleElement);
  }

  // 创建悬浮球按钮
  function createFloatingButton() {
    const button = document.createElement('button');
    button.className = 'koala-floating-button';
    button.title = '打开 AI 助手';
    
    if (config.expandIcon) {
      button.style.backgroundImage = `url(data:image/png;base64,${config.expandIcon})`;
      button.style.backgroundSize = 'cover';
      button.style.backgroundPosition = 'center';
    } else {
      button.innerHTML = '💬';
    }

    button.addEventListener('click', toggleChat);
    return button;
  }

  // 创建聊天容器
  function createChatContainer() {
    const container = document.createElement('div');
    container.className = 'koala-chat-container';

    // 创建头部
    const header = document.createElement('div');
    header.className = 'koala-chat-header';

    const title = document.createElement('div');
    title.className = 'koala-header-title';
    title.innerHTML = `💬 ${config.title}`;

    const actions = document.createElement('div');
    actions.className = 'koala-header-actions';

    // 最小化按钮
    const minimizeBtn = document.createElement('button');
    minimizeBtn.className = 'koala-header-btn';
    minimizeBtn.innerHTML = '−';
    minimizeBtn.title = '最小化';
    minimizeBtn.addEventListener('click', minimizeChat);

    // 最大化按钮
    const maximizeBtn = document.createElement('button');
    maximizeBtn.className = 'koala-header-btn';
    maximizeBtn.innerHTML = '⛶';
    maximizeBtn.title = '最大化';
    maximizeBtn.addEventListener('click', toggleMaximize);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'koala-header-btn';
    closeBtn.title = '关闭';
    
    if (config.closeIcon) {
      const img = document.createElement('img');
      img.src = `data:image/png;base64,${config.closeIcon}`;
      img.alt = '关闭';
      img.style.width = '14px';
      img.style.height = '14px';
      closeBtn.appendChild(img);
    } else {
      closeBtn.innerHTML = '×';
    }
    
    closeBtn.addEventListener('click', closeChat);

    actions.appendChild(minimizeBtn);
    actions.appendChild(maximizeBtn);
    actions.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(actions);

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'koala-chat-content';

    // 初始显示加载状态
    showLoading(content);

    container.appendChild(header);
    container.appendChild(content);

    return container;
  }

  // 显示加载状态
  function showLoading(container) {
    container.innerHTML = `
      <div class="koala-loading">
        <div>正在加载 AI 助手...</div>
      </div>
    `;
  }

  // 显示错误状态
  function showError(container, message) {
    container.innerHTML = `
      <div class="koala-error">
        <div class="koala-error-title">加载失败</div>
        <div class="koala-error-description">${message}</div>
      </div>
    `;
  }

  // 加载聊天界面
  function loadChatInterface(container) {
    // 检查必要配置
    if (!config.organizationName || !config.repositoryName) {
      showError(container, '应用配置缺失，无法加载聊天界面');
      return;
    }

    // 构建聊天界面 URL
    const params = new URLSearchParams({
      appId: config.appId,
      organizationName: config.organizationName,
      repositoryName: config.repositoryName,
      title: config.title,
      theme: config.theme,
      embedded: 'true'
    });

    if (config.expandIcon) {
      params.set('expandIcon', config.expandIcon);
    }
    if (config.closeIcon) {
      params.set('closeIcon', config.closeIcon);
    }

    const chatUrl = `${config.apiUrl || window.location.origin}/chat/embedded?${params.toString()}`;

    // 创建 iframe
    const iframe = document.createElement('iframe');
    iframe.src = chatUrl;
    iframe.className = 'koala-iframe-container';
    iframe.frameBorder = '0';
    iframe.allowTransparency = true;

    iframe.onload = function() {
      container.innerHTML = '';
      container.appendChild(iframe);
    };

    iframe.onerror = function() {
      showError(container, '无法加载聊天界面');
    };

    // 设置超时
    setTimeout(() => {
      if (container.querySelector('.koala-loading')) {
        showError(container, '加载超时，请检查网络连接');
      }
    }, 10000);
  }

  // 全局变量
  let floatingButton = null;
  let chatContainer = null;
  let isExpanded = false;
  let isMinimized = false;
  let isMaximized = false;

  // 切换聊天窗口
  async function toggleChat() {
    const validation = await validateDomain();
    if (!validation.isValid) {
      alert(`域名验证失败: ${validation.reason || '当前域名未被授权使用此功能'}`);
      return;
    }

    // 更新配置（如果从验证结果中获取到了应用配置）
    if (validation.appConfig) {
      config.organizationName = validation.appConfig.organizationName;
      config.repositoryName = validation.appConfig.repositoryName;
      config.title = validation.appConfig.name || config.title;
    }

    if (isExpanded) {
      closeChat();
    } else {
      openChat();
    }
  }

  // 打开聊天窗口
  async function openChat() {
    if (!chatContainer) {
      chatContainer = createChatContainer();
      document.body.appendChild(chatContainer);
      
      // 如果没有从验证中获取到配置，尝试单独获取
      if (!config.organizationName || !config.repositoryName) {
        const appConfig = await getAppConfig();
        if (appConfig) {
          config.organizationName = appConfig.organizationName;
          config.repositoryName = appConfig.repositoryName;
          config.title = appConfig.name || config.title;
        }
      }
      
      loadChatInterface(chatContainer.querySelector('.koala-chat-content'));
    }

    chatContainer.classList.add('visible');
    floatingButton.style.display = 'none';
    isExpanded = true;
    isMinimized = false;
  }

  // 关闭聊天窗口
  function closeChat() {
    if (chatContainer) {
      chatContainer.classList.remove('visible');
      chatContainer.classList.remove('minimized');
      chatContainer.classList.remove('maximized');
    }
    floatingButton.style.display = 'flex';
    isExpanded = false;
    isMinimized = false;
    isMaximized = false;
  }

  // 最小化聊天窗口
  function minimizeChat() {
    if (chatContainer) {
      chatContainer.classList.add('minimized');
      isMinimized = true;
    }
  }

  // 切换最大化
  function toggleMaximize() {
    if (chatContainer) {
      if (isMaximized) {
        chatContainer.classList.remove('maximized');
        isMaximized = false;
      } else {
        chatContainer.classList.add('maximized');
        isMaximized = true;
      }
    }
  }

  // 初始化函数
  async function init(options = {}) {
    // 合并配置
    config = Object.assign(config, options);

    // 验证必要参数
    if (!config.appId) {
      console.error('KoalaChatWidget: appId is required');
      return;
    }

    // 获取应用配置
    try {
      const appConfig = await getAppConfig();
      if (appConfig) {
        config.organizationName = appConfig.organizationName;
        config.repositoryName = appConfig.repositoryName;
        config.title = appConfig.name || config.title;
        config.enableDomainValidation = appConfig.enableDomainValidation;
        config.allowedDomains = appConfig.allowedDomains || [];
      }
    } catch (error) {
      console.error('KoalaChatWidget: Failed to get app config:', error);
    }

    // 验证域名（如果启用了域名验证）
    if (config.enableDomainValidation) {
      const validation = await validateDomain();
      if (!validation.isValid) {
        console.error('KoalaChatWidget: Domain validation failed -', validation.reason);
        if (typeof config.onValidationFailed === 'function') {
          config.onValidationFailed(window.location.hostname);
        }
        return;
      }
    }

    // 等待 DOM 加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initWidget, 100);
      });
    } else {
      setTimeout(initWidget, 100);
    }
  }

  // 初始化组件
  function initWidget() {
    try {
      // 创建样式
      createStyles();

      // 创建悬浮球按钮
      floatingButton = createFloatingButton();
      document.body.appendChild(floatingButton);

      console.log('KoalaChatWidget initialized successfully');
    } catch (error) {
      console.error('KoalaChatWidget initialization failed:', error);
      if (typeof config.onError === 'function') {
        config.onError(error.message);
      }
    }
  }

  // 销毁组件
  function destroy() {
    if (floatingButton) {
      floatingButton.remove();
      floatingButton = null;
    }
    if (chatContainer) {
      chatContainer.remove();
      chatContainer = null;
    }
    isExpanded = false;
    isMinimized = false;
    isMaximized = false;
  }

  // 暴露全局 API
  window.KoalaChatWidget = {
    init: init,
    destroy: destroy,
    open: openChat,
    close: closeChat,
    toggle: toggleChat,
    version: '1.0.0'
  };

})(); 