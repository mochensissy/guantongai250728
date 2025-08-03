/**
 * 卡片功能测试页面
 * 测试addLearningCard是否正常工作
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import { addLearningCard } from '../src/utils/storageAdapter'
import Button from '../src/components/ui/Button'
import { LearningCard } from '../src/types'
import { Save, Star, Lightbulb } from 'lucide-react'

function CardTestContent() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  const runCardTest = async () => {
    setIsLoading(true)
    setTestResult('开始测试卡片功能...')
    
    try {
      // 创建测试卡片
      const testCard: LearningCard = {
        id: `test-card-${Date.now()}`,
        title: '测试卡片',
        content: '这是一个测试卡片的内容，用于验证卡片保存功能是否正常工作。',
        userNote: '这是用户的学习笔记',
        type: 'inspiration',
        tags: ['测试'],
        createdAt: Date.now(),
        nextReviewAt: Date.now() + (24 * 60 * 60 * 1000), // 明天复习
        reviewCount: 0,
        difficulty: 3,
        sessionId: 'test-session-id',
        messageId: 'test-message-id',
        chapterId: 'test-chapter-id'
      }

      setTestResult('正在保存卡片...')
      console.log('🧪 测试保存卡片:', testCard)
      
      const success = await addLearningCard('test-session-id', testCard)
      
      if (success) {
        setTestResult('✅ 卡片保存成功！现在去Supabase数据库查看learning_cards表。')
        console.log('✅ 卡片保存成功')
      } else {
        setTestResult('❌ 卡片保存失败')
        console.error('❌ 卡片保存失败')
      }
    } catch (error) {
      setTestResult(`❌ 测试失败: ${error.message}`)
      console.error('❌ 卡片测试失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">卡片功能测试</h1>
          
          {/* 用户状态 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              {user ? <Star className="w-5 h-5 text-blue-600 mr-3" /> : <Lightbulb className="w-5 h-5 text-gray-500 mr-3" />}
              <div>
                <h3 className="font-medium text-blue-900">当前状态</h3>
                <p className="text-sm text-blue-800">
                  {user ? `已登录: ${user.email} (将测试云端卡片存储)` : '未登录 (将测试本地卡片存储)'}
                </p>
              </div>
            </div>
          </div>

          {/* 测试按钮 */}
          <div className="mb-6">
            <Button
              onClick={runCardTest}
              disabled={isLoading}
              variant="primary"
              icon={isLoading ? <Save className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {isLoading ? '测试中...' : '测试卡片保存功能'}
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
            <h3 className="font-medium mb-2">验证方法:</h3>
            <ul className="space-y-1">
              <li>• <strong>已登录:</strong> 检查Supabase数据库的learning_cards表</li>
              <li>• <strong>未登录:</strong> 检查浏览器localStorage</li>
              <li>• <strong>控制台:</strong> 查看开发者控制台的日志输出</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CardTestPage() {
  return (
    <AuthProvider>
      <CardTestContent />
    </AuthProvider>
  )
}