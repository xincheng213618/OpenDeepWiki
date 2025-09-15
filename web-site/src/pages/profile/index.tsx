// 用户个人资料页面
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { ProfileInfo } from './components/ProfileInfo'
import { AppManagement } from './components/AppManagement'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')

  // 如果未登录，重定向到登录页
  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 返回按钮 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>

        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">个人中心</h1>
          <p className="text-muted-foreground">
            管理您的个人资料和应用配置
          </p>
        </div>

        {/* 选项卡内容 */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">个人资料</TabsTrigger>
            <TabsTrigger value="apps">应用管理</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="p-6">
              <ProfileInfo />
            </Card>
          </TabsContent>

          <TabsContent value="apps" className="space-y-6">
            <Card className="p-6">
              <AppManagement />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProfilePage