/**
 * 主题化聊天消息组件
 * 
 * 根据学习模式（小白/高手）呈现不同的视觉效果：
 * - 小白模式：温和圆润，友好的AI头像，宽松间距
 * - 高手模式：简洁专业，紧凑布局，高效设计
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface ThemedChatMessageProps {
  /** 消息角色 */
  role: 'user' | 'assistant';
  /** 消息内容 */
  content: string;
  /** 时间戳（可选） */
  timestamp?: string;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否为HTML内容 */
  isHTML?: boolean;
}

/**
 * 主题化聊天消息组件
 */
export const ThemedChatMessage: React.FC<ThemedChatMessageProps> = ({
  role,
  content,
  timestamp,
  showAvatar = true,
  className = '',
  isHTML = false,
}) => {
  const { currentLevel, currentTheme } = useTheme();
  
  const isUser = role === 'user';
  const isExpertMode = currentLevel === 'expert';
  
  /**
   * 获取消息最大宽度（根据内容长度智能调整）
   */
  const getMessageMaxWidth = (content: string): string => {
    const length = content.length;
    
    // 统一使用宽松的布局，提升可读性
    if (length <= 10) return 'min-w-[120px] max-w-[200px]';
    if (length <= 20) return 'min-w-[150px] max-w-[300px]';
    if (length <= 50) return 'max-w-[50%]';
    if (length <= 100) return 'max-w-[65%]';
    return 'max-w-[80%]';
  };
  
  /**
   * 获取头像组件
   */
  const renderAvatar = () => {
    if (!showAvatar) return null;
    
    const avatarSize = isExpertMode ? 'w-7 h-7' : 'w-8 h-8';
    const avatarBg = isUser 
      ? 'bg-[var(--surface-message-user)]' 
      : 'bg-[var(--color-secondary-100)]';
    
    return (
      <div 
        className={`
          ${avatarSize} rounded-full flex items-center justify-center flex-shrink-0
          ${avatarBg}
          transition-all duration-[var(--transition-normal)]
        `}
        style={{
          borderRadius: isExpertMode ? currentTheme.borderRadius.md : currentTheme.borderRadius.lg,
        }}
      >
        <span className="text-[var(--text-inverse)] text-sm font-medium">
          {isUser ? (isExpertMode ? 'U' : '👤') : (isExpertMode ? 'AI' : '🤖')}
        </span>
      </div>
    );
  };
  
  /**
   * 获取AI消息的友好标识（仅小白模式）
   */
  const renderAILabel = () => {
    if (isUser || isExpertMode) return null;
    
    return (
      <div className="flex items-center mb-2 text-sm opacity-75">
        <span className="text-[var(--color-secondary-600)] font-medium">
          AI助教
        </span>
      </div>
    );
  };
  
  /**
   * 获取时间戳组件
   */
  const renderTimestamp = () => {
    if (!timestamp) return null;
    
    return (
      <div 
        className={`
          text-xs mt-2 opacity-60
          ${isExpertMode ? 'text-[var(--text-muted)]' : 'text-[var(--text-tertiary)]'}
        `}
        style={{
          color: isUser ? 'var(--text-inverse)' : undefined,
          fontSize: isExpertMode ? currentTheme.typography.fontSize.xs : currentTheme.typography.fontSize.sm,
        }}
      >
        {timestamp}
      </div>
    );
  };
  
  const maxWidth = getMessageMaxWidth(content);
  
  return (
    <div 
      className={`
        flex items-start gap-3 mb-[var(--spacing-message)] group
        ${isUser ? 'flex-row-reverse' : 'flex-row'}
        ${className}
      `}
      style={{
        marginBottom: currentTheme.spacing.message,
      }}
    >
      {/* 头像 */}
      {renderAvatar()}
      
      {/* 消息内容容器 */}
      <div className={`${maxWidth} ${isUser ? 'items-end' : 'items-start'} flex flex-col relative`}>
        {/* AI标识（仅小白模式） */}
        {renderAILabel()}
        
        {/* 消息气泡 */}
        <div
          className={`
            inline-block break-words overflow-hidden
            transition-all duration-[var(--transition-normal)]
            hover:scale-[var(--effect-scale-hover)]
            active:scale-[var(--effect-scale-active)]
          `}
          style={{
            backgroundColor: isUser 
              ? 'var(--surface-message-user)' 
              : 'var(--surface-message-assistant)',
            color: isUser 
              ? 'var(--text-inverse)' 
              : 'var(--text-primary)',
            borderRadius: currentTheme.borderRadius.message,
            padding: currentTheme.spacing.element,
            fontSize: currentTheme.typography.fontSize.base,
            lineHeight: currentTheme.typography.lineHeight.relaxed, // 统一使用宽松行距，提升可读性
            boxShadow: isUser 
              ? currentTheme.shadows.message 
              : `${currentTheme.shadows.message}, inset 0 0 0 1px var(--border-light)`,
            transition: currentTheme.transitions.normal,
          }}
        >
          {/* 消息内容 */}
          {isHTML ? (
            <div 
              className="prose prose-sm max-w-none chat-content [&>*]:break-words [&>*]:overflow-wrap-anywhere"
              style={{
                fontSize: 'inherit',
                lineHeight: 'inherit',
                color: 'inherit',
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div 
              className="prose prose-sm max-w-none"
              style={{
                fontSize: 'inherit',
                lineHeight: 'inherit',
                color: 'inherit',
              }}
            >
              {content}
            </div>
          )}
          
          {/* 时间戳 */}
          {renderTimestamp()}
        </div>
        
        {/* 专家模式的简洁状态指示器 */}
        {isExpertMode && !isUser && (
          <div className="mt-1 text-xs text-[var(--text-muted)] opacity-50">
            AI
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 主题化消息列表容器
 */
export interface ThemedMessageListProps {
  children: React.ReactNode;
  className?: string;
}

export const ThemedMessageList: React.FC<ThemedMessageListProps> = ({
  children,
  className = '',
}) => {
  const { currentTheme } = useTheme();
  
  return (
    <div
      className={`
        flex flex-col space-y-0 overflow-y-auto
        ${className}
      `}
      style={{
        backgroundColor: 'var(--bg-chat)',
        padding: currentTheme.spacing.container,
        fontSize: currentTheme.typography.fontSize.base,
        lineHeight: currentTheme.typography.lineHeight.normal,
      }}
    >
      {children}
    </div>
  );
};

export default ThemedChatMessage;