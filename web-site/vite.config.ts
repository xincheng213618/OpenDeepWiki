import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5085"
      },
    },
  },
  build: {
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks: {
          // 核心框架库
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // UI 组件库
          'vendor-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-tabs',
            '@radix-ui/react-progress'
          ],

          // 图标和样式
          'vendor-icons': ['lucide-react'],

          // 工具库
          'vendor-utils': [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge'
          ],

          // 表单处理
          'vendor-forms': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],

          // 状态管理和数据获取
          'vendor-state': ['zustand'],

          // 国际化
          'vendor-i18n': ['react-i18next', 'i18next'],

          // 通知和交互
          'vendor-feedback': ['sonner'],

          // Markdown 和图表
          'vendor-content': [
            'react-markdown',
            'remark-gfm',
            'remark-math',
            'rehype-katex',
            'rehype-highlight',
            'rehype-raw'
          ],

          // 图表库 (按需加载)
          'vendor-charts': ['mermaid']
        },
        // 优化 chunk 文件名
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            if (facadeModuleId.includes('pages/')) {
              return 'pages/[name]-[hash].js'
            }
            if (facadeModuleId.includes('components/')) {
              return 'components/[name]-[hash].js'
            }
          }
          return 'chunks/[name]-[hash].js'
        },
        // 静态资源文件名
        assetFileNames: (assetInfo) => {

          if (/\.(png|jpe?g|gif|svg|webp|ico)$/i.test(assetInfo.name || '')) {
            return 'images/[name]-[hash].[ext]'
          }
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name || '')) {
            return 'fonts/[name]-[hash].[ext]'
          }
          if (/\.css$/i.test(assetInfo.name || '')) {
            return 'styles/[name]-[hash].[ext]'
          }
          return 'assets/[name]-[hash].[ext]'
        }
      }
    },

    // 压缩配置
    minify: 'terser',
    // 输出目录配置
    outDir: 'dist',
    assetsDir: 'static',

    // 生成 source map（开发阶段可以设为 true）
    sourcemap: false,

    // 启用 CSS 代码分割
    cssCodeSplit: true,

    // 设置 chunk 大小警告限制
    chunkSizeWarningLimit: 1000, // 1MB

    // 静态资源内联阈值
    assetsInlineLimit: 4096, // 4KB
  },
  // 实验性功能
  experimental: {
    renderBuiltUrl(filename, { hostType }) {
      // 为静态资源添加版本号和 CDN 支持
      if (hostType === 'js') {
        return { runtime: `window.__staticBase + ${JSON.stringify(filename)}` }
      }
      return filename
    }
  },

  // 定义全局常量
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
