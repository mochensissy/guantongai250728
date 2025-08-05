/**
 * 优化的混合存储服务 - 集成智能同步策略
 * 
 * 基于 Anki 模式的改进：
 * - 本地优先操作
 * - 选择性云端同步
 * - 用户控制同步时机
 * - 数据分类管理
 */

import { LearningSession, ChatMessage, LearningCard, APIConfig, UserPreferences } from '../types'
import { CloudStorageService } from './cloudStorage'
import { smartSyncManager, DataClassifier } from './smartSync'
import * as localStorageService from '../utils/storage'
import { createClient } from '../utils/supabase'

const supabase = createClient()
const cloudStorage = new CloudStorageService()
const classifier = new DataClassifier()

export class OptimizedHybridStorageService {
  private isOnline = () => typeof window !== 'undefined' ? navigator.onLine : true
  private syncCallbacks: Set<Function> = new Set()

  constructor() {
    this.initializeStorage()
  }

  /**
   * 初始化存储服务
   */
  private initializeStorage() {
    console.log('初始化优化混合存储服务 - Anki模式')
    
    // 监听网络状态（仅用于提示，不自动同步）
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('网络连接恢复')
        this.notifySync('network_restored', { isOnline: true })
      })

      window.addEventListener('offline', () => {
        console.log('网络连接断开，切换到纯本地模式')
        this.notifySync('network_lost', { isOnline: false })
      })
    }
  }

  // =================================
  // 同步状态管理
  // =================================

  /**
   * 注册同步状态回调
   */
  onSync(callback: Function) {
    this.syncCallbacks.add(callback)
    return () => this.syncCallbacks.delete(callback)
  }

  /**
   * 通知同步状态变化
   */
  private notifySync(status: string, details?: any) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(status, details)
      } catch (error) {
        console.error('同步回调执行失败:', error)
      }
    })
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline(),
      isSyncing: false, // 没有自动同步，用户主动控制
      queueSize: 0,     // 不维护队列，按需同步
      hasUser: true     // 简化逻辑
    }
  }

  // =================================
  // 本地优先的数据操作
  // =================================

  /**
   * 获取所有学习会话（本地优先）
   */
  async getAllSessions(): Promise<LearningSession[]> {
    try {
      // 直接返回本地数据，快速响应
      return localStorageService.getAllSessions()
    } catch (error) {
      console.error('获取会话失败:', error)
      return []
    }
  }

  /**
   * 获取单个会话（本地优先）
   */
  async getSession(sessionId: string): Promise<LearningSession | null> {
    try {
      return localStorageService.getSessionById(sessionId)
    } catch (error) {
      console.error('获取会话失败:', error)
      return null
    }
  }

  /**
   * 保存学习会话（仅本地）
   */
  async saveSession(session: LearningSession): Promise<{ success: boolean; error?: string }> {
    try {
      const success = localStorageService.saveSession(session)
      
      if (success) {
        // 通知数据变更，但不自动同步
        this.notifySync('local_data_changed', { 
          type: 'session', 
          action: 'save',
          importance: classifier.classifySession(session)
        })
        
        return { success: true }
      } else {
        return { success: false, error: '本地保存失败' }
      }
    } catch (error) {
      console.error('保存会话失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 删除学习会话（仅本地）
   */
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = localStorageService.deleteSession(sessionId)
      
      if (success) {
        this.notifySync('local_data_changed', { 
          type: 'session', 
          action: 'delete',
          sessionId 
        })
        
        return { success: true }
      } else {
        return { success: false, error: '本地删除失败' }
      }
    } catch (error) {
      console.error('删除会话失败:', error)
      return { success: false, error: error.message }
    }
  }

  // =================================
  // 消息管理（本地优先）
  // =================================

  /**
   * 保存聊天消息（仅本地）
   */
  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<{ success: boolean; error?: string }> {
    try {
      const success = localStorageService.updateSessionMessages(sessionId, messages)
      
      if (success) {
        // 分析消息重要性
        const importantMessages = messages.filter(msg => 
          classifier.classifyMessage(msg, { isBookmarked: false }) !== 'temporary'
        )
        
        this.notifySync('local_data_changed', { 
          type: 'messages', 
          action: 'save',
          sessionId,
          messageCount: messages.length,
          importantCount: importantMessages.length
        })
        
        return { success: true }
      } else {
        return { success: false, error: '本地保存失败' }
      }
    } catch (error) {
      console.error('保存消息失败:', error)
      return { success: false, error: error.message }
    }
  }

  // =================================
  // 卡片管理（收藏数据 - 重要性高）
  // =================================

  /**
   * 获取所有卡片（本地优先）
   */
  async getAllCards(): Promise<LearningCard[]> {
    try {
      return localStorageService.getAllCards()
    } catch (error) {
      console.error('获取卡片失败:', error)
      return []
    }
  }

  /**
   * 添加学习卡片（本地 + 标记为需同步）
   */
  async addCard(card: LearningCard): Promise<{ success: boolean; error?: string }> {
    try {
      const success = localStorageService.saveCard(card)
      
      if (success) {
        // 卡片是重要数据，建议同步
        this.notifySync('critical_data_changed', { 
          type: 'card', 
          action: 'add',
          card,
          importance: 'critical', // 所有卡片都是关键数据
          recommendSync: true
        })
        
        return { success: true }
      } else {
        return { success: false, error: '本地保存失败' }
      }
    } catch (error) {
      console.error('添加卡片失败:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * 删除学习卡片（本地 + 标记为需同步）
   */
  async deleteCard(cardId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const success = localStorageService.deleteCard(cardId)
      
      if (success) {
        this.notifySync('critical_data_changed', { 
          type: 'card', 
          action: 'delete',
          cardId,
          importance: 'critical',
          recommendSync: true
        })
        
        return { success: true }
      } else {
        return { success: false, error: '本地删除失败' }
      }
    } catch (error) {
      console.error('删除卡片失败:', error)
      return { success: false, error: error.message }
    }
  }

  // =================================
  // 用户偏好管理
  // =================================

  /**
   * 获取用户偏好（本地优先）
   */
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      return localStorageService.getUserPreferences()
    } catch (error) {
      console.error('获取用户偏好失败:', error)
      return {
        defaultLearningLevel: 'beginner',
        theme: 'light',
        language: 'zh',
        soundEnabled: true,
        autoSave: true
      }
    }
  }

  /**
   * 保存用户偏好（本地 + 建议同步）
   */
  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      const success = localStorageService.saveUserPreferences(preferences)
      
      if (success) {
        this.notifySync('critical_data_changed', { 
          type: 'preferences', 
          action: 'save',
          preferences,
          importance: 'critical',
          recommendSync: true
        })
      }
      
      return success
    } catch (error) {
      console.error('保存用户偏好失败:', error)
      return false
    }
  }

  // =================================
  // 智能同步接口
  // =================================

  /**
   * 获取智能同步管理器
   */
  getSmartSyncManager() {
    return smartSyncManager
  }

  /**
   * 执行智能同步（用户主动触发）
   */
  async executeSmartSync(type: 'quick' | 'full' | 'custom', customItems?: any[]) {
    try {
      this.notifySync('sync_started', { type })

      let result
      switch (type) {
        case 'quick':
          result = await smartSyncManager.executeQuickSync()
          break
        case 'full':
          result = await smartSyncManager.executeFullSync()
          break
        case 'custom':
          result = await smartSyncManager.executeCustomSync(customItems || [])
          break
        default:
          throw new Error('未知的同步类型')
      }

      this.notifySync('sync_completed', { type, result })
      return result

    } catch (error) {
      console.error('智能同步失败:', error)
      this.notifySync('sync_error', { type, error: error.message })
      throw error
    }
  }

  /**
   * 获取同步统计
   */
  async getSyncStats() {
    return await smartSyncManager.getSyncStats()
  }

  // =================================
  // API配置管理（保持兼容性）
  // =================================

  /**
   * 获取API配置
   */
  getAPIConfig(): APIConfig | null {
    return localStorageService.getAPIConfig()
  }

  /**
   * 保存API配置
   */
  saveAPIConfig(config: APIConfig): boolean {
    return localStorageService.saveAPIConfig(config)
  }

  // =================================
  // 数据导出和备份
  // =================================

  /**
   * 导出所有本地数据
   */
  async exportAllData(): Promise<{
    sessions: LearningSession[]
    cards: LearningCard[]
    preferences: UserPreferences
    exportTime: number
  }> {
    return {
      sessions: await this.getAllSessions(),
      cards: await this.getAllCards(),
      preferences: await this.getUserPreferences(),
      exportTime: Date.now()
    }
  }

  /**
   * 清理临时数据（定期维护）
   */
  async cleanupTemporaryData(olderThanDays: number = 30) {
    try {
      const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000)
      const sessions = await this.getAllSessions()
      
      let cleanedCount = 0
      
      for (const session of sessions) {
        const importance = classifier.classifySession(session)
        
        // 只清理标记为临时的且超过期限的数据
        if (importance === 'temporary' && session.updatedAt < cutoffTime) {
          await this.deleteSession(session.id)
          cleanedCount++
        }
      }
      
      console.log(`清理完成，删除了 ${cleanedCount} 个临时会话`)
      
      this.notifySync('cleanup_completed', { 
        cleanedCount, 
        cutoffTime,
        type: 'temporary_sessions' 
      })
      
      return { success: true, cleanedCount }
      
    } catch (error) {
      console.error('清理临时数据失败:', error)
      return { success: false, error: error.message }
    }
  }
}

// 导出单例实例
export const optimizedHybridStorage = new OptimizedHybridStorageService()