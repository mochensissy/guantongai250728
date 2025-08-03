/**
 * Supabase连接测试页面
 * 
 * 用于验证Supabase配置是否正确工作
 */

import React, { useState, useEffect } from 'react'
import { createClient } from '../src/utils/supabase'
import { cloudStorage } from '../src/services/cloudStorage'

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'success' | 'error'>('testing')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [testResults, setTestResults] = useState<Array<{ test: string; status: 'success' | 'error'; message: string }>>([])

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    const results: Array<{ test: string; status: 'success' | 'error'; message: string }> = []

    try {
      // 测试1: 基本连接
      const client = createClient()
      
      // 测试2: 数据库连接
      const { data, error } = await client
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        results.push({ test: '数据库连接', status: 'error', message: error.message })
      } else {
        results.push({ test: '数据库连接', status: 'success', message: '连接成功' })
      }

      // 测试3: 认证状态
      const { data: { user }, error: authError } = await client.auth.getUser()
      
      if (authError) {
        results.push({ test: '认证检查', status: 'error', message: authError.message })
      } else if (user) {
        results.push({ test: '认证检查', status: 'success', message: `用户已登录: ${user.email}` })
        setUserInfo(user)
      } else {
        results.push({ test: '认证检查', status: 'success', message: '用户未登录（正常状态）' })
      }

      // 测试4: 云端存储服务
      const statsResult = await cloudStorage.getUserStats()
      if (statsResult.success) {
        results.push({ test: '云端存储服务', status: 'success', message: '服务正常工作' })
      } else {
        results.push({ test: '云端存储服务', status: 'error', message: statsResult.error || '未知错误' })
      }

      setTestResults(results)
      
      // 判断整体状态
      const hasError = results.some(r => r.status === 'error')
      setConnectionStatus(hasError ? 'error' : 'success')

    } catch (error) {
      console.error('Supabase连接测试失败:', error)
      setConnectionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : '未知错误')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Supabase 连接测试</h1>
          
          {/* 连接状态 */}
          <div className="mb-6">
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              connectionStatus === 'testing' ? 'bg-blue-100 text-blue-800' :
              connectionStatus === 'success' ? 'bg-green-100 text-green-800' :
              'bg-red-100 text-red-800'
            }`}>
              {connectionStatus === 'testing' && '🔄 正在测试连接...'}
              {connectionStatus === 'success' && '✅ 连接成功'}
              {connectionStatus === 'error' && '❌ 连接失败'}
            </div>
          </div>

          {/* 测试结果 */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">测试结果:</h2>
            
            {testResults.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{result.test}</span>
                  <span className={`text-sm ${
                    result.status === 'success' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {result.status === 'success' ? '✅ 成功' : '❌ 失败'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
              </div>
            ))}
          </div>

          {/* 用户信息 */}
          {userInfo && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-3">用户信息:</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(userInfo, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* 错误信息 */}
          {errorMessage && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold text-red-800 mb-3">错误详情:</h2>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <p className="text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* 重新测试按钮 */}
          <div className="mt-6">
            <button
              onClick={testSupabaseConnection}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              重新测试连接
            </button>
          </div>

          {/* 配置信息 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">配置信息:</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Project URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
              <p><strong>Anon Key:</strong> {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 已配置' : '❌ 未配置'}</p>
              <p><strong>Service Role Key:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 已配置' : '❌ 未配置'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}