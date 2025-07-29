/**
 * 学习模式选择组件
 * 
 * 提供小白模式和高手模式的选择界面：
 * - 使用主题系统实现视觉差异化
 * - 动态样式切换
 * - 模式描述和特点展示
 * - 可点击切换和键盘导航
 */

import React from 'react';
import { User, Zap } from 'lucide-react';
import { LearningLevel } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface LearningModeSelectorProps {
  /** 当前选择的学习水平 */
  value: LearningLevel;
  /** 学习水平变化回调 */
  onChange: (level: LearningLevel) => void;
  /** 自定义容器类名 */
  className?: string;
}

/**
 * 学习模式选择组件
 */
const LearningModeSelector: React.FC<LearningModeSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const { currentLevel } = useTheme();

  /**
   * 获取卡片样式
   * 根据选中状态和当前主题返回对应样式
   */
  const getCardStyle = (mode: LearningLevel, isSelected: boolean) => {
    const baseStyle = 'p-6 cursor-pointer transition-all duration-300 border-2';
    
    // 根据当前全局主题决定圆角
    const roundedStyle = currentLevel === 'beginner' ? 'rounded-xl' : 'rounded-lg';
    
    if (isSelected) {
      if (mode === 'beginner') {
        // 小白模式选中状态 - 使用绿色系
        return `${baseStyle} ${roundedStyle} border-[var(--color-primary-600)] bg-[var(--color-primary-50)] shadow-lg transform scale-105`;
      } else {
        // 高手模式选中状态 - 使用紫色系  
        return `${baseStyle} ${roundedStyle} border-[var(--color-secondary-600)] bg-[var(--color-secondary-50)] shadow-lg transform scale-105`;
      }
    } else {
      // 未选中状态
      const hoverEffect = currentLevel === 'beginner' 
        ? 'hover:border-[var(--border-focus)] hover:shadow-md hover:scale-102' 
        : 'hover:border-[var(--border-focus)] hover:shadow-sm hover:scale-101';
      
      return `${baseStyle} ${roundedStyle} border-[var(--border-primary)] bg-[var(--surface-primary)] ${hoverEffect}`;
    }
  };

  /**
   * 获取图标容器样式
   */
  const getIconStyle = (mode: LearningLevel, isSelected: boolean) => {
    const baseStyle = 'w-16 h-16 flex items-center justify-center mx-auto mb-4';
    const roundedStyle = 'rounded-full';
    
    if (isSelected) {
      if (mode === 'beginner') {
        return `${baseStyle} ${roundedStyle} bg-[var(--color-primary-600)] text-white`;
      } else {
        return `${baseStyle} ${roundedStyle} bg-[var(--color-secondary-600)] text-white`;
      }
    } else {
      return `${baseStyle} ${roundedStyle} bg-[var(--bg-secondary)] text-[var(--text-tertiary)]`;
    }
  };

  /**
   * 获取标题样式
   */
  const getTitleStyle = (mode: LearningLevel, isSelected: boolean) => {
    const baseStyle = 'text-xl font-semibold mb-3 transition-colors duration-200';
    
    if (isSelected) {
      if (mode === 'beginner') {
        return `${baseStyle} text-[var(--color-primary-900)]`;
      } else {
        return `${baseStyle} text-[var(--color-secondary-900)]`;
      }
    } else {
      return `${baseStyle} text-[var(--text-primary)]`;
    }
  };

  /**
   * 处理模式选择
   */
  const handleModeSelect = (mode: LearningLevel) => {
    onChange(mode);
  };

  /**
   * 处理键盘导航
   */
  const handleKeyDown = (event: React.KeyboardEvent, mode: LearningLevel) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleModeSelect(mode);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 标题 */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
          选择学习模式
        </h2>
        <p className="text-[var(--text-secondary)]">
          根据您的基础和需求，选择最适合的学习方式
        </p>
      </div>

      {/* 模式选择卡片 */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* 小白模式 */}
        <div
          className={getCardStyle('beginner', value === 'beginner')}
          onClick={() => handleModeSelect('beginner')}
          onKeyDown={(e) => handleKeyDown(e, 'beginner')}
          tabIndex={0}
          role="button"
          aria-pressed={value === 'beginner'}
          aria-label="选择小白模式"
        >
          <div className="text-center">
            {/* 图标 */}
            <div className={getIconStyle('beginner', value === 'beginner')}>
              <User className="w-8 h-8" />
            </div>
            
            {/* 标题 */}
            <h3 className={getTitleStyle('beginner', value === 'beginner')}>
              小白模式
            </h3>
            
            {/* 描述 */}
            <div className="text-sm space-y-2 text-left">
              <p className="text-[var(--text-secondary)]">
                <strong>适合对象：</strong>初学者或对主题不熟悉的用户
              </p>
              <p className="text-[var(--text-secondary)]">
                <strong>教学特点：</strong>
              </p>
              <ul className="text-[var(--text-secondary)] space-y-1 ml-4 list-none">
                <li>• 节奏缓慢，循序渐进</li>
                <li>• 详细解释每个概念</li>
                <li>• 提供具体的操作步骤</li>
                <li>• 使用通俗易懂的比喻</li>
                <li>• 频繁确认学习效果</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 高手模式 */}
        <div
          className={getCardStyle('expert', value === 'expert')}
          onClick={() => handleModeSelect('expert')}
          onKeyDown={(e) => handleKeyDown(e, 'expert')}
          tabIndex={0}
          role="button"
          aria-pressed={value === 'expert'}
          aria-label="选择高手模式"
        >
          <div className="text-center">
            {/* 图标 */}
            <div className={getIconStyle('expert', value === 'expert')}>
              <Zap className="w-8 h-8" />
            </div>
            
            {/* 标题 */}
            <h3 className={getTitleStyle('expert', value === 'expert')}>
              高手模式
            </h3>
            
            {/* 描述 */}
            <div className="text-sm space-y-2 text-left">
              <p className="text-[var(--text-secondary)]">
                <strong>适合对象：</strong>有相关基础或经验的用户
              </p>
              <p className="text-[var(--text-secondary)]">
                <strong>教学特点：</strong>
              </p>
              <ul className="text-[var(--text-secondary)] space-y-1 ml-4 list-none">
                <li>• 节奏较快，直击要点</li>
                <li>• 聚焦核心概念和差异</li>
                <li>• 讨论设计原理和最佳实践</li>
                <li>• 启发式深度思考</li>
                <li>• 高层级的技术对话</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 模式说明 */}
      <div className="text-center mt-6">
        <p className="text-sm text-[var(--text-tertiary)]">
          💡 您可以在学习过程中随时切换模式
        </p>
      </div>
    </div>
  );
};

export default LearningModeSelector; 