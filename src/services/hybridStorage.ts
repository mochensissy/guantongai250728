/**
 * 混合存储服务 - 本地 + 云端同步
 * 
 * 提供无缝的本地和云端数据同步功能：
 * - 优先使用云端数据（如果用户已登录）
 * - 本地缓存提高性能
 * - 离线模式支持
 * - 数据冲突自动解决
 * - 渐进式迁移现有数据
 */

import { LearningSession, ChatMessage, LearningCard, APIConfig, UserPreferences } from '../types'
import { CloudStorageService } from './cloudStorage'
import * as localStorageService from '../utils/storage'
import { createClient } from '../utils/supabase'

const supabase = createClient()
const cloudStorage = new CloudStorageService()

interface SyncQueueItem {
  id: string
  action: 'save_session' | 'save_message' | 'save_card' | 'delete_session'
  data: any
  timestamp: number
  retryCount: number
}

export class HybridStorageService {
  private syncQueue: SyncQueueItem[] = []
  private isSyncing = false
  private isOnline = () => typeof window !== 'undefined' ? navigator.onLine : true
  private syncCallbacks: Set<Function> = new Set()

  constructor() {
    this.initializeSync()
  }

  /**
   * 初始化同步机制
   */
  private initializeSync() {
    // 监听网络状态变化
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('网络连接恢复，开始同步数据')
        this.processOfflineQueue()
      })

      window.addEventListener('offline', () => {
        console.log('网络连接断开，切换到离线模式')
      })

      // 从本地存储恢复离线队列
      this.loadOfflineQueue()
    }
  }

  /**
   * 注册同步回调
   */
  onSync(callback: Function) {
    this.syncCallbacks.add(callback)
    return () => this.syncCallbacks.delete(callback)
  }

  /**
   * 通知同步状态变化
   */
  private notifySync(status: 'started' | 'completed' | 'error', details?: any) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(status, details)
      } catch (error) {
        console.error('同步回调执行失败:', error)
      }
    })
  }

  // =================================
  // 会话管理
  // =================================

  /**
   * 获取所有学习会话
   */
  async getAllSessions(): Promise<LearningSession[]> {
    try {
      // 检查用户登录状态
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && this.isOnline()) {
        // 用户已登录且在线，优先使用云端数据
        const cloudResult = await cloudStorage.getUserSessions()
        
        if (cloudResult.success && cloudResult.sessions) {
          // 更新本地缓存
          await this.updateLocalCache('sessions', cloudResult.sessions)
          return cloudResult.sessions
        }
      }
      
      // 降级到本地数据
      return localStorageService.getAllSessions()
    } catch (error) {
      console.error('获取会话失败，使用本地数据:', error)
      return localStorageService.getAllSessions()
    }
  }

  /**
   * 保存学习会话
   */
  async saveSession(session: LearningSession): Promise<boolean> {
    try {
      // 总是先保存到本地
      const localSuccess = localStorageService.saveSession(session)
      
      if (!localSuccess) {
        throw new Error('本地保存失败')
      }

      // 尝试同步到云端
      await this.syncToCloud('save_session', session)

      return true
    } catch (error) {
      console.error('保存会话失败:', error)
      return false
    }
  }

  /**
   * 根据ID获取会话
   */
  async getSessionById(id: string): Promise<LearningSession | null> {
    try {
      // 检查用户登录状态
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && this.isOnline()) {
        // 尝试从云端获取最新数据
        const cloudResult = await cloudStorage.loadSession(id)
        
        if (cloudResult.success && cloudResult.session) {
          // 更新本地缓存
          localStorageService.saveSession(cloudResult.session)
          return cloudResult.session
        }
      }
      
      // 降级到本地数据
      return localStorageService.getSessionById(id)
    } catch (error) {
      console.error('获取会话失败，使用本地数据:', error)
      return localStorageService.getSessionById(id)
    }
  }

  /**
   * 删除学习会话
   */
  async deleteSession(id: string): Promise<boolean> {
    try {
      // 先从本地删除
      const localSuccess = localStorageService.deleteSession(id)
      
      if (!localSuccess) {
        throw new Error('本地删除失败')
      }

      // 尝试从云端删除
      await this.syncToCloud('delete_session', { id })

      return true
    } catch (error) {
      console.error('删除会话失败:', error)
      return false
    }
  }

  // =================================
  // 消息管理
  // =================================

  /**
   * 更新会话的消息列表
   */
  async updateSessionMessages(sessionId: string, messages: ChatMessage[]): Promise<boolean> {
    try {
      // 更新本地数据
      const localSuccess = localStorageService.updateSessionMessages(sessionId, messages)
      
      if (!localSuccess) {
        throw new Error('本地更新失败')
      }

      // 同步到云端
      await this.syncToCloud('save_message', { sessionId, messages })

      return true
    } catch (error) {
      console.error('更新消息失败:', error)
      return false
    }
  }

  // =================================
  // 卡片管理
  // =================================

  /**
   * 获取所有学习卡片
   */
  async getAllCards(): Promise<LearningCard[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && this.isOnline()) {
        // 尝试从云端获取
        const cloudResult = await cloudStorage.getCardsForReview()
        
        if (cloudResult.success && cloudResult.cards) {
          return cloudResult.cards
        }
      }
      
      // 使用本地数据
      return localStorageService.getAllCards()
    } catch (error) {
      console.error('获取卡片失败，使用本地数据:', error)
      return localStorageService.getAllCards()
    }
  }

  /**
   * 添加学习卡片
   */
  async addLearningCard(sessionId: string, card: LearningCard): Promise<boolean> {
    try {
      // 先添加到本地
      const localSuccess = localStorageService.addLearningCard(sessionId, card)
      
      if (!localSuccess) {
        throw new Error('本地添加失败')
      }

      // 同步到云端
      await this.syncToCloud('save_card', card)

      return true
    } catch (error) {
      console.error('添加卡片失败:', error)
      return false
    }
  }

  // =================================
  // API配置管理（保持本地存储）
  // =================================

  /**
   * 获取API配置（仅本地存储）
   */
  getAPIConfig(): APIConfig | null {
    return localStorageService.getAPIConfig()
  }

  /**
   * 保存API配置（仅本地存储）
   */
  saveAPIConfig(config: APIConfig): boolean {
    return localStorageService.saveAPIConfig(config)
  }

  // =================================
  // 用户偏好管理
  // =================================

  /**
   * 获取用户偏好设置
   */
  async getUserPreferences(): Promise<UserPreferences> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && this.isOnline()) {
        // 从云端获取用户档案中的偏好设置
        const userResult = await cloudStorage.getCurrentUser()
        
        if (userResult.success && userResult.user?.preferences) {
          // 更新本地缓存
          const preferences = userResult.user.preferences as UserPreferences
          localStorageService.saveUserPreferences(preferences)
          return preferences
        }
      }
      
      // 使用本地偏好设置
      return localStorageService.getUserPreferences()
    } catch (error) {
      console.error('获取用户偏好失败，使用本地设置:', error)
      return localStorageService.getUserPreferences()
    }
  }

  /**
   * 保存用户偏好设置
   */
  async saveUserPreferences(preferences: Partial<UserPreferences>): Promise<boolean> {
    try {
      // 保存到本地
      const localSuccess = localStorageService.saveUserPreferences(preferences)
      
      if (!localSuccess) {
        throw new Error('本地保存失败')
      }

      // 同步到云端（更新用户档案）
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && this.isOnline()) {
        await cloudStorage.updateProfile({ preferences: preferences as any })
      }

      return true
    } catch (error) {
      console.error('保存用户偏好失败:', error)
      return false
    }
  }

  // =================================
  // 数据迁移和同步
  // =================================

  /**
   * 迁移本地数据到云端
   */
  async migrateLocalDataToCloud(): Promise<{ success: boolean; migrated: number; errors: string[] }> {
    const results = { success: true, migrated: 0, errors: [] as string[] }

    try {
      this.notifySync('started', { type: 'migration' })

      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('用户未登录，无法迁移数据')
      }

      if (!this.isOnline()) {
        throw new Error('网络未连接，无法迁移数据')
      }

      // 获取所有本地会话
      const localSessions = localStorageService.getAllSessions()
      
      console.log(`开始迁移 ${localSessions.length} 个本地会话到云端`)

      for (const session of localSessions) {
        try {
          const cloudResult = await cloudStorage.saveSession(session)
          
          if (cloudResult.success) {
            results.migrated++
            console.log(`成功迁移会话: ${session.title}`)
          } else {
            results.errors.push(`迁移会话失败: ${session.title} - ${cloudResult.error}`)
          }
        } catch (error) {
          results.errors.push(`迁移会话异常: ${session.title} - ${error.message}`)
        }
      }

      this.notifySync('completed', { type: 'migration', ...results })

      if (results.errors.length > 0) {
        results.success = false
      }

    } catch (error) {
      console.error('数据迁移失败:', error)
      results.success = false
      results.errors.push(error.message)
      this.notifySync('error', { type: 'migration', error: error.message })
    }

    return results
  }

  /**
   * 同步数据到云端
   */
  private async syncToCloud(action: string, data: any) {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // 用户未登录，跳过云端同步
      return
    }

    if (!this.isOnline()) {
      // 离线状态，加入同步队列
      this.addToOfflineQueue(action, data)
      return
    }

    try {
      switch (action) {
        case 'save_session':
          await cloudStorage.saveSession(data)
          break
        case 'save_message':
          await cloudStorage.saveMessages(data.sessionId, data.messages)
          break
        case 'save_card':
          await cloudStorage.addCard(data)
          break
        case 'delete_session':
          await cloudStorage.deleteSession(data.id)
          break
        default:
          console.warn('未知的同步操作:', action)
      }
    } catch (error) {
      console.error('云端同步失败，加入离线队列:', error)
      this.addToOfflineQueue(action, data)
    }
  }

  /**
   * 添加到离线同步队列
   */
  private addToOfflineQueue(action: string, data: any) {
    const item: SyncQueueItem = {
      id: `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: action as any,
      data,
      timestamp: Date.now(),
      retryCount: 0
    }

    this.syncQueue.push(item)
    this.saveOfflineQueue()
  }

  /**
   * 处理离线队列
   */
  async processOfflineQueue() {
    if (this.isSyncing || !this.isOnline()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    this.isSyncing = true
    this.notifySync('started', { type: 'offline_queue' })

    try {
      const queue = [...this.syncQueue]
      const processed: string[] = []
      const failed: SyncQueueItem[] = []

      for (const item of queue) {
        try {
          await this.syncToCloud(item.action, item.data)
          processed.push(item.id)
        } catch (error) {
          item.retryCount++
          if (item.retryCount < 3) {
            failed.push(item)
          }
          console.error(`离线队列项目处理失败 (${item.retryCount}/3):`, error)
        }
      }

      // 更新队列
      this.syncQueue = failed
      this.saveOfflineQueue()

      this.notifySync('completed', { 
        type: 'offline_queue', 
        processed: processed.length,
        failed: failed.length 
      })

    } catch (error) {
      console.error('处理离线队列失败:', error)
      this.notifySync('error', { type: 'offline_queue', error: error.message })
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * 保存离线队列到本地存储
   */
  private saveOfflineQueue() {
    try {
      localStorage.setItem('hybrid-sync-queue', JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('保存离线队列失败:', error)
    }
  }

  /**
   * 从本地存储加载离线队列
   */
  private loadOfflineQueue() {
    try {
      const saved = localStorage.getItem('hybrid-sync-queue')
      if (saved) {
        this.syncQueue = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载离线队列失败:', error)
      this.syncQueue = []
    }
  }

  /**
   * 更新本地缓存
   */
  private async updateLocalCache(type: string, data: any) {
    try {
      switch (type) {
        case 'sessions':
          // 更新本地会话缓存
          for (const session of data) {
            localStorageService.saveSession(session)
          }
          break
        default:
          console.warn('未知的缓存类型:', type)
      }
    } catch (error) {
      console.error('更新本地缓存失败:', error)
    }
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      isOnline: this.isOnline(),
      isSyncing: this.isSyncing,
      queueSize: this.syncQueue.length,
      hasUser: false // 需要在实际使用中检查
    }
  }
}

// 导出单例实例
export const hybridStorage = new HybridStorageService()

// 兼容现有API的导出 - 保持同步调用签名
export const getAllSessions = (): LearningSession[] => {
  // 注意：这里返回Promise但现有代码期望同步调用
  // 在实际集成时需要更新调用代码以支持async/await
  throw new Error('请使用 hybridStorage.getAllSessions() 异步方法')
}

export const saveSession = (session: LearningSession): boolean => {
  // 异步保存，但返回同步结果
  hybridStorage.saveSession(session).catch(console.error)
  // 同时保存到本地以保持兼容性
  return localStorageService.saveSession(session)
}

export const getSessionById = (id: string): LearningSession | null => {
  // 同步返回本地数据，异步更新云端数据
  const localResult = localStorageService.getSessionById(id)
  hybridStorage.getSessionById(id).then(cloudResult => {
    if (cloudResult && JSON.stringify(cloudResult) !== JSON.stringify(localResult)) {
      // 如果云端数据更新，更新本地缓存
      localStorageService.saveSession(cloudResult)
    }
  }).catch(console.error)
  return localResult
}

export const deleteSession = (id: string): boolean => {
  // 同步删除本地，异步删除云端
  const localResult = localStorageService.deleteSession(id)
  hybridStorage.deleteSession(id).catch(console.error)
  return localResult
}

export const updateSessionMessages = (sessionId: string, messages: ChatMessage[]): boolean => {
  // 同步更新本地，异步更新云端
  const localResult = localStorageService.updateSessionMessages(sessionId, messages)
  hybridStorage.updateSessionMessages(sessionId, messages).catch(console.error)
  return localResult
}

export const addLearningCard = (sessionId: string, card: LearningCard): boolean => {
  // 同步添加到本地，异步添加到云端
  const localResult = localStorageService.addLearningCard(sessionId, card)
  hybridStorage.addLearningCard(sessionId, card).catch(console.error)
  return localResult
}

export const getAllCards = (): LearningCard[] => {
  // 返回本地数据，异步更新云端数据
  const localResult = localStorageService.getAllCards()
  hybridStorage.getAllCards().then(cloudResult => {
    // 这里可以添加智能合并逻辑
  }).catch(console.error)
  return localResult
}

export const getAPIConfig = () => hybridStorage.getAPIConfig()
export const saveAPIConfig = (config: APIConfig) => hybridStorage.saveAPIConfig(config)

export const getUserPreferences = (): UserPreferences => {
  // 返回本地偏好，异步更新云端偏好
  const localResult = localStorageService.getUserPreferences()
  hybridStorage.getUserPreferences().then(cloudResult => {
    if (JSON.stringify(cloudResult) !== JSON.stringify(localResult)) {
      localStorageService.saveUserPreferences(cloudResult)
    }
  }).catch(console.error)
  return localResult
}

export const saveUserPreferences = (preferences: Partial<UserPreferences>): boolean => {
  // 同步保存到本地，异步保存到云端
  const localResult = localStorageService.saveUserPreferences(preferences)
  hybridStorage.saveUserPreferences(preferences).catch(console.error)
  return localResult
}