/**
 * 存储适配器 - 统一本地和云端存储接口
 * 
 * 这个适配器提供了一个统一的接口，可以无缝切换本地存储和混合存储
 * 在用户登录时自动使用云端同步，未登录时使用本地存储
 */

import { LearningSession, ChatMessage, LearningCard, APIConfig, UserPreferences } from '../types'
import { hybridStorage, addLearningCard as hybridAddLearningCard } from '../services/hybridStorage'
import * as localStorage from './storage'
import { createClient } from './supabase'

const supabase = createClient()

/**
 * 检查用户是否已登录
 */
async function isUserLoggedIn(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return !!user
  } catch {
    return false
  }
}

/**
 * 统一的存储适配器类
 */
class StorageAdapter {
  /**
   * 保存学习会话
   */
  async saveSession(session: LearningSession): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.saveSession(session)
      } else {
        return localStorage.saveSession(session)
      }
    } catch (error) {
      console.error('保存会话失败，降级到本地存储:', error)
      return localStorage.saveSession(session)
    }
  }

  /**
   * 获取会话
   */
  async getSessionById(id: string): Promise<LearningSession | null> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.getSessionById(id)
      } else {
        return localStorage.getSessionById(id)
      }
    } catch (error) {
      console.error('获取会话失败，降级到本地存储:', error)
      return localStorage.getSessionById(id)
    }
  }

  /**
   * 获取所有会话
   */
  async getAllSessions(): Promise<LearningSession[]> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.getUserSessions()
      } else {
        return localStorage.getAllSessions()
      }
    } catch (error) {
      console.error('获取所有会话失败，降级到本地存储:', error)
      return localStorage.getAllSessions()
    }
  }

  /**
   * 删除会话
   */
  async deleteSession(id: string): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.deleteSession(id)
      } else {
        return localStorage.deleteSession(id)
      }
    } catch (error) {
      console.error('删除会话失败，降级到本地存储:', error)
      return localStorage.deleteSession(id)
    }
  }

  /**
   * 更新会话消息
   */
  async updateSessionMessages(sessionId: string, messages: ChatMessage[]): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.updateSessionMessages(sessionId, messages)
      } else {
        return localStorage.updateSessionMessages(sessionId, messages)
      }
    } catch (error) {
      console.error('更新消息失败，降级到本地存储:', error)
      return localStorage.updateSessionMessages(sessionId, messages)
    }
  }

  /**
   * 更新会话当前章节
   */
  async updateSessionCurrentChapter(sessionId: string, chapterId: string): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        // 混合存储暂时没有这个方法，直接使用本地存储
        return localStorage.updateSessionCurrentChapter(sessionId, chapterId)
      } else {
        return localStorage.updateSessionCurrentChapter(sessionId, chapterId)
      }
    } catch (error) {
      console.error('更新当前章节失败:', error)
      return localStorage.updateSessionCurrentChapter(sessionId, chapterId)
    }
  }

  /**
   * 标记章节完成
   */
  async markChapterCompleted(sessionId: string, chapterId: string): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        // 混合存储暂时没有这个方法，直接使用本地存储
        return localStorage.markChapterCompleted(sessionId, chapterId)
      } else {
        return localStorage.markChapterCompleted(sessionId, chapterId)
      }
    } catch (error) {
      console.error('标记章节完成失败:', error)
      return localStorage.markChapterCompleted(sessionId, chapterId)
    }
  }

  /**
   * 添加学习卡片
   */
  async addLearningCard(sessionId: string, card: LearningCard): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        return hybridAddLearningCard(sessionId, card)
      } else {
        return localStorage.addLearningCard(sessionId, card)
      }
    } catch (error) {
      console.error('添加卡片失败，降级到本地存储:', error)
      return localStorage.addLearningCard(sessionId, card)
    }
  }

  /**
   * 获取所有卡片
   */
  async getAllCards(): Promise<LearningCard[]> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.getAllCards()
      } else {
        return localStorage.getAllCards()
      }
    } catch (error) {
      console.error('获取卡片失败，降级到本地存储:', error)
      return localStorage.getAllCards()
    }
  }

  /**
   * 获取API配置
   */
  async getAPIConfig(): Promise<APIConfig | null> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.getAPIConfig()
      } else {
        return localStorage.getAPIConfig()
      }
    } catch (error) {
      console.error('获取API配置失败，降级到本地存储:', error)
      return localStorage.getAPIConfig()
    }
  }

  /**
   * 保存API配置
   */
  async saveAPIConfig(config: APIConfig): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.saveAPIConfig(config)
      } else {
        return localStorage.saveAPIConfig(config)
      }
    } catch (error) {
      console.error('保存API配置失败，降级到本地存储:', error)
      return localStorage.saveAPIConfig(config)
    }
  }

  /**
   * 获取用户偏好
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.getUserPreferences()
      } else {
        return localStorage.getUserPreferences()
      }
    } catch (error) {
      console.error('获取用户偏好失败，降级到本地存储:', error)
      return localStorage.getUserPreferences()
    }
  }

  /**
   * 保存用户偏好
   */
  async saveUserPreferences(preferences: UserPreferences): Promise<boolean> {
    try {
      if (await isUserLoggedIn()) {
        return await hybridStorage.saveUserPreferences(preferences)
      } else {
        return localStorage.saveUserPreferences(preferences)
      }
    } catch (error) {
      console.error('保存用户偏好失败，降级到本地存储:', error)
      return localStorage.saveUserPreferences(preferences)
    }
  }

  // ===== 同步的兼容方法 (为了向后兼容) =====

  /**
   * 同步版本的获取会话方法 (向后兼容)
   */
  getSessionById_sync(id: string): LearningSession | null {
    return localStorage.getSessionById(id)
  }

  /**
   * 同步版本的获取所有会话方法 (向后兼容)
   */
  getAllSessions_sync(): LearningSession[] {
    return localStorage.getAllSessions()
  }

  /**
   * 同步版本的获取API配置方法 (向后兼容)
   */
  getAPIConfig_sync(): APIConfig | null {
    return localStorage.getAPIConfig()
  }
}

export const storageAdapter = new StorageAdapter()

// 导出兼容的同步方法 (为了快速迁移)
export const getSessionById = (id: string) => storageAdapter.getSessionById_sync(id)
export const getAllSessions = () => storageAdapter.getAllSessions_sync()
export const getAPIConfig = () => storageAdapter.getAPIConfig_sync()
export const saveSession = (session: LearningSession) => storageAdapter.saveSession(session)
export const updateSessionMessages = (sessionId: string, messages: ChatMessage[]) => 
  storageAdapter.updateSessionMessages(sessionId, messages)
export const updateSessionCurrentChapter = (sessionId: string, chapterId: string) =>
  storageAdapter.updateSessionCurrentChapter(sessionId, chapterId)
export const markChapterCompleted = (sessionId: string, chapterId: string) =>
  storageAdapter.markChapterCompleted(sessionId, chapterId)
export const addLearningCard = (sessionId: string, card: LearningCard) => storageAdapter.addLearningCard(sessionId, card)
export const deleteSession = (id: string) => storageAdapter.deleteSession(id)
export const saveAPIConfig = (config: APIConfig) => storageAdapter.saveAPIConfig(config)