/**
 * 数据生命周期管理组件
 * 
 * 功能：
 * - 显示存储空间使用情况
 * - 提供数据清理选项
 * - 管理临时数据的自动清理
 * - 数据导出和备份功能
 */

import React, { useState, useEffect } from 'react'
import { 
  Trash2, 
  Download, 
  Database, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  HardDrive,
  FileText,
  Bookmark,
  Settings as SettingsIcon
} from 'lucide-react'
import Button from './ui/Button'
import { optimizedHybridStorage } from '../services/optimizedHybridStorage'

interface StorageStats {
  totalSessions: number
  temporarySessions: number
  totalCards: number
  totalSize: string
  oldestSession: Date | null
  newestSession: Date | null
}

interface CleanupResult {
  success: boolean
  cleanedCount: number
  error?: string
}

export default function DataLifecycleManager() {
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<CleanupResult | null>(null)
  const [cleanupDays, setCleanupDays] = useState(30)
  
  useEffect(() => {
    loadStorageStats()
  }, [])
  
  /**
   * 加载存储统计数据
   */
  const loadStorageStats = async () => {
    setIsLoading(true)
    try {
      const sessions = await optimizedHybridStorage.getAllSessions()
      const cards = await optimizedHybridStorage.getAllCards()
      
      // 计算临时会话数量
      const temporarySessions = sessions.filter(session => {
        // 简单判断：无收藏消息且超过7天未更新的会话视为临时
        const isOld = Date.now() - session.updatedAt > 7 * 24 * 60 * 60 * 1000
        const hasBookmarks = session.bookmarkedMessages && session.bookmarkedMessages.length > 0
        return isOld && !hasBookmarks
      }).length
      
      // 估算存储大小
      const estimateSize = (data: any): number => {
        try {
          return new Blob([JSON.stringify(data)]).size
        } catch {
          return JSON.stringify(data).length * 2
        }
      }
      
      const totalSize = estimateSize(sessions) + estimateSize(cards)
      
      // 格式化大小
      const formatSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }
      
      // 计算最新和最旧会话时间
      const sessionTimes = sessions.map(s => s.updatedAt).sort((a, b) => a - b)
      const oldestSession = sessionTimes.length > 0 ? new Date(sessionTimes[0]) : null
      const newestSession = sessionTimes.length > 0 ? new Date(sessionTimes[sessionTimes.length - 1]) : null
      
      setStorageStats({
        totalSessions: sessions.length,
        temporarySessions,
        totalCards: cards.length,
        totalSize: formatSize(totalSize),
        oldestSession,
        newestSession
      })
      
    } catch (error) {
      console.error('加载存储统计失败:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * 执行数据清理
   */
  const handleCleanup = async () => {
    if (!confirm(`确定要清理超过 ${cleanupDays} 天的临时数据吗？此操作不可恢复。`)) {
      return
    }
    
    setIsCleaningUp(true)
    setCleanupResult(null)
    
    try {
      const result = await optimizedHybridStorage.cleanupTemporaryData(cleanupDays)
      setCleanupResult(result as CleanupResult)
      
      if (result.success) {
        // 重新加载统计数据
        await loadStorageStats()
      }
    } catch (error) {
      console.error('数据清理失败:', error)
      setCleanupResult({
        success: false,
        cleanedCount: 0,
        error: error.message
      })
    } finally {
      setIsCleaningUp(false)
    }
  }
  
  /**
   * 导出所有数据
   */
  const handleExportData = async () => {
    try {
      const data = await optimizedHybridStorage.exportAllData()
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      
      link.href = url
      link.download = `ai-learning-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('导出数据失败:', error)
      alert('导出失败，请重试')
    }
  }
  
  /**
   * 获取存储状态颜色
   */
  const getStorageStatusColor = () => {
    if (!storageStats) return 'text-gray-500'
    
    const totalItems = storageStats.totalSessions + storageStats.totalCards
    if (totalItems > 100) return 'text-red-600'
    if (totalItems > 50) return 'text-yellow-600'
    return 'text-green-600'
  }
  
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3">
          <HardDrive className="w-5 h-5 text-blue-500 animate-pulse" />
          <span className="text-gray-600">加载存储统计...</span>
        </div>
      </div>
    )
  }
  
  if (!storageStats) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">无法加载存储统计数据</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 标题栏 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HardDrive className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium text-gray-900">数据生命周期管理</h3>
          </div>
          <div className={`text-sm font-medium ${getStorageStatusColor()}`}>
            {storageStats.totalSize}
          </div>
        </div>
      </div>
      
      {/* 存储统计 */}
      <div className="p-4 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">学习会话:</span>
            <span className="font-medium">{storageStats.totalSessions}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Bookmark className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">收藏卡片:</span>
            <span className="font-medium">{storageStats.totalCards}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4 text-yellow-500" />
            <span className="text-gray-600">临时数据:</span>
            <span className="font-medium">{storageStats.temporarySessions}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-purple-500" />
            <span className="text-gray-600">使用时长:</span>
            <span className="font-medium">
              {storageStats.oldestSession 
                ? Math.ceil((Date.now() - storageStats.oldestSession.getTime()) / (24 * 60 * 60 * 1000)) + '天'
                : '新用户'
              }
            </span>
          </div>
        </div>
      </div>
      
      {/* 数据清理区域 */}
      <div className="p-4">
        <h4 className="font-medium text-gray-900 mb-3">数据清理</h4>
        
        {/* 清理配置 */}
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-yellow-800">清理超过</span>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={cleanupDays}
                onChange={(e) => setCleanupDays(parseInt(e.target.value) || 30)}
                min="7"
                max="365"
                className="w-16 px-2 py-1 text-sm border border-yellow-300 rounded text-center"
              />
              <span className="text-sm text-yellow-800">天的临时数据</span>
            </div>
          </div>
          
          <p className="text-xs text-yellow-700">
            临时数据指：无收藏内容且长时间未更新的学习会话
          </p>
        </div>
        
        {/* 操作按钮 */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={handleCleanup}
            disabled={isCleaningUp || storageStats.temporarySessions === 0}
            className="flex items-center justify-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>
              {isCleaningUp ? '清理中...' : `清理数据 (${storageStats.temporarySessions})`}
            </span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center justify-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>导出备份</span>
          </Button>
        </div>
      </div>
      
      {/* 清理结果 */}
      {cleanupResult && (
        <div className="border-t border-gray-100 p-4">
          <div className={`rounded-lg p-3 ${
            cleanupResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {cleanupResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="font-medium">
                {cleanupResult.success ? '清理完成' : '清理失败'}
              </span>
            </div>
            
            <div className="text-sm">
              {cleanupResult.success ? (
                <div>
                  成功清理了 {cleanupResult.cleanedCount} 个临时会话
                  {cleanupResult.cleanedCount > 0 && '，释放了存储空间'}
                </div>
              ) : (
                <div>清理失败: {cleanupResult.error}</div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* 数据时间线 */}
      {storageStats.oldestSession && storageStats.newestSession && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <h5 className="text-sm font-medium text-gray-700 mb-2">数据时间线</h5>
          <div className="text-xs text-gray-600 space-y-1">
            <div>最早数据: {storageStats.oldestSession.toLocaleDateString()}</div>
            <div>最新数据: {storageStats.newestSession.toLocaleDateString()}</div>
            <div>
              活跃期间: {Math.ceil((storageStats.newestSession.getTime() - storageStats.oldestSession.getTime()) / (24 * 60 * 60 * 1000))} 天
            </div>
          </div>
        </div>
      )}
    </div>
  )
}