/**
 * 通用模态框组件
 * 
 * 提供可复用的模态框组件：
 * - 背景遮罩
 * - 淡入淡出动画
 * - 键盘事件处理（ESC关闭）
 * - 点击外部关闭
 * - 自定义头部、主体和底部
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  /** 是否显示模态框 */
  isOpen: boolean;
  /** 关闭模态框回调 */
  onClose: () => void;
  /** 模态框标题 */
  title?: string;
  /** 模态框主体内容 */
  children: React.ReactNode;
  /** 底部操作按钮 */
  footer?: React.ReactNode;
  /** 模态框尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 是否点击外部关闭 */
  closeOnOverlayClick?: boolean;
  /** 是否按ESC关闭 */
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  // 处理ESC键关闭
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // 处理body滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // 尺寸样式映射
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  // 处理遮罩层点击
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
        onClick={handleOverlayClick}
      />

      {/* 模态框容器 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className={`
            relative w-full ${sizeStyles[size]} bg-white rounded-xl shadow-xl 
            transform transition-all duration-300 animate-slide-up
          `}
        >
          {/* 头部 */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  icon={<X className="w-4 h-4" />}
                  className="text-gray-400 hover:text-gray-600"
                />
              )}
            </div>
          )}

          {/* 主体内容 */}
          <div className="p-6">
            {children}
          </div>

          {/* 底部 */}
          {footer && (
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;