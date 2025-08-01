/**
 * 聊天界面组件
 * 
 * 提供与AI私教的对话界面：
 * - 消息列表显示
 * - 输入框和发送功能
 * - 打字机效果
 * - 消息状态指示
 * - 自动滚动
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Lightbulb, Star } from 'lucide-react';
import { marked } from 'marked';
import Button from './ui/Button';
import { ChatMessage, LearningLevel } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface ChatInterfaceProps {
  /** 对话消息列表 */
  messages: ChatMessage[];
  /** 发送消息回调 */
  onSendMessage: (content: string) => void;
  /** 收藏消息为卡片回调 */
  onBookmarkMessage?: (messageId: string, type: 'inspiration' | 'bookmark', userNote?: string) => void;
  /** 是否正在加载中 */
  loading?: boolean;
  /** 输入框占位符文本 */
  placeholder?: string;
  /** 是否禁用输入 */
  disabled?: boolean;
  /** 学习模式（用于UI差异化） */
  learningLevel?: LearningLevel;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onBookmarkMessage,
  loading = false,
  placeholder = '输入您的问题...',
  disabled = false,
  learningLevel = 'beginner',
}) => {
  // 状态管理
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInspirationModal, setShowInspirationModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [inspirationNote, setInspirationNote] = useState('');

  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 主题相关 - 保持useTheme hook以确保主题上下文正常工作
  useTheme();

  /**
   * 根据消息内容长度获取合适的最大宽度
   * 优化短消息显示，避免过多空白
   */
  const getMessageMaxWidth = (content: string): string => {
    const length = content.length;
    
    // 对于非常短的消息，使用固定宽度而不是百分比，避免空白过多
    if (length <= 10) return 'min-w-[120px] max-w-[200px]';  // 极短消息：固定合理宽度
    if (length <= 20) return 'min-w-[150px] max-w-[300px]';  // 短消息：适中固定宽度 
    if (length <= 50) return 'max-w-[50%]';                  // 中等消息：使用百分比
    if (length <= 100) return 'max-w-[65%]';                 // 较长消息
    return 'max-w-[80%]';                                    // 长消息
  };

  /**
   * 获取消息容器样式（根据学习模式差异化）
   */
  const getMessageContainerStyle = (isUser: boolean, content: string) => {
    const maxWidth = getMessageMaxWidth(content);
    // 优化样式：确保内容能够自适应，减少不必要的空白
    const baseStyle = `${maxWidth} px-4 py-3 shadow-sm transition-all duration-200 break-words overflow-hidden inline-block`;
    
    if (learningLevel === 'beginner') {
      // 小白模式：圆润友好的设计
      if (isUser) {
        return `${baseStyle} bg-[var(--color-primary-600)] text-white rounded-t-2xl rounded-bl-2xl rounded-br-lg`;
      } else {
        return `${baseStyle} bg-[var(--surface-primary)] border border-[var(--border-secondary)] rounded-t-2xl rounded-br-2xl rounded-bl-lg`;
      }
    } else {
      // 高手模式：专业锐利的设计
      if (isUser) {
        return `${baseStyle} bg-[var(--color-primary-600)] text-white rounded-lg`;
      } else {
        return `${baseStyle} bg-[var(--surface-primary)] border border-[var(--border-secondary)] rounded-lg`;
      }
    }
  };

  /**
   * 获取头像样式（根据学习模式差异化）
   */
  const getAvatarStyle = (isUser: boolean) => {
    const baseStyle = 'w-8 h-8 flex items-center justify-center text-white flex-shrink-0';
    
    if (learningLevel === 'beginner') {
      // 小白模式：圆润设计
      if (isUser) {
        return `${baseStyle} rounded-full bg-[var(--color-primary-600)]`;
      } else {
        return `${baseStyle} rounded-full bg-[var(--color-secondary-600)]`;
      }
    } else {
      // 高手模式：更加锐利的设计
      if (isUser) {
        return `${baseStyle} rounded-lg bg-[var(--color-primary-600)]`;
      } else {
        return `${baseStyle} rounded-lg bg-[var(--color-secondary-600)]`;
      }
    }
  };

  /**
   * 获取输入框样式（根据学习模式差异化）
   */
  const getInputContainerStyle = () => {
    const baseStyle = 'border-2 bg-[var(--surface-primary)] transition-all duration-200 focus-within:border-[var(--border-focus)]';
    
    if (learningLevel === 'beginner') {
      // 小白模式：圆润的输入框
      return `${baseStyle} rounded-2xl border-[var(--border-primary)]`;
    } else {
      // 高手模式：锐利的输入框
      return `${baseStyle} rounded-lg border-[var(--border-primary)]`;
    }
  };

  /**
   * 获取发送按钮样式（根据学习模式差异化）
   */
  const getSendButtonStyle = () => {
    const baseStyle = 'bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white transition-all duration-200 flex items-center justify-center';
    
    if (learningLevel === 'beginner') {
      // 小白模式：圆形按钮
      return `${baseStyle} w-10 h-10 rounded-full`;
    } else {
      // 高手模式：方形按钮
      return `${baseStyle} w-10 h-10 rounded-lg`;
    }
  };

  /**
   * 配置marked选项
   */
  useEffect(() => {
    marked.setOptions({
      breaks: true, // 支持换行
      gfm: true, // 支持GitHub风格的Markdown
    });
  }, []);

  /**
   * 自动滚动到底部
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  /**
   * 当消息更新时自动滚动
   */
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * 当开始加载时显示打字效果
   */
  useEffect(() => {
    if (loading) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [loading]);

  /**
   * 处理发送消息
   */
  const handleSendMessage = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue || loading || disabled) return;

    onSendMessage(trimmedValue);
    setInputValue('');
    
    // 重新聚焦输入框
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  /**
   * 自动调整输入框高度
   */
  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  /**
   * 处理输入变化
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight(e.target);
  };

  /**
   * 格式化时间戳
   */
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * 渲染Markdown内容
   */
  const renderMarkdown = (content: string): string => {
    try {
      let result = marked(content);
      if (typeof result === 'string') {
        // 清理Markdown渲染产生的多余空白
        result = result
          .replace(/<p>\s*<\/p>/g, '')           // 移除空的p标签
          .replace(/>\s+</g, '><')               // 移除标签之间的空白
          .replace(/\n\s*\n\s*\n/g, '\n\n')     // 限制连续空行
          .replace(/^\s+|\s+$/g, '');           // 移除首尾空白
        return result;
      }
      return content;
    } catch (error) {
      console.error('Markdown渲染失败:', error);
      return content;
    }
  };

  /**
   * 处理灵感收藏
   */
  const handleInspirationClick = (messageId: string) => {
    setSelectedMessageId(messageId);
    setInspirationNote('');
    setShowInspirationModal(true);
  };

  /**
   * 处理直接收藏
   */
  const handleBookmarkClick = (messageId: string) => {
    if (onBookmarkMessage) {
      onBookmarkMessage(messageId, 'bookmark');
    }
  };

  /**
   * 保存灵感笔记
   */
  const handleSaveInspiration = () => {
    if (selectedMessageId && onBookmarkMessage && inspirationNote.trim()) {
      onBookmarkMessage(selectedMessageId, 'inspiration', inspirationNote.trim());
      setShowInspirationModal(false);
      setSelectedMessageId(null);
      setInspirationNote('');
    }
  };

  /**
   * 检测AI消息是否需要显示选择按钮
   */
  const shouldShowChoiceButtons = (content: string) => {
    const choicePatterns = [
      // 开头确认类
      /准备好了吗[？?]/,
      /可以开始了吗[？?]/,
      /准备好开始学习了吗[？?]/,
      /准备好了解这个内容了吗[？?]/,
      
      // 小节结尾确认类
      /可以开始下一节了吗[？?]/,
      /可以进入下一节了吗[？?]/,
      /要继续学习下一节吗[？?]/,
      /准备好学习下一节了吗[？?]/,
      /可以开始下一个小节了吗[？?]/,
      /要开始下一个内容了吗[？?]/,
      
      // 内容确认类
      /你觉得.*如何[？?]/,
      /您觉得.*如何[？?]/,
      /有没有.*问题[？?]/,
      /有什么.*问题[？?]/,
      /需要.*补充.*吗[？?]/,
      /有.*需要.*修改.*吗[？?]/,
      /还有.*疑问吗[？?]/,
      /明白了吗[？?]/,
      /清楚了吗[？?]/,
      /理解了吗[？?]/,
      
      // 通用确认类
      /您有兴趣吗[？?]/,
      /您想.*吗[？?]/,
      /你想.*吗[？?]/,
      /您准备好.*了吗[？?]/,
      /你准备好.*了吗[？?]/
    ];

    console.log('检测选择按钮:', content, choicePatterns.some(pattern => pattern.test(content)));
    return choicePatterns.some(pattern => pattern.test(content));
  };

  /**
   * 获取选择按钮的文本
   */
  const getChoiceButtonTexts = (content: string) => {
    // 如果是开头准备确认
    if (/准备好了吗[？?]/.test(content) || /可以开始了吗[？?]/.test(content)) {
      return ['准备好了，开始吧！', '等一下'];
    }
    
    // 如果是下一节确认
    if (/可以开始下一节了吗[？?]/.test(content) || /可以进入下一节了吗[？?]/.test(content)) {
      return ['开始下一节', '再复习一下'];
    }
    
    // 如果是兴趣确认（反思与探索模块）
    if (/您有兴趣吗[？?]/.test(content)) {
      return ['有兴趣，开始吧', '直接进入下一节'];
    }
    
    // 如果是内容理解确认
    if (/你觉得.*如何[？?]/.test(content) || /您觉得.*如何[？?]/.test(content)) {
      return ['很好，继续', '有疑问'];
    }
    
    // 如果是问题确认
    if (/有没有.*问题[？?]/.test(content) || /有什么.*问题[？?]/.test(content)) {
      return ['没有问题', '有问题'];
    }
    
    // 如果是补充确认
    if (/需要.*补充.*吗[？?]/.test(content) || /有.*需要.*修改.*吗[？?]/.test(content)) {
      return ['不需要', '需要补充'];
    }
    
    // 如果是理解确认
    if (/明白了吗[？?]/.test(content) || /清楚了吗[？?]/.test(content) || /理解了吗[？?]/.test(content)) {
      return ['明白了', '还有疑问'];
    }
    
    // 通用确认
    return ['是的', '不，等一下'];
  };

  /**
   * 处理选择按钮点击
   */
  const handleChoiceClick = (choice: string) => {
    onSendMessage(choice);
  };

  /**
   * 渲染消息内容
   */
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'assistant';
    const showChoiceButtons = isAssistant && shouldShowChoiceButtons(message.content);

    return (
      <div
        key={message.id}
        className={`flex items-start gap-3 p-4 ${
          isUser ? 'flex-row-reverse' : ''
        } ${isSystem ? 'justify-center' : ''}`}
      >
        {!isSystem && (
          <div className={getAvatarStyle(isUser)}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        )}

        <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : 'flex justify-start'} ${isSystem ? 'text-center' : ''} ${isAssistant ? 'pr-16' : ''}`}>
          <div className={
            isSystem 
              ? 'inline-block bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-lg px-3 py-2 text-sm'
              : `${getMessageContainerStyle(isUser, message.content)} text-sm leading-relaxed ${isAssistant ? 'relative group' : ''}`
          }>
            
            {/* 消息内容 */}
            {isUser || isSystem ? (
              <div className="chat-content">
                {message.content}
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none chat-content [&>*]:break-words [&>*]:overflow-wrap-anywhere"
                dangerouslySetInnerHTML={{ 
                  __html: renderMarkdown(message.content) 
                }}
              />
            )}
            

            {/* 时间戳 */}
            {!isSystem && (
              <div className={`
                text-xs mt-2 opacity-70
                ${isUser ? 'text-primary-100' : 'text-gray-500'}
              `}>
                {formatTimestamp(message.timestamp)}
              </div>
            )}

            {/* AI消息的收藏按钮 */}
            {isAssistant && !message.isBookmarked && (
              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button
                  onClick={() => handleInspirationClick(message.id)}
                  className="w-7 h-7 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors duration-200"
                  title="有灵感，添加笔记"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleBookmarkClick(message.id)}
                  className="w-7 h-7 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors duration-200"
                  title="直接收藏"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 已收藏标识 */}
            {message.isBookmarked && (
              <div className="absolute right-2 top-2">
                <Star className="w-5 h-5 text-yellow-500 fill-current drop-shadow-sm" />
              </div>
            )}
          </div>

          {/* AI消息的选择按钮 */}
          {showChoiceButtons && (
            <div className="mt-3 flex flex-wrap gap-2">
              {getChoiceButtonTexts(message.content).map((choice, index) => (
                <button
                  key={index}
                  onClick={() => handleChoiceClick(choice)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                    ${index === 0 
                      ? 'bg-primary-600 hover:bg-primary-700 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
                    }
                  `}
                >
                  {choice}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        <div className="min-h-full pb-4">
          {/* 欢迎消息 */}
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-secondary-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  AI私教已就绪
                </h3>
                <p className="text-gray-600 text-sm">
                  我将根据您上传的文档内容，为您提供个性化的学习引导。请随时提问！
                </p>
              </div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map(renderMessage)}

          {/* AI打字指示器 */}
          {isTyping && (
            <div className="flex items-start gap-3 p-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="inline-block bg-gray-100 rounded-lg rounded-bl-sm p-3">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">AI私教正在思考</span>
                    <div className="flex gap-1 ml-2">
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 滚动锚点 */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入区域 */}
      <div className="border-t border-gray-200 p-4 flex-shrink-0">
        <div className={`flex items-end gap-3 ${getInputContainerStyle()} p-2`}>
          {/* 输入框 */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || loading}
              rows={1}
              className="
                w-full px-3 py-2 bg-transparent border-none resize-none
                focus:outline-none
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                text-sm leading-relaxed transition-colors duration-200 text-[var(--text-primary)]
                placeholder-[var(--text-tertiary)]
              "
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading || disabled}
            className={`
              ${getSendButtonStyle()}
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* 提示文本 */}
        <div className="mt-2 text-xs text-gray-500">
          按 Enter 发送，Shift + Enter 换行
        </div>
      </div>
    </div>

    {/* 灵感笔记模态框 */}
    {showInspirationModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            记录您的灵感
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              您的感受和想法：
            </label>
            <textarea
              value={inspirationNote}
              onChange={(e) => setInspirationNote(e.target.value)}
              placeholder="记录下这段内容给您的启发、想法或感受..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <div className="mt-1 text-xs text-gray-500">
              {inspirationNote.length}/500 字符
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowInspirationModal(false);
                setSelectedMessageId(null);
                setInspirationNote('');
              }}
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveInspiration}
              disabled={!inspirationNote.trim()}
              icon={<Lightbulb className="w-4 h-4" />}
            >
              保存灵感
            </Button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default ChatInterface;