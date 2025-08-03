/**
 * 应用仪表板页面 - 登录后的应用主界面
 * 
 * 功能：
 * - 学习会话历史管理
 * - 新建学习会话
 * - API配置管理
 * - 用户数据展示
 */

import React, { useState, useEffect } from 'react';
import { Settings, Upload, BookOpen, Brain, Zap } from 'lucide-react';
import Button from '../src/components/ui/Button';
import Card from '../src/components/ui/Card';
import APIConfigModal from '../src/components/APIConfigModal';
import SessionHistoryList from '../src/components/SessionHistoryList';
import { APIConfig, LearningSession } from '../src/types';
import { 
  getAllSessions, 
  deleteSession, 
  getAPIConfig, 
  saveAPIConfig 
} from '../src/utils/storageAdapter';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'next/router';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // 状态管理
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(null);
  const [showAPIConfigModal, setShowAPIConfigModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 初始化数据加载和用户认证检查
   */
  useEffect(() => {
    if (loading) {
      return; // 还在加载认证状态
    }

    if (!user) {
      console.log('用户未登录，跳转到首页');
      router.push('/');
      return;
    }

    const initializeData = () => {
      try {
        // 加载用户数据
        const loadedSessions = getAllSessions();
        const loadedConfig = getAPIConfig();
        
        setSessions(loadedSessions);
        setApiConfig(loadedConfig);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user, loading, router]);

  /**
   * 进入学习会话
   */
  const handleEnterSession = (sessionId: string) => {
    router.push(`/learn/${sessionId}`);
  };

  /**
   * 删除学习会话
   */
  const handleDeleteSession = (sessionId: string) => {
    if (window.confirm('确定要删除这个学习记录吗？此操作不可恢复。')) {
      const success = deleteSession(sessionId);
      if (success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      } else {
        alert('删除失败，请重试');
      }
    }
  };

  /**
   * 保存API配置
   */
  const handleSaveAPIConfig = (config: APIConfig) => {
    const success = saveAPIConfig(config);
    if (success) {
      setApiConfig(config);
      setShowAPIConfigModal(false);
    } else {
      alert('保存配置失败，请重试');
    }
  };

  /**
   * 开始新的学习会话
   */
  const handleStartNewSession = () => {
    if (!apiConfig) {
      alert('请先配置AI服务');
      setShowAPIConfigModal(true);
      return;
    }
    router.push('/upload');
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，不渲染内容（useEffect会处理跳转）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo和标题 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI学习私教</h1>
                <p className="text-sm text-gray-500">应用仪表板</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/cards')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                卡片管理
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAPIConfigModal(true)}
                icon={<Settings className="w-4 h-4" />}
              >
                API设置
              </Button>
              
              <Button
                variant="primary"
                onClick={handleStartNewSession}
                icon={<Upload className="w-4 h-4" />}
              >
                开始新学习
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              让AI成为您的专属学习导师
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              上传任何文档，AI会为您生成个性化学习路径，提供互动式教学体验
            </p>

            {/* 特性卡片 */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">智能解析</h3>
                <p className="text-sm text-gray-600">
                  支持PDF、Word、PPT等多种格式，自动提取关键内容
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-6 h-6 text-secondary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">个性化教学</h3>
                <p className="text-sm text-gray-600">
                  根据您的水平调整教学方式，小白和高手模式自由选择
                </p>
              </Card>

              <Card className="text-center p-6">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-accent-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">知识沉淀</h3>
                <p className="text-sm text-gray-600">
                  一键收藏重要内容为卡片，支持导出到Anki长期记忆
                </p>
              </Card>
            </div>

            {/* 行动按钮 */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleStartNewSession}
              icon={<Upload className="w-5 h-5" />}
            >
              立即开始学习
            </Button>
          </div>
        </div>

        {/* 学习历史区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              学习历史 ({sessions.length})
            </h3>
            {sessions.length > 0 && (
              <p className="text-sm text-gray-500">
                点击任一记录可继续学习
              </p>
            )}
          </div>
          
          <SessionHistoryList
            sessions={sessions}
            onEnterSession={handleEnterSession}
            onDeleteSession={handleDeleteSession}
          />
        </div>

        {/* 配置状态提示 */}
        {!apiConfig && (
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">需要配置AI服务</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  请先配置您的AI API密钥，才能开始学习体验
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAPIConfigModal(true)}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                立即配置
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* API配置模态框 */}
      {showAPIConfigModal && (
        <APIConfigModal
          isOpen={showAPIConfigModal}
          onClose={() => setShowAPIConfigModal(false)}
          currentConfig={apiConfig}
          onSave={handleSaveAPIConfig}
        />
      )}
    </div>
  );
};

export default DashboardPage;