/**
 * 可调整大小的面板组件
 * 
 * 提供左右两个面板，中间有可拖动的分隔条：
 * - 支持鼠标拖拽调整面板宽度
 * - 设置最小和最大宽度限制
 * - 平滑的拖拽体验和视觉反馈
 * - 记住用户的调整偏好
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizablePanelProps {
  /** 左侧面板内容 */
  leftPanel: React.ReactNode;
  /** 右侧面板内容 */
  rightPanel: React.ReactNode;
  /** 初始左侧面板宽度（像素） */
  initialLeftWidth?: number;
  /** 左侧面板最小宽度（像素） */
  minLeftWidth?: number;
  /** 左侧面板最大宽度（像素） */
  maxLeftWidth?: number;
  /** 分隔条宽度（像素） */
  resizerWidth?: number;
  /** 存储键名（用于记住用户偏好） */
  storageKey?: string;
  /** 容器类名 */
  className?: string;
}

const ResizablePanel: React.FC<ResizablePanelProps> = ({
  leftPanel,
  rightPanel,
  initialLeftWidth = 320,
  minLeftWidth = 200,
  maxLeftWidth = 600,
  resizerWidth = 4,
  storageKey = 'resizable-panel-width',
  className = '',
}) => {
  // 状态管理
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  // 引用
  const containerRef = useRef<HTMLDivElement>(null);

  /**
   * 从localStorage加载保存的宽度
   */
  useEffect(() => {
    if (typeof window !== 'undefined' && storageKey) {
      const savedWidth = localStorage.getItem(storageKey);
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= minLeftWidth && width <= maxLeftWidth) {
          setLeftWidth(width);
        }
      }
    }
  }, [storageKey, minLeftWidth, maxLeftWidth]);

  /**
   * 保存宽度到localStorage
   */
  const saveWidth = useCallback((width: number) => {
    if (typeof window !== 'undefined' && storageKey) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [storageKey]);

  /**
   * 开始拖拽
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(leftWidth);
    
    // 添加全局样式，防止文本选择和改善拖拽体验
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth]);

  /**
   * 处理拖拽移动
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startX;
    const newWidth = startWidth + deltaX;
    
    // 限制宽度范围
    const clampedWidth = Math.max(minLeftWidth, Math.min(maxLeftWidth, newWidth));
    setLeftWidth(clampedWidth);
  }, [isResizing, startX, startWidth, minLeftWidth, maxLeftWidth]);

  /**
   * 结束拖拽
   */
  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      saveWidth(leftWidth);
      
      // 恢复默认样式
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isResizing, leftWidth, saveWidth]);

  /**
   * 绑定全局鼠标事件
   */
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  /**
   * 双击重置宽度
   */
  const handleDoubleClick = useCallback(() => {
    setLeftWidth(initialLeftWidth);
    saveWidth(initialLeftWidth);
  }, [initialLeftWidth, saveWidth]);

  return (
    <div 
      ref={containerRef}
      className={`flex h-full ${className}`}
    >
      {/* 左侧面板 */}
      <div 
        className="flex-shrink-0 overflow-hidden"
        style={{ width: `${leftWidth}px` }}
      >
        {leftPanel}
      </div>

      {/* 可拖拽的分隔条 */}
      <div
        className={`
          flex-shrink-0 relative group cursor-col-resize
          ${isResizing ? 'bg-primary-200' : 'bg-gray-200 hover:bg-gray-300'}
          transition-colors duration-150
        `}
        style={{ width: `${resizerWidth}px` }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        title="拖拽调整面板大小，双击重置"
      >
        {/* 拖拽手柄图标 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <GripVertical 
            className={`
              w-3 h-3 transition-opacity duration-150
              ${isResizing 
                ? 'text-primary-600 opacity-100' 
                : 'text-gray-400 opacity-0 group-hover:opacity-100'
              }
            `} 
          />
        </div>

        {/* 拖拽时的视觉反馈线 */}
        {isResizing && (
          <div className="absolute inset-y-0 left-1/2 w-0.5 bg-primary-500 transform -translate-x-1/2" />
        )}
      </div>

      {/* 右侧面板 */}
      <div className="flex-1 min-w-0 overflow-hidden">
        {rightPanel}
      </div>
    </div>
  );
};

export default ResizablePanel;