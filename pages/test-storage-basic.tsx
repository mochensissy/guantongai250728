/**
 * 基础存储功能测试页面
 * 完全避免水合问题，只测试核心存储功能
 */

import React, { useState } from 'react'
import Button from '../src/components/ui/Button'
import * as localStorage from '../src/utils/storage'
import { LearningSession } from '../src/types'

export default function BasicStorageTestPage() {
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testBasicStorage = () => {
    setIsLoading(true)
    setResults([])

    try {
      // 测试1: 创建简单会话
      const testSession: LearningSession = {
        id: `basic-test-${Date.now()}`,
        title: `基础测试会话 ${new Date().toLocaleTimeString()}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel: 'beginner',
        documentContent: '基础测试内容',
        documentType: 'text',
        outline: [{
          id: 'ch1',
          title: '测试章节',
          order: 1,
          type: 'chapter',
          level: 1,
          chapterNumber: 1
        }],
        messages: [{
          id: `msg-${Date.now()}`,
          role: 'user',
          content: '基础测试消息',
          timestamp: Date.now()
        }],
        status: 'active',
        cards: []
      }

      // 保存会话
      const saveResult = localStorage.saveSession(testSession)
      if (saveResult) {
        addResult('✅ 本地保存会话成功')
      } else {
        addResult('❌ 本地保存会话失败')
      }

      // 读取会话
      const loadedSession = localStorage.getSessionById(testSession.id)
      if (loadedSession && loadedSession.title === testSession.title) {
        addResult('✅ 本地读取会话成功')
      } else {
        addResult('❌ 本地读取会话失败')
      }

      // 获取所有会话
      const allSessions = localStorage.getAllSessions()
      addResult(`✅ 获取所有会话: ${allSessions.length} 个`)

      // 测试API配置
      const testConfig = {
        provider: 'openrouter' as const,
        apiKey: 'test-key-123',
        baseURL: 'https://test.com',
        model: 'test-model'
      }

      const configSaveResult = localStorage.saveAPIConfig(testConfig)
      if (configSaveResult) {
        addResult('✅ API配置保存成功')
      } else {
        addResult('❌ API配置保存失败')
      }

      const loadedConfig = localStorage.getAPIConfig()
      if (loadedConfig && loadedConfig.apiKey === 'test-key-123') {
        addResult('✅ API配置读取成功')
      } else {
        addResult('❌ API配置读取失败')
      }

      // 测试用户偏好
      const testPrefs = {
        defaultLearningLevel: 'expert' as const,
        theme: 'dark' as const
      }

      const prefsSaveResult = localStorage.saveUserPreferences(testPrefs)
      if (prefsSaveResult) {
        addResult('✅ 用户偏好保存成功')
      } else {
        addResult('❌ 用户偏好保存失败')
      }

      const loadedPrefs = localStorage.getUserPreferences()
      if (loadedPrefs.defaultLearningLevel === 'expert') {
        addResult('✅ 用户偏好读取成功')
      } else {
        addResult('❌ 用户偏好读取失败')
      }

      addResult('🎉 所有基础功能测试完成')

    } catch (error) {
      addResult(`❌ 测试过程中发生错误: ${error.message}`)
    }

    setIsLoading(false)
  }

  const clearTestData = () => {
    try {
      const allSessions = localStorage.getAllSessions()
      const testSessions = allSessions.filter(s => s.title.includes('基础测试会话'))
      
      let cleared = 0
      testSessions.forEach(session => {
        if (localStorage.deleteSession(session.id)) {
          cleared++
        }
      })

      addResult(`🧹 清理了 ${cleared} 个测试会话`)
    } catch (error) {
      addResult(`❌ 清理失败: ${error.message}`)
    }
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">基础存储功能测试</h1>
          
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-medium text-blue-900 mb-2">测试说明</h2>
            <p className="text-sm text-blue-800">
              这个页面测试应用的基础本地存储功能，包括会话保存、API配置和用户偏好设置。
              这是混合存储系统的基础层，确保所有功能正常工作。
            </p>
          </div>

          {/* 控制按钮 */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={testBasicStorage}
                disabled={isLoading}
                variant="primary"
              >
                {isLoading ? '测试中...' : '运行基础测试'}
              </Button>
              
              <Button
                onClick={clearTestData}
                variant="outline"
              >
                清理测试数据
              </Button>
              
              <Button
                onClick={clearResults}
                variant="outline"
              >
                清空结果
              </Button>
            </div>
          </div>

          {/* 测试结果 */}
          {results.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">测试结果</h2>
              <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="space-y-2 font-mono text-sm">
                  {results.map((result, index) => (
                    <div 
                      key={index} 
                      className={`${
                        result.includes('✅') ? 'text-green-700' :
                        result.includes('❌') ? 'text-red-700' :
                        result.includes('🎉') ? 'text-blue-700' :
                        result.includes('🧹') ? 'text-orange-700' :
                        'text-gray-700'
                      }`}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 存储状态信息 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">存储状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">当前会话数:</span> {localStorage.getAllSessions().length}
              </div>
              <div>
                <span className="font-medium">当前卡片数:</span> {localStorage.getAllCards().length}
              </div>
              <div>
                <span className="font-medium">API配置:</span> {localStorage.getAPIConfig() ? '已配置' : '未配置'}
              </div>
              <div>
                <span className="font-medium">用户偏好:</span> 已加载
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}