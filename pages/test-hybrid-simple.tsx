/**
 * 简化的混合存储测试页面
 * 避免复杂的实时同步逻辑，专注于核心功能测试
 */

import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { hybridStorage } from '../src/services/hybridStorage'
import Button from '../src/components/ui/Button'
import { LearningSession, ChatMessage, LearningCard } from '../src/types'

function SimpleHybridTestContent() {
  const { user } = useAuth()
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'success' | 'error'; message: string }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    loadSessionCount()
  }, [])

  /**
   * 加载会话数量
   */
  const loadSessionCount = async () => {
    try {
      const sessions = await hybridStorage.getAllSessions()
      setSessionCount(sessions.length)
    } catch (error) {
      console.error('加载会话数量失败:', error)
    }
  }

  /**
   * 运行基础测试
   */
  const runBasicTests = async () => {
    setIsLoading(true)
    const results: Array<{ test: string; status: 'success' | 'error'; message: string }> = []

    try {
      // 测试1: 创建简单会话
      const testSession: LearningSession = {
        id: `simple-test-${Date.now()}`,
        title: `简单测试会话 ${new Date().toLocaleTimeString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner',
        documentContent: '这是简单测试内容',
        documentType: 'text',
        outline: [{
          id: 'ch1',
          title: '第一章',
          order: 1,
          type: 'chapter',
          level: 1,
          chapterNumber: 1
        }],
        messages: [{
          id: `msg-${Date.now()}`,
          role: 'user',
          content: '测试消息',
          timestamp: Date.now()
        }],
        status: 'active',
        cards: []
      }

      // 保存会话
      const saveResult = await hybridStorage.saveSession(testSession)
      if (saveResult) {
        results.push({ test: '保存会话', status: 'success', message: '会话保存成功' })
      } else {
        results.push({ test: '保存会话', status: 'error', message: '会话保存失败' })
      }

      // 读取会话
      const loadedSession = await hybridStorage.getSessionById(testSession.id)
      if (loadedSession && loadedSession.title === testSession.title) {
        results.push({ test: '读取会话', status: 'success', message: '会话读取成功' })
      } else {
        results.push({ test: '读取会话', status: 'error', message: '会话读取失败' })
      }

      // 获取同步状态
      const syncStatus = hybridStorage.getSyncStatus()
      results.push({ 
        test: '同步状态', 
        status: 'success', 
        message: `队列大小: ${syncStatus.queueSize}` 
      })

      // 更新会话计数
      await loadSessionCount()

    } catch (error) {
      results.push({ test: '测试执行', status: 'error', message: `错误: ${error.message}` })
    }

    setTestResults(results)
    setIsLoading(false)
  }

  /**
   * 测试API配置
   */
  const testAPIConfig = () => {
    try {
      const testConfig = {
        provider: 'openrouter' as const,
        apiKey: 'test-key',
        baseURL: 'https://test.com',
        model: 'test-model'
      }

      const saveResult = hybridStorage.saveAPIConfig(testConfig)
      const loadedConfig = hybridStorage.getAPIConfig()

      if (saveResult && loadedConfig && loadedConfig.apiKey === 'test-key') {
        setTestResults(prev => [...prev, { 
          test: 'API配置', 
          status: 'success', 
          message: 'API配置保存和读取成功' 
        }])
      } else {
        setTestResults(prev => [...prev, { 
          test: 'API配置', 
          status: 'error', 
          message: 'API配置测试失败' 
        }])
      }
    } catch (error) {
      setTestResults(prev => [...prev, { 
        test: 'API配置', 
        status: 'error', 
        message: `API配置错误: ${error.message}` 
      }])
    }
  }

  /**
   * 清理测试数据
   */
  const cleanupTestData = async () => {
    try {
      const sessions = await hybridStorage.getAllSessions()
      const testSessions = sessions.filter(s => s.title.includes('简单测试会话') || s.title.includes('测试会话'))
      
      let cleaned = 0
      for (const session of testSessions) {
        const result = await hybridStorage.deleteSession(session.id)
        if (result) cleaned++
      }
      
      await loadSessionCount()
      alert(`成功清理 ${cleaned} 个测试会话`)
    } catch (error) {
      alert(`清理失败: ${error.message}`)
    }
  }

  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-lg">加载中...</div>
    </div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">混合存储系统 - 简化测试</h1>
          
          {/* 状态信息 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">当前状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">用户状态:</span><br/>
                {user ? `${user.email} (已登录)` : '未登录'}
              </div>
              <div>
                <span className="font-medium">本地会话:</span><br/>
                {sessionCount} 个
              </div>
              <div>
                <span className="font-medium">系统状态:</span><br/>
                {typeof window !== 'undefined' ? '客户端已加载' : '服务端渲染'}
              </div>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">测试功能</h2>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={runBasicTests}
                disabled={isLoading}
                variant="primary"
              >
                {isLoading ? '测试中...' : '运行基础测试'}
              </Button>
              
              <Button
                onClick={testAPIConfig}
                variant="outline"
              >
                测试API配置
              </Button>
              
              <Button
                onClick={loadSessionCount}
                variant="outline"
              >
                刷新状态
              </Button>
              
              <Button
                onClick={cleanupTestData}
                variant="outline"
                disabled={sessionCount === 0}
              >
                清理测试数据
              </Button>
            </div>
          </div>

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">测试结果</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{result.test}</span>
                      <span
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          result.status === 'success' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.status === 'success' ? '✅ 成功' : '❌ 失败'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 说明 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">测试说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 这是简化版的混合存储测试，避免复杂的实时同步</li>
              <li>• 测试基本的数据存储、读取和API配置功能</li>
              <li>• 如果已登录，数据会同步到云端；否则仅保存在本地</li>
              <li>• 所有功能都有向后兼容性，不会影响现有应用</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SimpleHybridTestPage() {
  return (
    <AuthProvider>
      <SimpleHybridTestContent />
    </AuthProvider>
  )
}