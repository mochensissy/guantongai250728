/**
 * 智能同步控制组件 - Anki 风格的用户主导同步界面
 * 
 * 功能特性：
 * - 显示待同步数据统计和预览
 * - 提供多种同步选项（快速/完整/自定义）
 * - 实时同步进度显示
 * - 同步历史和成本分析
 */

import React, { useState, useEffect } from 'react'
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Database, 
  FileText, 
  Bookmark,
  Settings,
  Eye,
  Zap,
  Archive,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import Button from './ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { smartSyncManager, SyncPlan, SyncResult, SyncStats, DataItem } from '../services/smartSync'

interface SmartSyncControlProps {
  compact?: boolean
  showDetails?: boolean
}

export default function SmartSyncControl({ compact = false, showDetails = true }: SmartSyncControlProps) {
  const { user } = useAuth()
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)
  const [syncPlan, setSyncPlan] = useState<SyncPlan | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedItems, setSelectedItems] = useState<DataItem[]>([])
  
  // 初始化数据
  useEffect(() => {
    if (user) {
      loadSyncData()
    }
  }, [user])
  
  // 监听同步完成事件，自动刷新所有组件实例
  useEffect(() => {
    const handleSyncComplete = () => {
      if (user) {
        loadSyncData()
      }
    }
    
    // 添加事件监听器
    window.addEventListener('syncComplete', handleSyncComplete)
    
    return () => {
      window.removeEventListener('syncComplete', handleSyncComplete)
    }
  }, [user])
  
  /**
   * 加载同步数据
   */
  const loadSyncData = async () => {
    setIsLoading(true)
    try {
      const [stats, plan] = await Promise.all([
        smartSyncManager.getSyncStats(),
        smartSyncManager.generateSyncPlan()
      ])
      setSyncStats(stats)
      setSyncPlan(plan)
    } catch (error) {
      console.error('加载同步数据失败:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  /**
   * 执行快速同步
   */
  const handleQuickSync = async () => {
    if (!user || isSyncing) return
    
    setIsSyncing(true)
    setSyncResult(null)
    
    try {
               // 执行快速同步，减少动画时间
         const [result] = await Promise.all([
           smartSyncManager.executeQuickSync(),
           new Promise(resolve => setTimeout(resolve, 800)) // 减少到0.8秒同步动画
         ])
      
      setSyncResult(result)
      
      if (result.success) {
        smartSyncManager.updateLastSyncTime()
        await loadSyncData() // 刷新统计
        // 触发全局同步完成事件，让其他组件实例也更新
        window.dispatchEvent(new CustomEvent('syncComplete'))
      }
    } catch (error) {
      console.error('快速同步失败:', error)
      setSyncResult({
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [error.message],
        duration: 0,
        savedSize: 0
      })
    } finally {
      setIsSyncing(false)
    }
  }
  
  /**
   * 执行完整同步
   */
  const handleFullSync = async () => {
    if (!user || isSyncing) return
    
    if (!confirm('完整同步会上传更多数据到云端，确定继续吗？')) {
      return
    }
    
    setIsSyncing(true)
    setSyncResult(null)
    
    try {
      // 完整同步需要更长时间
               const [result] = await Promise.all([
           smartSyncManager.executeFullSync(),
           new Promise(resolve => setTimeout(resolve, 1200)) // 减少到1.2秒同步动画
         ])
      
      setSyncResult(result)
      
      if (result.success) {
        smartSyncManager.updateLastSyncTime()
        await loadSyncData()
        // 触发全局同步完成事件，让其他组件实例也更新
        window.dispatchEvent(new CustomEvent('syncComplete'))
      }
    } catch (error) {
      console.error('完整同步失败:', error)
      setSyncResult({
        success: false,
        syncedItems: 0,
        failedItems: 0,
        errors: [error.message],
        duration: 0,
        savedSize: 0
      })
    } finally {
      setIsSyncing(false)
    }
  }
  
  /**
   * 预览同步内容
   */
  const handlePreviewSync = () => {
    setShowPreview(!showPreview)
  }
  
  /**
   * 获取同步状态图标
   */
  const getSyncStatusIcon = () => {
    if (!user) {
      return <CloudOff className="w-5 h-5 text-gray-400" />
    }
    
    if (isSyncing) {
      return (
        <div className="relative">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )
    }
    
    if (syncStats?.hasUnsyncedChanges) {
      return (
        <div className="relative">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
        </div>
      )
    }
    
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }
  
  /**
   * 获取状态文本
   */
  const getStatusText = () => {
    if (!user) return '未登录'
    if (isSyncing) return '正在同步数据...'
    if (syncStats?.hasUnsyncedChanges) return `${syncStats.pendingItems} 项数据待同步`
    return '所有数据已同步'
  }
  
  /**
   * 获取成本颜色
   */
  const getCostColor = (cost: string) => {
    switch (cost) {
      case 'low': return 'text-green-600'
      case 'medium': return 'text-yellow-600'
      case 'high': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }
  
  /**
   * 渲染数据项图标
   */
  const getDataItemIcon = (type: string) => {
    switch (type) {
      case 'card': return <Bookmark className="w-4 h-4 text-blue-500" />
      case 'session': return <FileText className="w-4 h-4 text-green-500" />
      case 'preference': return <Settings className="w-4 h-4 text-purple-500" />
      default: return <Database className="w-4 h-4 text-gray-500" />
    }
  }
  
  // 紧凑模式渲染
  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        {getSyncStatusIcon()}
        <span className="text-sm text-gray-700">
          {getStatusText()}
        </span>
        {user && syncStats?.hasUnsyncedChanges && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="text-xs"
          >
            {isSyncing ? '同步中...' : '同步'}
          </Button>
        )}
      </div>
    )
  }
  
  // 无用户登录状态
  if (!user) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <CloudOff className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">请登录后使用云端同步功能</p>
      </div>
    )
  }
  
  // 加载状态
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
          <span className="text-gray-600">分析同步数据...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* 同步状态头部 */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getSyncStatusIcon()}
            <div>
              <h3 className="font-medium text-gray-900">
                智能云端同步
              </h3>
              <p className="text-sm text-gray-600">
                {getStatusText()}
              </p>
            </div>
          </div>
          
          {syncStats && (
            <div className="text-right">
              <div className="text-sm text-gray-500">
                数据大小: {syncStats.totalSize}
              </div>
              <div className={`text-xs ${getCostColor(syncStats.estimatedCost)}`}>
                成本: {syncStats.estimatedCost}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* 同步统计 */}
      {syncStats && showDetails && (
        <div className="p-4 bg-gray-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">待同步项目:</span>
              <span className="font-medium">{syncStats.pendingItems}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">上次同步:</span>
              <span className="font-medium">
                {syncStats.lastSyncTime 
                  ? syncStats.lastSyncTime.toLocaleString()
                  : '从未同步'
                }
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 同步操作按钮 */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3">
          <Button
            onClick={handleQuickSync}
            disabled={isSyncing || !syncStats?.hasUnsyncedChanges}
            className="flex items-center justify-center space-x-2"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            <span>{isSyncing ? '同步中...' : '快速同步'}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleFullSync}
            disabled={isSyncing || !syncStats?.hasUnsyncedChanges}
            className="flex items-center justify-center space-x-2"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Archive className="w-4 h-4" />
            )}
            <span>{isSyncing ? '同步中...' : '完整同步'}</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handlePreviewSync}
            className="flex items-center justify-center space-x-2"
          >
            <Eye className="w-4 h-4" />
            <span>预览</span>
          </Button>
        </div>
      </div>
      
      {/* 同步预览 */}
      {showPreview && syncPlan && (
        <div className="border-t border-gray-100 p-4">
          <h4 className="font-medium text-gray-900 mb-3">同步内容预览</h4>
          
          {/* 核心数据 */}
          {syncPlan.critical.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-red-600 mb-2">
                核心数据 ({syncPlan.critical.length} 项)
              </h5>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {syncPlan.critical.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {getDataItemIcon(item.type)}
                    <span className="text-gray-700 truncate flex-1">
                      {item.type === 'card' ? item.content.content.substring(0, 50) + '...' :
                       item.type === 'session' ? item.content.title :
                       item.type === 'preference' ? '用户偏好设置' : item.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(item.estimatedSize / 1024).toFixed(1)}KB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 重要数据 */}
          {syncPlan.important.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-orange-600 mb-2">
                重要数据 ({syncPlan.important.length} 项) - 可选
              </h5>
              <div className="space-y-2 max-h-24 overflow-y-auto">
                {syncPlan.important.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm">
                    {getDataItemIcon(item.type)}
                    <span className="text-gray-700 truncate flex-1">
                      {item.type === 'session' ? item.content.title : item.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(item.estimatedSize / 1024).toFixed(1)}KB
                    </span>
                  </div>
                ))}
                {syncPlan.important.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    还有 {syncPlan.important.length - 3} 项...
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 同步估算 */}
          <div className="bg-blue-50 rounded-lg p-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-blue-800">预计同步时间:</span>
              <span className="font-medium text-blue-900">
                {syncPlan.estimatedTime < 60 ? 
                  `${syncPlan.estimatedTime} 秒` : 
                  `${Math.ceil(syncPlan.estimatedTime / 60)} 分钟`
                }
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* 同步结果 */}
      {syncResult && (
        <div className="border-t border-gray-100 p-4">
          <div className={`rounded-lg p-3 ${
            syncResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {syncResult.success ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              <span className="font-medium">
                {syncResult.success ? '同步成功' : '同步失败'}
              </span>
            </div>
            
            <div className="text-sm space-y-1">
              <div>成功: {syncResult.syncedItems} 项</div>
              {syncResult.failedItems > 0 && (
                <div>失败: {syncResult.failedItems} 项</div>
              )}
              <div>耗时: {(syncResult.duration / 1000).toFixed(1)} 秒</div>
              <div>节省: {(syncResult.savedSize / 1024).toFixed(1)} KB</div>
            </div>
            
            {syncResult.errors.length > 0 && (
              <div className="mt-2 text-xs">
                <details>
                  <summary className="cursor-pointer">错误详情</summary>
                  <div className="mt-1 space-y-1">
                    {syncResult.errors.map((error, index) => (
                      <div key={index} className="text-red-600">{error}</div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}