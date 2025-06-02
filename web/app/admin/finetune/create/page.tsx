'use client'

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Select, message, Space, Alert, Tag, Spin } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { createDataset, CreateDatasetInput } from '../../../services/fineTuningService';
import { getWarehouse } from '../../../services/warehouseService';

const { Option } = Select;
const { TextArea } = Input;

export default function CreateDatasetPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseLoading, setWarehouseLoading] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelLoading, setModelLoading] = useState(false);
  const router = useRouter();

  // 获取仓库列表
  useEffect(() => {
    const fetchWarehouses = async () => {
      setWarehouseLoading(true);
      try {
        const response = await getWarehouse(1, 100, ''); // 获取前100个仓库
        if (response.success && response.data) {
          setWarehouses(response.data.items || []);
        } else {
          message.error(response.error || '获取仓库列表失败');
        }
      } catch (error) {
        console.error('获取仓库列表失败:', error);
        message.error('获取仓库列表失败');
      } finally {
        setWarehouseLoading(false);
      }
    };

    fetchWarehouses();
  }, []);

  // 获取模型列表
  const fetchModels = async () => {
    const endpoint = form.getFieldValue('endpoint');
    const apiKey = form.getFieldValue('apiKey');

    if (!endpoint || !apiKey) {
      message.warning('请先填写API端点和API密钥');
      return;
    }

    setModelLoading(true);
    try {
      const response = await fetch(`${endpoint}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelIds = data.data.map((model: any) => model.id);
        setModels(modelIds);
        
        // 如果有模型，默认选择第一个
        if (modelIds.length > 0) {
          form.setFieldsValue({ model: modelIds[0] });
        }
      } else {
        throw new Error('无效的模型数据格式');
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
      message.error('获取模型列表失败，请检查API端点和密钥是否正确');
    } finally {
      setModelLoading(false);
    }
  };

  // 当API端点或密钥变化时尝试获取模型
  const handleApiInfoChange = () => {
    const endpoint = form.getFieldValue('endpoint');
    const apiKey = form.getFieldValue('apiKey');
    
    if (endpoint && apiKey) {
      fetchModels();
    }
  };

  // 提交表单
  const handleSubmit = async (values: CreateDatasetInput) => {
    setLoading(true);
    try {
      const response = await createDataset(values);
      if (response.success && response.data) {
        message.success('数据集创建成功');
        router.push('/admin/finetune');
      } else {
        message.error(response.error || '创建数据集失败');
      }
    } catch (error) {
      console.error('创建数据集失败:', error);
      message.error('创建数据集失败');
    } finally {
      setLoading(false);
    }
  };

  // 返回列表页
  const handleBack = () => {
    router.push('/admin/finetune');
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginRight: '8px' }}
        >
          返回
        </Button>
        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>创建新数据集</span>
      </div>

      <Card>
        <Alert
          message="创建微调数据集"
          description="微调数据集是用于训练模型的数据集合。您需要指定关联仓库、API端点和密钥等信息。"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="数据集名称"
            rules={[{ required: true, message: '请输入数据集名称' }]}
          >
            <Input placeholder="输入一个描述性的名称" />
          </Form.Item>

          <Form.Item
            name="warehouseId"
            label="选择仓库"
            initialValue={warehouses[0]?.id}
            rules={[{ required: true, message: '请选择关联的仓库' }]}
          >
            <Select
              placeholder="选择关联的知识库仓库"
              loading={warehouseLoading}
            >
              {warehouses.map(warehouse => (
                <Option key={warehouse.id} value={warehouse.id}>
                  {warehouse.organizationName}/{warehouse.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="endpoint"
            label="API端点"
            initialValue="https://api.token-ai.cn/v1"
            rules={[{ required: true, message: '请输入API端点' }]}
          >
            <Input 
              placeholder="例如: https://api.token-ai.cn/v1" 
              onBlur={handleApiInfoChange}
            />
          </Form.Item>

          <Form.Item
            name="apiKey"
            label="API密钥"
            rules={[{ required: true, message: '请输入API密钥' }]}
          >
            <Input.Password 
              placeholder="输入API密钥" 
              onBlur={handleApiInfoChange}
            />
          </Form.Item>
          
          <Form.Item
            name="model"
            label="选择模型"
            rules={[{ required: true, message: '请选择模型' }]}
            extra={
              <Button 
                type="link" 
                icon={<ReloadOutlined />} 
                onClick={fetchModels} 
                loading={modelLoading}
                style={{ padding: 0 }}
              >
                刷新模型列表
              </Button>
            }
          >
            <Select
              placeholder="选择用于生成数据集的模型"
              loading={modelLoading}
              // 支持搜索
              showSearch
              // 支持自己填写模型
              notFoundContent={modelLoading ? <Spin size="small" /> : (
                models.length === 0 ? "请先填写API端点和密钥并刷新" : "没有找到模型"
              )}
            >
              {models.map(model => (
                <Option key={model} value={model}>
                  {model}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="prompt"
            initialValue={
`
# AI Training Data Engineering System for LLaMA-Factory

## SYSTEM ROLE AND OBJECTIVE
You are an Advanced AI Training Data Engineer specializing in creating premium-quality fine-tuning datasets for large language models. Your mission is to transform Markdown documentation into comprehensive, diverse instruction-response pairs for LLaMA-Factory model training.

## INPUT SPECIFICATION
<markdown_content>
{{markdown_content}}
</markdown_content>

## QUALITY STANDARDS AND METRICS
### Coverage Requirements
- Achieve 100% content coverage across all document sections
- Include every technical detail, code example, and implementation scenario
- Capture all domain-specific terminology and concepts
- Address all edge cases and special considerations

### Format Quality Metrics
- Maintain source code fidelity with exact syntax and formatting
- Preserve all original structural elements (tables, lists, hierarchies)
- Implement consistent markdown formatting throughout responses
- Ensure JSON output validates against schema specification

## INSTRUCTION DESIGN FRAMEWORK
### Cognitive Complexity Distribution
1. **Foundational (20%)**
   - Knowledge recall
   - Basic comprehension
   - Term definitions
   
2. **Practical (30%)**
   - Implementation tasks
   - Code application
   - Procedure execution
   
3. **Analytical (30%)**
   - Pattern recognition
   - Comparative analysis
   - System relationships
   
4. **Advanced (20%)**
   - Design evaluation
   - Solution synthesis
   - Architecture decisions

### Instruction Format Matrix
| Format Type | Target % | Example Structure |
|-------------|----------|-------------------|
| Direct Questions | 20% | "What is [concept]?" |
| Implementation Commands | 25% | "Implement [feature] using [method]" |
| Scenario Challenges | 25% | "Given [scenario], solve [problem]" |
| Analysis Tasks | 15% | "Compare [A] and [B] approaches" |
| Synthesis Problems | 15% | "Design a solution that integrates [components]" |

## RESPONSE QUALITY FRAMEWORK
### Technical Accuracy Requirements
- Code examples must match document exactly
- All technical specifications must be preserved
- Implementation details must remain unchanged
- Domain terminology must be consistently applied

### Structural Requirements
- Use appropriate headings (h1-h6)
- Implement code blocks with language tags
- Format tables with proper alignment
- Preserve list hierarchies and numbering

### Validation Checklist
✓ Content completely addresses instruction
✓ Technical details are accurate
✓ Formatting is properly implemented
✓ Code examples are correctly rendered
✓ Domain terminology is accurate

output format：
<data>
[
{"instruction": "Instruction text", "input": "", "output": "Response content"},
...additional pairs...
]
</data>

### Quality Control Gates
1. Verify instruction diversity across format matrix
2. Confirm cognitive complexity distribution
3. Validate technical accuracy of all content
4. Check structural integrity of responses
5. Ensure JSON schema compliance

## EXECUTION PROTOCOL
1. Analyze document structure and content map
2. Design instruction set meeting all requirements
3. Generate detailed, accurate responses
4. Validate against quality framework
5. Format output in specified JSON structure

Begin processing now. Generate exactly 30-40 instruction-response pairs implementing all quality requirements within the specified JSON structure.
`}
            label={<>提示词模板插入参数：<Tag color="blue">{'{{markdown_content}}'}</Tag></>}
            rules={[{ required: true, message: '请输入提示词模板' }]}
          >
            <TextArea 
              rows={8} 
              placeholder="输入用于微调的提示词模板" 
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建数据集
              </Button>
              <Button onClick={handleBack}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
} 