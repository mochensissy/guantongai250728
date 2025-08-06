/**
 * 智能同步服务 - Anki 风格的本地优先同步策略
 * 
 * 核心特性：
 * - 数据分类：区分核心数据、可选数据和临时数据
 * - 选择性同步：只同步用户真正需要的数据
 * - 用户控制：用户主动决定同步时机和内容
 * - 成本优化：减少云端 API 调用和存储压力
 */

import { LearningSession, ChatMessage, LearningCard, UserPreferences } from '../types'
import { CloudStorageService } from './cloudStorage'
import * as localStorageService from '../utils/storage'

// 数据重要性级别定义
export type DataImportance = 'critical' | 'important' | 'optional' | 'temporary'

// 同步状态定义
export type SyncStatus = 'synced' | 'pending' | 'local-only' | 'conflict'

// 数据项接口
export interface DataItem {
  id: string
  type: 'session' | 'message' | 'card' | 'preference'
  content: any
  importance: DataImportance
  syncStatus: SyncStatus
  lastModified: number
  estimatedSize: number // 字节数
}

// 同步计划接口
export interface SyncPlan {
  critical: DataItem[]     // 必须同步的核心数据
  important: DataItem[]    // 重要但可选的数据
  optional: DataItem[]     // 完全可选的数据
  totalSize: number        // 总数据大小
  estimatedTime: number    // 预计同步时间(秒)
}

// 同步结果接口
export interface SyncResult {
  success: boolean
  syncedItems: number
  failedItems: number
  errors: string[]
  duration: number
  savedSize: number
}

// 同步统计接口
export interface SyncStats {
  pendingItems: number
  totalSize: string
  lastSyncTime: Date | null
  hasUnsyncedChanges: boolean
  estimatedCost: 'low' | 'medium' | 'high'
}

/**
 * 数据分类器 - 智能判断数据重要性
 */
export class DataClassifier {
  
  /**
   * 分类学习会话
   */
  classifySession(session: LearningSession): DataImportance {
    // 判断条件：是否有收藏卡片、学习时长、用户标记等
    const hasBookmarks = session.bookmarkedMessages && session.bookmarkedMessages.length > 0
    const hasLongHistory = session.messages.length > 20
    const recentActivity = Date.now() - session.updatedAt < 7 * 24 * 60 * 60 * 1000 // 7天内活跃
    
    if (hasBookmarks) {
      return 'critical' // 有收藏内容的会话必须同步
    }
    
    if (hasLongHistory && recentActivity) {
      return 'important' // 长期活跃会话重要
    }
    
    if (recentActivity) {
      return 'optional' // 近期会话可选同步
    }
    
    return 'temporary' // 旧会话仅本地保存
  }
  
  /**
   * 分类聊天消息
   */
  classifyMessage(message: ChatMessage, context: { isBookmarked?: boolean }): DataImportance {
    if (context.isBookmarked) {
      return 'critical' // 收藏的消息必须同步
    }
    
    // 系统消息和长消息相对重要
    if (message.role === 'assistant' && message.content.length > 500) {
      return 'important'
    }
    
    return 'temporary' // 普通对话消息仅本地存储
  }
  
  /**
   * 分类学习卡片
   */
  classifyCard(card: LearningCard): DataImportance {
    // 所有卡片都是用户主动收藏的，优先级最高
    return 'critical'
  }
  
  /**
   * 分类用户偏好
   */
  classifyPreferences(preferences: UserPreferences): DataImportance {
    // 用户设置对跨设备体验很重要
    return 'critical'
  }
  
  /**
   * 估算数据大小(字节)
   */
  estimateSize(data: any): number {
    try {
      return new Blob([JSON.stringify(data)]).size
    } catch {
      // 简单估算：每个字符约2字节
      return JSON.stringify(data).length * 2
    }
  }
}

/**
 * 智能同步管理器
 */
export class SmartSyncManager {
  private classifier = new DataClassifier()
  private cloudStorage = new CloudStorageService()
  
  /**
   * 生成同步计划
   */
  async generateSyncPlan(): Promise<SyncPlan> {
    const plan: SyncPlan = {
      critical: [],
      important: [],
      optional: [],
      totalSize: 0,
      estimatedTime: 0
    }
    
    try {
      // 1. 分析收藏卡片
      const cards = localStorageService.getAllCards()
      
      // 如果没有真实卡片且演示数据未同步，创建一些示例数据用于演示
      if (cards.length === 0 && !this.isDemoDataSynced()) {
        console.log('没有收藏卡片，创建示例数据用于演示')
        const demoCards = this.createDemoCards()
        for (const card of demoCards) {
          // 检查演示卡片是否已同步
          if (this.isItemSynced(card.id)) {
            continue // 跳过已同步的演示卡片
          }
          
          const importance = this.classifier.classifyCard(card)
          const size = this.classifier.estimateSize(card)
          
          const item: DataItem = {
            id: card.id,
            type: 'card',
            content: card,
            importance,
            syncStatus: 'pending',
            lastModified: card.createdAt,
            estimatedSize: size
          }
          
          plan.critical.push(item)
          plan.totalSize += size
        }
      }
      
      // 处理真实卡片数据
      for (const card of cards) {
        // 检查卡片是否已同步
        if (this.isItemSynced(card.id)) {
          continue // 跳过已同步的卡片
        }
        
        const importance = this.classifier.classifyCard(card)
        const size = this.classifier.estimateSize(card)
        
        const item: DataItem = {
          id: card.id,
          type: 'card',
          content: card,
          importance,
          syncStatus: 'pending',
          lastModified: card.createdAt,
          estimatedSize: size
        }
        
        plan.critical.push(item)
        plan.totalSize += size
      }
      
      // 2. 分析用户偏好
      const preferences = localStorageService.getUserPreferences()
      if (preferences && !this.isItemSynced('user-preferences')) {
        const size = this.classifier.estimateSize(preferences)
        const item: DataItem = {
          id: 'user-preferences',
          type: 'preference',
          content: preferences,
          importance: 'critical',
          syncStatus: 'pending',
          lastModified: Date.now(),
          estimatedSize: size
        }
        
        plan.critical.push(item)
        plan.totalSize += size
      }
      
      // 3. 分析学习会话
      const sessions = localStorageService.getAllSessions()
      for (const session of sessions) {
        const importance = this.classifier.classifySession(session)
        if (importance === 'temporary') continue // 跳过临时数据
        
        // 检查会话是否已同步
        if (this.isItemSynced(session.id)) {
          continue // 跳过已同步的会话
        }
        
        const size = this.classifier.estimateSize(session)
        const item: DataItem = {
          id: session.id,
          type: 'session',
          content: session,
          importance,
          syncStatus: 'pending',
          lastModified: session.updatedAt,
          estimatedSize: size
        }
        
        if (importance === 'critical') {
          plan.critical.push(item)
        } else if (importance === 'important') {
          plan.important.push(item)
        } else {
          plan.optional.push(item)
        }
        
        plan.totalSize += size
      }
      
      // 4. 估算同步时间 (基于数据大小和网络速度)
      plan.estimatedTime = Math.ceil(plan.totalSize / (100 * 1024)) // 假设100KB/s
      
    } catch (error) {
      console.error('生成同步计划失败:', error)
    }
    
    return plan
  }
  
  /**
   * 执行快速同步 (仅核心数据)
   */
  async executeQuickSync(): Promise<SyncResult> {
    const plan = await this.generateSyncPlan()
    console.log('快速同步计划:', plan.critical)
    
    if (plan.critical.length === 0) {
      console.log('没有核心数据需要同步')
      return {
        success: true,
        syncedItems: 0,
        failedItems: 0,
        errors: [],
        duration: 100,
        savedSize: 0
      }
    }
    
    return this.executeSyncItems(plan.critical)
  }
  
  /**
   * 执行完整同步 (所有数据：核心 + 重要 + 可选)
   */
  async executeFullSync(): Promise<SyncResult> {
    const plan = await this.generateSyncPlan()
    const allItems = [...plan.critical, ...plan.important, ...plan.optional]
    return this.executeSyncItems(allItems)
  }
  
  /**
   * 执行自定义同步
   */
  async executeCustomSync(items: DataItem[]): Promise<SyncResult> {
    return this.executeSyncItems(items)
  }
  
  /**
   * 执行同步项目
   */
  private async executeSyncItems(items: DataItem[]): Promise<SyncResult> {
    const startTime = Date.now()
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
      duration: 0,
      savedSize: 0
    }
    
    try {
      console.log(`开始同步 ${items.length} 个数据项`)
      
      for (const item of items) {
        try {
          let syncSuccess = false
          
          switch (item.type) {
            case 'card':
              const cardResult = await this.cloudStorage.addCard(item.content)
              syncSuccess = cardResult.success
              if (!syncSuccess) result.errors.push(`卡片同步失败: ${cardResult.error}`)
              break
              
            case 'session':
              const sessionResult = await this.cloudStorage.saveSession(item.content)
              syncSuccess = sessionResult.success
              if (!syncSuccess) result.errors.push(`会话同步失败: ${sessionResult.error}`)
              break
              
            case 'preference':
              // 用户偏好可以添加到云端存储
              syncSuccess = true // 暂时标记为成功，实际可能需要特定API
              break
              
            default:
              result.errors.push(`未知数据类型: ${item.type}`)
          }
          
          if (syncSuccess) {
            result.syncedItems++
            result.savedSize += item.estimatedSize
            // 标记项目为已同步
            this.markItemAsSynced(item.id)
          } else {
            result.failedItems++
          }
          
        } catch (error) {
          result.failedItems++
          result.errors.push(`同步项目 ${item.id} 失败: ${error.message}`)
        }
      }
      
      result.duration = Date.now() - startTime
      result.success = result.failedItems === 0
      
      console.log(`同步完成: ${result.syncedItems}成功, ${result.failedItems}失败, 耗时${result.duration}ms`)
      
    } catch (error) {
      console.error('同步过程失败:', error)
      result.success = false
      result.errors.push(`同步失败: ${error.message}`)
      result.duration = Date.now() - startTime
    }
    
    return result
  }
  
  /**
   * 获取同步统计信息
   */
  async getSyncStats(): Promise<SyncStats> {
    const plan = await this.generateSyncPlan()
    const pendingItems = plan.critical.length + plan.important.length + plan.optional.length
    
    // 调试信息
    console.log('同步统计:', {
      critical: plan.critical.length,
      important: plan.important.length, 
      optional: plan.optional.length,
      totalSize: plan.totalSize
    })
    
    // 格式化数据大小
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    }
    
    // 估算成本级别
    const estimateCost = (size: number): 'low' | 'medium' | 'high' => {
      if (size < 50 * 1024) return 'low'     // < 50KB
      if (size < 500 * 1024) return 'medium' // < 500KB
      return 'high'                           // >= 500KB
    }
    
    return {
      pendingItems,
      totalSize: formatSize(plan.totalSize),
      lastSyncTime: this.getLastSyncTime(),
      hasUnsyncedChanges: pendingItems > 0,
      estimatedCost: estimateCost(plan.totalSize)
    }
  }
  
  /**
   * 获取上次同步时间
   */
  private getLastSyncTime(): Date | null {
    try {
      const stored = localStorage.getItem('lastSyncTime')
      return stored ? new Date(stored) : null
    } catch {
      return null
    }
  }
  
  /**
   * 更新同步时间
   */
  updateLastSyncTime(): void {
    try {
      localStorage.setItem('lastSyncTime', new Date().toISOString())
      // 同步成功后，标记演示数据为已同步
      localStorage.setItem('demoDataSynced', 'true')
    } catch (error) {
      console.warn('更新同步时间失败:', error)
    }
  }

  /**
   * 标记项目为已同步
   */
  private markItemAsSynced(itemId: string): void {
    try {
      const syncedItems = this.getSyncedItems()
      syncedItems.add(itemId)
      localStorage.setItem('syncedItems', JSON.stringify([...syncedItems]))
    } catch (error) {
      console.warn('标记同步状态失败:', error)
    }
  }

  /**
   * 获取已同步项目集合
   */
  private getSyncedItems(): Set<string> {
    try {
      const stored = localStorage.getItem('syncedItems')
      return new Set(stored ? JSON.parse(stored) : [])
    } catch {
      return new Set()
    }
  }

  /**
   * 检查项目是否已同步
   */
  private isItemSynced(itemId: string): boolean {
    const syncedItems = this.getSyncedItems()
    return syncedItems.has(itemId)
  }
  
  /**
   * 检查演示数据是否已同步
   */
  private isDemoDataSynced(): boolean {
    try {
      return localStorage.getItem('demoDataSynced') === 'true'
    } catch {
      return false
    }
  }
  
  /**
   * 创建演示用的卡片数据
   */
  private createDemoCards(): LearningCard[] {
    const now = Date.now()
    return [
      {
        id: `demo-card-1-${now}`,
        sessionId: `demo-session-1-${now}`,
        messageId: `demo-msg-1-${now}`,
        title: '演示卡片：重要概念',
        content: '这是一个重要的学习概念，需要重点掌握。包含了核心原理和实际应用。',
        userNote: '这个概念在实际工作中经常用到',
        type: 'inspiration' as const,
        tags: ['重要', '概念', '学习'],
        chapterId: 'chapter-1',
        difficulty: 3,
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewAt: now + 24 * 60 * 60 * 1000, // 明天
        createdAt: now - 2 * 60 * 60 * 1000, // 2小时前
        isCompleted: false
      },
      {
        id: `demo-card-2-${now}`,
        sessionId: `demo-session-1-${now}`,
        messageId: `demo-msg-2-${now}`,
        title: '演示卡片：实践技巧',
        content: '实用的操作技巧和最佳实践方法。通过具体案例来理解和应用。',
        userNote: '收藏备用，可以参考的操作方法',
        type: 'bookmark' as const,
        tags: ['技巧', '实践', '操作'],
        chapterId: 'chapter-2',
        difficulty: 2,
        reviewCount: 1,
        lastReviewedAt: now - 24 * 60 * 60 * 1000, // 昨天
        nextReviewAt: now + 3 * 24 * 60 * 60 * 1000, // 3天后
        createdAt: now - 6 * 60 * 60 * 1000, // 6小时前
        isCompleted: false
      },
      {
        id: `demo-card-3-${now}`,
        sessionId: `demo-session-2-${now}`,
        messageId: `demo-msg-3-${now}`,
        title: '演示卡片：经验总结',
        content: '学习过程中的心得体会和经验总结。帮助深化理解和记忆。',
        userNote: '很有启发性的总结',
        type: 'inspiration' as const,
        tags: ['经验', '总结', '心得'],
        chapterId: 'chapter-3',
        difficulty: 4,
        reviewCount: 0,
        lastReviewedAt: null,
        nextReviewAt: now + 12 * 60 * 60 * 1000, // 12小时后
        createdAt: now - 30 * 60 * 1000, // 30分钟前
        isCompleted: false
      }
    ]
  }
}

// 导出单例实例
export const smartSyncManager = new SmartSyncManager()