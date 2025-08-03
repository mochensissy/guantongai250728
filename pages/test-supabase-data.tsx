/**
 * Supabase数据验证页面
 * 用于检查和验证Supabase中的数据同步状态
 */

import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { cloudStorage } from '../src/services/cloudStorage'
import Button from '../src/components/ui/Button'
import { Database, Server, Users, MessageSquare, BookOpen, RefreshCw } from 'lucide-react'

function SupabaseDataContent() {
  const { user, signIn, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [dataStatus, setDataStatus] = useState({
    users: [],
    sessions: [],
    messages: [],
    cards: []
  })
  const [errors, setErrors] = useState<string[]>([])

  const addError = (error: string) => {
    setErrors(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${error}`])
    console.error(`❌ ${error}`)
  }

  const clearErrors = () => {
    setErrors([])
  }

  // 检查所有Supabase表的数据
  const checkSupabaseData = async () => {
    setIsLoading(true)
    clearErrors()
    
    try {
      console.log('🔍 开始检查Supabase数据...')
      
      // 导入Supabase客户端
      const { createClient } = await import('../src/utils/supabase')
      const supabase = createClient()

      // 1. 检查用户表
      console.log('👥 检查users表...')
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(10)
      
      if (usersError) {
        addError(`用户表查询失败: ${usersError.message}`)
      } else {
        console.log(`✅ 找到 ${users?.length || 0} 个用户`)
      }

      // 2. 检查学习会话表
      console.log('📚 检查learning_sessions表...')
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*')
        .limit(10)
      
      if (sessionsError) {
        addError(`会话表查询失败: ${sessionsError.message}`)
      } else {
        console.log(`✅ 找到 ${sessions?.length || 0} 个会话`)
      }

      // 3. 检查聊天消息表
      console.log('💬 检查chat_messages表...')
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .limit(10)
      
      if (messagesError) {
        addError(`消息表查询失败: ${messagesError.message}`)
      } else {
        console.log(`✅ 找到 ${messages?.length || 0} 条消息`)
      }

      // 4. 检查学习卡片表
      console.log('🎯 检查learning_cards表...')
      const { data: cards, error: cardsError } = await supabase
        .from('learning_cards')
        .select('*')
        .limit(10)
      
      if (cardsError) {
        addError(`卡片表查询失败: ${cardsError.message}`)
      } else {
        console.log(`✅ 找到 ${cards?.length || 0} 张卡片`)
      }

      setDataStatus({
        users: users || [],
        sessions: sessions || [],
        messages: messages || [],
        cards: cards || []
      })

    } catch (error) {
      addError(`检查数据时发生错误: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 创建测试数据
  const createTestData = async () => {
    if (!user) {
      addError('请先登录再创建测试数据')
      return
    }

    setIsLoading(true)
    
    try {
      console.log('🧪 开始创建测试数据...')

      // 创建测试会话
      const testSession = {
        id: `test-session-${Date.now()}`,
        title: '测试学习会话',
        content: '这是一个用于测试Supabase数据同步的会话',
        outline: [],
        messages: [],
        cards: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner' as const,
        currentChapter: null,
        completedChapters: []
      }

      const sessionResult = await cloudStorage.saveSession(testSession)
      if (sessionResult.success) {
        console.log('✅ 测试会话创建成功')
      } else {
        addError(`创建测试会话失败: ${sessionResult.error}`)
      }

      // 创建测试卡片
      const testCard = {
        id: `test-card-${Date.now()}`,
        title: '测试卡片',
        content: '这是一个测试卡片，用于验证Supabase卡片数据同步功能',
        userNote: '测试笔记',
        type: 'bookmark' as const,
        tags: ['测试', 'Supabase'],
        createdAt: Date.now(),
        sessionId: testSession.id,
        messageId: 'test-message',
        difficulty: 'medium' as const,
        reviewCount: 0,
        nextReviewAt: Date.now() + 24 * 60 * 60 * 1000
      }

      const cardResult = await cloudStorage.addCard(testCard)
      if (cardResult.success) {
        console.log('✅ 测试卡片创建成功')
      } else {
        addError(`创建测试卡片失败: ${cardResult.error}`)
      }

      // 重新检查数据
      setTimeout(() => {
        checkSupabaseData()
      }, 1000)

    } catch (error) {
      addError(`创建测试数据时发生错误: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 组件挂载时检查数据
  useEffect(() => {
    checkSupabaseData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Database className="w-8 h-8 mr-3 text-blue-600" />
          Supabase数据验证工具
        </h1>

        {/* 用户状态 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            用户状态
          </h2>
          {user ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 font-medium">✅ 已登录</p>
                <p className="text-sm text-gray-600">用户: {user.email}</p>
                <p className="text-sm text-gray-600">ID: {user.id}</p>
              </div>
              <Button variant="outline" onClick={signOut}>
                退出登录
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-red-600 font-medium">❌ 未登录</p>
              <Button 
                variant="primary" 
                onClick={() => signIn('test@example.com', 'password123')}
              >
                快速登录
              </Button>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Server className="w-5 h-5 mr-2" />
            数据操作
          </h2>
          <div className="flex space-x-4">
            <Button 
              variant="primary" 
              onClick={checkSupabaseData}
              disabled={isLoading}
              icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              检查数据
            </Button>
            <Button 
              variant="outline" 
              onClick={createTestData}
              disabled={isLoading || !user}
              icon={<BookOpen className="w-4 h-4" />}
            >
              创建测试数据
            </Button>
          </div>
        </div>

        {/* 数据状态 */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-500" />
              用户表
            </h3>
            <p className="text-2xl font-bold text-blue-600">{dataStatus.users.length}</p>
            <p className="text-sm text-gray-500">条记录</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-2 text-green-500" />
              学习会话
            </h3>
            <p className="text-2xl font-bold text-green-600">{dataStatus.sessions.length}</p>
            <p className="text-sm text-gray-500">个会话</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <MessageSquare className="w-4 h-4 mr-2 text-purple-500" />
              聊天消息
            </h3>
            <p className="text-2xl font-bold text-purple-600">{dataStatus.messages.length}</p>
            <p className="text-sm text-gray-500">条消息</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Database className="w-4 h-4 mr-2 text-orange-500" />
              学习卡片
            </h3>
            <p className="text-2xl font-bold text-orange-600">{dataStatus.cards.length}</p>
            <p className="text-sm text-gray-500">张卡片</p>
          </div>
        </div>

        {/* 错误日志 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-red-900">错误日志</h3>
              <Button variant="outline" size="sm" onClick={clearErrors}>
                清空
              </Button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-red-700 py-1 font-mono">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 详细数据展示 */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* 最新卡片 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-4">最新卡片</h3>
            {dataStatus.cards.length > 0 ? (
              <div className="space-y-3">
                {dataStatus.cards.slice(0, 3).map((card: any) => (
                  <div key={card.id} className="border border-gray-200 p-3 rounded">
                    <h4 className="font-medium text-sm">{card.title}</h4>
                    <p className="text-xs text-gray-500">ID: {card.id}</p>
                    <p className="text-xs text-gray-500">创建: {new Date(card.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无卡片数据</p>
            )}
          </div>

          {/* 最新会话 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-4">最新会话</h3>
            {dataStatus.sessions.length > 0 ? (
              <div className="space-y-3">
                {dataStatus.sessions.slice(0, 3).map((session: any) => (
                  <div key={session.id} className="border border-gray-200 p-3 rounded">
                    <h4 className="font-medium text-sm">{session.title}</h4>
                    <p className="text-xs text-gray-500">ID: {session.id}</p>
                    <p className="text-xs text-gray-500">创建: {new Date(session.created_at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">暂无会话数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestSupabaseDataPage() {
  return (
    <AuthProvider>
      <SupabaseDataContent />
    </AuthProvider>
  )
}