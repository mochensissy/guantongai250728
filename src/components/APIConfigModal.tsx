/**
 * API配置模态框组件
 * 
 * 提供用户配置AI服务API的界面：
 * - 支持多个AI服务提供商选择
 * - API密钥输入和验证
 * - 连接测试功能
 * - 配置保存和管理
 */

import React, { useState, useEffect } from 'react';
import { Settings, Check, AlertCircle } from 'lucide-react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import { APIConfig } from '../types';
import { getSupportedProviders, testAPIConnection } from '../utils/aiService';

interface APIConfigModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 当前API配置 */
  currentConfig?: APIConfig | null;
  /** 配置保存回调 */
  onSave: (config: APIConfig) => void;
}

const APIConfigModal: React.FC<APIConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  // 表单状态
  const [formData, setFormData] = useState<APIConfig>({
    provider: 'openai',
    apiKey: '',
    baseUrl: '',
    model: '',
  });

  // UI状态
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 支持的AI服务商
  const providers = getSupportedProviders();

  // 初始化表单数据
  useEffect(() => {
    if (currentConfig) {
      setFormData(currentConfig);
    } else {
      setFormData({
        provider: 'openai',
        apiKey: '',
        baseUrl: '',
        model: '',
      });
    }
    setTestResult(null);
  }, [currentConfig, isOpen]);

  /**
   * 处理表单字段变化
   */
  const handleFieldChange = (field: keyof APIConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // 清除之前的测试结果
    if (field === 'apiKey' || field === 'provider') {
      setTestResult(null);
    }
  };

  /**
   * 处理提供商选择变化
   */
  const handleProviderChange = (providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    setFormData(prev => ({
      ...prev,
      provider: providerId as APIConfig['provider'],
      model: provider?.defaultModel || '',
    }));
    setTestResult(null);
  };

  /**
   * 测试API连接
   */
  const handleTestConnection = async () => {
    if (!formData.apiKey.trim()) {
      setTestResult({
        success: false,
        message: '请先输入API密钥',
      });
      return;
    }

    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await testAPIConnection(formData);
      
      setTestResult({
        success: result.success,
        message: result.success 
          ? 'API连接测试成功！' 
          : result.error || '连接测试失败',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: '连接测试失败：网络错误',
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  /**
   * 保存配置
   */
  const handleSave = async () => {
    if (!formData.apiKey.trim()) {
      setTestResult({
        success: false,
        message: '请输入API密钥',
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // 如果还没有测试过连接，先测试一下
      if (!testResult) {
        const testResultData = await testAPIConnection(formData);
        if (!testResultData.success) {
          setTestResult({
            success: false,
            message: testResultData.error || '配置验证失败',
          });
          setIsSaving(false);
          return;
        }
      }

      // 保存配置
      onSave(formData);
      onClose();
    } catch (error) {
      setTestResult({
        success: false,
        message: '保存配置失败',
      });
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * 获取当前选中提供商的信息
   */
  const selectedProvider = providers.find(p => p.id === formData.provider);

  const modalFooter = (
    <>
      <Button
        variant="outline"
        onClick={onClose}
        disabled={isTestingConnection || isSaving}
      >
        取消
      </Button>
      <Button
        variant="secondary"
        onClick={handleTestConnection}
        loading={isTestingConnection}
        disabled={!formData.apiKey.trim() || isSaving}
      >
        测试连接
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        loading={isSaving}
        disabled={!formData.apiKey.trim() || isTestingConnection}
      >
        保存配置
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI服务配置"
      size="md"
      footer={modalFooter}
    >
      <div className="space-y-6">
        {/* 说明文本 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                配置您的AI服务
              </h4>
              <p className="text-sm text-blue-700">
                选择您偏好的AI服务提供商并输入相应的API密钥。配置将安全地保存在您的浏览器本地存储中。
              </p>
            </div>
          </div>
        </div>

        {/* AI服务提供商选择 */}
        <Select
          label="AI服务提供商"
          value={formData.provider}
          onChange={handleProviderChange}
          options={providers.map(provider => ({
            value: provider.id,
            label: provider.name,
          }))}
          helpText="选择您要使用的AI服务提供商"
        />

        {/* API密钥输入 */}
        <Input
          label="API密钥"
          type="password"
          value={formData.apiKey}
          onChange={(e) => handleFieldChange('apiKey', e.target.value)}
          placeholder="请输入您的API密钥"
          helpText="您的API密钥将加密存储在本地，不会上传到服务器"
        />

        {/* 模型名称（可选） */}
        <Input
          label="模型名称（可选）"
          value={formData.model}
          onChange={(e) => handleFieldChange('model', e.target.value)}
          placeholder={selectedProvider?.defaultModel || '使用默认模型'}
          helpText={`默认模型：${selectedProvider?.defaultModel || '未知'}`}
        />

        {/* 自定义API端点（高级选项） */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            高级选项
          </summary>
          <div className="mt-3 space-y-4">
            <Input
              label="自定义API端点（可选）"
              value={formData.baseUrl}
              onChange={(e) => handleFieldChange('baseUrl', e.target.value)}
              placeholder="https://api.example.com/v1"
              helpText="如果使用代理或自托管服务，请输入自定义API端点"
            />
          </div>
        </details>

        {/* 测试结果显示 */}
        {testResult && (
          <div className={`rounded-lg p-4 ${
            testResult.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                testResult.success ? 'text-green-900' : 'text-red-900'
              }`}>
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* 安全提示 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                安全提示
              </h4>
              <p className="text-sm text-yellow-700">
                您的API密钥将存储在浏览器的本地存储中。请不要在公共计算机上保存敏感信息。
                清除浏览器数据将删除所有保存的配置。
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default APIConfigModal;