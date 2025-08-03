'use client';

import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import {
  Database,
  Folder,
  Save,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';
import { roleService, Role } from '../../../services/roleService';
import {
  permissionService,
  WarehousePermissionTree,
  RolePermission,
  WarehousePermission,
} from '../../../services/permissionService';

// 类型定义
interface PermissionNode {
  key: string;
  title: string;
  children?: PermissionNode[];
  permission?: WarehousePermission;
  type: 'organization' | 'warehouse';
  isSelected: boolean;
  expanded?: boolean;
}

interface NodePermissions {
  [nodeId: string]: {
    isReadOnly: boolean;
    isWrite: boolean;
    isDelete: boolean;
  };
}

// 虚拟滚动相关常量
const ITEM_HEIGHT = 40; // 每个节点的高度
const CONTAINER_HEIGHT = 500; // 容器高度
const VISIBLE_ITEMS = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT) + 2; // 可见项目数 + 缓冲

const RolePermissionsPage: React.FC = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissionTree, setPermissionTree] = useState<PermissionNode[]>([]);
  const [filteredTree, setFilteredTree] = useState<PermissionNode[]>([]);
  const [flattenedNodes, setFlattenedNodes] = useState<(PermissionNode & { level: number })[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [nodePermissions, setNodePermissions] = useState<NodePermissions>({});
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [scrollTop, setScrollTop] = useState(0);
  const [useVirtualScrolling, setUseVirtualScrolling] = useState(false);

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
      
      // 递归收集所有已选中的节点
      const collectSelectedNodes = (nodes: WarehousePermissionTree[]): string[] => {
        const selected: string[] = [];
        nodes.forEach(node => {
          if (node.isSelected) {
            selected.push(node.id);
          }
          if (node.children && node.children.length > 0) {
            selected.push(...collectSelectedNodes(node.children));
          }
        });
        return selected;
      };
      
      const selected = collectSelectedNodes(tree);
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

  // 将树结构展开为平面列表（用于虚拟滚动）
  const flattenTree = (nodes: PermissionNode[], level: number = 0): (PermissionNode & { level: number })[] => {
    const flattened: (PermissionNode & { level: number })[] = [];
    
    nodes.forEach(node => {
      flattened.push({ ...node, level });
      
      if (node.children && expandedKeys.includes(node.key)) {
        flattened.push(...flattenTree(node.children, level + 1));
      }
    });
    
    return flattened;
  };
  
  // 搜索过滤树节点
  const filterTree = (nodes: PermissionNode[], searchText: string): PermissionNode[] => {
    if (!searchText.trim()) return nodes;
    
    const filtered: PermissionNode[] = [];
    
    const searchInNode = (node: PermissionNode): PermissionNode | null => {
      const matchesSearch = node.title.toLowerCase().includes(searchText.toLowerCase());
      const filteredChildren = node.children ? node.children.map(child => searchInNode(child)).filter(Boolean) as PermissionNode[] : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren,
        };
      }
      
      return null;
    };
    
    nodes.forEach(node => {
      const result = searchInNode(node);
      if (result) {
        filtered.push(result);
      }
    });
    
    return filtered;
  };
  
  // 处理搜索输入
  const handleSearch = (value: string) => {
    setSearchValue(value);
    const filtered = filterTree(permissionTree, value);
    setFilteredTree(filtered);
    
    // 搜索时自动展开所有匹配的节点
    if (value.trim()) {
      const expandedKeys = new Set<string>();
      const collectExpandedKeys = (nodes: PermissionNode[]) => {
        nodes.forEach(node => {
          if (node.children && node.children.length > 0) {
            expandedKeys.add(node.key);
            collectExpandedKeys(node.children);
          }
        });
      };
      collectExpandedKeys(filtered);
      setExpandedKeys(Array.from(expandedKeys));
    }
  };

  // 转换权限树数据格式
  const convertToTreeData = (tree: WarehousePermissionTree[]): PermissionNode[] => {
    return tree.map(node => ({
      key: node.id,
      title: node.name,
      children: node.children ? convertToTreeData(node.children) : undefined,
      permission: node.permission,
      type: node.type,
      isSelected: node.isSelected,
      expanded: expandedKeys.includes(node.id),
    }));
  };

  // 切换节点展开状态
  const toggleExpanded = (nodeKey: string) => {
    setExpandedKeys(prev =>
      prev.includes(nodeKey)
        ? prev.filter(key => key !== nodeKey)
        : [...prev, nodeKey]
    );
  };

  // 切换节点选中状态
  const toggleChecked = (nodeKey: string) => {
    setCheckedKeys(prev => {
      const isCurrentlyChecked = prev.includes(nodeKey);
      let newCheckedKeys: string[];
      
      if (isCurrentlyChecked) {
        // 取消选中：移除该节点及其所有子节点
        const nodeToRemove = findNodeByKey(filteredTree, nodeKey);
        const nodesToRemove = new Set([nodeKey]);
        
        if (nodeToRemove) {
          const collectChildKeys = (node: PermissionNode) => {
            if (node.children) {
              node.children.forEach(child => {
                nodesToRemove.add(child.key);
                collectChildKeys(child);
              });
            }
          };
          collectChildKeys(nodeToRemove);
        }
        
        newCheckedKeys = prev.filter(key => !nodesToRemove.has(key));
      } else {
        // 选中：添加该节点
        newCheckedKeys = [...prev, nodeKey];
        
        // 为新选中的仓库节点设置默认权限
        const node = findNodeByKey(filteredTree, nodeKey);
        if (node && node.type === 'warehouse' && !nodePermissions[nodeKey]) {
          setNodePermissions(prevPermissions => ({
            ...prevPermissions,
            [nodeKey]: {
              isReadOnly: true,
              isWrite: false,
              isDelete: false,
            }
          }));
        }
        
        // 如果是组织节点，自动选中所有子仓库
        if (node && node.type === 'organization' && node.children) {
          const collectWarehouseKeys = (nodes: PermissionNode[]): string[] => {
            const keys: string[] = [];
            nodes.forEach(child => {
              if (child.type === 'warehouse') {
                keys.push(child.key);
                // 为仓库设置默认权限
                if (!nodePermissions[child.key]) {
                  setNodePermissions(prevPermissions => ({
                    ...prevPermissions,
                    [child.key]: {
                      isReadOnly: true,
                      isWrite: false,
                      isDelete: false,
                    }
                  }));
                }
              } else if (child.children) {
                keys.push(...collectWarehouseKeys(child.children));
              }
            });
            return keys;
          };
          
          const warehouseKeys = collectWarehouseKeys(node.children);
          newCheckedKeys = [...newCheckedKeys, ...warehouseKeys];
        }
      }

      return newCheckedKeys;
    });
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

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  // 渲染自定义树节点
  const renderTreeNode = (node: PermissionNode, level: number = 0): React.ReactNode => {
    const isChecked = checkedKeys.includes(node.key);
    const isExpanded = expandedKeys.includes(node.key);
    const hasChildren = node.children && node.children.length > 0;
    const icon = node.type === 'organization' ? <Folder className="size-4" /> : <Database className="size-4" />;

    const currentPermissions = nodePermissions[node.key] || {
      isReadOnly: node.permission?.isReadOnly || true,
      isWrite: node.permission?.isWrite || false,
      isDelete: node.permission?.isDelete || false,
    };

    return (
      <div key={node.key} className="select-none">
        <div
          className="flex items-center justify-between p-2 hover:bg-accent rounded-md"
          style={{ paddingLeft: `${level * 20 + 8}px` }}
        >
          <div className="flex items-center gap-2 flex-1">
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0"
                onClick={() => toggleExpanded(node.key)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}
            {!hasChildren && <div className="w-4" />}

            <Checkbox
              checked={isChecked}
              onCheckedChange={() => toggleChecked(node.key)}
            />

            {icon}
            <span className="text-sm">{node.title}</span>
            {node.permission && node.isSelected && <Badge variant="default">已授权</Badge>}
          </div>

          {node.type === 'warehouse' && isChecked && (
            <div className="flex items-center gap-1">
              <Checkbox
                checked={currentPermissions.isReadOnly}
                onCheckedChange={(checked) =>
                  handlePermissionChange(node.key, 'isReadOnly', checked === true)
                }
              />
              <Badge variant="secondary">读</Badge>
              <Checkbox
                checked={currentPermissions.isWrite}
                onCheckedChange={(checked) =>
                  handlePermissionChange(node.key, 'isWrite', checked === true)
                }
              />
              <Badge variant="secondary">写</Badge>
              <Checkbox
                checked={currentPermissions.isDelete}
                onCheckedChange={(checked) =>
                  handlePermissionChange(node.key, 'isDelete', checked === true)
                }
              />
              <Badge variant="destructive">删</Badge>
            </div>
          )}

          {node.type === 'warehouse' && !isChecked && node.permission && node.isSelected && (
            <div className="flex items-center gap-1">
              {node.permission.isReadOnly && <Badge variant="secondary">读</Badge>}
              {node.permission.isWrite && <Badge variant="secondary">写</Badge>}
              {node.permission.isDelete && <Badge variant="destructive">删</Badge>}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };



  // 处理角色选择变化
  const handleRoleChange = (roleId: string) => {
    setSelectedRoleId(roleId);
    loadPermissionTree(roleId);
  };



  // 查找节点（优化版本，支持缓存）
  const findNodeByKey = (nodes: PermissionNode[], key: string): PermissionNode | null => {
    const search = (nodeList: PermissionNode[]): PermissionNode | null => {
      for (const node of nodeList) {
        if (node.key === key) {
          return node;
        }
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    return search(nodes);
  };

  // 保存权限配置
  const handleSave = async () => {
    if (!selectedRoleId) {
      toast({ description: '请先选择角色', variant: 'destructive' });
      return;
    }

    // 验证是否有选中的仓库
    const warehouseCount = checkedKeys.filter(key => {
      const node = findNodeByKey(permissionTree, key);
      return node && node.type === 'warehouse';
    }).length;
    
    if (warehouseCount === 0) {
      toast({ description: '请至少选择一个仓库', variant: 'destructive' });
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
            
            // 验证权限设置的合理性
            if (!permissions.isReadOnly && !permissions.isWrite && !permissions.isDelete) {
              toast({ 
                description: `仓库 "${node.title}" 至少需要一个权限`, 
                variant: 'destructive' 
              });
              throw new Error('权限设置不合理');
            }
            
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
      toast({ description: `保存成功，共配置了 ${warehousePermissions.length} 个仓库的权限` });
      
      // 重新加载权限树以显示最新状态
      await loadPermissionTree(selectedRoleId);
    } catch (error) {
      if (error instanceof Error && error.message === '权限设置不合理') {
        // 已经显示了具体错误信息
        return;
      }
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

  // 组件初始化时加载数据
  useEffect(() => {
    loadRoles();
    loadPermissionTree();
  }, []);

  // 当权限树数据加载完成后，设置默认展开的节点和过滤树
  useEffect(() => {
    if (permissionTree.length > 0) {
      // 默认展开所有组织节点
      const expandAllOrganizations = (nodes: PermissionNode[]): string[] => {
        const keys: string[] = [];
        nodes.forEach(node => {
          if (node.type === 'organization') {
            keys.push(node.key);
          }
          if (node.children) {
            keys.push(...expandAllOrganizations(node.children));
          }
        });
        return keys;
      };

      setExpandedKeys(expandAllOrganizations(permissionTree));
      // 初始化过滤树
      setFilteredTree(permissionTree);
      
      // 检查是否需要启用虚拟滚动（超过100个节点）
      const totalNodes = flattenTree(permissionTree).length;
      setUseVirtualScrolling(totalNodes > 100);
    }
  }, [permissionTree]);
  
  // 当搜索值或展开状态变化时，更新过滤树和平面列表
  useEffect(() => {
    const filtered = filterTree(permissionTree, searchValue);
    setFilteredTree(filtered);
    
    if (useVirtualScrolling) {
      const flattened = flattenTree(filtered);
      setFlattenedNodes(flattened);
    }
  }, [permissionTree, searchValue, expandedKeys, useVirtualScrolling]);

  return (
    <div className="p-6 space-y-6">
      {/* 角色选择卡片 */}
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle>角色权限配置</CardTitle>
          <CardDescription>先选择角色，再配置其仓库权限</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
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
          </div>
          
          {/* 搜索框 */}
          <div className="flex items-center gap-2 w-64">
            <Search className="size-4 text-muted-foreground" />
            <Input
              placeholder="搜索仓库或组织..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full"
            />
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
              <div className="mb-4 space-y-2">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Badge>说明</Badge>
                  <span>
                    选择组织将自动选择该组织下的所有仓库。选中仓库后，可以在右侧配置具体的读、写、删除权限。
                  </span>
                </div>
                {useVirtualScrolling && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="outline">性能优化</Badge>
                    <span>检测到大量数据，已启用虚拟滚动优化加载性能。</span>
                  </div>
                )}
                {checkedKeys.length > 0 && (
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Badge variant="secondary">统计</Badge>
                    <span>已选中 {checkedKeys.filter(key => {
                      const node = findNodeByKey(filteredTree, key);
                      return node && node.type === 'warehouse';
                    }).length} 个仓库</span>
                  </div>
                )}
              </div>

              <div className="border rounded-md p-4 max-h-[500px] overflow-y-auto" onScroll={handleScroll}>
                {filteredTree.length > 0 ? (
                  useVirtualScrolling && flattenedNodes.length > 100 ? (
                    // 虚拟滚动模式
                    <div style={{ height: flattenedNodes.length * ITEM_HEIGHT }}>
                      <div
                        style={{
                          transform: `translateY(${Math.floor(scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT}px)`,
                          position: 'relative',
                        }}
                      >
                        {flattenedNodes
                          .slice(
                            Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 1),
                            Math.min(flattenedNodes.length, Math.floor(scrollTop / ITEM_HEIGHT) + VISIBLE_ITEMS)
                          )
                          .map((node, index) => (
                            <div key={`${node.key}-${index}`} style={{ height: ITEM_HEIGHT }}>
                              {renderTreeNode(node, node.level)}
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    // 普通模式
                    filteredTree.map(node => renderTreeNode(node))
                  )
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {searchValue.trim() ? '未找到匹配的仓库或组织' : '暂无数据'}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RolePermissionsPage; 