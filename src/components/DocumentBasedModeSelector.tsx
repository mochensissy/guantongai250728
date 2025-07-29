/**
 * 基于文档的学习模式选择组件
 * 
 * 重新设计的学习模式选择理念：
 * - 学习模式是相对于具体文档的，不是用户的全局属性
 * - 用户根据对当前文档主题的熟悉程度来选择模式
 * - 更精准的描述：对此主题的熟悉程度，而非身份标签
 */

import React from 'react';
import { GraduationCap, Sparkles, FileText } from 'lucide-react';
import { LearningLevel } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface DocumentBasedModeSelectorProps {
  /** 当前选择的学习水平 */
  value: LearningLevel;
  /** 学习水平变化回调 */
  onChange: (level: LearningLevel) => void;
  /** 文档标题 */
  documentTitle?: string;
  /** 自定义容器类名 */
  className?: string;
}

/**
 * 基于文档的学习模式选择组件
 */
const DocumentBasedModeSelector: React.FC<DocumentBasedModeSelectorProps> = ({
  value,
  onChange,
  documentTitle = "这份文档",
  className = '',
}) => {
  const { currentLevel } = useTheme();

  /**
   * 获取卡片样式
   */
  const getCardStyle = (mode: LearningLevel, isSelected: boolean) => {
    const baseStyle = 'p-6 cursor-pointer transition-all duration-300 border-2';
    const roundedStyle = currentLevel === 'beginner' ? 'rounded-xl' : 'rounded-lg';
    
    if (isSelected) {
      if (mode === 'beginner') {
        return `${baseStyle} ${roundedStyle} border-[var(--color-primary-600)] bg-[var(--color-primary-50)] shadow-lg transform scale-105`;
      } else {
        return `${baseStyle} ${roundedStyle} border-[var(--color-secondary-600)] bg-[var(--color-secondary-50)] shadow-lg transform scale-105`;
      }
    } else {
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
    <div className={`space-y-6 ${className}`}>
      {/* 标题 */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <FileText className="w-6 h-6 text-[var(--color-primary-600)]" />
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            选择学习方式
          </h2>
        </div>
        <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
          请根据您对《{documentTitle}》<strong>主题内容的熟悉程度</strong>，选择合适的学习引导方式
        </p>
        <div className="mt-2 text-sm text-[var(--text-tertiary)]">
          💡 这不是对您能力的评判，而是为了提供最适合的学习体验
        </div>
      </div>

      {/* 模式选择卡片 */}
      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* 初学者模式 */}
        <div
          className={getCardStyle('beginner', value === 'beginner')}
          onClick={() => handleModeSelect('beginner')}
          onKeyDown={(e) => handleKeyDown(e, 'beginner')}
          tabIndex={0}
          role="button"
          aria-pressed={value === 'beginner'}
          aria-label="选择初学者模式"
        >
          <div className="text-center">
            {/* 图标 */}
            <div className={getIconStyle('beginner', value === 'beginner')}>
              <GraduationCap className="w-8 h-8" />
            </div>
            
            {/* 标题 */}
            <h3 className={getTitleStyle('beginner', value === 'beginner')}>
              初学者引导模式
            </h3>
            
            {/* 描述 */}
            <div className="text-sm space-y-3 text-left">
              <div className="bg-[var(--color-primary-50)] rounded-lg p-3 mb-3">
                <p className="text-[var(--color-primary-800)] font-medium text-center">
                  "我对这个主题比较陌生，需要详细讲解"
                </p>
              </div>
              
              <div>
                <p className="text-[var(--text-secondary)] font-medium mb-2">
                  🎯 适合情况：
                </p>
                <ul className="text-[var(--text-secondary)] space-y-1 ml-4 list-none">
                  <li>• 第一次接触这个领域</li>
                  <li>• 对相关概念不太熟悉</li>
                  <li>• 希望从基础开始系统学习</li>
                  <li>• 想要深入理解每个细节</li>
                </ul>
              </div>
              
              <div>
                <p className="text-[var(--text-secondary)] font-medium mb-2">
                  📚 教学特点：
                </p>
                <ul className="text-[var(--text-secondary)] space-y-1 ml-4 list-none">
                  <li>• 节奏缓慢，循序渐进</li>
                  <li>• 详细解释专业术语</li>
                  <li>• 提供生活化的比喻</li>
                  <li>• 频繁确认理解程度</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 进阶者模式 */}
        <div
          className={getCardStyle('expert', value === 'expert')}
          onClick={() => handleModeSelect('expert')}
          onKeyDown={(e) => handleKeyDown(e, 'expert')}
          tabIndex={0}
          role="button"
          aria-pressed={value === 'expert'}
          aria-label="选择进阶者模式"
        >
          <div className="text-center">
            {/* 图标 */}
            <div className={getIconStyle('expert', value === 'expert')}>
              <Sparkles className="w-8 h-8" />
            </div>
            
            {/* 标题 */}
            <h3 className={getTitleStyle('expert', value === 'expert')}>
              进阶者深入模式
            </h3>
            
            {/* 描述 */}
            <div className="text-sm space-y-3 text-left">
              <div className="bg-[var(--color-secondary-50)] rounded-lg p-3 mb-3">
                <p className="text-[var(--color-secondary-800)] font-medium text-center">
                  "我有一定基础，希望快速抓住重点"
                </p>
              </div>
              
              <div>
                <p className="text-[var(--text-secondary)] font-medium mb-2">
                  🎯 适合情况：
                </p>
                <ul className="text-[var(--text-secondary)] space-y-1 ml-4 list-none">
                  <li>• 对相关领域有一定了解</li>
                  <li>• 想要快速掌握核心内容</li>
                  <li>• 希望重点关注新知识点</li>
                  <li>• 偏好高效的学习节奏</li>
                </ul>
              </div>
              
              <div>
                <p className="text-[var(--text-secondary)] font-medium mb-2">
                  ⚡ 教学特点：
                </p>
                <ul className="text-[var(--text-secondary)] space-y-1 ml-4 list-none">
                  <li>• 节奏较快，直击要点</li>
                  <li>• 聚焦核心概念和差异</li>
                  <li>• 讨论深层原理和应用</li>
                  <li>• 启发式思考和讨论</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 补充说明 */}
      <div className="text-center mt-8 space-y-2">
        <p className="text-sm text-[var(--text-tertiary)]">
          💭 在学习过程中，您可以随时根据理解情况切换模式
        </p>
        <p className="text-xs text-[var(--text-tertiary)]">
          选择后，AI私教会根据您的选择调整讲解方式和互动节奏
        </p>
      </div>
    </div>
  );
};

export default DocumentBasedModeSelector; 