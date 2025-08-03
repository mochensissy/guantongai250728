/**
 * 认证模态框组件 - 集成Supabase Auth
 * 
 * 功能：
 * - 用户注册和登录
 * - 密码重置
 * - 集成云端认证系统
 * - 表单验证和错误处理
 * - 响应式设计
 */

import React, { useState, useEffect } from 'react'
import { X, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal from './ui/Modal'
import { useAuth } from '../contexts/AuthContext'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'signup' | 'reset'
  onModeChange: (mode: 'login' | 'signup' | 'reset') => void
  onAuthSuccess?: () => void
}

interface FormData {
  email: string
  password: string
  confirmPassword?: string
  username?: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  username?: string
  general?: string
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  mode, 
  onModeChange, 
  onAuthSuccess 
}: AuthModalProps) {
  const { signIn, signUp, resetPassword, loading } = useAuth()
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // 重置表单状态
  useEffect(() => {
    if (isOpen) {
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        username: ''
      })
      setErrors({})
      setSuccessMessage('')
      setIsSubmitting(false)
    }
  }, [isOpen, mode])

  /**
   * 验证表单数据
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '请输入邮箱地址'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    // 密码验证
    if (mode !== 'reset') {
      if (!formData.password) {
        newErrors.password = '请输入密码'
      } else if (formData.password.length < 6) {
        newErrors.password = '密码至少需要6位字符'
      }

      // 注册时的额外验证
      if (mode === 'signup') {
        // 用户名验证
        if (!formData.username?.trim()) {
          newErrors.username = '请输入用户名'
        } else if (formData.username.length < 2) {
          newErrors.username = '用户名至少需要2位字符'
        } else if (formData.username.length > 20) {
          newErrors.username = '用户名不能超过20位字符'
        } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(formData.username)) {
          newErrors.username = '用户名只能包含字母、数字、中文、下划线和连字符'
        }

        // 确认密码验证
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = '请确认密码'
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = '两次输入的密码不一致'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * 验证邮箱格式
   */
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * 处理表单提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      let result

      switch (mode) {
        case 'login':
          result = await signIn(formData.email, formData.password)
          break
        
        case 'signup':
          result = await signUp(formData.email, formData.password, formData.username)
          break
        
        case 'reset':
          result = await resetPassword(formData.email)
          break
        
        default:
          throw new Error('未知的操作模式')
      }

      if (result.success) {
        setSuccessMessage(result.message || '操作成功！')
        
        // 登录成功后关闭模态框
        if (mode === 'login') {
          setTimeout(() => {
            onClose()
            onAuthSuccess?.()
          }, 1500)
        }
      } else {
        setErrors({ general: result.error || '操作失败，请稍后重试' })
      }
    } catch (error) {
      console.error('认证操作失败:', error)
      setErrors({ general: '操作过程中发生错误，请稍后重试' })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * 切换模式
   */
  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    onModeChange(newMode)
  }

  /**
   * 获取模态框标题
   */
  const getTitle = () => {
    switch (mode) {
      case 'login': return '登录'
      case 'signup': return '注册'
      case 'reset': return '重置密码'
      default: return '认证'
    }
  }

  /**
   * 获取提交按钮文本
   */
  const getSubmitText = () => {
    if (isSubmitting) {
      switch (mode) {
        case 'login': return '登录中...'
        case 'signup': return '注册中...'
        case 'reset': return '发送中...'
      }
    }
    
    switch (mode) {
      case 'login': return '登录'
      case 'signup': return '注册'
      case 'reset': return '发送重置邮件'
      default: return '提交'
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{getTitle()}</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 成功消息 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-700 text-sm">{successMessage}</span>
        </div>
      )}

      {/* 错误消息 */}
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-700 text-sm">{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 邮箱输入 */}
        <div>
          <Input
            type="email"
            placeholder="邮箱地址"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            icon={<Mail className="w-5 h-5" />}
            disabled={isSubmitting || loading}
          />
        </div>

        {/* 用户名输入（仅注册时显示） */}
        {mode === 'signup' && (
          <div>
            <Input
              type="text"
              placeholder="用户名"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
              icon={<User className="w-5 h-5" />}
              disabled={isSubmitting || loading}
            />
          </div>
        )}

        {/* 密码输入（重置密码时不显示） */}
        {mode !== 'reset' && (
          <div>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="密码"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              icon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              disabled={isSubmitting || loading}
            />
          </div>
        )}

        {/* 确认密码输入（仅注册时显示） */}
        {mode === 'signup' && (
          <div>
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="确认密码"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              icon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              disabled={isSubmitting || loading}
            />
          </div>
        )}

        {/* 提交按钮 */}
        <Button
          type="submit"
          variant="primary"
          className="w-full"
          disabled={isSubmitting || loading}
        >
          {(isSubmitting || loading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {getSubmitText()}
        </Button>
      </form>

      {/* 模式切换链接 */}
      <div className="mt-6 text-center space-y-2">
        {mode === 'login' && (
          <>
            <p className="text-sm text-gray-600">
              还没有账户？{' '}
              <button
                onClick={() => switchMode('signup')}
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                立即注册
              </button>
            </p>
            <p className="text-sm">
              <button
                onClick={() => switchMode('reset')}
                className="text-gray-500 hover:text-gray-700"
              >
                忘记密码？
              </button>
            </p>
          </>
        )}

        {mode === 'signup' && (
          <p className="text-sm text-gray-600">
            已有账户？{' '}
            <button
              onClick={() => switchMode('login')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              立即登录
            </button>
          </p>
        )}

        {mode === 'reset' && (
          <p className="text-sm text-gray-600">
            记起密码了？{' '}
            <button
              onClick={() => switchMode('login')}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              返回登录
            </button>
          </p>
        )}
      </div>
    </Modal>
  )
}