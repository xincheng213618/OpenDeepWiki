# 管理后台认证测试说明

## 功能测试步骤

### 1. 设置登录状态

在浏览器控制台中执行以下代码来模拟登录：

```javascript
// 设置管理员登录
localStorage.setItem('userToken', 'admin-token-123');
localStorage.setItem('userName', '超级管理员');
localStorage.setItem('userInfo', JSON.stringify({
  role: 'admin',
  name: '超级管理员',
  id: '1'
}));

// 刷新页面
location.reload();
```

### 2. 测试管理员权限

管理员应该能看到所有菜单项：
- 数据统计
- 用户管理
- 仓库管理
- 微调数据
- 系统管理

### 3. 测试普通用户权限

```javascript
// 设置普通用户登录
localStorage.setItem('userToken', 'user-token-456');
localStorage.setItem('userName', '普通用户');
localStorage.setItem('userInfo', JSON.stringify({
  role: 'user',
  name: '普通用户',
  id: '2'
}));

// 刷新页面
location.reload();
```

普通用户只能看到受限菜单：
- 数据统计
- 微调数据

### 4. 测试退出登录功能

1. 点击右上角的用户头像
2. 在下拉菜单中点击"退出登录"
3. 验证：
   - 页面跳转到登录页面
   - localStorage中的认证信息被清除
   - 控制台输出退出日志

### 5. 验证清除的数据

退出登录后，在控制台检查：

```javascript
// 这些应该都返回null
console.log('userToken:', localStorage.getItem('userToken'));
console.log('userName:', localStorage.getItem('userName'));
console.log('userInfo:', localStorage.getItem('userInfo'));
console.log('redirectPath:', localStorage.getItem('redirectPath'));
```

## 功能特性

### 下拉菜单交互
- 点击头像区域显示/隐藏下拉菜单
- 点击空白处自动关闭下拉菜单
- 菜单项有hover效果
- 退出登录按钮使用红色突出显示

### 角色权限控制
- admin：完整菜单权限
- 其他角色：受限菜单权限
- 控制台输出调试信息

### 安全清理
- 退出时清除所有用户相关数据
- 重置组件状态
- 自动跳转到登录页面 