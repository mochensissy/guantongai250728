/**
 * 通用输入框组件
 * 
 * 提供统一样式的输入框组件：
 * - 支持不同类型的输入
 * - 错误状态显示
 * - 标签和帮助文本
 * - 图标装饰
 */

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** 输入框标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 容器的自定义类名 */
  containerClassName?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  id,
  ...props
}) => {
  // 生成唯一ID
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // 输入框样式
  const inputStyles = `
    block w-full rounded-lg border px-3 py-2.5 text-gray-900 placeholder-gray-500 
    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
    ${error 
      ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
    }
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${className}
  `;

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {/* 标签 */}
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div className="relative">
        {/* 左侧图标 */}
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {leftIcon}
            </span>
          </div>
        )}

        {/* 输入框 */}
        <input
          id={inputId}
          className={inputStyles}
          {...props}
        />

        {/* 右侧图标 */}
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">
              {rightIcon}
            </span>
          </div>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <p className="text-sm text-error-600 animate-slide-down">
          {error}
        </p>
      )}

      {/* 帮助文本 */}
      {helpText && !error && (
        <p className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  );
};

export default Input;