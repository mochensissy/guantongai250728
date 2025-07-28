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
import { ChatMessage } from '../types';

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
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onBookmarkMessage,
  loading = false,
  placeholder = '输入您的问题...',
  disabled = false,
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
      const result = marked(content);
      return typeof result === 'string' ? result : content;
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
      
      // 通用确认类
      /您有兴趣吗[？?]/,
      /您想.*吗[？?]/,
      /你想.*吗[？?]/,
      /您准备好.*了吗[？?]/,
      /你准备好.*了吗[？?]/
    ];

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
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            ${isUser 
              ? 'bg-primary-600 text-white' 
              : 'bg-secondary-100 text-secondary-700'
            }
          `}>
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
        )}

        <div className={`flex-1 ${isUser ? 'text-right' : ''} ${isSystem ? 'text-center' : ''}`}>
          <div className={`
            inline-block max-w-[80%] p-3 rounded-lg text-sm leading-relaxed
            ${isAssistant ? 'relative group' : ''}
            ${isUser 
              ? 'bg-primary-600 text-white rounded-br-sm' 
              : isSystem
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
            }
          `}>
            
            {/* 消息内容 */}
            {isUser || isSystem ? (
              <div className="whitespace-pre-wrap break-words">
                {message.content}
              </div>
            ) : (
              <div 
                className="prose prose-sm max-w-none break-words"
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
              <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
                <button
                  onClick={() => handleInspirationClick(message.id)}
                  className="w-6 h-6 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors duration-200"
                  title="有灵感，添加笔记"
                >
                  <Lightbulb className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleBookmarkClick(message.id)}
                  className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm transition-colors duration-200"
                  title="直接收藏"
                >
                  <Star className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* 已收藏标识 */}
            {message.isBookmarked && (
              <div className="absolute -right-1 top-1">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
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
        <div className="flex items-end gap-3">
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
                w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                text-sm leading-relaxed transition-colors duration-200
              "
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* 发送按钮 */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || loading || disabled}
            loading={loading}
            icon={loading ? <Loader2 className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            className="flex-shrink-0"
          >
            发送
          </Button>
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