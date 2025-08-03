/**
 * 同步状态组件
 * 
 * 显示数据同步状态和提供手动同步功能
 */

import React, { useState, useEffect } from 'react'
import { Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { hybridStorage } from '../services/hybridStorage'
import Button from './ui/Button'

interface SyncStatusProps {
  compact?: boolean
  showMigration?: boolean
}

export default function SyncStatus({ compact = false, showMigration = true }: SyncStatusProps) {
  const { user } = useAuth()
  const [syncStatus, setSyncStatus] = useState({
    isOnline: true,
    isSyncing: false,
    queueSize: 0,
    hasUser: false
  })
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationResult, setMigrationResult] = useState<any>(null)
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    // 注册同步状态监听
    const unsubscribe = hybridStorage.onSync((status, details) => {
      console.log('同步状态变化:', status, details)
      
      if (status === 'completed') {
        setLastSyncTime(new Date())
      }
      
      if (details?.type === 'migration') {
        setIsMigrating(false)
        setMigrationResult(details)
      }
      
      // 更新同步状态
      setSyncStatus(hybridStorage.getSyncStatus())
    })

    // 定期更新状态
    const interval = setInterval(() => {
      if (typeof window !== 'undefined') {
        setSyncStatus({
          ...hybridStorage.getSyncStatus(),
          hasUser: !!user
        })
      }
    }, 2000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [user])

  /**
   * 手动触发数据同步
   */
  const handleManualSync = async () => {
    if (!user) {
      alert('请先登录后再同步数据')
      return
    }

    try {
      await hybridStorage.processOfflineQueue()
    } catch (error) {
      console.error('手动同步失败:', error)
    }
  }

  /**
   * 迁移本地数据到云端
   */
  const handleMigration = async () => {
    if (!user) {
      alert('请先登录后再迁移数据')
      return
    }

    if (!confirm('确定要将本地数据迁移到云端吗？这个过程可能需要几分钟。')) {
      return
    }

    setIsMigrating(true)
    setMigrationResult(null)

    try {
      await hybridStorage.migrateLocalDataToCloud()
    } catch (error) {
      console.error('数据迁移失败:', error)
      setIsMigrating(false)
    }
  }

  /**
   * 获取连接状态图标
   */
  const getConnectionIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="w-4 h-4 text-red-500" />
    }
    
    if (!user) {
      return <CloudOff className="w-4 h-4 text-gray-400" />
    }
    
    if (syncStatus.isSyncing) {
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    }
    
    return <Cloud className="w-4 h-4 text-green-500" />
  }

  /**
   * 获取状态文本
   */
  const getStatusText = () => {
    if (!syncStatus.isOnline) {
      return '离线模式'
    }
    
    if (!user) {
      return '未登录'
    }
    
    if (syncStatus.isSyncing) {
      return '同步中...'
    }
    
    if (syncStatus.queueSize > 0) {
      return `${syncStatus.queueSize} 项待同步`
    }
    
    return '已同步'
  }

  /**
   * 获取状态颜色
   */
  const getStatusColor = () => {
    if (!syncStatus.isOnline) return 'text-red-600'
    if (!user) return 'text-gray-500'
    if (syncStatus.isSyncing) return 'text-blue-600'
    if (syncStatus.queueSize > 0) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {getConnectionIcon()}
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {syncStatus.queueSize > 0 && user && (
          <button
            onClick={handleManualSync}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            同步
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">数据同步状态</h3>
      
      {/* 连接状态 */}
      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {getConnectionIcon()}
          <div>
            <p className={`font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </p>
            {lastSyncTime && (
              <p className="text-xs text-gray-500">
                上次同步: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
        
        {/* 网络状态指示器 */}
        {isMounted && (
          <div className="flex items-center space-x-2">
            {syncStatus.isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs text-gray-500">
              {syncStatus.isOnline ? '在线' : '离线'}
            </span>
          </div>
        )}
      </div>

      {/* 同步队列状态 */}
      {syncStatus.queueSize > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                有 {syncStatus.queueSize} 项数据等待同步到云端
              </span>
            </div>
            {user && (
              <Button
                size="sm"
                onClick={handleManualSync}
                disabled={syncStatus.isSyncing || !syncStatus.isOnline}
              >
                立即同步
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 数据迁移 */}
      {showMigration && user && (
        <div className="mb-4">
          <h4 className="font-medium text-gray-800 mb-2">数据迁移</h4>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              将本地存储的学习数据迁移到云端，实现多设备同步。
            </p>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleMigration}
                disabled={isMigrating || !syncStatus.isOnline}
              >
                {isMigrating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    迁移中...
                  </>
                ) : (
                  '迁移本地数据'
                )}
              </Button>
            </div>

            {/* 迁移结果 */}
            {migrationResult && (
              <div className={`p-3 rounded-lg ${
                migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {migrationResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${
                    migrationResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {migrationResult.success ? '迁移完成' : '迁移失败'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1">
                  <p>成功迁移: {migrationResult.migrated} 个会话</p>
                  {migrationResult.errors.length > 0 && (
                    <p>错误: {migrationResult.errors.length} 个</p>
                  )}
                </div>
                
                {migrationResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">
                      查看错误详情
                    </summary>
                    <div className="mt-1 text-xs text-red-600 space-y-1">
                      {migrationResult.errors.map((error: string, index: number) => (
                        <p key={index}>• {error}</p>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 未登录提示 */}
      {!user && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 登录后可享受云端数据同步，确保您的学习记录安全不丢失。
          </p>
        </div>
      )}

      {/* 离线提示 */}
      {!syncStatus.isOnline && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-700">
            📱 当前处于离线模式，数据将在网络恢复后自动同步。
          </p>
        </div>
      )}
    </div>
  )
}