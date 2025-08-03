/**
 * 受保护的路由组件
 * 
 * 确保只有已认证的用户才能访问特定页面
 * 未认证用户将看到登录界面
 */

import React, { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login')

  // 加载中状态
  if (loading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">正在验证身份...</p>
          </div>
        </div>
      )
    )
  }

  // 用户已登录，显示受保护的内容
  if (user) {
    return <>{children}</>
  }

  // 用户未登录，显示认证界面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 背景图案 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-50" />
      
      {/* 登录界面 */}
      <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo和标题 */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              AI学习私教
            </h1>
            <p className="text-lg text-gray-600">
              您的个人化学习助手
            </p>
          </div>

          {/* 功能介绍 */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              请登录以继续使用
            </h2>
            
            <div className="text-left space-y-3">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                <p className="text-gray-600 text-sm">
                  智能文档解析，自动生成学习大纲
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                <p className="text-gray-600 text-sm">
                  AI对话学习，小白和高手模式任选
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                <p className="text-gray-600 text-sm">
                  学习卡片收藏，支持复习和导出
                </p>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3" />
                <p className="text-gray-600 text-sm">
                  云端同步，多设备无缝学习
                </p>
              </div>
            </div>

            {/* 登录按钮 */}
            <div className="mt-6 space-y-3">
              <button
                onClick={() => setAuthMode('login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                登录账户
              </button>
              
              <button
                onClick={() => setAuthMode('signup')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                创建新账户
              </button>
            </div>
          </div>

          {/* 版本信息 */}
          <p className="text-sm text-gray-500">
            版本 1.0.0 · 云端化学习平台
          </p>
        </div>
      </div>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={authMode !== 'login' || true} // 根据需要调整显示逻辑
        onClose={() => {}} // 在这个场景下不允许关闭
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthSuccess={() => {
          // 认证成功后的处理逻辑会由AuthContext自动处理
        }}
      />
    </div>
  )
}

/**
 * 仅需要登录状态检查的轻量级保护组件
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 mb-4">请先登录以使用此功能</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          去登录
        </button>
      </div>
    )
  }

  return <>{children}</>
}