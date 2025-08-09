/**
 * 通用按钮组件
 * 
 * 提供多种样式变体的按钮组件：
 * - 主要按钮、次要按钮、危险按钮等
 * - 不同尺寸支持
 * - 加载状态和禁用状态
 * - 图标按钮支持
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体类型 */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 按钮图标（显示在文字前面） */
  icon?: React.ReactNode;
  /** 子元素 */
  children?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  // 基础样式
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  // 变体样式
  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white border-transparent focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white border-transparent focus:ring-secondary-500 shadow-sm hover:shadow-md',
    outline: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 focus:ring-primary-500 hover:border-gray-400',
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 border-transparent focus:ring-primary-500',
    danger: 'bg-error-600 hover:bg-error-700 text-white border-transparent focus:ring-error-500 shadow-sm hover:shadow-md',
  };

  // 尺寸样式
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-3',
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  return (
    <button
      className={combinedClassName}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      {/* 加载图标 */}
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="inline-flex">{icon}</span>
      ) : null}
      
      {/* 按钮文字 */}
      {children && (
        <span>{children}</span>
      )}
    </button>
  );
};

export default Button;