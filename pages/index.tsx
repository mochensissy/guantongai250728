/**
 * 首页组件 - 应用程序的主入口
 * 
 * 功能：
 * - 显示现代化的产品首页 (Landing Page)
 * - 用户认证入口
 * - 应用功能展示
 * - 为未来Supabase集成做准备
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import LandingPage from '../src/components/LandingPage';
import { APIConfig } from '../src/types';
import { getAPIConfig } from '../src/utils/storage';

const HomePage: React.FC = () => {
  const router = useRouter();
  
  // 状态管理
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 初始化数据加载
   */
  useEffect(() => {
    const initializeData = () => {
      try {
        const loadedConfig = getAPIConfig();
        setApiConfig(loadedConfig);
      } catch (error) {
        console.error('加载配置失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  /**
   * 处理开始使用按钮点击
   * 检查API配置，如果已配置则进入仪表板，否则跳转到上传页面
   */
  const handleGetStarted = () => {
    if (!apiConfig) {
      // 如果没有API配置，先跳转到上传页面进行文档上传和API配置
      router.push('/upload');
    } else {
      // 如果已有API配置，直接跳转到用户仪表板
      router.push('/dashboard');
    }
  };

  /**
   * 处理登录操作
   * 不提供onLogin回调，让LandingPage组件显示登录模态框
   * 认证成功后通过handleAuthSuccess处理跳转
   */
  // 移除handleLogin函数，让LandingPage组件自行处理登录模态框显示

  /**
   * 处理认证成功
   */
  const handleAuthSuccess = (user: any) => {
    console.log('用户认证成功:', user);
    // 跳转到用户仪表板 - 可以查看学习历史和创建新会话
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <LandingPage 
      onGetStarted={handleGetStarted}
      onAuthSuccess={handleAuthSuccess}
    />
  );
};

export default HomePage;