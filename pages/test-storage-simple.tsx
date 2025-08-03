/**
 * 简化的存储测试页面
 */

import React, { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { storageAdapter } from '../src/utils/storageAdapter'
import Button from '../src/components/ui/Button'
import { Save, RefreshCw, Cloud, CloudOff } from 'lucide-react'

function StorageTestContent() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  const runTest = async () => {
    setIsLoading(true)
    setTestResult('开始测试...')
    
    try {
      // 简单测试：创建一个会话
      const testSession = {
        id: `test-${Date.now()}`,
        title: `测试会话 ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner' as const,
        documentContent: '测试内容',
        documentType: 'text' as const,
        outline: [],
        messages: [],
        status: 'active' as const,
        cards: []
      }

      setTestResult('正在保存会话...')
      const saveResult = await storageAdapter.saveSession(testSession)
      
      if (saveResult) {
        setTestResult('✅ 会话保存成功！')
        
        // 验证读取
        const loadedSession = await storageAdapter.getSessionById(testSession.id)
        if (loadedSession) {
          setTestResult('✅ 会话保存和读取都成功！数据已正确存储。')
        } else {
          setTestResult('⚠️ 会话保存成功，但读取失败')
        }
      } else {
        setTestResult('❌ 会话保存失败')
      }
    } catch (error) {
      setTestResult(`❌ 测试失败: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">存储功能测试</h1>
          
          {/* 用户状态 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              {user ? <Cloud className="w-5 h-5 text-blue-600 mr-3" /> : <CloudOff className="w-5 h-5 text-gray-500 mr-3" />}
              <div>
                <h3 className="font-medium text-blue-900">当前状态</h3>
                <p className="text-sm text-blue-800">
                  {user ? `已登录: ${user.email} (云端存储)` : '未登录 (本地存储)'}
                </p>
              </div>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="mb-6">
            <Button
              onClick={runTest}
              disabled={isLoading}
              variant="primary"
              icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {isLoading ? '测试中...' : '运行存储测试'}
            </Button>
          </div>

          {/* 测试结果 */}
          {testResult && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">测试结果:</h3>
              <p className="text-sm text-gray-700">{testResult}</p>
            </div>
          )}

          <div className="mt-6 text-sm text-gray-600">
            <p><strong>说明:</strong> 这个测试会创建一个简单的学习会话并验证存储功能。如果您已登录，数据会保存到云端；未登录时保存到本地。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StorageTestPage() {
  return (
    <AuthProvider>
      <StorageTestContent />
    </AuthProvider>
  )
}