/**
 * 主题化聊天输入组件
 * 
 * 根据学习模式提供不同的交互体验：
 * - 小白模式：友好的提示文字，温和的视觉反馈
 * - 高手模式：简洁的界面，快速的操作反馈
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface ThemedChatInputProps {
  /** 输入值 */
  value: string;
  /** 输入变化回调 */
  onChange: (value: string) => void;
  /** 发送消息回调 */
  onSend: () => void;
  /** 是否正在加载 */
  loading?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 占位符文本（可选，将根据模式自动设置） */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 主题化聊天输入组件
 */
export const ThemedChatInput: React.FC<ThemedChatInputProps> = ({
  value,
  onChange,
  onSend,
  loading = false,
  disabled = false,
  placeholder,
  className = '',
}) => {
  const { currentLevel, currentTheme } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const isExpertMode = currentLevel === 'expert';
  
  // 根据模式设置默认占位符
  const defaultPlaceholder = isExpertMode
    ? '输入消息...'
    : '请输入您的问题，我会耐心为您解答...';
  
  const finalPlaceholder = placeholder || defaultPlaceholder;
  
  /**
   * 自动调整文本域高度
   */
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // 重置高度以获得正确的scrollHeight
    textarea.style.height = 'auto';
    
    // 设置最小和最大行数
    const minRows = isExpertMode ? 1 : 2;
    const maxRows = isExpertMode ? 4 : 6;
    const lineHeight = parseInt(currentTheme.typography.lineHeight.normal) * parseInt(currentTheme.typography.fontSize.base);
    
    const minHeight = minRows * lineHeight + 16; // 16px for padding
    const maxHeight = maxRows * lineHeight + 16;
    
    const scrollHeight = Math.max(minHeight, Math.min(maxHeight, textarea.scrollHeight));
    textarea.style.height = `${scrollHeight}px`;
  }, [value, currentTheme, isExpertMode]);
  
  /**
   * 处理键盘事件
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      // 统一逻辑：Enter直接发送，Shift+Enter换行
      if (!e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    }
  };
  
  /**
   * 处理发送
   */
  const handleSend = () => {
    if (value.trim() && !loading && !disabled) {
      onSend();
    }
  };
  
  /**
   * 获取发送按钮图标
   */
  const getSendIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin w-5 h-5">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
              <animateTransform attributeName="transform" type="rotate" dur="1s" repeatCount="indefinite" values="0 12 12;360 12 12"/>
            </circle>
          </svg>
        </div>
      );
    }
    
    return (
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
        />
      </svg>
    );
  };
  
  /**
   * 获取提示文字
   */
  const renderHint = () => {
    if (isExpertMode) return null;
    
    return (
      <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mt-2">
        <span>💡 Enter 发送消息，Shift + Enter 换行</span>
        {value.length > 0 && (
          <span className="opacity-75">
            {value.length} 字符
          </span>
        )}
      </div>
    );
  };
  
  const canSend = value.trim() && !loading && !disabled;
  
  return (
    <div 
      className={`
        bg-[var(--surface-primary)] border-t border-[var(--border-secondary)]
        transition-all duration-[var(--transition-normal)]
        ${className}
      `}
      style={{
        padding: currentTheme.spacing.container,
        borderTopWidth: '1px',
        borderTopColor: 'var(--border-secondary)',
      }}
    >
      {/* 主输入区域 */}
      <div className="flex items-end gap-3">
        {/* 文本输入区域 */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={finalPlaceholder}
            disabled={disabled}
            className={`
              w-full resize-none overflow-hidden
              border transition-all duration-[var(--transition-normal)]
              focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent
              placeholder-[var(--text-tertiary)]
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            style={{
              backgroundColor: 'var(--surface-primary)',
              borderColor: isFocused ? 'var(--border-focus)' : 'var(--border-primary)',
              borderRadius: currentTheme.borderRadius.lg,
              padding: currentTheme.spacing.element,
              fontSize: currentTheme.typography.fontSize.base,
              lineHeight: currentTheme.typography.lineHeight.normal,
              color: 'var(--text-primary)',
              minHeight: isExpertMode ? '40px' : '48px',
            }}
          />
          
          {/* 聚焦状态的装饰（仅小白模式） */}
          {!isExpertMode && isFocused && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: currentTheme.borderRadius.lg,
                boxShadow: `0 0 0 3px ${currentTheme.primary[100]}40`,
                transition: currentTheme.transitions.normal,
              }}
            />
          )}
        </div>
        
        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`
            flex items-center justify-center flex-shrink-0
            transition-all duration-[var(--transition-normal)]
            focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2
            hover:scale-[var(--effect-scale-hover)]
            active:scale-[var(--effect-scale-active)]
            ${!canSend ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
          `}
          style={{
            backgroundColor: canSend ? 'var(--surface-message-user)' : 'var(--border-primary)',
            color: canSend ? 'var(--text-inverse)' : 'var(--text-muted)',
            borderRadius: currentTheme.borderRadius.lg,
            width: isExpertMode ? '40px' : '48px',
            height: isExpertMode ? '40px' : '48px',
            transition: currentTheme.transitions.normal,
          }}
        >
          {getSendIcon()}
        </button>
      </div>
      
      {/* 提示信息 */}
      {renderHint()}
      
      {/* 高手模式的快捷键提示 */}
      {isExpertMode && (
        <div className="flex justify-end mt-1">
          <span className="text-xs text-[var(--text-muted)] opacity-60">
            Enter 发送，Shift + Enter 换行
          </span>
        </div>
      )}
    </div>
  );
};

export default ThemedChatInput;