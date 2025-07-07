'use client'
import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';

import { getUserList, createUser, updateUser, deleteUser, UserInfo, CreateUserRequest, UpdateUserRequest } from '../../services/userService';
import { roleService, Role } from '../../services/roleService';

export default function UsersPage() {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });

  // 加载角色数据
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await roleService.getRoleList(1, 100, '', true); // 只获取激活的角色
      setRoles(response.items);
    } catch (error) {
      console.error('加载角色数据失败:', error);
      toast({
        title: "错误",
        description: "加载角色数据失败",
        variant: "destructive",
      });
    } finally {
      setRolesLoading(false);
    }
  };

  // 加载用户数据
  const loadUsers = async (page = currentPage, size = pageSize, keyword = searchText) => {
    try {
      setLoading(true);
      const response = await getUserList(page, size, keyword);
      if (response.code === 200) {
        setUsers(response.data.items);
        setTotal(response.data.total);
      } else {
        toast({
          title: "错误",
          description: response.message || '获取用户列表失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
      toast({
        title: "错误",
        description: "加载用户数据失败",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    setCurrentPage(1); // 重置到第一页
    loadUsers(1, pageSize, searchText);
  };

  // 处理分页变化
  const handleTableChange = (pagination: any) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
    loadUsers(pagination.current, pagination.pageSize, searchText);
  };

  // 处理用户操作（编辑、删除等）
  const handleUserAction = async (action: string, user: UserInfo) => {
    if (action === 'edit') {
      setCurrentUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: '', // 不设置密码字段，让用户选择是否修改
      });
      setIsModalOpen(true);
    } else if (action === 'delete') {
      if (confirm(`确定要删除用户 ${user.name} 吗？此操作不可恢复。`)) {
        try {
          const response = await deleteUser(user.id);
          if (response.code === 200 && response.data) {
            toast({
              title: "成功",
              description: "用户删除成功",
            });
            loadUsers(); // 重新加载用户列表
          } else {
            toast({
              title: "错误",
              description: response.message || '删除用户失败',
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('删除用户失败:', error);
          toast({
            title: "错误",
            description: "删除用户失败",
            variant: "destructive",
          });
        }
      }
    }
  };

  // 处理表单提交（创建/更新用户）
  const handleFormSubmit = async () => {
    // 简单的表单验证
    if (!formData.name || !formData.email || (!currentUser && !formData.password)) {
      toast({
        title: "错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      });
      return;
    }

    try {
      if (currentUser) {
        // 更新用户
        const updateData: UpdateUserRequest = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          password: formData.password || undefined, // 如果没有输入密码，会是undefined
        };

        const response = await updateUser(currentUser.id, updateData);
        if (response.code === 200) {
          toast({
            title: "成功",
            description: "用户更新成功",
          });
          setIsModalOpen(false);
          loadUsers(); // 重新加载用户列表
        } else {
          toast({
            title: "错误",
            description: response.message || '更新用户失败',
            variant: "destructive",
          });
        }
      } else {
        // 创建用户
        const createData: CreateUserRequest = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        };

        const { data } = await createUser(createData) as any;
        if (data.code === 200) {
          toast({
            title: "成功",
            description: "用户创建成功",
          });
          setIsModalOpen(false);
          loadUsers(); // 重新加载用户列表
        } else {
          toast({
            title: "错误",
            description: data.message || '创建用户失败',
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('提交表单失败:', error);
      toast({
        title: "错误",
        description: "操作失败，请重试",
        variant: "destructive",
      });
    }
  };

  // 创建新用户
  const handleAddUser = () => {
    setCurrentUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: '',
    });
    setIsModalOpen(true);
  };

  // 根据角色获取标签颜色和样式
  const getRoleTagProps = (role: string) => {
    if (role === 'admin' || role === '管理员') {
      return {
        color: '#ff4d4f',
        backgroundColor: '#fff2f0',
        border: 'none',
        fontWeight: 500,
      };
    } else {
      return {
        color: '#1677ff',
        backgroundColor: '#e6f4ff',
        border: 'none',
        fontWeight: 500,
      };
    }
  };

  // 获取角色标签样式
  const getRoleBadgeVariant = (role: string) => {
    if (role === 'admin' || role === '管理员') {
      return 'destructive';
    }
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">用户管理</h1>
        <p className="text-sm text-muted-foreground mt-2">
          管理系统用户和权限设置
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              用户列表
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户名或邮箱"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadUsers(1, pageSize, searchText)}
                  className="pl-8 w-80"
                />
              </div>
              <Button
                onClick={() => loadUsers(1, pageSize, searchText)}
                variant="outline"
              >
                搜索
              </Button>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddUser}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {currentUser ? '编辑用户' : '添加用户'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">用户名</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="请输入用户名"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password">密码</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        placeholder={currentUser ? "留空则不修改密码" : "请输入密码"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">角色</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.name}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleFormSubmit}>
                        {currentUser ? '更新' : '创建'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {roles.find(r => r.name === user.role)?.name || user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '从未登录'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleUserAction('edit', user)}>
                          <Edit className="h-4 w-4 mr-2" />
                          编辑
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUserAction('delete', user)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}