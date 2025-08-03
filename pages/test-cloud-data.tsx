/**
 * 云端数据验证页面
 * 直接从Supabase查询数据，验证云端存储是否正常工作
 */

import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { CloudStorageService } from '../src/services/cloudStorage'
import Button from '../src/components/ui/Button'
import { Database, User, MessageSquare, BookOpen, RefreshCw } from 'lucide-react'

const cloudStorage = new CloudStorageService()

function CloudDataTestContent() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [cloudData, setCloudData] = useState({
    userProfile: null,
    sessions: [],
    totalMessages: 0,
    totalCards: 0
  })
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  /**
   * 从云端加载所有数据
   */
  const loadCloudData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      console.log('🔍 开始从云端加载数据...')
      
      // 1. 获取用户档案
      const userResult = await cloudStorage.getCurrentUser()
      console.log('👤 用户档案结果:', userResult)

      // 2. 获取学习会话
      const sessionsResult = await cloudStorage.getUserSessions()
      console.log('📚 学习会话结果:', sessionsResult)

      // 3. 统计消息和卡片数量
      let totalMessages = 0
      let totalCards = 0

      if (sessionsResult.success && sessionsResult.sessions) {
        for (const session of sessionsResult.sessions) {
          totalMessages += session.messages?.length || 0
          totalCards += session.cards?.length || 0
        }
      }

      setCloudData({
        userProfile: userResult.success ? userResult.user : null,
        sessions: sessionsResult.success ? sessionsResult.sessions : [],
        totalMessages,
        totalCards
      })

      setLastSyncTime(new Date())
      console.log('✅ 云端数据加载完成')

    } catch (error) {
      console.error('❌ 云端数据加载失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 创建测试数据到云端
   */
  const createTestData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const testSession = {
        id: `cloud-test-${Date.now()}`,
        title: `云端测试会话 ${new Date().toLocaleTimeString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner' as const,
        documentContent: '这是一个云端存储测试的文档内容。用于验证数据是否正确保存到Supabase数据库中。',
        documentType: 'text' as const,
        outline: [{
          id: 'test-chapter',
          title: '测试章节',
          order: 1,
          type: 'chapter' as const,
          level: 1,
          chapterNumber: 1
        }],
        messages: [{
          id: `test-msg-${Date.now()}`,
          role: 'user' as const,
          content: '这是一条测试消息，用于验证云端消息存储。',
          timestamp: Date.now()
        }, {
          id: `test-msg-ai-${Date.now()}`,
          role: 'assistant' as const,
          content: '这是AI的回复消息，同样保存在云端数据库中。',
          timestamp: Date.now()
        }],
        status: 'active' as const,
        cards: []
      }

      console.log('💾 正在创建测试数据到云端...')
      const result = await cloudStorage.saveSession(testSession)
      
      if (result.success) {
        console.log('✅ 测试数据创建成功')
        // 重新加载数据
        await loadCloudData()
      } else {
        console.error('❌ 测试数据创建失败:', result.error)
      }

    } catch (error) {
      console.error('❌ 创建测试数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 组件加载时自动加载云端数据
  useEffect(() => {
    if (user) {
      loadCloudData()
    }
  }, [user])

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">需要登录才能查看云端数据</h2>
          <p className="text-gray-600">请先登录您的账号</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">云端数据验证</h1>
              <p className="text-gray-600">直接从Supabase数据库查询您的云端数据</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={loadCloudData}
                disabled={isLoading}
                variant="outline"
                icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              >
                刷新数据
              </Button>
              <Button
                onClick={createTestData}
                disabled={isLoading}
                variant="primary"
              >
                创建测试数据
              </Button>
            </div>
          </div>

          {lastSyncTime && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ⏰ 最后同步时间: {lastSyncTime.toLocaleString()}
              </p>
            </div>
          )}

          {/* 用户信息 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              用户档案信息
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {cloudData.userProfile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">用户ID:</span>
                    <span className="ml-2 text-gray-600 font-mono">{cloudData.userProfile.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">邮箱:</span>
                    <span className="ml-2 text-gray-600">{cloudData.userProfile.email}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">用户名:</span>
                    <span className="ml-2 text-gray-600">{cloudData.userProfile.username || '未设置'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">订阅等级:</span>
                    <span className="ml-2 text-gray-600">{cloudData.userProfile.subscription_tier || 'free'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">创建时间:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date(cloudData.userProfile.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">最后登录:</span>
                    <span className="ml-2 text-gray-600">
                      {cloudData.userProfile.last_login_at 
                        ? new Date(cloudData.userProfile.last_login_at).toLocaleString()
                        : '首次登录'
                      }
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">未找到用户档案信息</p>
              )}
            </div>
          </div>

          {/* 数据统计 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              云端数据统计
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{cloudData.sessions.length}</div>
                <div className="text-sm text-blue-700">学习会话</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <MessageSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{cloudData.totalMessages}</div>
                <div className="text-sm text-green-700">聊天消息</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <BookOpen className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{cloudData.totalCards}</div>
                <div className="text-sm text-purple-700">学习卡片</div>
              </div>
            </div>
          </div>

          {/* 会话列表 */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">云端学习会话</h2>
            {cloudData.sessions.length > 0 ? (
              <div className="space-y-3">
                {cloudData.sessions.map((session, index) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{session.title}</h3>
                      <span className="text-xs text-gray-500">#{index + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">ID:</span>
                        <span className="ml-1 font-mono">{session.id.substring(0, 8)}...</span>
                      </div>
                      <div>
                        <span className="font-medium">学习级别:</span>
                        <span className="ml-1">{session.learningLevel}</span>
                      </div>
                      <div>
                        <span className="font-medium">消息数:</span>
                        <span className="ml-1">{session.messages?.length || 0}</span>
                      </div>
                      <div>
                        <span className="font-medium">状态:</span>
                        <span className="ml-1">{session.status}</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      创建时间: {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Database className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>暂无云端学习会话数据</p>
                <p className="text-sm mt-1">创建一些学习会话后再来查看</p>
              </div>
            )}
          </div>

          {/* 验证说明 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">💡 如何验证数据真正存储在云端？</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>方法1:</strong> 清空浏览器缓存，重新登录后检查数据是否还在</li>
              <li>• <strong>方法2:</strong> 访问 <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Supabase管理面板</a> 直接查看数据库表</li>
              <li>• <strong>方法3:</strong> 在不同设备/浏览器上登录同一账号，检查数据同步</li>
              <li>• <strong>方法4:</strong> 在此页面创建测试数据，然后去Supabase面板验证</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CloudDataTestPage() {
  return (
    <AuthProvider>
      <CloudDataTestContent />
    </AuthProvider>
  )
}