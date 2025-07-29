/**
 * 主题切换组件
 * 
 * 提供一个美观的按钮来切换小白模式和高手模式：
 * - 实时显示当前模式
 * - 流畅的切换动画
 * - 模式状态提示
 * - 响应式设计
 */

import React from 'react';
import { User, Zap } from 'lucide-react';
import { useTheme, useThemeToggle } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  /** 是否显示文字标签 */
  showLabel?: boolean;
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 自定义类名 */
  className?: string;
}

/**
 * 主题切换组件
 */
const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  const { currentLevel, getModeName, getModeDescription } = useTheme();
  const { toggle } = useThemeToggle();

  // 尺寸样式映射
  const sizeStyles = {
    sm: {
      container: 'p-2',
      button: 'w-12 h-6',
      slider: 'w-5 h-5',
      icon: 'w-3 h-3',
      text: 'text-sm',
    },
    md: {
      container: 'p-3',
      button: 'w-16 h-8',
      slider: 'w-7 h-7',
      icon: 'w-4 h-4',
      text: 'text-base',
    },
    lg: {
      container: 'p-4',
      button: 'w-20 h-10',
      slider: 'w-9 h-9',
      icon: 'w-5 h-5',
      text: 'text-lg',
    },
  };

  const styles = sizeStyles[size];
  const isBeginner = currentLevel === 'beginner';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* 当前模式标签 */}
      {showLabel && (
        <div className="text-right">
          <div className={`font-medium text-[var(--text-primary)] ${styles.text}`}>
            UI风格：{getModeName()}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">
            界面设计风格
          </div>
        </div>
      )}

      {/* 切换按钮 */}
      <button
        onClick={toggle}
        className={`
          relative inline-flex items-center ${styles.button} 
          bg-[var(--bg-secondary)] border-2 border-[var(--border-primary)]
          rounded-full transition-all duration-300 ease-in-out
          hover:border-[var(--border-focus)] focus:outline-none focus:ring-2 
          focus:ring-[var(--border-focus)] focus:ring-offset-2
          ${styles.container}
        `}
        title={`切换到${isBeginner ? '专业' : '友好'}风格界面`}
        aria-label={`当前：${getModeName()}风格界面，点击切换到${isBeginner ? '专业' : '友好'}风格`}
      >
        {/* 滑动背景 */}
        <div
          className={`
            absolute inset-0 rounded-full transition-all duration-300 ease-in-out
            ${isBeginner 
              ? 'bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)]' 
              : 'bg-gradient-to-r from-[var(--color-secondary-500)] to-[var(--color-secondary-600)]'
            }
          `}
        />

        {/* 滑动圆点 */}
        <div
          className={`
            relative ${styles.slider} bg-white rounded-full shadow-lg
            flex items-center justify-center transition-all duration-300 ease-in-out
            transform ${isBeginner ? 'translate-x-0' : 
              size === 'sm' ? 'translate-x-6' : 
              size === 'md' ? 'translate-x-8' : 
              'translate-x-10'
            }
          `}
        >
          {/* 图标 */}
          {isBeginner ? (
            <User className={`${styles.icon} text-[var(--color-primary-600)]`} />
          ) : (
            <Zap className={`${styles.icon} text-[var(--color-secondary-600)]`} />
          )}
        </div>

        {/* 左侧图标（小白模式） */}
        <div className="absolute left-1 top-1/2 transform -translate-y-1/2">
          <User 
            className={`
              ${styles.icon} transition-all duration-300
              ${isBeginner ? 'text-white' : 'text-[var(--text-tertiary)]'}
            `} 
          />
        </div>

        {/* 右侧图标（高手模式） */}
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
          <Zap 
            className={`
              ${styles.icon} transition-all duration-300
              ${!isBeginner ? 'text-white' : 'text-[var(--text-tertiary)]'}
            `} 
          />
        </div>
      </button>

      {/* 模式提示 */}
      {!showLabel && (
        <div className="text-xs text-[var(--text-tertiary)]">
          {getModeName()}
        </div>
      )}
    </div>
  );
};

export default ThemeToggle; 