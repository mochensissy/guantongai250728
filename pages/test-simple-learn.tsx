/**
 * 简化的学习页面测试
 * 用于快速验证卡片功能是否正常
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { addLearningCard } from '../src/utils/storageAdapter';
import Button from '../src/components/ui/Button';
import { LearningCard, ChatMessage } from '../src/types';
import { Star, Lightbulb, MessageCircle } from 'lucide-react';

function SimpleLearnContent() {
  const { user } = useAuth();
  const [testMessages] = useState<ChatMessage[]>([
    {
      id: 'test-msg-1',
      role: 'assistant',
      content: '这是一条测试AI消息，用于验证卡片收藏功能。这里包含了一些重要的学习内容，可以被收藏为卡片。',
      timestamp: new Date().toISOString(),
      isBookmarked: false
    },
    {
      id: 'test-msg-2',
      role: 'assistant',
      content: '这是第二条测试消息。我们可以测试灵感收藏功能，看看能否正常创建卡片并避免重复。',
      timestamp: new Date().toISOString(),
      isBookmarked: false
    }
  ]);
  
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(`📝 ${message}`);
  };

  const handleBookmark = async (messageId: string, type: 'bookmark' | 'inspiration') => {
    // 防止重复点击
    if (isProcessing === messageId) {
      addResult(`⚠️ 正在处理中，请稍等... (${messageId})`);
      return;
    }

    // 检查是否已经收藏
    if (bookmarkedMessages.has(messageId)) {
      addResult(`⚠️ 消息已经收藏过了 (${messageId})`);
      return;
    }

    setIsProcessing(messageId);
    addResult(`🔄 开始处理${type}收藏 (${messageId})`);

    try {
      const message = testMessages.find(m => m.id === messageId);
      if (!message) {
        throw new Error('消息不存在');
      }

      // 首先确保测试会话存在
      const testSessionId = 'test-session';
      let existingSession = null;
      
      try {
        const { getSessionById, saveSession } = await import('../src/utils/storage');
        existingSession = getSessionById(testSessionId);
        
        if (!existingSession) {
          // 创建测试会话
          const testSession = {
            id: testSessionId,
            title: '测试会话',
            content: '这是一个用于测试卡片功能的会话',
            outline: [],
            messages: testMessages,
            cards: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            learningLevel: 'beginner' as const,
            currentChapter: null,
            completedChapters: []
          };
          
          const sessionSaved = saveSession(testSession);
          addResult(`📦 ${sessionSaved ? '✅' : '❌'} 创建测试会话: ${testSessionId}`);
          
          if (!sessionSaved) {
            throw new Error('创建测试会话失败');
          }
        } else {
          addResult(`📦 ✅ 找到现有测试会话: ${testSessionId}`);
        }
      } catch (error) {
        addResult(`❌ 会话处理失败: ${error.message}`);
        return;
      }

      // 创建测试卡片
      const card: LearningCard = {
        id: `test-card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        title: `${type === 'inspiration' ? '💡' : '⭐'} 测试卡片`,
        content: message.content,
        userNote: type === 'inspiration' ? '这是一个灵感卡片' : '这是一个收藏卡片',
        type: type,
        tags: ['测试'],
        createdAt: Date.now(),
        sessionId: testSessionId,
        messageId: messageId,
        difficulty: 'medium',
        reviewCount: 0,
        nextReviewAt: Date.now() + 24 * 60 * 60 * 1000 // 24小时后
      };

      addResult(`📝 创建卡片: ${card.id}`);

      // 保存卡片
      const success = await addLearningCard(testSessionId, card);
      
      if (success) {
        setBookmarkedMessages(prev => new Set([...prev, messageId]));
        addResult(`✅ ${type}收藏成功！卡片ID: ${card.id}`);
      } else {
        throw new Error('保存失败');
      }

    } catch (error) {
      addResult(`❌ ${type}收藏失败: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">简化学习页面测试</h1>
        
        {/* 用户状态 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-2">用户状态</h2>
          <p className="text-sm text-gray-600">
            {user ? `已登录: ${user.email}` : '未登录（使用本地存储）'}
          </p>
        </div>

        {/* 测试消息 */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">测试消息</h2>
          
          {testMessages.map((message) => (
            <div key={message.id} className="border border-gray-200 rounded-lg p-4 mb-4 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <MessageCircle className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm font-medium text-gray-900">AI助手</span>
                    <span className="text-xs text-gray-500 ml-2">{message.id}</span>
                  </div>
                  <p className="text-gray-700">{message.content}</p>
                </div>
                
                {/* 收藏按钮 */}
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBookmark(message.id, 'inspiration')}
                    disabled={isProcessing === message.id}
                    className={`${bookmarkedMessages.has(message.id) ? 'text-yellow-600 border-yellow-300' : ''}`}
                  >
                    <Lightbulb className={`w-4 h-4 ${bookmarkedMessages.has(message.id) ? 'fill-yellow-400' : ''}`} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBookmark(message.id, 'bookmark')}
                    disabled={isProcessing === message.id}
                    className={`${bookmarkedMessages.has(message.id) ? 'text-blue-600 border-blue-300' : ''}`}
                  >
                    <Star className={`w-4 h-4 ${bookmarkedMessages.has(message.id) ? 'fill-blue-400' : ''}`} />
                  </Button>
                </div>
              </div>
              
              {/* 处理状态 */}
              {isProcessing === message.id && (
                <div className="mt-2 text-sm text-blue-600">
                  正在处理中...
                </div>
              )}
              
              {/* 收藏状态 */}
              {bookmarkedMessages.has(message.id) && (
                <div className="mt-2 text-sm text-green-600">
                  ✅ 已收藏
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 操作日志 */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">操作日志</h2>
          <div className="max-h-64 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">暂无操作记录</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="text-sm text-gray-700 py-1 font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
          
          {results.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResults([])}
              className="mt-4"
            >
              清空日志
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TestSimpleLearnPage() {
  return (
    <AuthProvider>
      <SimpleLearnContent />
    </AuthProvider>
  );
}