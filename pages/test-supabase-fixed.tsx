/**
 * 修复版Supabase测试页面
 * 修复UUID和数据类型问题
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import Button from '../src/components/ui/Button'
import { Database, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

function FixedSupabaseTestContent() {
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

  // 生成有效的UUID
  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  // 将difficulty字符串转换为数字
  const getDifficultyNumber = (difficulty: string): number => {
    const difficultyMap: Record<string, number> = {
      'easy': 1,
      'medium': 2,
      'hard': 3
    }
    return difficultyMap[difficulty] || 2
  }

  // 测试修复后的数据插入
  const testFixedSupabaseInsert = async () => {
    if (!user) {
      addResult('请先登录', 'error')
      return
    }

    setIsLoading(true)
    clearResults()

    try {
      addResult('开始测试修复后的Supabase插入...')
      
      // 直接导入Supabase客户端
      const { createClient } = await import('../src/utils/supabase')
      const supabase = createClient()

      addResult(`当前用户: ${user.email} (${user.id})`)

      // 1. 测试插入学习会话 - 使用有效UUID
      addResult('测试插入学习会话（使用有效UUID）...')
      const sessionUUID = generateUUID()
      const sessionData = {
        id: sessionUUID,
        title: '修复后测试会话',
        document_content: '这是一个修复后的测试会话内容',
        document_type: 'text' as const, // 添加必需的document_type字段
        outline: [],
        learning_level: 'beginner' as const,
        status: 'active' as const,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      addResult(`生成的会话UUID: ${sessionUUID}`)

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

      // 2. 先创建一条测试消息
      addResult('创建测试消息...')
      const messageUUID = generateUUID()
      const messageData = {
        id: messageUUID,
        session_id: sessionUUID,
        role: 'assistant' as const,
        content: '这是一个测试AI回复消息',
        created_at: new Date().toISOString()
      }

      const { error: messageError } = await supabase
        .from('chat_messages')
        .insert(messageData)

      if (messageError) {
        addResult(`消息插入失败: ${messageError.message}`, 'error')
        return
      } else {
        addResult('消息插入成功!', 'success')
      }

      // 3. 测试插入学习卡片 - 使用有效UUID和正确的difficulty数字
      addResult('测试插入学习卡片（修复difficulty类型）...')
      const cardUUID = generateUUID()
      const cardData = {
        id: cardUUID,
        title: '修复后测试卡片',
        content: '这是一个修复后的测试卡片内容',
        user_note: '修复后测试笔记',
        type: 'bookmark' as const,
        tags: ['测试', '修复后'],
        difficulty: getDifficultyNumber('medium'), // 转换为数字 2
        review_count: 0,
        next_review_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        session_id: sessionUUID,
        message_id: messageUUID, // 引用真实存在的message_id
        user_id: user.id,
        created_at: new Date().toISOString()
      }

      addResult(`生成的卡片UUID: ${cardUUID}`)
      addResult(`生成的消息UUID: ${messageUUID}`)
      addResult(`difficulty值: ${cardData.difficulty} (数字类型)`)

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

      // 4. 验证数据是否存在
      addResult('验证插入的数据...')
      
      const { data: sessions, error: sessionsError } = await supabase
        .from('learning_sessions')
        .select('*')
        .eq('user_id', user.id)

      if (sessionsError) {
        addResult(`查询会话失败: ${sessionsError.message}`, 'error')
      } else {
        addResult(`找到 ${sessions?.length || 0} 个会话`, 'success')
        sessions?.forEach(session => {
          addResult(`  会话: ${session.title} (${session.id})`, 'info')
        })
      }

      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)

      if (messagesError) {
        addResult(`查询消息失败: ${messagesError.message}`, 'error')
      } else {
        addResult(`找到 ${messages?.length || 0} 条消息`, 'success')
      }

      const { data: cards, error: cardsError } = await supabase
        .from('learning_cards')
        .select('*')
        .eq('user_id', user.id)

      if (cardsError) {
        addResult(`查询卡片失败: ${cardsError.message}`, 'error')
      } else {
        addResult(`找到 ${cards?.length || 0} 张卡片`, 'success')
        cards?.forEach(card => {
          addResult(`  卡片: ${card.title} (difficulty: ${card.difficulty})`, 'info')
        })
      }

    } catch (error) {
      addResult(`测试过程中发生错误: ${error.message}`, 'error')
      console.error('测试错误:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 测试修复后的CloudStorageService
  const testFixedCloudStorageService = async () => {
    if (!user) {
      addResult('请先登录', 'error')
      return
    }

    setIsLoading(true)
    clearResults()

    try {
      addResult('开始测试修复后的CloudStorageService...')
      
      const { cloudStorage } = await import('../src/services/cloudStorage')

      // 创建测试会话 - 使用UUID
      addResult('使用CloudStorageService创建会话（UUID格式）...')
      const sessionUUID = generateUUID()
      const testSession = {
        id: sessionUUID,
        title: '修复后CloudStorage测试会话',
        content: '这是通过修复后CloudStorageService创建的会话',
        outline: [],
        messages: [],
        cards: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner' as const,
        currentChapter: null,
        completedChapters: [],
        documentType: 'text' as const // 添加document_type字段
      }

      addResult(`生成会话UUID: ${sessionUUID}`)

      const sessionResult = await cloudStorage.saveSession(testSession)
      if (sessionResult.success) {
        addResult('CloudStorage会话创建成功!', 'success')
      } else {
        addResult(`CloudStorage会话创建失败: ${sessionResult.error}`, 'error')
      }

      // 先通过CloudStorageService创建消息
      addResult('使用CloudStorageService创建消息...')
      const cloudMessageUUID = generateUUID()
      const { createClient } = await import('../src/utils/supabase')
      const cloudSupabase = createClient()

      const cloudMessageData = {
        id: cloudMessageUUID,
        session_id: sessionUUID,
        role: 'assistant' as const,
        content: '这是CloudStorageService创建的测试消息',
        created_at: new Date().toISOString()
      }

      const { error: cloudMessageError } = await cloudSupabase
        .from('chat_messages')
        .insert(cloudMessageData)

      if (cloudMessageError) {
        addResult(`CloudStorage消息创建失败: ${cloudMessageError.message}`, 'error')
        return
      } else {
        addResult('CloudStorage消息创建成功!', 'success')
      }

      // 创建测试卡片 - 使用UUID和正确的difficulty
      addResult('使用CloudStorageService创建卡片（修复类型）...')
      const cardUUID = generateUUID()
      const testCard = {
        id: cardUUID,
        title: '修复后CloudStorage测试卡片',
        content: '这是通过修复后CloudStorageService创建的卡片',
        userNote: '修复后CloudStorage测试笔记',
        type: 'bookmark' as const,
        tags: ['CloudStorage', '修复后'],
        createdAt: Date.now(),
        sessionId: sessionUUID,
        messageId: cloudMessageUUID, // 使用真实的消息UUID
        difficulty: 2, // 直接使用数字
        reviewCount: 0,
        nextReviewAt: Date.now() + 24 * 60 * 60 * 1000
      }

      addResult(`生成卡片UUID: ${cardUUID}`)
      addResult(`生成消息UUID: ${cloudMessageUUID}`)
      addResult(`difficulty值: ${testCard.difficulty} (数字类型)`)

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
          <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
          修复版Supabase测试
        </h1>

        {/* 修复说明 */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">修复内容</h2>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ 使用有效的UUID格式替代时间戳ID</li>
            <li>✅ 将difficulty从字符串转换为数字类型</li>
            <li>✅ 添加必需的document_type字段</li>
            <li>✅ message_id字段使用UUID格式</li>
            <li>✅ 先创建消息记录，确保外键约束满足</li>
            <li>✅ 确保所有字段类型与数据库匹配</li>
          </ul>
        </div>

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
              onClick={testFixedSupabaseInsert}
              disabled={isLoading || !user}
              icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            >
              修复后直接测试
            </Button>
            <Button 
              variant="outline" 
              onClick={testFixedCloudStorageService}
              disabled={isLoading || !user}
              icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            >
              修复后CloudStorage测试
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

export default function TestSupabaseFixedPage() {
  return (
    <AuthProvider>
      <FixedSupabaseTestContent />
    </AuthProvider>
  )
}