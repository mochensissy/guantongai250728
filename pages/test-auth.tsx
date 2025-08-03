/**
 * 认证系统测试页面
 * 
 * 测试完整的认证流程和用户状态管理
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import AuthModal from '../src/components/AuthModal'
import UserProfile from '../src/components/UserProfile'
import ProtectedRoute from '../src/components/ProtectedRoute'
import Button from '../src/components/ui/Button'

function AuthTestContent() {
  const { user, userProfile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'reset'>('login')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">认证系统测试</h1>
          
          {/* 认证状态 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">认证状态</h2>
            <div className={`p-4 rounded-lg ${
              loading ? 'bg-blue-50 border border-blue-200' :
              user ? 'bg-green-50 border border-green-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              {loading && (
                <p className="text-blue-700">🔄 正在加载认证状态...</p>
              )}
              
              {!loading && user && (
                <div>
                  <p className="text-green-700 font-medium mb-2">✅ 用户已登录</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>用户ID:</strong> {user.id}</p>
                    <p><strong>邮箱:</strong> {user.email}</p>
                    <p><strong>邮箱已验证:</strong> {user.email_confirmed_at ? '是' : '否'}</p>
                    <p><strong>创建时间:</strong> {new Date(user.created_at).toLocaleString()}</p>
                    {userProfile && (
                      <>
                        <p><strong>用户名:</strong> {userProfile.username || '未设置'}</p>
                        <p><strong>订阅等级:</strong> {userProfile.subscription_tier}</p>
                        <p><strong>总会话数:</strong> {userProfile.total_sessions}</p>
                        <p><strong>总卡片数:</strong> {userProfile.total_cards}</p>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {!loading && !user && (
                <p className="text-gray-700">❌ 用户未登录</p>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">操作测试</h2>
            <div className="flex flex-wrap gap-3">
              {!user ? (
                <>
                  <Button
                    onClick={() => {
                      setAuthMode('login')
                      setShowAuthModal(true)
                    }}
                    variant="primary"
                  >
                    测试登录
                  </Button>
                  <Button
                    onClick={() => {
                      setAuthMode('signup')
                      setShowAuthModal(true)
                    }}
                    variant="outline"
                  >
                    测试注册
                  </Button>
                  <Button
                    onClick={() => {
                      setAuthMode('reset')
                      setShowAuthModal(true)
                    }}
                    variant="outline"
                  >
                    测试重置密码
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => signOut()}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  登出
                </Button>
              )}
            </div>
          </div>

          {/* 用户档案显示 */}
          {user && userProfile && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">用户档案</h2>
              <UserProfile showStats={true} />
            </div>
          )}

          {/* 受保护内容测试 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">受保护内容测试</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <ProtectedRoute
                fallback={
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">这是受保护的内容，需要登录后才能查看</p>
                    <Button
                      onClick={() => {
                        setAuthMode('login')
                        setShowAuthModal(true)
                      }}
                    >
                      登录查看
                    </Button>
                  </div>
                }
              >
                <div className="text-center py-8">
                  <h3 className="text-lg font-medium text-green-600 mb-2">🎉 恭喜！</h3>
                  <p className="text-gray-600">您已成功通过认证，可以查看受保护的内容了！</p>
                </div>
              </ProtectedRoute>
            </div>
          </div>

          {/* 认证流程说明 */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">测试指南</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">认证功能测试流程：</h4>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>测试用户注册（需要真实邮箱接收验证邮件）</li>
                <li>测试邮箱验证（点击邮件中的验证链接）</li>
                <li>测试用户登录</li>
                <li>查看用户档案和统计信息</li>
                <li>测试受保护内容的访问控制</li>
                <li>测试用户登出</li>
                <li>测试密码重置功能</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* 认证模态框 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
        onAuthSuccess={() => {
          setShowAuthModal(false)
        }}
      />
    </div>
  )
}

export default function TestAuthPage() {
  return (
    <AuthProvider>
      <AuthTestContent />
    </AuthProvider>
  )
}