/**
 * 认证模态框组件
 * 
 * 功能：
 * - 登录和注册表单切换
 * - 为未来Supabase认证集成做准备
 * - 响应式设计
 * - 表单验证和错误处理
 */

import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Modal from './ui/Modal';
import { 
  registerUser, 
  loginUser, 
  validateEmail, 
  validatePassword, 
  validateUsername 
} from '../utils/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  onModeChange: (mode: 'login' | 'signup') => void;
  onAuthSuccess?: (user: any) => void;
}

interface FormData {
  email: string;
  password: string;
  confirmPassword?: string;
  username?: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  username?: string;
  general?: string;
}

interface SuccessState {
  show: boolean;
  message: string;
}

/**
 * 认证模态框组件
 */
const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  mode,
  onModeChange,
  onAuthSuccess,
}) => {
  // 状态管理
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successState, setSuccessState] = useState<SuccessState>({
    show: false,
    message: ''
  });

  /**
   * 重置表单
   */
  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      username: '',
    });
    setErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
    setSuccessState({ show: false, message: '' });
  };

  /**
   * 处理模式切换
   */
  const handleModeChange = (newMode: 'login' | 'signup') => {
    resetForm();
    onModeChange(newMode);
  };

  /**
   * 处理关闭
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * 表单字段验证
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }

    // 密码验证
    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.message || '密码格式不正确';
      }
    }

    // 注册模式下的额外验证
    if (mode === 'signup') {
      // 用户名验证
      if (!formData.username) {
        newErrors.username = '请输入用户名';
      } else {
        const usernameValidation = validateUsername(formData.username);
        if (!usernameValidation.isValid) {
          newErrors.username = usernameValidation.message || '用户名格式不正确';
        }
      }

      // 确认密码验证
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = '请确认密码';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次输入的密码不一致';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});
    setSuccessState({ show: false, message: '' });

    try {
      if (mode === 'login') {
        const result = await loginUser({
          email: formData.email,
          password: formData.password,
        });
        
        if (result.success) {
          setSuccessState({
            show: true,
            message: result.message
          });
          
          // 1秒后关闭模态框并触发成功回调
          setTimeout(() => {
            if (onAuthSuccess && result.user) {
              onAuthSuccess(result.user);
            }
            handleClose();
          }, 1000);
        } else {
          setErrors({ general: result.message });
        }
        
      } else {
        const result = await registerUser({
          username: formData.username!,
          email: formData.email,
          password: formData.password,
        });
        
        if (result.success) {
          setSuccessState({
            show: true,
            message: result.message
          });
          
          // 1.5秒后关闭模态框并触发成功回调
          setTimeout(() => {
            if (onAuthSuccess && result.user) {
              onAuthSuccess(result.user);
            }
            handleClose();
          }, 1500);
        } else {
          setErrors({ general: result.message });
        }
      }
      
    } catch (error) {
      console.error('认证失败:', error);
      setErrors({
        general: mode === 'login' 
          ? '登录过程中发生错误，请稍后重试' 
          : '注册过程中发生错误，请稍后重试'
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 处理输入变化
   */
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="sm">
      <div className="p-6">
        {/* 标题区域 */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'login' ? '登录账户' : '创建账户'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 副标题 */}
        <p className="text-gray-600 mb-6 text-center">
          {mode === 'login' 
            ? '欢迎回来！继续您的学习之旅' 
            : '开启您的AI学习之旅'}
        </p>

        {/* 成功提示 */}
        {successState.show && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
            <p className="text-green-700 text-sm">{successState.message}</p>
          </div>
        )}

        {/* 错误提示 */}
        {errors.general && !successState.show && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 注册模式下的用户名字段 */}
          {mode === 'signup' && (
            <div>
              <Input
                type="text"
                placeholder="用户名"
                value={formData.username || ''}
                onChange={(e) => handleInputChange('username', e.target.value)}
                error={errors.username}
                disabled={isLoading}
                leftIcon={<User className="w-4 h-4 text-gray-400" />}
              />
            </div>
          )}

          {/* 邮箱字段 */}
          <div>
            <Input
              type="email"
              placeholder="邮箱地址"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={errors.email}
              disabled={isLoading}
              leftIcon={<Mail className="w-4 h-4 text-gray-400" />}
            />
          </div>

          {/* 密码字段 */}
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              disabled={isLoading}
              leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              }
            />
          </div>

          {/* 注册模式下的确认密码字段 */}
          {mode === 'signup' && (
            <div>
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="确认密码"
                value={formData.confirmPassword || ''}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                error={errors.confirmPassword}
                disabled={isLoading}
                leftIcon={<Lock className="w-4 h-4 text-gray-400" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
              />
            </div>
          )}

          {/* 提交按钮 */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={isLoading}
            loading={isLoading}
            className="w-full"
          >
            {mode === 'login' ? '登录' : '创建账户'}
          </Button>
        </form>

        {/* 模式切换 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === 'login' ? '还没有账户？' : '已有账户？'}
            <button
              onClick={() => handleModeChange(mode === 'login' ? 'signup' : 'login')}
              className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
              disabled={isLoading}
            >
              {mode === 'login' ? '立即注册' : '立即登录'}
            </button>
          </p>
        </div>

        {/* 服务条款提示（仅在注册时显示） */}
        {mode === 'signup' && (
          <p className="mt-4 text-xs text-gray-500 text-center">
            注册即表示您同意我们的
            <a href="#" className="text-primary-600 hover:text-primary-700">服务条款</a>
            和
            <a href="#" className="text-primary-600 hover:text-primary-700">隐私政策</a>
          </p>
        )}
      </div>
    </Modal>
  );
};

export default AuthModal;