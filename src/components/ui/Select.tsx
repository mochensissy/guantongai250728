/**
 * 通用选择框组件
 * 
 * 提供统一样式的下拉选择框：
 * - 支持单选和多选
 * - 错误状态显示
 * - 标签和帮助文本
 * - 自定义选项渲染
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  /** 选项值 */
  value: string;
  /** 选项显示文本 */
  label: string;
  /** 是否禁用此选项 */
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** 选择框标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 选项列表 */
  options: SelectOption[];
  /** 占位符文本 */
  placeholder?: string;
  /** 值变化回调 */
  onChange?: (value: string) => void;
  /** 容器的自定义类名 */
  containerClassName?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helpText,
  options,
  placeholder,
  onChange,
  containerClassName = '',
  className = '',
  id,
  value,
  ...props
}) => {
  // 生成唯一ID
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  // 选择框样式
  const selectStyles = `
    block w-full rounded-lg border px-3 py-2.5 pr-10 text-gray-900 
    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
    appearance-none bg-white cursor-pointer
    ${error 
      ? 'border-error-300 focus:border-error-500 focus:ring-error-500' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
    }
    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
    ${className}
  `;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div className={`space-y-1 ${containerClassName}`}>
      {/* 标签 */}
      {label && (
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      {/* 选择框容器 */}
      <div className="relative">
        {/* 选择框 */}
        <select
          id={selectId}
          className={selectStyles}
          value={value}
          onChange={handleChange}
          {...props}
        >
          {/* 占位符选项 */}
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {/* 选项列表 */}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {/* 下拉箭头图标 */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
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

export default Select;