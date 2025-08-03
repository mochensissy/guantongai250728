/**
 * Supabase 客户端配置
 * 
 * 提供类型安全的数据库操作接口和认证管理
 * 使用最新的 @supabase/ssr 包支持服务端渲染
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { Database } from '../types/database.types'

// 环境变量验证
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '缺少Supabase环境变量。请检查 .env.local 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_ANON_KEY'
  )
}

/**
 * 浏览器端 Supabase 客户端
 * 用于客户端组件和页面
 */
export const createClient = () => {
  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!)
}

/**
 * 服务器端 Supabase 客户端
 * 用于 API 路由、服务器组件和中间件
 */
export const createServerSupabaseClient = (
  cookieStore: {
    get: (name: string) => { value: string } | undefined
    set: (name: string, value: string, options?: CookieOptions) => void
    remove: (name: string, options?: CookieOptions) => void
  }
) => {
  return createServerClient<Database>(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.remove(name, options)
      }
    }
  })
}

/**
 * 默认客户端实例 (仅用于客户端)
 * 注意：仅在浏览器环境中使用
 */
export const supabase = typeof window !== 'undefined' ? createClient() : null

// =================================
// 类型安全的表操作接口
// =================================

/**
 * 用户表操作
 */
export const usersTable = () => {
  const client = createClient()
  return client.from('users')
}

/**
 * 学习会话表操作
 */
export const sessionsTable = () => {
  const client = createClient()
  return client.from('learning_sessions')
}

/**
 * 对话消息表操作
 */
export const messagesTable = () => {
  const client = createClient()
  return client.from('chat_messages')
}

/**
 * 学习卡片表操作
 */
export const cardsTable = () => {
  const client = createClient()
  return client.from('learning_cards')
}

// =================================
// 辅助函数
// =================================

/**
 * 检查用户是否已认证
 */
export const checkAuth = async () => {
  const client = createClient()
  const { data: { user }, error } = await client.auth.getUser()
  
  if (error) {
    console.error('检查认证状态失败:', error)
    return { user: null, error }
  }
  
  return { user, error: null }
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async () => {
  const { user, error } = await checkAuth()
  
  if (error || !user) {
    return null
  }
  
  // 获取用户的完整档案信息
  const { data: profile } = await usersTable()
    .select('*')
    .eq('id', user.id)
    .single()
  
  return profile
}

/**
 * 登出用户
 */
export const signOut = async () => {
  const client = createClient()
  const { error } = await client.auth.signOut()
  
  if (error) {
    console.error('登出失败:', error)
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

// =================================
// 数据库类型定义 (临时，待生成完整类型)
// =================================

export interface DatabaseUser {
  id: string
  email: string
  username?: string
  avatar_url?: string
  subscription_tier: 'free' | 'pro' | 'team'
  subscription_expires_at?: string
  preferences: {
    defaultLearningLevel: 'beginner' | 'expert'
    theme: 'light' | 'dark'
    language: 'zh' | 'en'
    soundEnabled: boolean
    autoSave: boolean
  }
  total_sessions: number
  total_cards: number
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface DatabaseSession {
  id: string
  user_id: string
  title: string
  document_content?: string
  document_type: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text'
  learning_level: 'beginner' | 'expert'
  status: 'draft' | 'active' | 'completed' | 'paused'
  outline: any[]
  current_chapter?: string
  progress: any
  message_count: number
  card_count: number
  completion_percentage: number
  created_at: string
  updated_at: string
}

export interface DatabaseMessage {
  id: string
  session_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  chapter_id?: string
  is_bookmarked: boolean
  card_id?: string
  metadata: any
  created_at: string
}

export interface DatabaseCard {
  id: string
  user_id: string
  session_id: string
  message_id?: string
  title: string
  content: string
  user_note?: string
  type: 'inspiration' | 'bookmark'
  tags: string[]
  chapter_id?: string
  difficulty: number
  review_count: number
  last_reviewed_at?: string
  next_review_at: string
  created_at: string
  updated_at: string
}

// =================================
// 错误处理
// =================================

/**
 * Supabase 错误处理器
 */
export const handleSupabaseError = (error: any, context: string = '') => {
  console.error(`Supabase错误 ${context}:`, error)
  
  // 常见错误类型处理
  if (error?.code === 'PGRST116') {
    return '数据未找到'
  }
  
  if (error?.code === '23505') {
    return '数据已存在，请检查重复项'
  }
  
  if (error?.code === '23503') {
    return '关联数据不存在'
  }
  
  if (error?.message?.includes('JWT')) {
    return '登录已过期，请重新登录'
  }
  
  return error?.message || '发生未知错误'
}