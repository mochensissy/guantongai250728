/**
 * 存储修复验证页面
 * 测试新的存储适配器是否正确工作
 */

import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { storageAdapter } from '../src/utils/storageAdapter'
import Button from '../src/components/ui/Button'
import { LearningSession, ChatMessage } from '../src/types'
import { Cloud, CloudOff, Save, RefreshCw } from 'lucide-react'

function StorageFixTestContent() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<Array<{ 
    test: string; 
    status: 'success' | 'error'; 
    message: string;
    data?: any;
  }>>([])

  /**
   * 运行存储测试
   */
  const runStorageTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    const results = []

    try {
      // 测试1: 创建测试会话
      console.log('🧪 测试1: 创建测试会话')
      const testSession: LearningSession = {
        id: `storage-test-${Date.now()}`,
        title: `存储测试会话 ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner',
        documentContent: '这是一个存储测试的文档内容',
        documentType: 'text',
        outline: [{
          id: 'test-chapter',
          title: '测试章节',
          order: 1,
          type: 'chapter',
          level: 1,
          chapterNumber: 1
        }],
        messages: [],
        status: 'active',
        cards: []
      }

      const saveResult = await storageAdapter.saveSession(testSession)
      results.push({
        test: '创建测试会话',
        status: saveResult ? 'success' : 'error',
        message: saveResult ? '会话保存成功' : '会话保存失败',
        data: { sessionId: testSession.id }
      })

      // 测试2: 读取会话
      console.log('🧪 测试2: 读取会话')
      const loadedSession = await storageAdapter.getSessionById(testSession.id)
      results.push({
        test: '读取会话',
        status: loadedSession ? 'success' : 'error',
        message: loadedSession ? `成功读取会话: ${loadedSession.title}` : '读取会话失败',
        data: { found: !!loadedSession }
      })

      // 测试3: 添加消息
      console.log('🧪 测试3: 添加消息')
      const testMessages: ChatMessage[] = [
        {
          id: `msg-${Date.now()}`,
          role: 'user',
          content: '这是一条测试消息',
          timestamp: Date.now()
        },
        {
          id: `msg-ai-${Date.now()}`,
          role: 'assistant',
          content: '这是AI的回复',
          timestamp: Date.now() + 1000
        }
      ]

      const messageResult = await storageAdapter.updateSessionMessages(testSession.id, testMessages)
      results.push({
        test: '添加消息',
        status: messageResult ? 'success' : 'error',
        message: messageResult ? `成功添加${testMessages.length}条消息` : '添加消息失败',
        data: { messageCount: testMessages.length }
      })

      // 测试4: 验证消息保存
      console.log('🧪 测试4: 验证消息保存')
      const updatedSession = await storageAdapter.getSessionById(testSession.id)
      const hasMessages = updatedSession && updatedSession.messages && updatedSession.messages.length > 0
      results.push({
        test: '验证消息保存',
        status: hasMessages ? 'success' : 'error',
        message: hasMessages ? `会话中有${updatedSession?.messages?.length}条消息` : '消息未正确保存',
        data: { messageCount: updatedSession?.messages?.length || 0 }
      })

      // 测试5: 获取所有会话
      console.log('🧪 测试5: 获取所有会话')
      const allSessions = await storageAdapter.getAllSessions()
      const hasTestSession = allSessions.some(s => s.id === testSession.id)
      results.push({
        test: '获取所有会话',
        status: hasTestSession ? 'success' : 'error',
        message: hasTestSession ? `在${allSessions.length}个会话中找到测试会话` : '测试会话未出现在会话列表中',
        data: { totalSessions: allSessions.length, foundTestSession: hasTestSession }
      })

      // 测试6: API配置测试
      console.log('🧪 测试6: API配置测试')
      const currentConfig = await storageAdapter.getAPIConfig()
      results.push({
        test: 'API配置读取',
        status: 'success',
        message: currentConfig ? 'API配置存在' : 'API配置不存在',
        data: { hasConfig: !!currentConfig }
      })

    } catch (error) {
      console.error('存储测试失败:', error)
      results.push({
        test: '整体测试',
        status: 'error',
        message: `测试失败: ${error.message}`,
        data: { error: error.message }
      })
    }

    setTestResults(results)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">存储修复验证</h1>
              <p className="text-gray-600">测试新的存储适配器是否正确工作</p>
            </div>
            <Button
              onClick={runStorageTests}
              disabled={isLoading}
              variant="primary"
              icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {isLoading ? '测试中...' : '运行测试'}
            </Button>
          </div>

          {/* 用户状态 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              {user ? <Cloud className="w-5 h-5 text-blue-600 mr-3" /> : <CloudOff className="w-5 h-5 text-gray-500 mr-3" />}
              <div>
                <h3 className="font-medium text-blue-900">当前用户状态</h3>
                <p className="text-sm text-blue-800">
                  {user ? `已登录: ${user.email} (将使用云端存储)` : '未登录 (将使用本地存储)'}
                </p>
              </div>
            </div>
          </div>

          {/* 测试结果 */}
          {testResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">测试结果</h2>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <h3 className={`font-medium ${
                        result.status === 'success' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {result.test}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'success' ? '✅ 成功' : '❌ 失败'}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      result.status === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.message}
                    </p>
                    {result.data && (
                      <pre className="text-xs mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 说明信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">💡 测试说明</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>已登录用户:</strong> 数据会保存到云端 (Supabase) 并同步到本地缓存</li>
              <li>• <strong>未登录用户:</strong> 数据只保存在本地浏览器存储中</li>
              <li>• <strong>自动降级:</strong> 如果云端保存失败，会自动降级到本地存储</li>
              <li>• <strong>透明切换:</strong> 应用代码无需修改，存储适配器会自动选择最佳方案</li>
            </ul>
            
            <div className="mt-4 p-3 bg-blue-50 rounded border">
              <p className="text-sm text-blue-800">
                <strong>🎯 期望结果:</strong> 所有测试都应该成功。如果您已登录，数据应该出现在Supabase数据库中。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StorageFixTestPage() {
  return (
    <AuthProvider>
      <StorageFixTestContent />
    </AuthProvider>
  )
}