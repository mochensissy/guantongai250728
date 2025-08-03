/**
 * 简化的Supabase测试页面
 * 专门用于调试数据创建问题
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import Button from '../src/components/ui/Button'
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

function SimpleSupabaseTestContent() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'
    const result = `[${timestamp}] ${prefix} ${message}`
    setResults(prev => [...prev, result])
    console.log(result)
  }

  const clearResults = () => {
    setResults([])
  }

  // 直接测试Supabase连接和插入
  const testDirectSupabaseInsert = async () => {
    if (!user) {
      addResult('请先登录', 'error')
      return
    }

    setIsLoading(true)
    clearResults()

    try {
      addResult('开始测试直接Supabase插入...')
      
      // 直接导入Supabase客户端
      const { createClient } = await import('../src/utils/supabase')
      const supabase = createClient()

      addResult(`当前用户: ${user.email} (${user.id})`)

      // 1. 测试插入学习会话
      addResult('测试插入学习会话...')
      const sessionData = {
        id: `test-session-${Date.now()}`,
        title: '直接测试会话',
        document_content: '这是一个直接测试的会话内容',
        outline: [],
        learning_level: 'beginner',
        status: 'active',
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: sessionResult, error: sessionError } = await supabase
        .from('learning_sessions')
        .insert(sessionData)
        .select()

      if (sessionError) {
        addResult(`会话插入失败: ${sessionError.message}`, 'error')
        console.error('会话插入错误详情:', sessionError)
      } else {
        addResult('会话插入成功!', 'success')
        console.log('会话插入结果:', sessionResult)
      }

      // 2. 测试插入学习卡片
      addResult('测试插入学习卡片...')
      const cardData = {
        id: `test-card-${Date.now()}`,
        title: '直接测试卡片',
        content: '这是一个直接测试的卡片内容',
        user_note: '直接测试笔记',
        type: 'bookmark',
        tags: ['测试', '直接插入'],
        difficulty: 'medium',
        review_count: 0,
        next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        session_id: sessionData.id,
        message_id: 'direct-test-message',
        user_id: user.id,
        created_at: new Date().toISOString()
      }

      const { data: cardResult, error: cardError } = await supabase
        .from('learning_cards')
        .insert(cardData)
        .select()

      if (cardError) {
        addResult(`卡片插入失败: ${cardError.message}`, 'error')
        console.error('卡片插入错误详情:', cardError)
      } else {
        addResult('卡片插入成功!', 'success')
        console.log('卡片插入结果:', cardResult)
      }

      // 3. 验证数据是否存在
      addResult('验证插入的数据...')
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user.id)

      if (sessionsError) {
        addResult(`查询会话失败: ${sessionsError.message}`, 'error')
      } else {
        addResult(`找到 ${sessions?.length || 0} 个会话`, 'success')
      }

      const { data: cards, error: cardsError } = await supabase
        .from('learning_cards')
        .select('*')
        .eq('user_id', user.id)

      if (cardsError) {
        addResult(`查询卡片失败: ${cardsError.message}`, 'error')
      } else {
        addResult(`找到 ${cards?.length || 0} 张卡片`, 'success')
      }

    } catch (error) {
      addResult(`测试过程中发生错误: ${error.message}`, 'error')
      console.error('测试错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 测试CloudStorageService
  const testCloudStorageService = async () => {
    if (!user) {
      addResult('请先登录', 'error')
      return
    }

    setIsLoading(true)
    clearResults()

    try {
      addResult('开始测试CloudStorageService...')
      
      const { cloudStorage } = await import('../src/services/cloudStorage')

      // 创建测试会话
      addResult('使用CloudStorageService创建会话...')
      const testSession = {
        id: `cloud-test-session-${Date.now()}`,
        title: 'CloudStorage测试会话',
        content: '这是通过CloudStorageService创建的会话',
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
        addResult('CloudStorage会话创建成功!', 'success')
      } else {
        addResult(`CloudStorage会话创建失败: ${sessionResult.error}`, 'error')
      }

      // 创建测试卡片
      addResult('使用CloudStorageService创建卡片...')
      const testCard = {
        id: `cloud-test-card-${Date.now()}`,
        title: 'CloudStorage测试卡片',
        content: '这是通过CloudStorageService创建的卡片',
        userNote: 'CloudStorage测试笔记',
        type: 'bookmark' as const,
        tags: ['CloudStorage', '测试'],
        createdAt: Date.now(),
        sessionId: testSession.id,
        messageId: 'cloud-test-message',
        difficulty: 'medium' as const,
        reviewCount: 0,
        nextReviewAt: Date.now() + 24 * 60 * 60 * 1000
      }

      const cardResult = await cloudStorage.addCard(testCard)
      if (cardResult.success) {
        addResult('CloudStorage卡片创建成功!', 'success')
      } else {
        addResult(`CloudStorage卡片创建失败: ${cardResult.error}`, 'error')
      }

    } catch (error) {
      addResult(`CloudStorageService测试错误: ${error.message}`, 'error')
      console.error('CloudStorageService测试错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center">
          <Database className="w-6 h-6 mr-3 text-blue-600" />
          简化Supabase测试
        </h1>

        {/* 用户状态 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">用户状态</h2>
          {user ? (
            <div className="text-green-600">
              <p>✅ 已登录: {user.email}</p>
              <p className="text-sm text-gray-600">ID: {user.id}</p>
            </div>
          ) : (
            <p className="text-red-600">❌ 未登录</p>
          )}
        </div>

        {/* 测试按钮 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">测试操作</h2>
          <div className="flex space-x-4">
            <Button 
              variant="primary" 
              onClick={testDirectSupabaseInsert}
              disabled={isLoading || !user}
              icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            >
              直接Supabase测试
            </Button>
            <Button 
              variant="outline" 
              onClick={testCloudStorageService}
              disabled={isLoading || !user}
              icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            >
              CloudStorage测试
            </Button>
          </div>
        </div>

        {/* 测试结果 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">测试结果</h2>
            <Button variant="outline" size="sm" onClick={clearResults}>
              清空
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无测试结果</p>
            ) : (
              results.map((result, index) => (
                <div 
                  key={index} 
                  className={`text-sm py-1 font-mono ${
                    result.includes('❌') ? 'text-red-600' : 
                    result.includes('✅') ? 'text-green-600' : 
                    'text-gray-700'
                  }`}
                >
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestSupabaseSimplePage() {
  return (
    <AuthProvider>
      <SimpleSupabaseTestContent />
    </AuthProvider>
  )
}