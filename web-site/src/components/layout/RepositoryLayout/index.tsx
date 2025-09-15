// 仓库详情页专用布局

import { useEffect } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FumadocsSidebar } from '@/components/layout/FumadocsSidebar'
import { useRepositoryDetailStore } from '@/stores/repositoryDetail.store'
import {
  Github,
  Home,
  Download,
  ChevronLeft,
  Menu,
  X,
  Search
} from 'lucide-react'

interface RepositoryLayoutProps {
  children?: React.ReactNode
}

export const RepositoryLayout: React.FC<RepositoryLayoutProps> = ({ children }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { owner, name } = useParams<{ owner: string; name: string }>()

  // 使用store
  const {
    branches,
    selectedBranch,
    loadingBranches,
    documentNodes,
    selectedNode,
    loadingDocuments,
    sidebarOpen,
    mobileMenuOpen,
    error,
    setRepository,
    fetchBranches,
    selectBranch,
    selectNode,
    setSidebarOpen,
    setMobileMenuOpen,
    clearError,
    reset
  } = useRepositoryDetailStore()

  // 处理节点选择
  const handleNodeSelect = (node: any) => {
    selectNode(node)
    // 导航到文档页面
    if (node.type === 'file' && owner && name) {
      navigate(`/${owner}/${name}/docs/${encodeURIComponent(node.path)}`)
    }
    // 移动端关闭菜单
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false)
    }
  }

  // 初始化
  useEffect(() => {
    if (owner && name) {
      setRepository(owner, name)
      fetchBranches()
    }

    return () => {
      // 组件卸载时重置store
      reset()
    }
  }, [owner, name])

  // 移动端关闭菜单
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-4 flex-1">
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Logo/Home */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hidden lg:flex"
            >
              <Home className="h-5 w-5" />
            </Button>

            {/* 面包屑 */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
              >
                {t('nav.repositories')}
              </Button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{owner}</span>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{name}</span>
            </div>
          </div>

          {/* 右侧操作按钮 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
            >
              <Download className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(`https://github.com/${owner}/${name}`, '_blank')}
            >
              <Github className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 侧边栏 - 桌面端 */}
        <aside
          className={cn(
            "hidden lg:block w-72 min-h-[calc(100vh-3.5rem)]",
            "transition-all duration-300",
            !sidebarOpen && "lg:w-0 lg:overflow-hidden"
          )}
        >
          {owner && name && (
            <FumadocsSidebar
              owner={owner}
              name={name}
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchChange={selectBranch}
              documentNodes={documentNodes}
              selectedPath={selectedNode?.path}
              onSelectNode={handleNodeSelect}
              loading={loadingBranches || loadingDocuments}
              className="h-[calc(100vh-3.5rem)]"
            />
          )}
        </aside>

        {/* 侧边栏 - 移动端 */}
        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-72 bg-background lg:hidden">
              {owner && name && (
                <FumadocsSidebar
                  owner={owner}
                  name={name}
                  branches={branches}
                  selectedBranch={selectedBranch}
                  onBranchChange={selectBranch}
                  documentNodes={documentNodes}
                  selectedPath={selectedNode?.path}
                  onSelectNode={handleNodeSelect}
                  loading={loadingBranches || loadingDocuments}
                  className="h-full"
                />
              )}
            </aside>
          </>
        )}

        {/* 主内容区 */}
        <main className="flex-1 min-h-[calc(100vh-3.5rem)]">
          <div className="container mx-auto p-6">
            {children || <Outlet context={{ branch: selectedBranch, selectedNode }} />}
          </div>
        </main>

        {/* 侧边栏切换按钮 - 桌面端 */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "hidden lg:flex fixed top-20 transition-all duration-300 z-30",
            sidebarOpen ? "left-[17rem]" : "left-2"
          )}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform",
            !sidebarOpen && "rotate-180"
          )} />
        </Button>
      </div>
    </div>
  )
}

export default RepositoryLayout