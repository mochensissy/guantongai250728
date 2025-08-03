/**
 * 认证上下文 - 基于Supabase Auth
 * 
 * 提供完整的用户认证功能：
 * - 用户注册和登录
 * - 认证状态管理
 * - 用户信息获取
 * - 自动会话恢复
 */

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { createClient } from '../utils/supabase'
import { DbUser } from '../types/database.types'

interface AuthContextType {
  // 认证状态
  user: User | null
  userProfile: DbUser | null
  session: Session | null
  loading: boolean
  
  // 认证操作
  signUp: (email: string, password: string, username?: string) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
  
  // 用户操作
  updateProfile: (updates: Partial<DbUser>) => Promise<AuthResult>
  refreshUserProfile: () => Promise<void>
}

interface AuthResult {
  success: boolean
  error?: string
  message?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<DbUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    initializeAuth()
  }, [])

  /**
   * 初始化认证状态
   */
  const initializeAuth = async () => {
    try {
      // 获取当前会话
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('获取会话失败:', error)
      } else {
        setSession(session)
        setUser(session?.user ?? null)
        
        // 如果有用户，获取用户档案
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      }
    } catch (error) {
      console.error('初始化认证状态失败:', error)
    } finally {
      setLoading(false)
    }

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('认证状态变化:', event, session?.user?.email)
        
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)

        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }

  /**
   * 获取用户档案信息
   */
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('获取用户档案失败:', error)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('获取用户档案时发生错误:', error)
    }
  }

  /**
   * 用户注册
   */
  const signUp = async (email: string, password: string, username?: string): Promise<AuthResult> => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split('@')[0] // 如果没有提供用户名，使用邮箱前缀
          }
        }
      })

      if (error) {
        return { success: false, error: getErrorMessage(error) }
      }

      // 注册成功但需要邮箱验证
      if (data.user && !data.user.email_confirmed_at) {
        return { 
          success: true, 
          message: '注册成功！请检查您的邮箱并点击验证链接来激活账户。' 
        }
      }

      // 注册并已验证
      return { 
        success: true, 
        message: '注册成功！欢迎使用AI学习私教。' 
      }
    } catch (error) {
      console.error('注册失败:', error)
      return { success: false, error: '注册过程中发生错误，请稍后重试。' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 用户登录
   */
  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: getErrorMessage(error) }
      }

      if (data.user) {
        return { 
          success: true, 
          message: '登录成功！欢迎回来。' 
        }
      }

      return { success: false, error: '登录失败，请检查您的凭据。' }
    } catch (error) {
      console.error('登录失败:', error)
      return { success: false, error: '登录过程中发生错误，请稍后重试。' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 用户登出
   */
  const signOut = async (): Promise<AuthResult> => {
    try {
      setLoading(true)
      
      const { error } = await supabase.auth.signOut()

      if (error) {
        return { success: false, error: getErrorMessage(error) }
      }

      return { 
        success: true, 
        message: '已成功登出。' 
      }
    } catch (error) {
      console.error('登出失败:', error)
      return { success: false, error: '登出过程中发生错误。' }
    } finally {
      setLoading(false)
    }
  }

  /**
   * 重置密码
   */
  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: getErrorMessage(error) }
      }

      return { 
        success: true, 
        message: '密码重置邮件已发送，请检查您的邮箱。' 
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      return { success: false, error: '重置密码过程中发生错误。' }
    }
  }

  /**
   * 更新用户档案
   */
  const updateProfile = async (updates: Partial<DbUser>): Promise<AuthResult> => {
    try {
      if (!user) {
        return { success: false, error: '用户未登录' }
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)

      if (error) {
        return { success: false, error: `更新档案失败: ${error.message}` }
      }

      // 刷新用户档案
      await fetchUserProfile(user.id)

      return { 
        success: true, 
        message: '档案更新成功！' 
      }
    } catch (error) {
      console.error('更新档案失败:', error)
      return { success: false, error: '更新档案过程中发生错误。' }
    }
  }

  /**
   * 刷新用户档案
   */
  const refreshUserProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id)
    }
  }

  /**
   * 获取用户友好的错误信息
   */
  const getErrorMessage = (error: AuthError): string => {
    switch (error.message) {
      case 'Invalid login credentials':
        return '邮箱或密码错误，请检查后重试。'
      case 'Email not confirmed':
        return '请先验证您的邮箱地址。'
      case 'User already registered':
        return '该邮箱已被注册，请直接登录或使用其他邮箱。'
      case 'Password should be at least 6 characters':
        return '密码至少需要6位字符。'
      case 'Only an email address is required':
        return '请输入有效的邮箱地址。'
      case 'Unable to validate email address: invalid format':
        return '邮箱格式不正确，请检查后重试。'
      default:
        return error.message || '发生未知错误，请稍后重试。'
    }
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    refreshUserProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 使用认证上下文的Hook
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

/**
 * 检查用户是否已登录的Hook
 */
export const useRequireAuth = () => {
  const { user, loading } = useAuth()
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    requireAuth: !loading && !user
  }
}