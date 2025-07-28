/**
 * 通用卡片组件
 * 
 * 提供统一样式的卡片容器：
 * - 不同的阴影层级
 * - 可选的头部和底部
 * - 鼠标悬停效果
 * - 边框和圆角样式
 */

import React from 'react';

interface CardProps {
  /** 卡片内容 */
  children: React.ReactNode;
  /** 卡片标题 */
  title?: string;
  /** 卡片描述 */
  description?: string;
  /** 底部操作区域 */
  footer?: React.ReactNode;
  /** 阴影层级 */
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  /** 是否有边框 */
  bordered?: boolean;
  /** 是否可悬停 */
  hoverable?: boolean;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击事件 */
  onClick?: () => void;
  /** 自定义类名 */
  className?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  footer,
  shadow = 'sm',
  bordered = false,
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
}) => {
  // 基础样式
  const baseStyles = 'bg-white rounded-xl overflow-hidden transition-all duration-200';

  // 阴影样式
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  // 交互样式
  const interactiveStyles = [
    hoverable && 'hover:shadow-lg hover:-translate-y-1',
    clickable && 'cursor-pointer hover:shadow-md',
    bordered && 'border border-gray-200',
  ].filter(Boolean).join(' ');

  const combinedClassName = `
    ${baseStyles} 
    ${shadowStyles[shadow]} 
    ${interactiveStyles} 
    ${className}
  `.trim();

  const CardContent = (
    <>
      {/* 头部 */}
      {(title || description) && (
        <div className="p-6 pb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-gray-600 text-sm">
              {description}
            </p>
          )}
        </div>
      )}

      {/* 主体内容 */}
      <div className={`${title || description ? 'px-6 pb-6' : 'p-6'}`}>
        {children}
      </div>

      {/* 底部 */}
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          {footer}
        </div>
      )}
    </>
  );

  if (clickable && onClick) {
    return (
      <div 
        className={combinedClassName}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
      >
        {CardContent}
      </div>
    );
  }

  return (
    <div className={combinedClassName}>
      {CardContent}
    </div>
  );
};

export default Card;