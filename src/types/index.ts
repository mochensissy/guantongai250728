/**
 * 私教学习引导平台 - 核心类型定义
 * 
 * 定义了平台中使用的所有主要数据结构和接口：
 * - API配置相关类型
 * - 学习会话相关类型  
 * - 文档和大纲相关类型
 * - AI对话相关类型
 */

// 学习水平类型
export type LearningLevel = 'beginner' | 'expert';

// API配置相关类型
export interface APIConfig {
  /** API提供商类型 */
  provider: 'openai' | 'gemini' | 'claude' | 'deepseek' | 'kimi' | 'openrouter';
  /** API密钥 */
  apiKey: string;
  /** API基础URL（可选，用于自定义端点） */
  baseUrl?: string;
  /** 模型名称 */
  model?: string;
}

// 学习大纲章节
export interface OutlineItem {
  /** 章节唯一标识符 */
  id: string;
  /** 章节标题 */
  title: string;
  /** 章节在大纲中的顺序 */
  order: number;
  /** 章节类型：章或节 */
  type: 'chapter' | 'section';
  /** 父章节ID（仅对小节有效） */
  parentId?: string;
  /** 章节层级（1为章，2为节） */
  level: number;
  /** 是否当前正在学习此章节 */
  isActive?: boolean;
  /** 是否已完成此章节 */
  isCompleted?: boolean;
  /** 完成时间戳 */
  completedAt?: number;
  /** 预估完成时间（分钟） */
  estimatedMinutes?: number;
}

// 对话消息
export interface ChatMessage {
  /** 消息唯一标识符 */
  id: string;
  /** 消息发送者角色 */
  role: 'user' | 'assistant' | 'system';
  /** 消息内容 */
  content: string;
  /** 消息发送时间戳 */
  timestamp: number;
  /** 关联的章节ID（如果适用） */
  chapterId?: string;
  /** 是否已收藏为卡片 */
  isBookmarked?: boolean;
  /** 关联的卡片ID（如果已收藏） */
  cardId?: string;
}

// 学习卡片
export interface LearningCard {
  /** 卡片唯一标识符 */
  id: string;
  /** 卡片标题 */
  title: string;
  /** 卡片内容（AI的回答） */
  content: string;
  /** 用户的感受/笔记（可选） */
  userNote?: string;
  /** 卡片类型 */
  type: 'inspiration' | 'bookmark';
  /** 卡片标签 */
  tags: string[];
  /** 创建时间 */
  createdAt: number;
  /** 最后复习时间 */
  lastReviewedAt?: number;
  /** 下次复习时间 */
  nextReviewAt: number;
  /** 复习次数 */
  reviewCount: number;
  /** 复习难度等级（1-5，影响下次复习间隔） */
  difficulty: number;
  /** 关联的会话ID */
  sessionId: string;
  /** 关联的消息ID */
  messageId: string;
  /** 关联的章节ID */
  chapterId?: string;
}

// 复习记录
export interface ReviewRecord {
  /** 记录ID */
  id: string;
  /** 卡片ID */
  cardId: string;
  /** 复习时间 */
  reviewedAt: number;
  /** 复习质量评分（1-5） */
  quality: number;
  /** 复习用时（秒） */
  duration?: number;
}

// 学习会话
export interface LearningSession {
  /** 会话唯一标识符 */
  id: string;
  /** 会话标题（通常是文档名称） */
  title: string;
  /** 会话创建时间 */
  createdAt: number;
  /** 最后更新时间 */
  updatedAt: number;
  /** 用户选择的学习水平 */
  learningLevel: 'beginner' | 'expert';
  /** 原始文档内容 */
  documentContent: string;
  /** 文档类型 */
  documentType: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text';
  /** 学习大纲 */
  outline: OutlineItem[];
  /** 对话历史 */
  messages: ChatMessage[];
  /** 当前学习进度（当前章节ID） */
  currentChapter?: string;
  /** 会话状态 */
  status: 'draft' | 'active' | 'completed' | 'paused';
  /** 学习卡片 */
  cards: LearningCard[];
}

// 文档解析结果
export interface DocumentParseResult {
  /** 解析成功标志 */
  success: boolean;
  /** 解析得到的文本内容 */
  content: string;
  /** 文档标题（如果能提取到） */
  title?: string;
  /** 错误信息（如果解析失败） */
  error?: string;
  /** 文档元数据 */
  metadata?: {
    pageCount?: number;
    wordCount?: number;
    author?: string;
    createdDate?: string;
  };
}

// AI生成大纲的响应
export interface GenerateOutlineResponse {
  /** 生成成功标志 */
  success: boolean;
  /** 生成的大纲项目列表 */
  outline: Omit<OutlineItem, 'id'>[];
  /** 错误信息（如果生成失败） */
  error?: string;
}

// API请求基础响应
export interface APIResponse<T = any> {
  /** 请求成功标志 */
  success: boolean;
  /** 响应数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  code?: string;
}

// 用户偏好设置
export interface UserPreferences {
  /** 默认学习水平 */
  defaultLearningLevel: 'beginner' | 'expert';
  /** 主题偏好 */
  theme: 'light' | 'dark' | 'auto';
  /** 语言偏好 */
  language: 'zh' | 'en';
  /** 是否开启音效 */
  soundEnabled: boolean;
  /** 是否自动保存 */
  autoSave: boolean;
}

// 本地存储的数据结构
export interface LocalStorageData {
  /** API配置 */
  apiConfig?: APIConfig;
  /** 学习会话列表 */
  sessions: LearningSession[];
  /** 用户偏好设置 */
  preferences: UserPreferences;
  /** 数据版本号（用于迁移） */
  version: string;
}

// 组件Props类型
export interface BaseComponentProps {
  /** 自定义CSS类名 */
  className?: string;
  /** 子元素 */
  children?: React.ReactNode;
}

// 学习水平选择组件Props
export interface LearningLevelSelectorProps extends BaseComponentProps {
  /** 当前选中的学习水平 */
  value: 'beginner' | 'expert';
  /** 水平变化回调 */
  onChange: (level: 'beginner' | 'expert') => void;
  /** 是否禁用 */
  disabled?: boolean;
}

// 大纲编辑器组件Props
export interface OutlineEditorProps extends BaseComponentProps {
  /** 大纲项目列表 */
  items: OutlineItem[];
  /** 大纲变化回调 */
  onChange: (items: OutlineItem[]) => void;
  /** 当前激活的章节ID */
  activeChapterId?: string;
  /** 章节点击回调 */
  onChapterClick?: (chapterId: string) => void;
  /** 是否只读模式 */
  readonly?: boolean;
}

// 聊天界面组件Props
export interface ChatInterfaceProps extends BaseComponentProps {
  /** 对话消息列表 */
  messages: ChatMessage[];
  /** 发送消息回调 */
  onSendMessage: (content: string) => void;
  /** 是否正在加载中 */
  loading?: boolean;
  /** 输入框占位符文本 */
  placeholder?: string;
  /** 是否禁用输入 */
  disabled?: boolean;
}