/**
 * 本地数据清空测试页面
 * 用于验证云端数据同步是否正常工作
 */

import React, { useState } from 'react'
import { AuthProvider, useAuth } from '../src/contexts/AuthContext'
import Button from '../src/components/ui/Button'
import { Trash2, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'
import * as localStorage from '../src/utils/storage'

function LocalClearTestContent() {
  const { user } = useAuth()
  const [localData, setLocalData] = useState({
    sessions: [],
    cards: [],
    preferences: null,
    apiConfig: null
  })
  const [isClearing, setIsClearing] = useState(false)
  const [hasCleared, setHasCleared] = useState(false)

  /**
   * 加载本地数据统计
   */
  const loadLocalData = () => {
    const sessions = localStorage.getAllSessions()
    const cards = localStorage.getAllCards()
    const preferences = localStorage.getUserPreferences()
    const apiConfig = localStorage.getAPIConfig()

    setLocalData({
      sessions,
      cards,
      preferences,
      apiConfig
    })
  }

  /**
   * 清空所有本地数据
   */
  const clearAllLocalData = async () => {
    if (!confirm('⚠️ 确定要清空所有本地数据吗？\n\n这将删除：\n- 所有学习会话\n- 所有学习卡片\n- 用户偏好设置\n- API配置\n\n如果云端同步正常，数据应该能从云端恢复。')) {
      return
    }

    setIsClearing(true)
    
    try {
      // 清空localStorage
      const keysToRemove = [
        'ai-learning-platform-data',
        'ai-learning-platform-version',
        'hybrid-sync-queue'
      ]
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
      })
      
      // 也清空其他可能的缓存
      localStorage.clear()
      
      setHasCleared(true)
      loadLocalData()
      
      alert('✅ 本地数据已清空！\n\n现在请：\n1. 刷新页面\n2. 重新登录\n3. 检查数据是否从云端恢复')
      
    } catch (error) {
      console.error('清空本地数据失败:', error)
      alert('❌ 清空失败：' + error.message)
    } finally {
      setIsClearing(false)
    }
  }

  // 加载本地数据
  React.useEffect(() => {
    loadLocalData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">本地数据清空测试</h1>
            <p className="text-gray-600">
              通过清空本地缓存来验证云端数据同步是否正常工作
            </p>
          </div>

          {/* 当前用户状态 */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">当前用户状态</h2>
            <p className="text-sm text-blue-800">
              {user ? `已登录: ${user.email}` : '未登录'}
            </p>
          </div>

          {/* 本地数据统计 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">本地数据统计</h2>
              <Button
                onClick={loadLocalData}
                variant="outline"
                size="sm"
                icon={<RefreshCw className="w-4 h-4" />}
              >
                刷新统计
              </Button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{localData.sessions.length}</div>
                <div className="text-sm text-gray-600">学习会话</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{localData.cards.length}</div>
                <div className="text-sm text-gray-600">学习卡片</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {localData.preferences ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">用户偏好</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {localData.apiConfig ? '1' : '0'}
                </div>
                <div className="text-sm text-gray-600">API配置</div>
              </div>
            </div>
          </div>

          {/* 测试说明 */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-yellow-900 mb-2">测试原理</h3>
                <div className="text-sm text-yellow-800 space-y-1">
                  <p>• <strong>步骤1:</strong> 清空所有本地缓存数据</p>
                  <p>• <strong>步骤2:</strong> 刷新页面并重新登录</p>
                  <p>• <strong>步骤3:</strong> 检查数据是否从云端自动恢复</p>
                  <p>• <strong>验证:</strong> 如果数据能恢复，说明云端同步正常工作</p>
                </div>
              </div>
            </div>
          </div>

          {/* 操作区域 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">测试操作</h2>
            
            {!hasCleared ? (
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">准备清空本地数据</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    这将删除浏览器中的所有本地缓存数据。如果云端同步正常，数据应该能够恢复。
                  </p>
                  <Button
                    onClick={clearAllLocalData}
                    disabled={isClearing || !user}
                    variant="destructive"
                    icon={<Trash2 className="w-4 h-4" />}
                  >
                    {isClearing ? '清空中...' : '清空所有本地数据'}
                  </Button>
                  {!user && (
                    <p className="text-sm text-red-600 mt-2">请先登录后再进行测试</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                  <div>
                    <h3 className="font-medium text-green-900">本地数据已清空</h3>
                    <p className="text-sm text-green-800 mt-1">
                      现在请刷新页面或重新登录，检查数据是否从云端恢复
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 验证步骤 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3">🔍 验证步骤详解</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              <li><strong>1. 记录当前数据:</strong> 记住你当前有多少个学习会话和消息</li>
              <li><strong>2. 清空本地缓存:</strong> 点击上方的"清空所有本地数据"按钮</li>
              <li><strong>3. 刷新页面:</strong> 按F5或刷新浏览器页面</li>
              <li><strong>4. 重新登录:</strong> 使用相同的邮箱账号登录</li>
              <li><strong>5. 检查数据恢复:</strong> 查看仪表板中的学习历史是否恢复</li>
              <li><strong>6. 访问云端验证页面:</strong> 访问 <code>/test-cloud-data</code> 查看详细云端数据</li>
            </ol>
            
            <div className="mt-4 p-3 bg-blue-50 rounded border">
              <p className="text-sm text-blue-800">
                <strong>💡 预期结果:</strong> 如果云端同步正常，您的所有学习会话、消息记录都应该在重新登录后自动恢复。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LocalClearTestPage() {
  return (
    <AuthProvider>
      <LocalClearTestContent />
    </AuthProvider>
  )
}