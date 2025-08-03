/**
 * 卡片功能详细调试页面
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { addLearningCard } from '../src/utils/storageAdapter'
import * as localStorage from '../src/utils/storage'
import Button from '../src/components/ui/Button'
import { LearningCard } from '../src/types'
import { Save, Bug, Database } from 'lucide-react'

function CardDebugContent() {
  const { user } = useAuth()
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addLog = (message: string) => {
    setDebugLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(`🐛 ${message}`)
  }

  const runDetailedTest = async () => {
    setIsLoading(true)
    setDebugLog([])
    
    addLog('开始详细调试测试...')

    try {
      // 1. 检查用户状态
      addLog(`用户状态: ${user ? `已登录 (${user.email})` : '未登录'}`)

      // 2. 检查localStorage中的会话
      const allSessions = localStorage.getAllSessions()
      addLog(`localStorage中的会话数量: ${allSessions.length}`)
      
      if (allSessions.length === 0) {
        // 创建一个测试会话
        const testSession = {
          id: 'test-session-debug',
          title: '调试测试会话',
          documentTitle: '测试文档',
          outline: [],
          messages: [],
          cards: [],
          currentChapter: null,
          completedChapters: [],
          learningLevel: 'beginner' as const,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        
        const sessionSaved = localStorage.saveSession(testSession)
        addLog(`创建测试会话: ${sessionSaved ? '成功' : '失败'}`)
      }

      // 3. 使用第一个会话（或刚创建的）进行测试
      const sessions = localStorage.getAllSessions()
      const testSessionId = sessions[0]?.id || 'test-session-debug'
      addLog(`使用会话ID: ${testSessionId}`)

      // 4. 检查会话是否存在
      const session = localStorage.getSessionById(testSessionId)
      addLog(`会话查找结果: ${session ? `找到 - ${session.title}` : '未找到'}`)

      if (!session) {
        addLog('❌ 无法找到测试会话，停止测试')
        return
      }

      // 5. 创建测试卡片
      const testCard: LearningCard = {
        id: `debug-card-${Date.now()}`,
        title: '调试测试卡片',
        content: '这是一个详细调试的测试卡片内容。',
        userNote: '调试笔记',
        type: 'bookmark',
        tags: ['调试', '测试'],
        createdAt: Date.now(),
        nextReviewAt: Date.now() + (24 * 60 * 60 * 1000),
        reviewCount: 0,
        difficulty: 3,
        sessionId: testSessionId,
        messageId: 'debug-message-id',
        chapterId: 'debug-chapter-id'
      }

      addLog(`准备保存卡片: ${testCard.id}`)

      // 6. 直接测试localStorage.addLearningCard
      addLog('测试直接调用 localStorage.addLearningCard...')
      const localResult = localStorage.addLearningCard(testSessionId, testCard)
      addLog(`localStorage.addLearningCard 结果: ${localResult ? '成功' : '失败'}`)

      // 7. 测试storageAdapter.addLearningCard
      addLog('测试 storageAdapter.addLearningCard...')
      const adapterResult = await addLearningCard(testSessionId, testCard)
      addLog(`storageAdapter.addLearningCard 结果: ${adapterResult ? '成功' : '失败'}`)

      // 8. 验证卡片是否保存成功
      const updatedSession = localStorage.getSessionById(testSessionId)
      if (updatedSession) {
        addLog(`会话中的卡片数量: ${updatedSession.cards?.length || 0}`)
        if (updatedSession.cards && updatedSession.cards.length > 0) {
          const lastCard = updatedSession.cards[updatedSession.cards.length - 1]
          addLog(`最新卡片ID: ${lastCard.id}`)
        }
      }

      addLog('✅ 调试测试完成')

    } catch (error) {
      addLog(`❌ 测试失败: ${error.message}`)
      console.error('调试测试失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearDebugLog = () => {
    setDebugLog([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
            <Bug className="w-6 h-6 mr-2 text-red-600" />
            卡片功能详细调试
          </h1>

          {/* 控制按钮 */}
          <div className="mb-6 flex gap-3">
            <Button
              onClick={runDetailedTest}
              disabled={isLoading}
              variant="primary"
              icon={isLoading ? <Save className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            >
              {isLoading ? '调试中...' : '开始详细调试'}
            </Button>
            
            <Button
              onClick={clearDebugLog}
              variant="outline"
              disabled={isLoading}
            >
              清空日志
            </Button>
          </div>

          {/* 调试日志 */}
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
            <div className="text-white mb-2">🐛 调试日志:</div>
            {debugLog.length === 0 ? (
              <div className="text-gray-500">点击"开始详细调试"查看详细日志...</div>
            ) : (
              debugLog.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>

          {/* 说明 */}
          <div className="mt-6 text-sm text-gray-600">
            <h3 className="font-medium mb-2">调试步骤说明:</h3>
            <ol className="space-y-1 ml-4">
              <li>1. 检查用户登录状态</li>
              <li>2. 检查localStorage中的会话数据</li>
              <li>3. 创建测试会话（如果不存在）</li>
              <li>4. 验证会话查找功能</li>
              <li>5. 测试直接调用localStorage.addLearningCard</li>
              <li>6. 测试通过storageAdapter的调用</li>
              <li>7. 验证卡片是否成功保存</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CardDebugPage() {
  return (
    <AuthProvider>
      <CardDebugContent />
    </AuthProvider>
  )
}