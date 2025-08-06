/**
 * 本地存储工具类
 * 
 * 提供了完整的localStorage管理功能：
 * - 安全的数据读写操作
 * - 会话管理（增删改查）
 * - API配置管理
 * - 数据版本控制和迁移
 */

import { LocalStorageData, LearningSession, APIConfig, UserPreferences, ChatMessage } from '../types';
import { LearningCard, ReviewRecord } from '../types';

const STORAGE_KEY = 'ai-learning-platform';
const CURRENT_VERSION = '1.0.0';

/**
 * 获取默认的用户偏好设置
 */
const getDefaultPreferences = (): UserPreferences => ({
  defaultLearningLevel: 'beginner',
  theme: 'light',
  language: 'zh',
  soundEnabled: true,
  autoSave: true,
});

/**
 * 获取默认的存储数据结构
 */
const getDefaultStorageData = (): LocalStorageData => ({
  sessions: [],
  preferences: getDefaultPreferences(),
  version: CURRENT_VERSION,
});

/**
 * 安全地从localStorage读取数据
 * 处理JSON解析错误和数据格式不匹配的情况
 */
const safeGetStorageData = (): LocalStorageData => {
  try {
    if (typeof window === 'undefined') {
      return getDefaultStorageData();
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultStorageData();
    }

    const parsed = JSON.parse(stored) as LocalStorageData;
    
    // 检查数据版本，如需要则进行迁移
    if (parsed.version !== CURRENT_VERSION) {
      return migrateStorageData(parsed);
    }

    // 确保必要字段存在
    return {
      ...getDefaultStorageData(),
      ...parsed,
      preferences: {
        ...getDefaultPreferences(),
        ...(parsed.preferences || {}),
      },
    };
  } catch (error) {
    console.warn('读取本地存储数据失败，使用默认配置:', error);
    return getDefaultStorageData();
  }
};

/**
 * 数据版本迁移函数
 * 处理不同版本间的数据结构变化
 */
const migrateStorageData = (oldData: any): LocalStorageData => {
  console.log('正在迁移存储数据从版本', oldData.version, '到', CURRENT_VERSION);
  
  // 目前只有一个版本，暂时直接返回默认数据
  // 未来版本可在此处添加具体的迁移逻辑
  return {
    ...getDefaultStorageData(),
    sessions: Array.isArray(oldData.sessions) ? oldData.sessions : [],
  };
};

/**
 * 安全地保存数据到localStorage
 */
const safeSaveStorageData = (data: LocalStorageData): boolean => {
  try {
    if (typeof window === 'undefined') {
      return false;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('保存本地存储数据失败:', error);
    return false;
  }
};

// =================
// 会话管理功能
// =================

/**
 * 获取所有学习会话
 * 按最后更新时间倒序排列
 */
export const getAllSessions = (): LearningSession[] => {
  const data = safeGetStorageData();
  return data.sessions.sort((a, b) => b.updatedAt - a.updatedAt);
};

/**
 * 根据ID获取特定会话
 */
export const getSessionById = (id: string): LearningSession | null => {
  const data = safeGetStorageData();
  return data.sessions.find(session => session.id === id) || null;
};

/**
 * 保存学习会话（新增或更新）
 * 如果会话ID已存在则更新，否则新增
 */
export const saveSession = (session: LearningSession): boolean => {
  try {
    console.log('💾 LocalStorage.saveSession 开始:', {
      sessionId: session.id,
      title: session.title
    });
    
    const data = safeGetStorageData();
    const existingIndex = data.sessions.findIndex(s => s.id === session.id);
    
    const updatedSession = {
      ...session,
      updatedAt: Date.now(),
    };

    if (existingIndex >= 0) {
      // 更新现有会话
      console.log('💾 更新现有会话');
      data.sessions[existingIndex] = updatedSession;
    } else {
      // 新增会话
      console.log('💾 新增会话');
      data.sessions.push(updatedSession);
    }

    const result = safeSaveStorageData(data);
    console.log('💾 LocalStorage.saveSession 结果:', result);
    return result;
  } catch (error) {
    console.error('💾 保存会话失败:', error);
    return false;
  }
};

/**
 * 删除学习会话
 */
export const deleteSession = (id: string): boolean => {
  try {
    const data = safeGetStorageData();
    data.sessions = data.sessions.filter(session => session.id !== id);
    return safeSaveStorageData(data);
  } catch (error) {
    console.error('删除会话失败:', error);
    return false;
  }
};

/**
 * 更新会话的对话历史
 * 专门用于高频的消息更新操作
 */
export const updateSessionMessages = (sessionId: string, messages: ChatMessage[]): boolean => {
  const session = getSessionById(sessionId);
  if (!session) {
    return false;
  }

  return saveSession({
    ...session,
    messages,
  });
};

/**
 * 更新会话的当前章节
 */
export const updateSessionCurrentChapter = (sessionId: string, chapterId: string): boolean => {
  const session = getSessionById(sessionId);
  if (!session) {
    return false;
  }

  return saveSession({
    ...session,
    currentChapter: chapterId,
  });
};

/**
 * 标记章节为已完成
 */
export const markChapterCompleted = (sessionId: string, chapterId: string): boolean => {
  const session = getSessionById(sessionId);
  if (!session) {
    return false;
  }

  const updatedOutline = session.outline.map(item => 
    item.id === chapterId 
      ? { ...item, isCompleted: true, completedAt: Date.now() }
      : item
  );

  return saveSession({
    ...session,
    outline: updatedOutline,
  });
};

/**
 * 取消章节完成状态
 */
export const unmarkChapterCompleted = (sessionId: string, chapterId: string): boolean => {
  const session = getSessionById(sessionId);
  if (!session) {
    return false;
  }

  const updatedOutline = session.outline.map(item => 
    item.id === chapterId 
      ? { ...item, isCompleted: false, completedAt: undefined }
      : item
  );

  return saveSession({
    ...session,
    outline: updatedOutline,
  });
};

// =================
// 卡片管理功能
// =================

/**
 * 获取所有会话的卡片
 */
export const getAllCards = (): LearningCard[] => {
  const data = safeGetStorageData();
  const allCards: LearningCard[] = [];
  
  data.sessions.forEach(session => {
    if (session.cards) {
      allCards.push(...session.cards);
    }
  });
  
  return allCards.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * 添加学习卡片
 */
export const addLearningCard = (sessionId: string, card: LearningCard): boolean => {
  try {
    const session = getSessionById(sessionId);
    if (!session) return false;

    // 确保卡片有tags字段
    const cardWithTags = {
      ...card,
      tags: card.tags || [],
    };

    const updatedSession = {
      ...session,
      cards: [...(session.cards || []), cardWithTags],
    };

    return saveSession(updatedSession);
  } catch (error) {
    console.error('添加学习卡片失败:', error);
    return false;
  }
};

/**
 * 更新学习卡片
 */
export const updateLearningCard = (sessionId: string, cardId: string, updates: Partial<LearningCard>): boolean => {
  try {
    const session = getSessionById(sessionId);
    if (!session) return false;

    const updatedCards = (session.cards || []).map(card =>
      card.id === cardId ? { ...card, ...updates } : card
    );

    const updatedSession = {
      ...session,
      cards: updatedCards,
    };

    return saveSession(updatedSession);
  } catch (error) {
    console.error('更新学习卡片失败:', error);
    return false;
  }
};

/**
 * 删除学习卡片
 */
export const deleteLearningCard = (sessionId: string, cardId: string): boolean => {
  try {
    const session = getSessionById(sessionId);
    if (!session) return false;

    const updatedCards = (session.cards || []).filter(card => card.id !== cardId);

    const updatedSession = {
      ...session,
      cards: updatedCards,
    };

    return saveSession(updatedSession);
  } catch (error) {
    console.error('删除学习卡片失败:', error);
    return false;
  }
};

/**
 * 获取会话的所有卡片
 */
export const getSessionCards = (sessionId: string): LearningCard[] => {
  const session = getSessionById(sessionId);
  const cards = session?.cards || [];
  // 按创建时间倒序排列，最新的卡片在前面
  return cards.sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * 获取需要复习的卡片
 */
export const getCardsForReview = (sessionId: string): LearningCard[] => {
  const cards = getSessionCards(sessionId);
  const now = Date.now();
  
  return cards.filter(card => card.nextReviewAt <= now);
};

/**
 * 记录卡片复习
 */
export const recordCardReview = (sessionId: string, cardId: string, quality: number): boolean => {
  try {
    const session = getSessionById(sessionId);
    if (!session) return false;

    const card = session.cards?.find(c => c.id === cardId);
    if (!card) return false;

    // 计算下次复习时间（艾宾浩斯遗忘曲线）
    const nextInterval = calculateNextReviewInterval(card.reviewCount, quality, card.difficulty);
    const nextReviewAt = Date.now() + nextInterval;

    const updatedCard: LearningCard = {
      ...card,
      lastReviewedAt: Date.now(),
      nextReviewAt,
      reviewCount: card.reviewCount + 1,
      difficulty: Math.max(1, Math.min(5, card.difficulty + (quality < 3 ? 1 : -0.1))),
    };

    return updateLearningCard(sessionId, cardId, updatedCard);
  } catch (error) {
    console.error('记录卡片复习失败:', error);
    return false;
  }
};

/**
 * 计算下次复习间隔（基于艾宾浩斯遗忘曲线）
 */
const calculateNextReviewInterval = (reviewCount: number, quality: number, difficulty: number): number => {
  // 基础间隔（毫秒）
  const baseIntervals = [
    1 * 60 * 1000,      // 1分钟（测试用，实际可以是1天）
    10 * 60 * 1000,     // 10分钟（测试用，实际可以是3天）
    60 * 60 * 1000,     // 1小时（测试用，实际可以是7天）
    6 * 60 * 60 * 1000, // 6小时（测试用，实际可以是15天）
    24 * 60 * 60 * 1000, // 1天（测试用，实际可以是30天）
  ];

  // 如果复习质量差（quality < 3），重置到第一个间隔
  if (quality < 3) {
    return baseIntervals[0];
  }

  // 根据复习次数选择基础间隔
  const baseInterval = baseIntervals[Math.min(reviewCount, baseIntervals.length - 1)];
  
  // 根据难度调整间隔
  const difficultyFactor = 2.5 - (difficulty - 1) * 0.3; // 难度越高，间隔越短
  
  return Math.round(baseInterval * difficultyFactor);
};

// =================
// API配置管理
// =================

/**
 * 获取API配置
 */
export const getAPIConfig = (): APIConfig | null => {
  const data = safeGetStorageData();
  return data.apiConfig || null;
};

/**
 * 保存API配置
 */
export const saveAPIConfig = (config: APIConfig): boolean => {
  try {
    const data = safeGetStorageData();
    data.apiConfig = config;
    return safeSaveStorageData(data);
  } catch (error) {
    console.error('保存API配置失败:', error);
    return false;
  }
};

/**
 * 清除API配置
 */
export const clearAPIConfig = (): boolean => {
  try {
    const data = safeGetStorageData();
    delete data.apiConfig;
    return safeSaveStorageData(data);
  } catch (error) {
    console.error('清除API配置失败:', error);
    return false;
  }
};

// =================
// 用户偏好管理
// =================

/**
 * 获取用户偏好设置
 */
export const getUserPreferences = (): UserPreferences => {
  const data = safeGetStorageData();
  return data.preferences;
};

/**
 * 保存用户偏好设置
 */
export const saveUserPreferences = (preferences: Partial<UserPreferences>): boolean => {
  try {
    const data = safeGetStorageData();
    data.preferences = {
      ...data.preferences,
      ...preferences,
    };
    return safeSaveStorageData(data);
  } catch (error) {
    console.error('保存用户偏好失败:', error);
    return false;
  }
};

// =================
// 数据清理和维护
// =================

/**
 * 清理所有本地数据
 * 谨慎使用，这将删除所有学习记录
 */
export const clearAllData = (): boolean => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    return true;
  } catch (error) {
    console.error('清理数据失败:', error);
    return false;
  }
};

/**
 * 获取存储使用情况统计
 */
export const getStorageStats = () => {
  const data = safeGetStorageData();
  const serialized = JSON.stringify(data);
  
  return {
    sessionCount: data.sessions.length,
    totalSizeBytes: new Blob([serialized]).size,
    totalSizeKB: Math.round(new Blob([serialized]).size / 1024 * 100) / 100,
    hasAPIConfig: !!data.apiConfig,
    version: data.version,
  };
};

/**
 * 导出数据（用于备份）
 */
export const exportData = (): string => {
  const data = safeGetStorageData();
  return JSON.stringify(data, null, 2);
};

/**
 * 导入数据（用于恢复备份）
 */
export const importData = (jsonData: string): boolean => {
  try {
    const importedData = JSON.parse(jsonData) as LocalStorageData;
    
    // 基本数据验证
    if (!Array.isArray(importedData.sessions)) {
      throw new Error('无效的数据格式：sessions必须是数组');
    }

    // 如果有版本差异，进行迁移
    const finalData = importedData.version !== CURRENT_VERSION 
      ? migrateStorageData(importedData)
      : importedData;

    return safeSaveStorageData(finalData);
  } catch (error) {
    console.error('导入数据失败:', error);
    return false;
  }
};