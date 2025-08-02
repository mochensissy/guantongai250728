/**
 * 主题化大纲侧边栏组件
 * 
 * 根据学习模式提供不同的大纲展示方式：
 * - 小白模式：温和的色彩，详细的信息，友好的图标
 * - 高手模式：简洁的设计，紧凑的布局，专业的外观
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface OutlineItem {
  /** 章节ID */
  id: string;
  /** 章节标题 */
  title: string;
  /** 章节类型：章或节 */
  type?: 'chapter' | 'section';
  /** 章节描述（可选） */
  description?: string;
  /** 预计学习时间（分钟） */
  estimatedMinutes?: number;
  /** 是否已完成 */
  completed?: boolean;
  /** 是否正在学习 */
  current?: boolean;
  /** 子章节 */
  children?: OutlineItem[];
}

export interface ThemedOutlineSidebarProps {
  /** 大纲数据 */
  outline: OutlineItem[];
  /** 当前选中的章节ID */
  currentChapter?: string;
  /** 章节选择回调 */
  onChapterSelect: (chapterId: string) => void;
  /** 自定义类名 */
  className?: string;
}

/**
 * 主题化大纲侧边栏组件
 */
export const ThemedOutlineSidebar: React.FC<ThemedOutlineSidebarProps> = ({
  outline,
  currentChapter,
  onChapterSelect,
  className = '',
}) => {
  const { currentLevel, currentTheme } = useTheme();
  
  const isExpertMode = currentLevel === 'expert';
  

  
  /**
   * 渲染章节状态图标
   */
  const renderChapterIcon = (item: OutlineItem) => {
    const isChapterItem = isChapter(item);
    
    if (item.completed) {
      return <span className="text-green-500">✓</span>;
    }
    
    if (item.id === currentChapter) {
      return <span className="text-[var(--surface-message-user)]">📖</span>;
    }
    
    // 根据章节类型显示不同图标
    if (isChapterItem) {
      return <span className="text-[var(--text-tertiary)]">📚</span>;
    } else {
      return <span className="text-[var(--text-tertiary)]">📄</span>;
    }
  };
  
  /**
   * 渲染预计时间
   */
  const renderEstimatedTime = (item: OutlineItem) => {
    if (!item.estimatedMinutes) return null;
    
    return (
      <div 
        className="flex items-center gap-1 text-xs opacity-75 mt-1"
        style={{
          color: 'var(--text-tertiary)',
          fontSize: currentTheme.typography.fontSize.xs,
        }}
      >
        <span>⏱️</span>
        <span>约 {item.estimatedMinutes} 分钟</span>
      </div>
    );
  };
  
  /**
   * 渲染章节描述（当有描述时）
   */
  const renderDescription = (item: OutlineItem) => {
    if (!item.description) return null;
    
    return (
      <div 
        className="text-xs opacity-70 mt-1 line-clamp-2"
        style={{
          color: 'var(--text-secondary)',
          fontSize: currentTheme.typography.fontSize.xs,
          lineHeight: currentTheme.typography.lineHeight.normal,
        }}
      >
        {item.description}
      </div>
    );
  };
  
  /**
   * 判断是否为章节（优先使用type字段，然后通过标题判断）
   */
  const isChapter = (item: OutlineItem) => {
    if (item.type) {
      return item.type === 'chapter';
    }
    return item.title.includes('第') && item.title.includes('章');
  };

  /**
   * 渲染单个章节项
   */
  const renderChapterItem = (item: OutlineItem, index: number, depth: number = 0) => {
    const isSelected = currentChapter === item.id;
    const isChapterItem = isChapter(item);
    // 章节顶格（paddingLeft为0），小节缩进（paddingLeft为16px，减少留白）
    const paddingLeft = !isChapterItem ? '16px' : '0';
    
    return (
      <div key={item.id || index}>
        <div
          className={`
            cursor-pointer transition-all duration-[var(--transition-normal)]
            hover:scale-[1.01]
            ${isSelected ? 'ring-2 ring-opacity-50' : ''}
          `}
          style={{
            backgroundColor: isSelected 
              ? `${currentTheme.primary[50]}80` 
              : 'transparent',
            borderRadius: currentTheme.borderRadius.md,
            border: isSelected 
              ? `2px solid var(--surface-message-user)` 
              : `1px solid var(--border-light)`,
            padding: currentTheme.spacing.element,
            marginBottom: isExpertMode ? '8px' : '12px',
            paddingLeft: `calc(${currentTheme.spacing.element} + ${paddingLeft})`,
            transition: currentTheme.transitions.normal,
          }}
          onClick={() => onChapterSelect(item.id)}
        >
          {/* 章节标题行 */}
          <div className="flex items-start gap-3">
            {/* 状态图标 */}
            <div className="flex-shrink-0 mt-1">
              {renderChapterIcon(item)}
            </div>
            
            {/* 章节信息 */}
            <div className="flex-1 min-w-0">
              <div 
                className={`
                  font-medium leading-tight
                  ${isSelected ? 'text-[var(--surface-message-user)]' : 'text-[var(--text-primary)]'}
                `}
                style={{ 
                  fontSize: currentTheme.typography.fontSize.sm, // 统一使用较小字体
                  fontWeight: currentTheme.typography.weight.medium,
                  lineHeight: currentTheme.typography.lineHeight.tight,
                }}
              >
                {item.title}
              </div>
              
              {/* 章节描述 */}
              {renderDescription(item)}
              
              {/* 预计时间 */}
              {renderEstimatedTime(item)}
            </div>
          </div>
        </div>
        
        {/* 子章节 */}
        {item.children && item.children.length > 0 && (
          <div className="ml-4">
            {item.children.map((child, childIndex) => 
              renderChapterItem(child, childIndex, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };
  
  /**
   * 渲染学习进度（仅小白模式）
   */
  const renderProgress = () => {
    if (isExpertMode || outline.length === 0) return null;
    
    const totalChapters = outline.length;
    const completedChapters = outline.filter(item => item.completed).length;
    const progressPercent = Math.round((completedChapters / totalChapters) * 100);
    
    return (
      <div 
        className="mb-[var(--spacing-section)]"
        style={{
          marginBottom: currentTheme.spacing.section,
        }}
      >
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--text-secondary)] font-medium">学习进度</span>
          <span className="text-[var(--surface-message-user)] font-semibold">
            {progressPercent}%
          </span>
        </div>
        
        <div 
          className="w-full bg-[var(--border-light)] rounded-full h-2"
          style={{
            borderRadius: currentTheme.borderRadius.full,
          }}
        >
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{
              backgroundColor: 'var(--surface-message-user)',
              width: `${progressPercent}%`,
              borderRadius: currentTheme.borderRadius.full,
            }}
          />
        </div>
        
        <div className="text-xs text-[var(--text-tertiary)] mt-1 text-center">
          已完成 {completedChapters} / {totalChapters} 章节
        </div>
      </div>
    );
  };
  
  return (
    <div 
      className={`
        h-full overflow-y-auto
        ${className}
      `}
      style={{
        backgroundColor: 'var(--surface-primary)',
        borderRight: `1px solid var(--border-secondary)`,
        padding: currentTheme.spacing.container,
      }}
    >
      
      {/* 学习进度 */}
      {renderProgress()}
      
      {/* 大纲标题 */}
      <div 
        className={`
          mb-[var(--spacing-section)] pb-3 border-b border-[var(--border-light)]
        `}
        style={{
          marginBottom: currentTheme.spacing.section,
        }}
      >
        <h3 
          className="font-semibold text-[var(--text-primary)] flex items-center gap-2"
          style={{
            fontSize: isExpertMode 
              ? currentTheme.typography.fontSize.base 
              : currentTheme.typography.fontSize.lg,
            fontWeight: currentTheme.typography.weight.semibold,
          }}
        >
          {isExpertMode ? '📋' : '📚'} 
          学习大纲
        </h3>
        
        {!isExpertMode && (
          <p 
            className="text-[var(--text-secondary)] mt-1"
            style={{
              fontSize: currentTheme.typography.fontSize.sm,
            }}
          >
            点击章节开始学习
          </p>
        )}
      </div>
      
      {/* 章节列表 */}
      <div className="space-y-0">
        {outline.map((item, index) => renderChapterItem(item, index))}
      </div>
      
      {/* 空状态 */}
      {outline.length === 0 && (
        <div className="text-center text-[var(--text-tertiary)] py-8">
          <div className="text-4xl mb-4">📖</div>
          <p>暂无学习内容</p>
        </div>
      )}
    </div>
  );
};

export default ThemedOutlineSidebar;