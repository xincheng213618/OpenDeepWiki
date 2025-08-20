'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
  User,
  Shield,
  Settings,
  Save,
  Camera,
  CheckCircle,
  Upload,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';

import {
  getCurrentUser,
  updateCurrentUserProfile,
  verifyPassword,
  changePassword,
  uploadAvatar,
  type UserInfo,
  type UpdateProfileRequest,
  type ChangePasswordRequest
} from '../services/userService';
import AppManagement from '../components/AppManagement';

// 表单验证模式
const profileFormSchema = z.object({
  name: z.string().min(2, '用户名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string()
    .min(8, '密码至少8个字符')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/, '密码必须包含大小写字母和数字'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export default function SettingsPage() {
  const router = useRouter();

  // 表单实例
  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  // 获取当前用户信息
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const { data } = await getCurrentUser() as any;
        if (data) {
          const user = data.data;
          // 添加时间戳参数到头像URL以防止浏览器缓存
          const timestamp = new Date().getTime();
          const avatarWithTimestamp = user.avatar ? `${user.avatar}?t=${timestamp}` : '';
          setUserInfo(user);
          setAvatarUrl(avatarWithTimestamp);

          profileForm.setValue('name', user.name || '');
          profileForm.setValue('email', user.email || '');
        } else {
          const storedUserInfo = localStorage.getItem('userInfo');
          if (storedUserInfo) {
            const user = JSON.parse(storedUserInfo);
            // 添加时间戳参数到头像URL以防止浏览器缓存
            const timestamp = new Date().getTime();
            const avatarWithTimestamp = user.avatar ? `${user.avatar}?t=${timestamp}` : '';
            setUserInfo(user);
            setAvatarUrl(avatarWithTimestamp);

            profileForm.setValue('name', user.name || '');
            profileForm.setValue('email', user.email || '');
          } else {
            toast.error('获取用户信息失败，请重新登录');
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('加载用户信息失败:', error);
        toast.error('加载用户信息失败');
      }
    };

    loadUserInfo();
  }, [profileForm, router]);

  // 处理个人信息更新
  const handleProfileUpdate = async (values: z.infer<typeof profileFormSchema>) => {
    if (!userInfo) return;

    try {
      setLoading(true);

      const updateData: UpdateProfileRequest = {
        name: values.name,
        email: values.email,
        avatar: avatarUrl,
      };

      const { data } = await updateCurrentUserProfile(updateData) as any;
      if (data.code === 200) {
        toast.success('个人信息更新成功');
        const updatedUser = { ...userInfo, ...updateData };
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
        setUserInfo(updatedUser);
      } else {
        toast.error(data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      toast.error('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理密码修改
  const handlePasswordChange = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!userInfo) return;

    try {
      setLoading(true);

      const verifyResponse = await verifyPassword(values.currentPassword);
      if (verifyResponse.code !== 200 || !verifyResponse.data) {
        toast.error('当前密码不正确');
        return;
      }

      const changePasswordData: ChangePasswordRequest = {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      };

      const response = await changePassword(changePasswordData);
      if (response.code === 200) {
        toast.success('密码修改成功');
        passwordForm.reset();
      } else {
        toast.error(response.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
      toast.error('修改密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 头像上传处理
  const handleAvatarUpload = async (file: File) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
    if (!isJpgOrPng) {
      toast.error('只能上传 JPG/PNG/GIF 格式的图片!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      toast.error('图片大小不能超过 2MB!');
      return false;
    }

    try {
      setAvatarUploading(true);
      const { data } = await uploadAvatar(file) as any;
      if (data.code === 200 && data.data) {
        // 添加时间戳参数到头像URL以防止浏览器缓存
        const timestamp = new Date().getTime();
        const avatarUrl = `${data.data}?t=${timestamp}`;
        setAvatarUrl(avatarUrl);
        toast.success('头像上传成功');

        if (userInfo) {
          const updateData: UpdateProfileRequest = {
            name: userInfo.name,
            email: userInfo.email,
            avatar: avatarUrl,
          };

          const { data } = await updateCurrentUserProfile(updateData) as any;
          if (data.code === 200) {
            const updatedUser = { ...userInfo, avatar: avatarUrl };
            localStorage.setItem('userInfo', JSON.stringify(updatedUser));
            setUserInfo(updatedUser);
          }
        }
      } else {
        toast.error(data.message || '头像上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      toast.error('头像上传失败，请重试');
    } finally {
      setAvatarUploading(false);
    }

    return false;
  };

  // 返回首页
  const handleGoHome = () => {
    router.push('/');
  };

  // 侧边栏菜单项
  const menuItems = [
    {
      key: 'profile',
      icon: <User className="w-4 h-4" />,
      title: '账户信息',
    },
    {
      key: 'security',
      icon: <Shield className="w-4 h-4" />,
      title: '安全设置',
    },
    {
      key: 'apps',
      icon: <Settings className="w-4 h-4" />,
      title: '应用管理',
    }
  ];

  // 渲染内容区域
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="pb-6 border-b">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">账户信息</h2>
              <p className="text-lg text-muted-foreground">管理您的个人资料和基本信息</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* 头像卡片 */}
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-8 pb-8">
                  <div className="flex flex-col items-center space-y-6">
                    <div className="relative group">
                      <div className="relative">
                        <Avatar className="w-24 h-24 ring-4 ring-background shadow-xl transition-all duration-300 group-hover:ring-primary/20">
                          <AvatarImage src={avatarUrl} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5">
                            <User className="w-10 h-10 text-primary" />
                          </AvatarFallback>
                        </Avatar>
                        {avatarUploading && (
                          <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={avatarUploading}
                        className="absolute -bottom-1 -right-1 rounded-full w-10 h-10 p-0 shadow-lg border-2 border-background bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/jpeg,image/png,image/gif';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handleAvatarUpload(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {avatarUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <div className="text-center space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg text-foreground">{userInfo?.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{userInfo?.email}</p>
                      </div>
                      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已验证
                      </Badge>
                      <p className="text-xs text-muted-foreground px-4">
                        支持 JPG、PNG、GIF 格式，文件大小不超过 2MB
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 基本信息表单 */}
              <Card className="lg:col-span-3 border-0 shadow-lg">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    基本信息
                  </CardTitle>
                  <CardDescription className="text-base">
                    管理您的个人资料信息
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={profileForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-medium text-foreground">用户名</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="请输入用户名" 
                                  className="h-11 border-2 focus:border-primary transition-colors" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-medium text-foreground">邮箱地址</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="请输入邮箱地址" 
                                  className="h-11 border-2 focus:border-primary transition-colors" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="pt-4 border-t">
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          className="h-11 px-8 bg-primary hover:bg-primary/90 transition-all duration-200"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              保存中...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              保存更改
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="pb-6 border-b">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">安全设置</h2>
              <p className="text-lg text-muted-foreground">管理您的账户安全和密码设置</p>
            </div>

            <div className="max-w-3xl">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    修改密码
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    定期更改密码有助于保护您的账户安全。请确保使用强密码。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-6">
                      <div className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel className="text-sm font-medium text-foreground">当前密码</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="请输入当前密码" 
                                  className="h-11 border-2 focus:border-primary transition-colors" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={passwordForm.control}
                            name="newPassword"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-sm font-medium text-foreground">新密码</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="请输入新密码" 
                                    className="h-11 border-2 focus:border-primary transition-colors" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription className="text-xs text-muted-foreground">
                                  密码必须至少8个字符，包含大小写字母和数字
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={passwordForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem className="space-y-3">
                                <FormLabel className="text-sm font-medium text-foreground">确认新密码</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="password" 
                                    placeholder="请再次输入新密码" 
                                    className="h-11 border-2 focus:border-primary transition-colors" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Button 
                          type="submit" 
                          disabled={loading} 
                          className="h-11 px-8 bg-primary hover:bg-primary/90 transition-all duration-200"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              更新中...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              更新密码
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'apps':
        return (
          <div className="space-y-6">
            <div className="pb-6 border-b">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-3">应用管理</h2>
              <p className="text-lg text-muted-foreground">管理与您账户连接的应用</p>
            </div>
            <div className="max-w-3xl">
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-6">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    应用管理
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    管理您的应用偏好设置和通知选项
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium cursor-pointer">邮件通知</Label>
                        <p className="text-sm text-muted-foreground">
                          接收重要更新和通知邮件
                        </p>
                      </div>
                      <Switch className="data-[state=checked]:bg-primary" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium cursor-pointer">桌面通知</Label>
                        <p className="text-sm text-muted-foreground">
                          在桌面显示实时通知
                        </p>
                      </div>
                      <Switch className="data-[state=checked]:bg-primary" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="space-y-1">
                        <Label className="text-base font-medium cursor-pointer">自动保存</Label>
                        <p className="text-sm text-muted-foreground">
                          自动保存您的工作进度
                        </p>
                      </div>
                      <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Settings className="w-4 h-4" />
                      <span>设置将自动保存</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>设置</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map(item => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        onClick={() => setActiveSection(item.key)}
                        isActive={activeSection === item.key}
                        className="w-full"
                      >
                        {item.icon}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main content */}
        <SidebarInset className="flex-1 bg-gradient-to-br from-background via-background to-muted/20">
          {/* 顶部导航栏 */}
          <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center gap-4 px-6 py-4">
              <SidebarTrigger className="hover:bg-muted/50 transition-colors" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoHome}
                className="gap-2 hover:bg-muted/50 transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">设置</h1>
              </div>
            </div>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 p-8 max-w-7xl mx-auto">
            {loading && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">更新中...</p>
                </div>
              </div>
            )}
            {renderContent()}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}