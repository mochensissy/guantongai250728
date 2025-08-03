/**
 * 用户档案组件
 * 
 * 显示用户信息和提供快速操作
 */

import React, { useState } from 'react'
import { User, Settings, LogOut, Crown, BarChart3, FileText, BookOpen } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Button from './ui/Button'

interface UserProfileProps {
  compact?: boolean
  showStats?: boolean
}

export default function UserProfile({ compact = false, showStats = true }: UserProfileProps) {
  const { user, userProfile, signOut } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!user || !userProfile) {
    return null
  }

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await signOut()
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getSubscriptionBadge = () => {
    switch (userProfile.subscription_tier) {
      case 'pro':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Crown className="w-3 h-3 mr-1" />
            专业版
          </span>
        )
      case 'team':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <Crown className="w-3 h-3 mr-1" />
            团队版
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            免费版
          </span>
        )
    }
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {userProfile.username || user.email}
          </p>
          <p className="text-xs text-gray-500">
            {getSubscriptionBadge()}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* 用户基本信息 */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {userProfile.username || '用户'}
            </h3>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2">
              {getSubscriptionBadge()}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center"
          >
            <Settings className="w-4 h-4 mr-1" />
            设置
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoading}
            className="flex items-center text-red-600 hover:text-red-700 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-1" />
            登出
          </Button>
        </div>
      </div>

      {/* 用户统计信息 */}
      {showStats && (
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{userProfile.total_sessions}</p>
            <p className="text-sm text-gray-600">学习会话</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mx-auto mb-2">
              <BookOpen className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{userProfile.total_cards}</p>
            <p className="text-sm text-gray-600">学习卡片</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round((userProfile.total_sessions > 0 ? userProfile.total_cards / userProfile.total_sessions : 0) * 10) / 10}
            </p>
            <p className="text-sm text-gray-600">平均卡片</p>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 简单的用户头像组件
 */
export function UserAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const { user, userProfile } = useAuth()

  if (!user) return null

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  }

  return (
    <div className={`${sizeClasses[size]} bg-blue-600 rounded-full flex items-center justify-center`}>
      <User className={`${iconSizes[size]} text-white`} />
    </div>
  )
}