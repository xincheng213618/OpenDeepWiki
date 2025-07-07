'use client';

import React, { useState, useEffect } from 'react';
import { Tree } from 'antd';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Database,
  Folder,
  Save,
  RefreshCw,
} from 'lucide-react';
import type { DataNode } from 'antd/es/tree';
import { roleService, Role } from '../../../services/roleService';
import {
  permissionService,
  WarehousePermissionTree,
  RolePermission,
  WarehousePermission,
} from '../../../services/permissionService';

// 类型定义
interface PermissionNode extends DataNode {
  key: string;
  title: React.ReactNode;
  children?: PermissionNode[];
  permission?: WarehousePermission;
  type: 'organization' | 'warehouse';
  isSelected: boolean;
}

interface NodePermissions {
  [nodeId: string]: {
    isReadOnly: boolean;
    isWrite: boolean;
    isDelete: boolean;
  };
}

const RolePermissionsPage: React.FC = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [nodePermissions, setNodePermissions] = useState<NodePermissions>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载角色列表
  const loadRoles = async () => {
    try {
      const allRoles = await roleService.getAllRoles();
      setRoles(allRoles.items.filter((role: Role) => !role.isSystemRole)); // 过滤系统角色
    } catch (error) {
      toast({ description: '加载角色列表失败', variant: 'destructive' });
      console.error('加载角色列表失败:', error);
    }
  };

  // 加载权限树
  const loadPermissionTree = async (roleId?: string) => {
    setLoading(true);
    try {
      const tree = await permissionService.getWarehousePermissionTree(roleId);
      const treeData = convertToTreeData(tree);
      setPermissionTree(treeData);
      
      // 设置已选中的节点
      const selected = tree.filter(node => isNodeSelected(node)).map(node => node.id);
      setCheckedKeys(selected);
      
      // 设置节点权限
      const permissions: NodePermissions = {};
      const buildNodePermissions = (nodes: WarehousePermissionTree[]) => {
        nodes.forEach(node => {
          if (node.type === 'warehouse' && node.permission) {
            permissions[node.id] = {
              isReadOnly: node.permission.isReadOnly,
              isWrite: node.permission.isWrite,
              isDelete: node.permission.isDelete,
            };
          } else if (node.type === 'warehouse') {
            permissions[node.id] = {
              isReadOnly: true,
              isWrite: false,
              isDelete: false,
            };
          }
          if (node.children) {
            buildNodePermissions(node.children);
          }
        });
      };
      buildNodePermissions(tree);
      setNodePermissions(permissions);
    } catch (error) {
      toast({ description: '加载权限树失败', variant: 'destructive' });
      console.error('加载权限树失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 递归检查节点是否被选中
  const isNodeSelected = (node: WarehousePermissionTree): boolean => {
    if (node.isSelected) return true;
    return node.children.some(child => isNodeSelected(child));
  };

  // 转换权限树数据格式
  const convertToTreeData = (tree: WarehousePermissionTree[]): PermissionNode[] => {
    return tree.map(node => ({
      key: node.id,
      title: node.name, // 先设置简单的标题
      children: node.children ? convertToTreeData(node.children) : undefined,
      permission: node.permission,
      type: node.type,
      isSelected: node.isSelected,
    }));
  };

  // 处理权限变更
  const handlePermissionChange = (nodeId: string, permissionType: 'isReadOnly' | 'isWrite' | 'isDelete', checked: boolean) => {
    setNodePermissions(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [permissionType]: checked,
      }
    }));
  };

  // 渲染树节点标题
  const renderTreeTitle = (nodeId: string, nodeName: string, nodeType: 'organization' | 'warehouse', isSelected: boolean, permission?: WarehousePermission) => {
    const icon = nodeType === 'organization' ? <Folder className="size-4 mr-1" /> : <Database className="size-4 mr-1" />;
    const currentPermissions = nodePermissions[nodeId] || {
      isReadOnly: permission?.isReadOnly || true,
      isWrite: permission?.isWrite || false,
      isDelete: permission?.isDelete || false,
    };
    
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{nodeName}</span>
          {isSelected && <Badge variant="success">已授权</Badge>}
        </div>
        {nodeType === 'warehouse' && checkedKeys.includes(nodeId) && (
          <div className="flex items-center gap-1">
            <Checkbox
              checked={currentPermissions.isReadOnly}
              onCheckedChange={(checked) =>
                handlePermissionChange(nodeId, 'isReadOnly', checked === true)
              }
            />
            <Badge variant="secondary">读</Badge>
            <Checkbox
              checked={currentPermissions.isWrite}
              onCheckedChange={(checked) =>
                handlePermissionChange(nodeId, 'isWrite', checked === true)
              }
            />
            <Badge variant="secondary">写</Badge>
            <Checkbox
              checked={currentPermissions.isDelete}
              onCheckedChange={(checked) =>
                handlePermissionChange(nodeId, 'isDelete', checked === true)
              }
            />
            <Badge variant="destructive">删</Badge>
          </div>
        )}
        {nodeType === 'warehouse' && !checkedKeys.includes(nodeId) && permission && (
          <div className="flex items-center gap-1">
            {permission.isReadOnly && <Badge variant="secondary">读</Badge>}
            {permission.isWrite && <Badge variant="secondary">写</Badge>}
            {permission.isDelete && <Badge variant="destructive">删</Badge>}
          </div>
        )}
      </div>
    );
  };

  // 获取渲染用的树数据
  const getTreeDataForRender = (): PermissionNode[] => {
    const updateTreeData = (nodes: PermissionNode[]): PermissionNode[] => {
      return nodes.map(node => ({
        ...node,
        title: renderTreeTitle(node.key, node.title as string, node.type, node.isSelected, node.permission),
        children: node.children ? updateTreeData(node.children) : undefined,
      }));
    };
    
    return updateTreeData(permissionTree);
  };

  // 处理角色选择变化
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    loadPermissionTree(roleId);
  };

  // 处理树节点选择
  const handleCheck = (checkedKeysValue: any) => {
    setCheckedKeys(checkedKeysValue);
    
    // 为新选中的仓库节点设置默认权限
    const newCheckedKeys = Array.isArray(checkedKeysValue) ? checkedKeysValue : checkedKeysValue.checked;
    const addedKeys = newCheckedKeys.filter((key: string) => !checkedKeys.includes(key));
    
    if (addedKeys.length > 0) {
      const newPermissions = { ...nodePermissions };
      addedKeys.forEach((key: string) => {
        const node = findNodeByKey(permissionTree, key);
        if (node && node.type === 'warehouse' && !newPermissions[key]) {
          newPermissions[key] = {
            isReadOnly: true,
            isWrite: false,
            isDelete: false,
          };
        }
      });
      setNodePermissions(newPermissions);
    }
  };

  // 查找节点
  const findNodeByKey = (nodes: PermissionNode[], key: string): PermissionNode | null => {
    for (const node of nodes) {
      if (node.key === key) {
        return node;
      }
      if (node.children) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  // 保存权限配置
  const handleSave = async () => {
    if (!selectedRoleId) {
      toast({ description: '请先选择角色' });
      return;
    }

    setSaving(true);
    try {
      // 获取选中的仓库权限
      const warehousePermissions: WarehousePermission[] = [];
      
      const getWarehousePermissions = (nodes: PermissionNode[], selectedKeys: string[]) => {
        nodes.forEach(node => {
          if (node.type === 'warehouse' && selectedKeys.includes(node.key)) {
            const permissions = nodePermissions[node.key] || {
              isReadOnly: true,
              isWrite: false,
              isDelete: false,
            };
            
            warehousePermissions.push({
              warehouseId: node.key,
              isReadOnly: permissions.isReadOnly,
              isWrite: permissions.isWrite,
              isDelete: permissions.isDelete,
            });
          }
          if (node.children) {
            getWarehousePermissions(node.children, selectedKeys);
          }
        });
      };

      getWarehousePermissions(permissionTree, checkedKeys);

      const rolePermission: RolePermission = {
        roleId: selectedRoleId,
        warehousePermissions,
      };

      await permissionService.setRolePermissions(rolePermission);
      toast({ description: '保存权限配置成功' });
      
      // 重新加载权限树以显示最新状态
      loadPermissionTree(selectedRoleId);
    } catch (error) {
      toast({ description: '保存权限配置失败', variant: 'destructive' });
      console.error('保存权限配置失败:', error);
    } finally {
      setSaving(false);
    }
  };

  // 刷新权限树
  const handleRefresh = () => {
    if (selectedRoleId) {
      loadPermissionTree(selectedRoleId);
    } else {
      loadPermissionTree();
    }
  };

  useEffect(() => {
    loadRoles();
    loadPermissionTree();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* 角色选择卡片 */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>角色权限配置</CardTitle>
          <CardDescription>先选择角色，再配置其仓库权限</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 w-64">
            <span className="text-sm whitespace-nowrap">选择角色：</span>
            <Select value={selectedRoleId} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择角色" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id} disabled={!role.isActive}>
                    <span className="flex items-center gap-2">
                      {role.name}
                      {!role.isActive && <Badge variant="destructive">禁用</Badge>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={!selectedRoleId || saving}>
              <Save className="size-4 mr-1" /> 保存配置
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="size-4 mr-1" /> 刷新
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 权限树卡片 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>仓库权限树</CardTitle>
          {selectedRoleId && (
            <Badge>已选择: {roles.find((r) => r.id === selectedRoleId)?.name}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-20">
              <Skeleton className="w-32 h-32" />
            </div>
          ) : (
            <>
              <div className="mb-4 text-xs text-muted-foreground flex items-center gap-2">
                <Badge>说明</Badge>
                <span>
                  选择组织将自动选择该组织下的所有仓库。选中仓库后，可以在右侧配置具体的读、写、删除权限。
                </span>
              </div>

              <Tree
                checkable
                checkedKeys={checkedKeys}
                onCheck={handleCheck as any}
                treeData={getTreeDataForRender()}
                height={500}
                className="border rounded-md p-2"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissionsPage; 