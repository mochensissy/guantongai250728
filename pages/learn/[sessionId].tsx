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

import ChatInterface from '../../src/components/ChatInterface';
import CardManager from '../../src/components/CardManager';
import { ThemedOutlineSidebar } from '../../src/components/ThemedOutlineSidebar';
import { ThemeProvider, useTheme } from '../../src/contexts/ThemeContext';
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
  markChapterCompleted
} from '../../src/utils/storageAdapter';
import { addLearningCard } from '../../src/utils/storage';
import { sendChatMessage, summarizeCardTitle, purifyCardContent, fixExistingOutline } from '../../src/utils/aiService';

const LearnPageContent: React.FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;
  const { currentLevel } = useTheme();
  const isBeginner = currentLevel === 'beginner';

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
        console.log('🔍 开始加载会话，sessionId:', sessionId);
        
        // 检查localStorage中的所有会话
        const allSessions = JSON.parse(localStorage.getItem('ai-learning-platform') || '{"sessions":[]}');
        console.log('📦 localStorage中的所有会话:', allSessions.sessions?.map(s => ({id: s.id, title: s.title})));
        
        const loadedSession = getSessionById(sessionId);
        const loadedConfig = getAPIConfig();
        
        console.log('🎯 查找的会话ID:', sessionId);
        console.log('📋 找到的会话:', loadedSession ? `${loadedSession.title} (${loadedSession.id})` : 'null');
        console.log('⚙️ API配置:', loadedConfig ? 'ok' : 'null');

        if (!loadedSession) {
          console.error('❌ 学习会话不存在，sessionId:', sessionId);
          alert('学习会话不存在');
          router.push('/dashboard');
          return;
        }

        if (!loadedConfig) {
          console.error('❌ API配置丢失');
          alert('API配置丢失，请重新配置');
          router.push('/dashboard');
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
   * 生成UUID格式的消息ID
   */
  const generateMessageId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  };

  /**
   * 生成UUID格式的卡片ID
   */
  const generateCardId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
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
    await saveSession(updatedSession);
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
      console.error('完整错误信息:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        apiConfig: apiConfig,
        sessionInfo: {
          id: session.id,
          messagesCount: session.messages.length,
          learningLevel: session.learningLevel,
        }
      });
      
      // 创建详细的错误消息
      const errorDetails = error instanceof Error ? error.message : '未知错误';
      const errorMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'system',
        content: `❌ AI回复失败：${errorDetails}

可能的原因：
• API密钥无效或已过期
• 网络连接问题
• AI服务暂时不可用
• 请求内容超过限制

建议操作：
• 检查API配置是否正确
• 稍后重试
• 联系技术支持`,
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
          item.type === 'section' && item.title.includes(sectionNumber)
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
    const aiSectionPattern = /(?:现在|开始|进入|学习|讲解|探讨|来看|接下来|我们来|先看|首先|然后).*?(\d+\.\d+)(?:小节|节|章|部分)?/g;
    const aiSectionMatches = [...aiResponse.matchAll(aiSectionPattern)];
    console.log('AI小节匹配结果:', aiSectionMatches);
    
    if (aiSectionMatches.length > 0) {
      // 找到最后一个提到的小节编号
      const lastMatch = aiSectionMatches[aiSectionMatches.length - 1];
      const sectionNumber = lastMatch[1];
      console.log('AI提到的小节编号:', sectionNumber);
      
      // 在大纲中查找对应的小节
      const targetSection = sessionData.outline.find(item => 
        item.type === 'section' && item.title.includes(sectionNumber)
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

    // 3. 尝试简单的数字模式匹配 (如 "1.2" 这样的独立数字)
    const simpleNumberPattern = /(\d+\.\d+)/g;
    const simpleMatches = [...aiResponse.matchAll(simpleNumberPattern)];
    
    if (simpleMatches.length > 0) {
      // 检查每个数字是否对应大纲中的小节
      for (const match of simpleMatches) {
        const sectionNumber = match[1];
        const targetSection = sessionData.outline.find(item => 
          item.type === 'section' && item.title.includes(sectionNumber)
        );
        
        if (targetSection && sessionData.currentChapter !== targetSection.id) {
          console.log(`通过数字模式匹配到小节 ${sectionNumber}，切换到:`, targetSection.title);
          
          // 在切换到新小节之前，先标记当前小节为完成
          if (sessionData.currentChapter) {
            await handleMarkChapterCompleted(sessionData.currentChapter);
          }
          
          updateSessionCurrentChapter(sessionData.id, targetSection.id);
          setSession(prev => prev ? { ...prev, currentChapter: targetSection.id } : null);
          return;
        }
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
      '下一个章节', '继续下一章', '下个章节'
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
          for (let i = currentIndex + 1; i < sessionData.outline.length; i++) {
            console.log(`检查索引 ${i}: ${sessionData.outline[i].title} (${sessionData.outline[i].type})`);
            if (sessionData.outline[i].type === 'section') {
              const nextSection = sessionData.outline[i];
              console.log('用户要求推进到下一小节:', nextSection.title);
              
              // 在推进到下一节之前，先标记当前小节为完成
              console.log('用户推进前标记当前小节为完成:', sessionData.currentChapter);
              await handleMarkChapterCompleted(sessionData.currentChapter);
              
              updateSessionCurrentChapter(sessionData.id, nextSection.id);
              setSession(prev => prev ? { ...prev, currentChapter: nextSection.id } : null);
              break;
            }
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
   * 修复大纲数据，确保每个章节都有小节
   */
  const handleFixOutline = async () => {
    if (!session) return;

    try {
      console.log('🔧 【新强化版】开始修复大纲数据...');
      console.log('📋 修复前的大纲项目:', session.outline.length, '个');
      session.outline.forEach((item, index) => {
        console.log(`  ${index}: ${item.type} - "${item.title}" (parentChapter: ${item.parentChapter})`);
      });
      
      const fixedOutline = fixExistingOutline(session.outline);
      
      console.log('📋 修复后的大纲项目:', fixedOutline.length, '个');
      fixedOutline.forEach((item, index) => {
        console.log(`  ${index}: ${item.type} - "${item.title}" (parentChapter: ${item.parentChapter})`);
      });
      
      const updatedSession = {
        ...session,
        outline: fixedOutline
      };

      // 保存到localStorage
      await saveSession(updatedSession);
      
      // 更新本地状态
      setSession(updatedSession);
      
      console.log('✅ 【新强化版】大纲修复完成');
      alert('✅ 大纲修复完成！使用了新的强化重组算法。请查看控制台日志了解详细过程。');
    } catch (error) {
      console.error('❌ 修复大纲失败:', error);
      alert('修复大纲失败，请稍后重试。');
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
    console.log('📝 handleBookmarkMessage 被调用，messageId:', messageId, 'type:', type);
    
    if (!session || !apiConfig) {
      console.log('❌ session 或 apiConfig 缺失');
      return;
    }

    const message = session.messages.find(m => m.id === messageId);
    if (!message || message.role !== 'assistant') {
      console.log('❌ 消息不存在或不是AI消息');
      return;
    }

    // 检查消息是否已经被收藏
    if (message.isBookmarked) {
      console.log('⚠️ 消息已经被收藏，跳过');
      return;
    }

    // 先标记消息为已收藏，防止重复点击
    const tempUpdatedMessages = session.messages.map(m =>
      m.id === messageId ? { ...m, isBookmarked: true } : m
    );
    setSession(prev => prev ? { ...prev, messages: tempUpdatedMessages } : null);

    let cardTitle = '';
    let cardContent = '';

    try {
      // 尝试使用AI提纯内容和生成标题
      const contentResponse = await purifyCardContent(apiConfig, message.content, userNote);
      const purifiedContent = contentResponse.success ? contentResponse.data : message.content;

      console.log('原始对话内容:', message.content);
      console.log('提纯后内容:', purifiedContent);

      // 基于提纯后的内容生成标题
      const titleResponse = await summarizeCardTitle(apiConfig, purifiedContent);
      cardTitle = titleResponse.success ? titleResponse.data : purifiedContent.substring(0, 12);
      cardContent = purifiedContent;

    } catch (error) {
      console.error('AI处理失败，使用备用方案:', error);
      
      // AI调用失败时的备用方案
      cardTitle = message.content.substring(0, 12);
      
      // 简单的文本清理作为备用
      cardContent = message.content
        .replace(/[😊😄😆🤔💡👍📚✨🎯🚀🔧🎨]/g, '') // 移除表情符号
        .replace(/你好[！!]*\s*/g, '')
        .replace(/我们[来去]?[学习讲解分析探讨]*\s*/g, '')
        .replace(/你觉得.*?[？?]/g, '')
        .replace(/明白了吗[？?]/g, '')
        .trim();
    }

    // 无论AI是否成功，都只创建一张卡片
    const card: LearningCard = {
      id: generateCardId(),
      title: cardTitle,
      content: cardContent + (userNote ? `\n\n学习感受：${userNote}` : ''),
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

    try {
      // 保存卡片
      const success = addLearningCard(session.id, card);
      if (success) {
        // 更新消息的收藏状态，添加卡片ID
        const updatedMessages = session.messages.map(m =>
          m.id === messageId 
            ? { ...m, isBookmarked: true, cardId: card.id }
            : m
        );
        
        setSession(prev => prev ? { ...prev, messages: updatedMessages } : null);
        updateSessionMessages(session.id, updatedMessages);
        
        // 刷新卡片管理器 - 双重确保
        setCardManagerKey(prev => prev + 1);
        handleCardsUpdate();
        
        console.log('✅ 卡片创建成功:', card.id);
      } else {
        throw new Error('保存卡片失败');
      }
    } catch (saveError) {
      console.error('保存卡片失败:', saveError);
      
      // 保存失败时，恢复消息的收藏状态
      const revertedMessages = session.messages.map(m =>
        m.id === messageId ? { ...m, isBookmarked: false } : m
      );
      setSession(prev => prev ? { ...prev, messages: revertedMessages } : null);
      
      // 可以在这里添加用户提示
      alert('收藏失败，请重试');
    }
  };

  /**
   * 返回仪表板页面
   */
  const handleGoBack = () => {
    router.push('/dashboard');
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
    // 强制重新挂载CardManager组件以确保显示最新数据
    setCardManagerKey(prev => prev + 1);
    console.log('🔄 卡片更新事件触发，强制刷新CardManager');
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
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col">
        {/* 顶部导航栏 */}
        <header className="bg-[var(--surface-primary)] border-b border-[var(--border-secondary)] flex-shrink-0">
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
          {/* 左侧大纲面板 - 缩减10%宽度 */}
          <div className="w-[22%] min-w-[220px] max-w-[360px] h-full bg-[var(--surface-primary)] border-r border-[var(--border-secondary)] flex flex-col">
            {/* 大纲头部 - 根据模式调整 */}
            <div className={`${isBeginner ? 'p-4' : 'p-3'} border-b border-[var(--border-secondary)] flex-shrink-0`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[var(--color-primary-600)]" />
                  <h2 className={`${isBeginner ? 'text-base' : 'text-sm'} font-semibold text-[var(--text-primary)]`}>
                    学习大纲
                  </h2>
                </div>
                
                {/* 进度显示 - 统一显示详细信息 */}
                {(() => {
                  const stats = getCompletionStats();
                  const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <div className="text-xs text-gray-500">
                      {stats.completed}/{stats.total} ({percentage}%)
                    </div>
                  );
                })()}
              </div>
              
              {/* 进度条 - 两种模式都显示 */}
              {(() => {
                const stats = getCompletionStats();
                const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                return (
                  <div className="w-full bg-gray-200 rounded-full h-1 mb-2">
                    <div
                      className="bg-green-500 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                );
              })()}
              
              {/* 当前章节提示 - 仅小白模式显示 */}
              {isBeginner && session.currentChapter && (
                <p className="text-xs text-primary-600 truncate">
                  当前：{session.outline.find(item => item.id === session.currentChapter)?.title}
                </p>
              )}
            </div>

            {/* 大纲内容 */}
            <div className="flex-1 overflow-y-auto">
              <ThemedOutlineSidebar
                outline={session.outline.map(item => ({
                  id: item.id,
                  title: item.title,
                  estimatedMinutes: item.estimatedMinutes,
                  completed: item.isCompleted,
                  type: item.type // 添加类型信息以便正确判断章节
                }))}
                currentChapter={session.currentChapter}
                onChapterSelect={handleChapterClick}
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
            
            {/* 修复功能 - 移至底部，紧凑设计 */}
            <div className="flex-shrink-0 p-2 border-t border-gray-200 bg-gray-50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFixOutline}
                className="w-full text-xs py-1"
              >
                🔧 修复大纲
              </Button>
            </div>
          </div>

          {/* 中间聊天界面 */}
          <div className="flex-1 h-full flex flex-col bg-[var(--surface-primary)] overflow-hidden">
            {/* 聊天头部 */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--border-secondary)]">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 bg-gradient-to-br flex items-center justify-center
                  ${session.learningLevel === 'beginner' 
                    ? 'from-[var(--color-primary-500)] to-[var(--color-primary-600)] rounded-full' 
                    : 'from-[var(--color-secondary-500)] to-[var(--color-secondary-600)] rounded-lg'
                  }
                `}>
                  {session.learningLevel === 'beginner' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Zap className="w-5 h-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    AI私教助手
                    <span className={`
                      ml-2 px-2 py-1 text-xs font-medium rounded-full
                      ${session.learningLevel === 'beginner' 
                        ? 'bg-[var(--color-primary-100)] text-[var(--color-primary-700)]' 
                        : 'bg-[var(--color-secondary-100)] text-[var(--color-secondary-700)]'
                      }
                    `}>
                      {session.learningLevel === 'beginner' ? '小白模式' : '高手模式'}
                    </span>
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {session.learningLevel === 'beginner' 
                      ? '🌱 耐心引导模式，循序渐进，用心陪伴每一步' 
                      : '⚡ 高效学习模式，直击重点，快速掌握核心'
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
                learningLevel={session.learningLevel}
              />
            </div>
          </div>

          {/* 右侧卡片管理面板 - 适中宽度，提升可读性 */}
          <div className="w-[20%] min-w-[280px] max-w-[360px] h-full">
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

const LearnPage: React.FC = () => {
  const router = useRouter();
  const { sessionId } = router.query;
  const [learningLevel, setLearningLevel] = React.useState<'beginner' | 'expert'>('beginner');
  
  React.useEffect(() => {
    if (!sessionId || typeof sessionId !== 'string') return;
    
    // 从会话数据中读取学习级别
    try {
      const session = getSessionById(sessionId);
      console.log('🎨 当前会话的学习级别:', session?.learningLevel);
      if (session && session.learningLevel) {
        console.log('🎨 设置学习级别为:', session.learningLevel);
        setLearningLevel(session.learningLevel);
        // 同步到localStorage
        localStorage.setItem('ai-tutor-ui-theme', session.learningLevel);
        localStorage.setItem('selectedLearningMode', session.learningLevel);
      } else {
        // 如果会话中没有学习级别，从localStorage读取
        const storedMode = localStorage.getItem('selectedLearningMode');
        const storedTheme = localStorage.getItem('ai-tutor-ui-theme');
        const level = storedMode || storedTheme;
        console.log('🎨 从localStorage读取的级别:', level);
        if (level === 'beginner' || level === 'expert') {
          setLearningLevel(level);
        }
      }
    } catch (error) {
      console.error('读取学习级别失败:', error);
    }
  }, [sessionId]);

  return (
    <ThemeProvider initialLevel={learningLevel}>
      <LearnPageContent />
    </ThemeProvider>
  );
};

export default LearnPage;