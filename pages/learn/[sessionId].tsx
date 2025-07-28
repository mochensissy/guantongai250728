/**
 * 学习会话页面
 * 
 * 提供双栏布局的学习界面：
 * - 左侧：学习大纲导航
 * - 右侧：AI私教对话界面
 * - 大纲与对话的双向同步
 * - 学习进度跟踪
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ArrowLeft, Settings, BookOpen, MessageCircle, User, Zap } from 'lucide-react';
import Button from '../../src/components/ui/Button';
import ResizablePanel from '../../src/components/ResizablePanel';
import OutlineEditor from '../../src/components/OutlineEditor';
import ChatInterface from '../../src/components/ChatInterface';
import CardManager from '../../src/components/CardManager';
import { 
  LearningSession, 
  ChatMessage, 
  OutlineItem, 
  APIConfig,
  LearningCard
} from '../../src/types';
import { 
  getSessionById, 
  saveSession, 
  updateSessionMessages,
  updateSessionCurrentChapter,
  getAPIConfig,
  markChapterCompleted,
  addLearningCard
} from '../../src/utils/storage';
import { sendChatMessage, summarizeCardTitle } from '../../src/utils/aiService';

const LearnPage: React.FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;

  // 状态管理
  const [session, setSession] = useState<LearningSession | null>(null);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [cardManagerKey, setCardManagerKey] = useState(0);

  /**
   * 初始化会话数据
   */
  useEffect(() => {
    if (!sessionId || typeof sessionId !== 'string') return;

    const loadSession = () => {
      try {
        const loadedSession = getSessionById(sessionId);
        const loadedConfig = getAPIConfig();

        if (!loadedSession) {
          alert('学习会话不存在');
          router.push('/');
          return;
        }

        if (!loadedConfig) {
          alert('API配置丢失，请重新配置');
          router.push('/');
          return;
        }

        setSession(loadedSession);
        setApiConfig(loadedConfig);
        
        // 如果是新会话且没有消息，发送初始消息
        if (loadedSession.messages.length === 0) {
          initializeChat(loadedSession, loadedConfig);
        }
      } catch (error) {
        console.error('加载会话失败:', error);
        alert('加载会话失败');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [sessionId, router]);

  /**
   * 生成消息ID
   */
  const generateMessageId = (): string => {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 生成卡片ID
   */
  const generateCardId = (): string => {
    return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 初始化聊天
   */
  const initializeChat = async (sessionData: LearningSession, config: APIConfig) => {
    // 找到第一个小节作为初始学习目标
    const firstSection = sessionData.outline.find(item => item.type === 'section');
    
    // 创建系统初始化消息
    const systemMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'system',
      content: `学习会话已开始。文档标题：${sessionData.title}，学习水平：${sessionData.learningLevel === 'beginner' ? '小白' : '高手'}模式。`,
      timestamp: Date.now(),
    };

    const welcomeMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: `你好！我将作为你的私人导师，帮助你更好的理解你上传的材料《${sessionData.title}》。为了给您提供最合适的教学体验，我将根据你之前选择的${sessionData.learningLevel === 'beginner' ? '小白' : '高手'}模式来跟你互动。

看完左边这个课程大纲了吗？我们是按照这个顺序从第一章开始，还是您想先跳到某个您特别感兴趣的章节？`,
      timestamp: Date.now(),
    };

    const initialMessages = [systemMessage, welcomeMessage];
    
    // 更新会话
    const updatedSession = {
      ...sessionData,
      messages: initialMessages,
      currentChapter: firstSection?.id, // 设置第一个小节为当前章节
    };

    setSession(updatedSession);
    // 保存会话和当前章节
    saveSession(updatedSession);
  };

  /**
   * 查找下一个小节
   * 跳过章节标题，只返回小节类型的项目
   */
  const findNextSection = (outline: OutlineItem[], currentIndex: number): OutlineItem | null => {
    for (let i = currentIndex + 1; i < outline.length; i++) {
      console.log(`检查索引 ${i}: ${outline[i].title} (${outline[i].type})`);
      if (outline[i].type === 'section') {
        return outline[i];
      }
    }
    return null;
  };

  /**
   * 发送消息给AI
   */
  const handleSendMessage = async (content: string) => {
    if (!session || !apiConfig || isSendingMessage) return;

    setIsSendingMessage(true);

    try {
      // 创建用户消息
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // 更新消息列表
      const updatedMessages = [...session.messages, userMessage];
      setSession(prev => prev ? { ...prev, messages: updatedMessages } : null);

      // 发送给AI
      const response = await sendChatMessage(
        apiConfig,
        updatedMessages,
        session.documentContent,
        session.outline,
        session.learningLevel
      );

      if (response.success && response.data) {
        // 创建AI回复消息
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.data,
          timestamp: Date.now(),
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        
        // 更新本地状态
        setSession(prev => prev ? { ...prev, messages: finalMessages } : null);
        
        // 保存到存储
        updateSessionMessages(session.id, finalMessages);

        // 检查是否需要更新当前章节
        await checkAndUpdateCurrentChapter(response.data, session);
      } else {
        throw new Error(response.error || 'AI响应失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 创建错误消息
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'system',
        content: `发送失败: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now(),
      };

      setSession(prev => {
        if (!prev) return null;
        const messagesWithError = [...prev.messages, errorMessage];
        updateSessionMessages(prev.id, messagesWithError);
        return { ...prev, messages: messagesWithError };
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  /**
   * 检查并更新当前章节
   */
  const checkAndUpdateCurrentChapter = async (aiResponse: string, sessionData: LearningSession) => {
    const lowerResponse = aiResponse.toLowerCase();
    
    // 1. 首先检查用户是否明确要求跳转到特定小节
    const userMessageForJump = sessionData.messages.filter(m => m.role === 'user').pop();
    if (userMessageForJump) {
      // 检查用户消息中的小节编号（如"去1.2"、"学习1.3"、"1.2小节"等）
      const userSectionPattern = /(?:去|到|学习|进入|开始)?.*?(\d+\.\d+)(?:小节|节)?/g;
      const userSectionMatches = [...userMessageForJump.content.matchAll(userSectionPattern)];
      
      if (userSectionMatches.length > 0) {
        // 找到最后一个提到的小节编号
        const lastMatch = userSectionMatches[userSectionMatches.length - 1];
        const sectionNumber = lastMatch[1];
        
        // 在大纲中查找对应的小节
        const targetSection = sessionData.outline.find(item => 
          item.type === 'section' && (
            item.title.includes(sectionNumber) || 
            item.title.match(/^\d+\.\d+/) && item.title.startsWith(sectionNumber)
          )
        );
        
        if (targetSection && sessionData.currentChapter !== targetSection.id) {
          console.log(`用户要求跳转到小节 ${sectionNumber}，切换到:`, targetSection.title);
          
          // 在跳转到指定小节之前，先标记当前小节为完成
          if (sessionData.currentChapter) {
            console.log('用户跳转前标记当前小节为完成:', sessionData.currentChapter);
            await handleMarkChapterCompleted(sessionData.currentChapter);
          }
          
          updateSessionCurrentChapter(sessionData.id, targetSection.id);
          setSession(prev => prev ? { ...prev, currentChapter: targetSection.id } : null);
          return; // 找到明确的小节，直接返回
        }
      }
    }
    
    // 2. 检查AI是否明确提到了具体的小节编号
    console.log('AI回复内容:', aiResponse);
    const aiSectionPattern = /(?:现在|开始|进入|学习|讲解|探讨).*?(\d+\.\d+)(?:小节|节)?/g;
    const aiSectionMatches = [...aiResponse.matchAll(aiSectionPattern)];
    console.log('AI小节匹配结果:', aiSectionMatches);
    
    if (aiSectionMatches.length > 0) {
      // 找到最后一个提到的小节编号
      const lastMatch = aiSectionMatches[aiSectionMatches.length - 1];
      const sectionNumber = lastMatch[1];
      console.log('AI提到的小节编号:', sectionNumber);
      
      // 在大纲中查找对应的小节
      const targetSection = sessionData.outline.find(item => 
        item.type === 'section' && (
          item.title.includes(sectionNumber) || 
          item.title.match(/^\d+\.\d+/) && item.title.startsWith(sectionNumber)
        )
      );
      console.log('找到的目标小节:', targetSection);
      
      if (targetSection && sessionData.currentChapter !== targetSection.id) {
        console.log(`AI明确提到小节 ${sectionNumber}，切换到:`, targetSection.title);
        
        // 在切换到新小节之前，先标记当前小节为完成
        if (sessionData.currentChapter) {
          console.log('切换前标记当前小节为完成:', sessionData.currentChapter);
          await handleMarkChapterCompleted(sessionData.currentChapter);
        }
        
        updateSessionCurrentChapter(sessionData.id, targetSection.id);
        setSession(prev => prev ? { ...prev, currentChapter: targetSection.id } : null);
        return; // 找到明确的小节，直接返回
      }
    }
    
    // 2. 检查AI是否提到了小节完成的关键词
    const completionKeywords = [
      '完成了', '已经完成了', '我们完成了', '刚才完成了',
      '学习完了', '已经学完了', '我们学完了',
      '结束了', '已经结束了', '我们结束了',
      '这一节就到这里', '本节内容结束',
      '这个小节的内容就讲完了', '本小节到此结束'
    ];
    
    console.log('检查AI是否提到完成关键词:', completionKeywords.some(keyword => lowerResponse.includes(keyword)));
    console.log('AI回复内容(小写):', lowerResponse);
    
    // 如果AI提到了完成关键词
    if (completionKeywords.some(keyword => lowerResponse.includes(keyword))) {
      let completedSectionId = null;
      
      // 检查是否提到了具体的小节编号（用于标记完成）
      // 增强正则表达式，支持更多的表达方式
      const completedSectionPattern = /(?:完成了|学完了|结束了|已经完成了|我们完成了).*?(\d+\.\d+)(?:小节|节)?.*?(?:的学习|学习|的内容)?/g;
      const completedMatches = [...aiResponse.matchAll(completedSectionPattern)];
      
      console.log('完成小节匹配结果:', completedMatches);
      
      if (completedMatches.length > 0) {
        const completedNumber = completedMatches[0][1];
        console.log('提取到的完成小节编号:', completedNumber);
        
        const completedSection = sessionData.outline.find(item => 
          item.type === 'section' && item.title.includes(completedNumber)
        );
        
        console.log('找到的完成小节:', completedSection);
        
        if (completedSection) {
          completedSectionId = completedSection.id;
        }
      }
      
      // 如果没有明确的编号，尝试通过小节标题匹配
      if (!completedSectionId) {
        console.log('尝试通过标题匹配完成的小节');
        for (const item of sessionData.outline) {
          if (item.type === 'section') {
            const titleWithoutNumber = item.title.replace(/^\d+\.\d+\s*/, '').trim();
            if (titleWithoutNumber && aiResponse.includes(titleWithoutNumber)) {
              console.log('通过标题匹配到完成小节:', item.title);
              completedSectionId = item.id;
              break;
            }
          }
        }
      }
      
      // 如果还是没找到，使用当前章节
      if (!completedSectionId && sessionData.currentChapter) {
        console.log('使用当前章节作为完成小节:', sessionData.currentChapter);
        completedSectionId = sessionData.currentChapter;
      }
      
      // 标记找到的小节为完成
      if (completedSectionId) {
        console.log('标记小节为完成:', completedSectionId);
        await handleMarkChapterCompleted(completedSectionId);
      } else {
        console.log('未找到要标记为完成的小节');
      }
    }
    
    // 3. 检查是否用户明确要求进入下一节
    // 注意：根据新的"一步一停"教学模式，我们不应该因为AI提到"接下来"就自动推进
    // 只有当用户明确要求或AI明确说明整个小节已经完成时才推进
    const userRequestNextKeywords = [
      '我想学下一节', '进入下一节吧', '开始下一节', 
      '下一个小节', '继续下一节', '跳到下一节',
      '下一章吧', '进入下一章', '开始下一章',
      '下个章节', '继续下一章', '下个章节'
    ];
    
    // 只有当用户的消息中包含这些关键词时才考虑推进
    const userMessageForNext = sessionData.messages.filter(m => m.role === 'user').pop();
    if (userMessageForNext && userRequestNextKeywords.some(keyword => userMessageForNext.content.toLowerCase().includes(keyword))) {
      // 如果没有明确指定小节编号，自动推进到下一个小节
      if (!aiSectionMatches.length && sessionData.currentChapter) {
        const currentIndex = sessionData.outline.findIndex(item => item.id === sessionData.currentChapter);
        console.log('当前章节索引:', currentIndex, '当前章节ID:', sessionData.currentChapter);
        console.log('大纲结构:', sessionData.outline.map((item, index) => `${index}: ${item.title} (${item.type})`));
        
        if (currentIndex >= 0) {
          // 查找下一个小节（跳过章节标题）
          const nextSection = findNextSection(sessionData.outline, currentIndex);
          
          if (nextSection) {
            console.log('用户要求推进到下一小节:', nextSection.title);
            
            // 在推进到下一节之前，先标记当前小节为完成
            console.log('用户推进前标记当前小节为完成:', sessionData.currentChapter);
            await handleMarkChapterCompleted(sessionData.currentChapter);
            
            updateSessionCurrentChapter(sessionData.id, nextSection.id);
            setSession(prev => prev ? { ...prev, currentChapter: nextSection.id } : null);
          } else {
            console.log('已经是最后一个小节，无法继续推进');
          }
        }
      }
    }
    
    // 4. 检查AI是否提到了具体的小节标题（用于切换章节）
    let chapterFoundAndUpdated = false;
    for (const item of sessionData.outline) {
      if (item.type === 'section' && !chapterFoundAndUpdated) {
        // 检查是否提到了小节的核心标题
        const titleWithoutNumber = item.title.replace(/^\d+\.\d+\s*/, '').trim();
        
        if (titleWithoutNumber.length > 2) { // 避免匹配过短的标题
          const titlePatterns = [
            `学习${titleWithoutNumber}`, `开始${titleWithoutNumber}`,
            `进入${titleWithoutNumber}`, `讲解${titleWithoutNumber}`,
            `${titleWithoutNumber}的内容`, `${titleWithoutNumber}部分`
          ];
          
          if (titlePatterns.some(pattern => aiResponse.includes(pattern))) {
            if (sessionData.currentChapter !== item.id) {
              console.log('通过标题匹配切换章节:', item.title);
              updateSessionCurrentChapter(sessionData.id, item.id);
              setSession(prev => prev ? { ...prev, currentChapter: item.id } : null);
              chapterFoundAndUpdated = true;
            }
          }
        }
      }
    }
  };

  /**
   * 处理章节点击
   */
  const handleChapterClick = (chapterId: string) => {
    if (!session || isSendingMessage) return;

    const item = session.outline.find(item => item.id === chapterId);
    if (!item) return;
    
    // 只有小节（section）才能点击学习，章节（chapter）只是标题
    if (item.type === 'chapter') return;

    // 更新当前章节
    updateSessionCurrentChapter(session.id, chapterId);
    setSession(prev => prev ? { ...prev, currentChapter: chapterId } : null);

    // 发送切换章节的消息
    const switchMessage = `我想跳转到"${item.title}"这个小节进行学习。`;
    handleSendMessage(switchMessage);
  };

  /**
   * 处理消息收藏为卡片
   */
  const handleBookmarkMessage = async (messageId: string, type: 'inspiration' | 'bookmark', userNote?: string) => {
    if (!session || !apiConfig) return;

    const message = session.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') return;

    try {
      // 使用AI生成简洁的卡片标题
      const titleResponse = await summarizeCardTitle(apiConfig, message.content);
      const cardTitle = titleResponse.success ? titleResponse.data : message.content.substring(0, 12);

      // 创建卡片
      const card: LearningCard = {
        id: generateCardId(),
        title: cardTitle,
        content: message.content,
        userNote,
        type,
        tags: [],
        createdAt: Date.now(),
        nextReviewAt: Date.now() + (1 * 60 * 1000), // 1分钟后复习（测试用）
        reviewCount: 0,
        difficulty: 3,
        sessionId: session.id,
        messageId: message.id,
        chapterId: session.currentChapter,
      };

      // 保存卡片
      const success = addLearningCard(session.id, card);
      if (success) {
        // 更新消息的收藏状态
        const updatedMessages = session.messages.map(m =>
          m.id === messageId 
            ? { ...m, isBookmarked: true, cardId: card.id }
            : m
        );
        
        setSession(prev => prev ? { ...prev, messages: updatedMessages } : null);
        updateSessionMessages(session.id, updatedMessages);
        
        // 刷新卡片管理器
        setCardManagerKey(prev => prev + 1);
      }
    } catch (error) {
      console.error('创建卡片失败:', error);
      
      // 如果AI调用失败，使用备用方案
      const fallbackTitle = message.content.substring(0, 12);
      
      const card: LearningCard = {
        id: generateCardId(),
        title: fallbackTitle,
        content: message.content,
        userNote,
        type,
        tags: [],
        createdAt: Date.now(),
        nextReviewAt: Date.now() + (1 * 60 * 1000),
        reviewCount: 0,
        difficulty: 3,
        sessionId: session.id,
        messageId: message.id,
        chapterId: session.currentChapter,
      };

      const success = addLearningCard(session.id, card);
      if (success) {
        const updatedMessages = session.messages.map(m =>
          m.id === messageId 
            ? { ...m, isBookmarked: true, cardId: card.id }
            : m
        );
        
        setSession(prev => prev ? { ...prev, messages: updatedMessages } : null);
        updateSessionMessages(session.id, updatedMessages);
        setCardManagerKey(prev => prev + 1);
      }
    }
  };

  /**
   * 返回首页
   */
  const handleGoBack = () => {
    router.push('/');
  };

  /**
   * 标记章节为已完成
   */
  const handleMarkChapterCompleted = async (chapterId: string) => {
    if (!session) return;

    const success = markChapterCompleted(session.id, chapterId);
    if (success) {
      // 更新本地状态
      setSession(prev => {
        if (!prev) return null;
        const updatedOutline = prev.outline.map(item => 
          item.id === chapterId 
            ? { ...item, isCompleted: true, completedAt: Date.now() }
            : item
        );
        return { ...prev, outline: updatedOutline };
      });
    }
  };

  /**
   * 计算完成进度
   */
  const getCompletionStats = () => {
    if (!session) return { completed: 0, total: 0 };
    
    const completed = session.outline.filter(item => item.isCompleted).length;
    const total = session.outline.length;
    
    return { completed, total };
  };

  /**
   * 处理卡片更新
   */
  const handleCardsUpdate = () => {
    setCardManagerKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">加载学习会话中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">会话不存在</h2>
          <p className="text-gray-600 mb-6">请检查链接是否正确</p>
          <Button onClick={handleGoBack}>返回首页</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between h-16 px-6">
          {/* 左侧信息 */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGoBack}
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              返回
            </Button>
            
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                {session.title}
              </h1>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  {session.learningLevel === 'beginner' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {session.learningLevel === 'beginner' ? '小白模式' : '高手模式'}
                </span>
                
                <span>·</span>
                
                <span>
                  {(() => {
                    const stats = getCompletionStats();
                    return `${stats.completed}/${stats.total} 个章节已完成`;
                  })()}
                </span>
                
                <span>·</span>
                
                <span>{session.messages.filter(m => m.role !== 'system').length} 条对话</span>
              </div>
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500">
              拖拽中间分隔条可调整面板大小
            </div>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex w-full">
          {/* 左侧大纲面板 */}
          <div className="w-1/4 min-w-[250px] max-w-[400px] h-full bg-white border-r border-gray-200 flex flex-col">
            {/* 大纲头部 */}
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <h2 className="text-lg font-semibold text-gray-900">学习大纲</h2>
              </div>
              
              {/* 进度信息 */}
              <div className="text-sm text-gray-600">
                <div className="space-y-1">
                  <p>共 {session.outline.length} 个章节</p>
                  {(() => {
                    const stats = getCompletionStats();
                    const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    return (
                      <div>
                        <p className="text-green-600">已完成 {stats.completed} 个 ({percentage}%)</p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {session.currentChapter && (
                  <p className="mt-2 text-primary-600">
                    当前：{session.outline.find(item => item.id === session.currentChapter)?.title}
                  </p>
                )}
              </div>
            </div>

            {/* 大纲内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <OutlineEditor
                items={session.outline}
                onChange={() => {}} // 学习模式下不允许编辑大纲
                activeChapterId={session.currentChapter}
                onChapterClick={handleChapterClick}
                readonly={true}
                showNumbers={true}
              />
              
              {/* 章节完成操作 */}
              {session.currentChapter && session.outline.find(item => item.id === session.currentChapter)?.type === 'section' && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600 mb-2">
                    当前小节操作：
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkChapterCompleted(session.currentChapter!)}
                    disabled={session.outline.find(item => item.id === session.currentChapter)?.isCompleted}
                    className="w-full"
                  >
                    {session.outline.find(item => item.id === session.currentChapter)?.isCompleted 
                      ? '✅ 已完成' 
                      : '标记为已完成'
                    }
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* 中间聊天界面 */}
          <div className="flex-1 h-full flex flex-col bg-white overflow-hidden">
            {/* 聊天头部 */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI私教助手</h3>
                  <p className="text-sm text-gray-500">
                    {session.learningLevel === 'beginner' 
                      ? '耐心引导模式，循序渐进' 
                      : '高效学习模式，直击重点'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* 聊天内容 */}
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                messages={session.messages.filter(m => m.role !== 'system')}
                onSendMessage={handleSendMessage}
                onBookmarkMessage={handleBookmarkMessage}
                loading={isSendingMessage}
                placeholder="输入您的问题或回应..."
                disabled={isSendingMessage}
              />
            </div>
          </div>

          {/* 右侧卡片管理面板 */}
          <div className="w-1/5 min-w-[280px] max-w-[350px] h-full">
            <CardManager
              key={cardManagerKey}
              sessionId={session.id}
              onCardsUpdate={handleCardsUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearnPage;