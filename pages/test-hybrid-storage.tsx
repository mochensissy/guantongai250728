/**
 * 混合存储系统测试页面
 * 
 * 测试本地+云端存储的完整功能
 */

import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { hybridStorage } from '../src/services/hybridStorage'
import SyncStatus from '../src/components/SyncStatus'
import Button from '../src/components/ui/Button'
import { LearningSession, ChatMessage, LearningCard } from '../src/types'

function HybridStorageTestContent() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<LearningSession[]>([])
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'success' | 'error'; message: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    loadSessions()
  }, [user])

  /**
   * 加载会话列表
   */
  const loadSessions = async () => {
    try {
      const allSessions = await hybridStorage.getAllSessions()
      setSessions(allSessions)
    } catch (error) {
      console.error('加载会话失败:', error)
    }
  }

  /**
   * 测试混合存储功能
   */
  const runTests = async () => {
    setIsLoading(true)
    const results: Array<{ test: string; status: 'success' | 'error'; message: string }> = []

    try {
      // 测试1: 创建测试会话
      const testSession: LearningSession = {
        id: `test-session-${Date.now()}`,
        title: `测试会话 ${new Date().toLocaleTimeString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner',
        documentContent: '这是一个测试文档的内容。',
        documentType: 'text',
        outline: [
          {
            id: 'chapter-1',
            title: '第一章',
            order: 1,
            type: 'chapter',
            level: 1,
            chapterNumber: 1
          }
        ],
        messages: [
          {
            id: `msg-${Date.now()}`,
            role: 'user',
            content: '这是一条测试消息',
            timestamp: Date.now()
          }
        ],
        status: 'active',
        cards: []
      }

      const saveResult = await hybridStorage.saveSession(testSession)
      if (saveResult) {
        results.push({ test: '保存会话', status: 'success', message: '会话保存成功' })
      } else {
        results.push({ test: '保存会话', status: 'error', message: '会话保存失败' })
      }

      // 测试2: 读取会话
      const loadedSession = await hybridStorage.getSessionById(testSession.id)
      if (loadedSession && loadedSession.title === testSession.title) {
        results.push({ test: '读取会话', status: 'success', message: '会话读取成功' })
      } else {
        results.push({ test: '读取会话', status: 'error', message: '会话读取失败或数据不匹配' })
      }

      // 测试3: 更新消息
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}-2`,
        role: 'assistant',
        content: '这是AI的回复',
        timestamp: Date.now()
      }

      const updatedMessages = [...testSession.messages, newMessage]
      const messageUpdateResult = await hybridStorage.updateSessionMessages(testSession.id, updatedMessages)
      if (messageUpdateResult) {
        results.push({ test: '更新消息', status: 'success', message: '消息更新成功' })
      } else {
        results.push({ test: '更新消息', status: 'error', message: '消息更新失败' })
      }

      // 测试4: 添加学习卡片
      const testCard: LearningCard = {
        id: `card-${Date.now()}`,
        title: '测试学习卡片',
        content: '这是一张测试学习卡片的内容',
        type: 'bookmark',
        tags: ['测试', '卡片'],
        createdAt: Date.now(),
        nextReviewAt: Date.now() + 24 * 60 * 60 * 1000, // 24小时后复习
        reviewCount: 0,
        difficulty: 3,
        sessionId: testSession.id,
        messageId: newMessage.id
      }

      const cardResult = await hybridStorage.addLearningCard(testSession.id, testCard)
      if (cardResult) {
        results.push({ test: '添加卡片', status: 'success', message: '学习卡片添加成功' })
      } else {
        results.push({ test: '添加卡片', status: 'error', message: '学习卡片添加失败' })
      }

      // 测试5: 获取所有卡片
      const allCards = await hybridStorage.getAllCards()
      const hasTestCard = allCards.some(card => card.id === testCard.id)
      if (hasTestCard) {
        results.push({ test: '获取卡片', status: 'success', message: `获取到 ${allCards.length} 张卡片` })
      } else {
        results.push({ test: '获取卡片', status: 'error', message: '未找到测试卡片' })
      }

      // 测试6: 用户偏好设置
      const testPreferences = {
        defaultLearningLevel: 'expert' as const,
        theme: 'dark' as const
      }

      const prefResult = await hybridStorage.saveUserPreferences(testPreferences)
      if (prefResult) {
        const savedPrefs = await hybridStorage.getUserPreferences()
        if (savedPrefs.defaultLearningLevel === 'expert') {
          results.push({ test: '用户偏好', status: 'success', message: '偏好设置保存和读取成功' })
        } else {
          results.push({ test: '用户偏好', status: 'error', message: '偏好设置读取数据不匹配' })
        }
      } else {
        results.push({ test: '用户偏好', status: 'error', message: '偏好设置保存失败' })
      }

      // 测试7: 同步状态
      const syncStatus = hybridStorage.getSyncStatus()
      results.push({ 
        test: '同步状态', 
        status: 'success', 
        message: `在线: ${syncStatus.isOnline}, 同步中: ${syncStatus.isSyncing}, 队列: ${syncStatus.queueSize}` 
      })

      // 刷新会话列表
      await loadSessions()

    } catch (error) {
      results.push({ test: '测试执行', status: 'error', message: `测试过程中发生错误: ${error.message}` })
    }

    setTestResults(results)
    setIsLoading(false)
  }

  /**
   * 清理测试数据
   */
  const cleanupTestData = async () => {
    try {
      const testSessions = sessions.filter(session => session.title.includes('测试会话'))
      
      for (const session of testSessions) {
        await hybridStorage.deleteSession(session.id)
      }
      
      await loadSessions()
      alert(`清理了 ${testSessions.length} 个测试会话`)
    } catch (error) {
      alert(`清理失败: ${error.message}`)
    }
  }

  /**
   * 触发数据迁移
   */
  const triggerMigration = async () => {
    if (!user) {
      alert('请先登录')
      return
    }

    try {
      const result = await hybridStorage.migrateLocalDataToCloud()
      alert(`迁移结果: 成功 ${result.migrated} 个, 错误 ${result.errors.length} 个`)
    } catch (error) {
      alert(`迁移失败: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">混合存储系统测试</h1>
          
          {/* 用户状态 */}
          {isMounted && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">当前状态</h2>
              <p className="text-sm text-gray-600">
                用户: {user ? `${user.email} (已登录)` : '未登录'}
              </p>
              <p className="text-sm text-gray-600">
                网络: {typeof window !== 'undefined' && navigator.onLine ? '在线' : '离线'}
              </p>
              <p className="text-sm text-gray-600">
                本地会话数: {sessions.length}
              </p>
            </div>
          )}

          {/* 测试控制 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">功能测试</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={runTests}
                disabled={isLoading}
                variant="primary"
              >
                {isLoading ? '测试中...' : '运行完整测试'}
              </Button>
              
              <Button
                onClick={loadSessions}
                variant="outline"
              >
                刷新会话列表
              </Button>
              
              <Button
                onClick={cleanupTestData}
                variant="outline"
                disabled={sessions.filter(s => s.title.includes('测试会话')).length === 0}
              >
                清理测试数据
              </Button>
              
              {user && (
                <Button
                  onClick={triggerMigration}
                  variant="outline"
                >
                  触发数据迁移
                </Button>
              )}
            </div>
          </div>

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">测试结果</h2>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{result.test}</span>
                      <span
                        className={`text-sm ${
                          result.status === 'success' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {result.status === 'success' ? '✅ 成功' : '❌ 失败'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 会话列表 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">本地会话列表</h2>
            {sessions.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sessions.map((session) => (
                  <div key={session.id} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{session.title}</h3>
                        <p className="text-sm text-gray-600">
                          创建时间: {new Date(session.createdAt).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          消息数: {session.messages?.length || 0}, 卡片数: {session.cards?.length || 0}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.status === 'active' ? 'bg-green-100 text-green-800' :
                        session.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无会话数据</p>
            )}
          </div>
        </div>

        {/* 同步状态组件 */}
        <SyncStatus showMigration={true} />
      </div>
    </div>
  )
}

export default function TestHybridStoragePage() {
  return (
    <AuthProvider>
      <HybridStorageTestContent />
    </AuthProvider>
  )
}