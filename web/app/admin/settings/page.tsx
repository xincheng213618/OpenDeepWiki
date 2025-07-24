'use client'
import { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  AlertTriangle,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  getSettingGroups,
  batchUpdateSettings,
  resetSetting,
  clearCache,
  getRestartRequiredSettings,
  SystemSettingGroupOutput,
  SystemSettingOutput
} from '@/app/services/systemSettingService';

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingGroups, setSettingGroups] = useState<SystemSettingGroupOutput[]>([]);
  const [activeTab, setActiveTab] = useState('');
  const [changedSettings, setChangedSettings] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [restartRequired, setRestartRequired] = useState<string[]>([]);

  // 加载设置数据
  const loadSettings = async () => {
    try {
      setLoading(true);
      const [groupsResponse, restartResponse] = await Promise.all([
        getSettingGroups(),
        getRestartRequiredSettings()
      ]);

      if (groupsResponse.code === 200) {
        setSettingGroups(groupsResponse.data);
        if (groupsResponse.data.length > 0 && !activeTab) {
          setActiveTab(groupsResponse.data[0].group);
        }
      } else {
        toast({
          title: "加载失败",
          description: groupsResponse.message || '获取系统设置失败',
          variant: "destructive",
        });
      }

      if (restartResponse.code === 200) {
        setRestartRequired(restartResponse.data);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      toast({
        title: "加载失败",
        description: '获取系统设置失败',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 处理设置值变更
  const handleSettingChange = (key: string, value: string) => {
    setChangedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 保存设置
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const settings = Object.entries(changedSettings).map(([key, value]) => ({
        key,
        value
      }));

      if (settings.length === 0) {
        toast({
          title: "提示",
          description: "没有需要保存的更改",
        });
        return;
      }

      const response = await batchUpdateSettings({ settings });
      
      if (response.code === 200) {
        toast({
          title: "保存成功",
          description: `已更新 ${settings.length} 个设置项`,
        });
        setChangedSettings({});
        
        // 检查是否有需要重启的设置项
        const hasRestartRequired = settings.some(s => 
          settingGroups.some(g => 
            g.settings.some(setting => 
              setting.key === s.key && setting.requiresRestart
            )
          )
        );

        if (hasRestartRequired) {
          toast({
            title: "需要重启",
            description: "某些设置需要重启应用才能生效",
            variant: "destructive",
          });
        }

        // 重新加载设置
        await loadSettings();
      } else {
        toast({
          title: "保存失败",
          description: response.message || '保存设置失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('保存设置失败:', error);
      toast({
        title: "保存失败",
        description: '保存设置失败',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 重置单个设置
  const handleReset = async (key: string) => {
    try {
      const response = await resetSetting(key);
      if (response.code === 200) {
        toast({
          title: "重置成功",
          description: `设置 ${key} 已重置为默认值`,
        });
        
        // 从已更改的设置中移除
        setChangedSettings(prev => {
          const newChangedSettings = { ...prev };
          delete newChangedSettings[key];
          return newChangedSettings;
        });

        await loadSettings();
      } else {
        toast({
          title: "重置失败",
          description: response.message || '重置设置失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('重置设置失败:', error);
      toast({
        title: "重置失败",
        description: '重置设置失败',
        variant: "destructive",
      });
    }
  };

  // 清空缓存
  const handleClearCache = async () => {
    try {
      const response = await clearCache();
      if (response.code === 200) {
        toast({
          title: "清空成功",
          description: "配置缓存已清空",
        });
      } else {
        toast({
          title: "清空失败",
          description: response.message || '清空缓存失败',
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('清空缓存失败:', error);
      toast({
        title: "清空失败",
        description: '清空缓存失败',
        variant: "destructive",
      });
    }
  };

  // 切换敏感信息显示
  const toggleSensitive = (key: string) => {
    setShowSensitive(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 获取设置的当前值
  const getCurrentValue = (setting: SystemSettingOutput) => {
    return changedSettings[setting.key] ?? setting.value ?? setting.defaultValue ?? '';
  };

  // 检查是否为数值字段
  const isNumberField = (key: string) => {
    return ['Temperature', 'TopP', 'FrequencyPenalty', 'PresencePenalty'].includes(key);
  };

  // 获取输入框的最小值
  const getInputMin = (key: string) => {
    switch (key) {
      case 'Temperature':
      case 'TopP':
        return '0';
      case 'FrequencyPenalty':
      case 'PresencePenalty':
        return '-2';
      case 'ExpireMinutes':
      case 'RefreshExpireMinutes':
      case 'MaxFileReadCount':
      case 'MaxFileLimit':
        return '0';
      default:
        return undefined;
    }
  };

  // 获取输入框的最大值
  const getInputMax = (key: string) => {
    switch (key) {
      case 'Temperature':
        return '2';
      case 'TopP':
        return '1';
      case 'FrequencyPenalty':
      case 'PresencePenalty':
        return '2';
      default:
        return undefined;
    }
  };

  // 获取输入框的步长
  const getInputStep = (key: string) => {
    switch (key) {
      case 'Temperature':
      case 'TopP':
      case 'FrequencyPenalty':
      case 'PresencePenalty':
        return '0.1';
      default:
        return '1';
    }
  };

  // 获取占位符文本
  const getPlaceholder = (key: string) => {
    switch (key) {
      case 'Temperature':
        return '0.0-2.0，控制输出的随机性';
      case 'TopP':
        return '0.0-1.0，核采样参数';
      case 'FrequencyPenalty':
        return '-2.0-2.0，频率惩罚';
      case 'PresencePenalty':
        return '-2.0-2.0，存在惩罚';
      case 'ChatModel':
        return '如：gpt-4, gpt-3.5-turbo';
      case 'CatalogueFormat':
        return 'compact, json, pathlist, unix';
      default:
        return undefined;
    }
  };

  // 渲染设置输入控件
  const renderSettingInput = (setting: SystemSettingOutput) => {
    const currentValue = getCurrentValue(setting);
    const isChanged = setting.key in changedSettings;
    const isSensitive = setting.isSensitive && !showSensitive[setting.key];

    switch (setting.valueType.toLowerCase()) {
      case 'bool':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={currentValue === 'true'}
              onCheckedChange={(checked) => 
                handleSettingChange(setting.key, checked.toString())
              }
            />
            <Label>{currentValue === 'true' ? '启用' : '禁用'}</Label>
          </div>
        );

      case 'int':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className={isChanged ? 'border-orange-500' : ''}
            min={getInputMin(setting.key)}
            max={getInputMax(setting.key)}
            step={getInputStep(setting.key)}
          />
        );

      case 'array':
      case 'json':
        return (
          <Textarea
            value={currentValue}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className={isChanged ? 'border-orange-500' : ''}
            rows={3}
          />
        );

      default:
        return (
          <div className="relative">
            <Input
              type={isSensitive ? 'password' : isNumberField(setting.key) ? 'number' : 'text'}
              value={isSensitive ? '••••••••' : currentValue}
              onChange={(e) => handleSettingChange(setting.key, e.target.value)}
              className={isChanged ? 'border-orange-500' : ''}
              disabled={isSensitive}
              min={isNumberField(setting.key) ? getInputMin(setting.key) : undefined}
              max={isNumberField(setting.key) ? getInputMax(setting.key) : undefined}
              step={isNumberField(setting.key) ? getInputStep(setting.key) : undefined}
              placeholder={getPlaceholder(setting.key)}
            />
            {setting.isSensitive && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => toggleSensitive(setting.key)}
              >
                {showSensitive[setting.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-3">
            <SettingsIcon className="h-6 w-6" />
            系统设置
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            管理系统的全局配置设置
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleClearCache}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            清空缓存
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || Object.keys(changedSettings).length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? '保存中...' : `保存更改 (${Object.keys(changedSettings).length})`}
          </Button>
        </div>
      </div>

      {restartRequired.length > 0 && (
        <Alert className="border-orange-500">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            以下设置项需要重启应用才能生效：{restartRequired.join(', ')}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap gap-2">
          {settingGroups.map((group) => (
            <TabsTrigger key={group.group} value={group.group} className="px-6">
              {group.group}
              {group.settings.some(s => s.key in changedSettings) && (
                <Badge variant="secondary" className="ml-2 h-2 w-2 p-0" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {settingGroups.map((group) => (
          <TabsContent key={group.group} value={group.group}>
            <Card>
              <CardHeader>
                <CardTitle>{group.group} 配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {group.settings.map((setting) => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">
                          {setting.description || setting.key}
                        </Label>
                        {setting.requiresRestart && (
                          <Badge variant="destructive" className="text-xs">
                            需要重启
                          </Badge>
                        )}
                        {setting.isSensitive && (
                          <Badge variant="secondary" className="text-xs">
                            敏感信息
                          </Badge>
                        )}
                        {setting.key in changedSettings && (
                          <Badge variant="outline" className="text-xs">
                            已修改
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleReset(setting.key)}
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    </div>

                    {renderSettingInput(setting)}

                    <p className="text-xs text-muted-foreground">
                      键名: {setting.key}
                      {setting.defaultValue && (
                        <span className="ml-2">
                          默认值: {setting.isSensitive ? '***' : setting.defaultValue}
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
