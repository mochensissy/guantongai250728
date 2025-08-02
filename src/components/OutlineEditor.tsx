/**
 * 大纲编辑器组件
 * 
 * 提供交互式的学习大纲编辑功能：
 * - 章节的增删改查
 * - 拖拽排序
 * - 实时预览
 * - 章节点击跳转
 */

import React, { useState } from 'react';
import { 
  GripVertical, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  X,
  ChevronRight,
  CheckCircle
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { OutlineItem } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface OutlineEditorProps {
  /** 大纲项目列表 */
  items: OutlineItem[];
  /** 大纲变化回调 */
  onChange: (items: OutlineItem[]) => void;
  /** 当前激活的章节ID */
  activeChapterId?: string;
  /** 章节点击回调 */
  onChapterClick?: (chapterId: string) => void;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否显示序号 */
  showNumbers?: boolean;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({
  items,
  onChange,
  activeChapterId,
  onChapterClick,
  readonly = false,
  showNumbers = true,
}) => {
  // 主题相关
  const { currentLevel, currentTheme } = useTheme();
  const isBeginner = currentLevel === 'beginner';
  
  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);

  /**
   * 生成新的章节ID
   */
  const generateId = (type: 'chapter' | 'section' = 'chapter'): string => {
    return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 开始编辑章节
   */
  const startEditing = (item: OutlineItem) => {
    setEditingId(item.id);
    setEditingTitle(item.title);
  };

  /**
   * 保存编辑
   */
  const saveEdit = () => {
    if (!editingId || !editingTitle.trim()) return;

    const updatedItems = items.map(item =>
      item.id === editingId
        ? { ...item, title: editingTitle.trim() }
        : item
    );

    onChange(updatedItems);
    setEditingId(null);
    setEditingTitle('');
  };

  /**
   * 取消编辑
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  /**
   * 删除章节
   */
  const deleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    // 重新排序
    const reorderedItems = updatedItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));
    onChange(reorderedItems);
  };

  /**
   * 添加新章节
   */
  const addNewItem = (type: 'chapter' | 'section' = 'chapter', parentId?: string) => {
    const newItem: OutlineItem = {
      id: generateId(type),
      title: type === 'chapter' ? '新章节' : '新小节',
      order: items.length + 1,
      type,
      level: type === 'chapter' ? 1 : 2,
      parentId,
    };

    onChange([...items, newItem]);
    
    // 自动开始编辑新章节
    setTimeout(() => {
      startEditing(newItem);
    }, 100);
  };

  /**
   * 获取章节的子节点
   */
  const getChildSections = (chapterId: string): OutlineItem[] => {
    return items.filter(item => item.parentId === chapterId);
  };

  /**
   * 获取顶级章节
   */
  const getTopLevelChapters = (): OutlineItem[] => {
    return items.filter(item => item.type === 'chapter');
  };
  /**
   * 拖拽开始
   */
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  /**
   * 拖拽结束
   */
  const handleDragEnd = () => {
    setDraggedId(null);
  };

  /**
   * 拖拽悬停
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  /**
   * 放置处理
   */
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedId || draggedId === targetId) return;

    const draggedIndex = items.findIndex(item => item.id === draggedId);
    const targetIndex = items.findIndex(item => item.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, draggedItem);

    // 重新设置顺序
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    onChange(reorderedItems);
  };

  /**
   * 处理章节点击
   */
  const handleChapterClick = (id: string) => {
    const item = items.find(item => item.id === id);
    
    // 只有小节（section）才能点击学习，章节（chapter）只是标题
    if (readonly && onChapterClick && item?.type === 'section') {
      onChapterClick(id);
    }
  };

  /**
   * 渲染单个大纲项目
   */
  const renderOutlineItem = (item: OutlineItem, index: number, isChild: boolean = false) => {
    const isChapter = item.type === 'chapter';
    const childSections = isChapter ? getChildSections(item.id) : [];
    
    return (
      <div key={item.id}>
        
        {/* 主项目 */}
        <div
          className={`
            group relative border cursor-pointer
            ${!isChapter ? 'ml-4 mt-2' : 'mb-2'}
            ${draggedId === item.id ? 'opacity-50' : ''}
            ${isChapter ? 'chapter-item' : 'section-item'}
          `}
          style={{
            backgroundColor: activeChapterId === item.id 
              ? 'var(--surface-selected)' 
              : 'transparent', // 统一使用透明背景，更清晰简洁
            borderColor: activeChapterId === item.id 
              ? 'var(--border-focus)' 
              : 'var(--border-light)', // 统一使用淡边框
            borderRadius: 'var(--radius-md)', // 统一圆角
            borderWidth: activeChapterId === item.id ? '2px' : '1px', // 只有选中时用粗边框
            boxShadow: activeChapterId === item.id 
              ? 'var(--shadow-sm)' // 减少阴影强度
              : 'none', // 去除默认阴影
            transition: 'var(--transition-normal)',
            transform: `scale(${draggedId === item.id ? '0.98' : '1'})`,
            // 统一使用合适的padding，不过分强调章节
            padding: '12px',
            marginBottom: isChapter ? '8px' : '4px', // 减少章节间距
          }}
          draggable={!readonly && editingId !== item.id}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
          onClick={() => handleChapterClick(item.id)}
        >
          <div className="flex items-center p-2">
            {/* 拖拽手柄 */}
            {!readonly && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              </div>
            )}

            {/* 章节序号 */}
            {showNumbers && (
              <div 
                className={`flex-shrink-0 flex items-center justify-center mr-2 relative ${isChapter ? 'w-7 h-7' : 'w-6 h-6'}`}
                style={{
                  backgroundColor: activeChapterId === item.id 
                    ? 'var(--color-primary-600)' 
                    : isChapter
                    ? 'var(--color-primary-100)' // 章节用更淡的背景色
                    : 'var(--color-secondary-100)',
                  color: activeChapterId === item.id 
                    ? 'var(--text-inverse)' 
                    : isChapter 
                    ? 'var(--color-primary-700)' // 章节用深色文字，更清晰
                    : 'var(--text-primary)',
                  borderRadius: 'var(--radius-sm)', // 统一使用小圆角
                  fontSize: 'var(--font-size-sm)', // 统一字体大小
                  fontWeight: isChapter ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)', // 章节稍微加粗
                  transition: 'var(--transition-normal)',
                  // 去除夸张的边框和阴影
                  border: 'none',
                  boxShadow: 'none',
                }}
              >
                {isChapter ? (item.title.match(/第(\d+)章/) ? item.title.match(/第(\d+)章/)[1] : index + 1) : '•'}
                
                {/* 完成状态标志 */}
                {item.isCompleted && (
                  <div 
                    className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-success-500)',
                      borderRadius: '50%',
                    }}
                  >
                    <CheckCircle className="w-2 h-2" style={{ color: 'var(--text-inverse)' }} />
                  </div>
                )}
              </div>
            )}

            {/* 章节标题 */}
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <Input
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                  autoFocus
                />
              ) : (
                <div className="flex items-center">
                  <span 
                    className="truncate flex items-center gap-2"
                    style={{
                      fontSize: isChapter 
                        ? (isBeginner ? 'var(--font-size-xl)' : 'var(--font-size-lg)') // 章节字体更大
                        : (isBeginner ? 'var(--font-size-base)' : 'var(--font-size-sm)'),
                      lineHeight: isBeginner ? 'var(--line-height-relaxed)' : 'var(--line-height-normal)',
                      fontWeight: isChapter ? 'var(--font-weight-bold)' : 'var(--font-weight-medium)',
                      color: activeChapterId === item.id 
                        ? 'var(--color-primary-700)' 
                        : isChapter 
                        ? 'var(--color-primary-700)' // 章节用更深的主色调文字
                        : 'var(--text-primary)',
                      transition: 'var(--transition-normal)',
                      // 章节标题增加文字阴影
                      textShadow: isChapter ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
                    }}
                  >
                    {item.title}
                    {item.isCompleted && (
                      <span 
                        className="px-2 py-1"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-success-600)',
                          backgroundColor: 'var(--color-success-100)',
                          borderRadius: isBeginner ? 'var(--radius-full)' : 'var(--radius-sm)',
                        }}
                      >
                        已完成
                      </span>
                    )}
                    {/* 预估时间显示 - 仅在小白模式下显示 */}
                    {item.estimatedMinutes && !isChapter && isBeginner && (
                      <span 
                        className="px-2 py-1 ml-2"
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--text-muted)',
                          backgroundColor: 'var(--surface-secondary)',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        约 {item.estimatedMinutes} 分钟
                      </span>
                    )}
                  </span>
                  {readonly && !isChapter && (
                    <ChevronRight 
                      className="w-4 h-4 ml-2 flex-shrink-0" 
                      style={{ color: 'var(--text-tertiary)' }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {!readonly && (
              <div 
                className="flex items-center gap-1 opacity-0 group-hover:opacity-100"
                style={{
                  transition: isBeginner ? 'var(--transition-slow)' : 'var(--transition-fast)',
                }}
              >
                {editingId === item.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveEdit}
                      icon={<Check className="w-3 h-3" />}
                      style={{
                        color: 'var(--color-success-600)',
                        borderRadius: isBeginner ? 'var(--radius-md)' : 'var(--radius-sm)',
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      icon={<X className="w-3 h-3" />}
                      style={{
                        color: 'var(--text-secondary)',
                        borderRadius: isBeginner ? 'var(--radius-md)' : 'var(--radius-sm)',
                      }}
                    />
                  </>
                ) : (
                  <>
                    {isChapter && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addNewItem('section', item.id)}
                        icon={<Plus className="w-3 h-3" />}
                        title="添加小节"
                        style={{
                          color: 'var(--color-info-600)',
                          borderRadius: isBeginner ? 'var(--radius-md)' : 'var(--radius-sm)',
                        }}
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(item)}
                      icon={<Edit2 className="w-3 h-3" />}
                      style={{
                        color: 'var(--text-secondary)',
                        borderRadius: isBeginner ? 'var(--radius-md)' : 'var(--radius-sm)',
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      icon={<Trash2 className="w-3 h-3" />}
                      style={{
                        color: 'var(--color-danger-600)',
                        borderRadius: isBeginner ? 'var(--radius-md)' : 'var(--radius-sm)',
                      }}
                    />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 子节点（小节） */}
        {isChapter && childSections.map((section, sectionIndex) => 
          renderOutlineItem(section, sectionIndex, true)
        )}
      </div>
    );
  };
  /**
   * 键盘事件处理
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div 
      style={{ 
        gap: isBeginner ? 'var(--spacing-element)' : 'var(--spacing-message)',
        padding: 'var(--spacing-container)',
        backgroundColor: 'var(--surface-primary)',
        borderRadius: 'var(--radius-lg)',
        border: `1px solid var(--border-secondary)`,
      }}
      className="flex flex-col"
    >
      {/* 大纲列表 - 只显示顶级章节，子节点在renderOutlineItem中处理 */}
      <div style={{ gap: isBeginner ? 'var(--spacing-element)' : 'var(--spacing-message)' }} className="flex flex-col">
        {getTopLevelChapters().map((chapter, index) => 
          renderOutlineItem(chapter, index)
        )}
      </div>

      {/* 添加新章节按钮 */}
      {!readonly && (
        <div style={{ marginTop: 'var(--spacing-section)' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addNewItem('chapter')}
            icon={<Plus className="w-4 h-4" />}
            className="w-full border-dashed"
            style={{
              color: 'var(--text-secondary)',
              borderColor: 'var(--border-secondary)',
              borderRadius: isBeginner ? 'var(--radius-lg)' : 'var(--radius-md)',
              fontSize: isBeginner ? 'var(--font-size-base)' : 'var(--font-size-sm)',
              padding: isBeginner ? 'var(--spacing-element)' : 'var(--spacing-message)',
              transition: 'var(--transition-normal)',
            }}
          >
            {isBeginner ? '+ 添加新章节' : '添加章节'}
          </Button>
        </div>
      )}

      {/* 空状态 */}
      {items.length === 0 && (
        <div 
          className="text-center py-8"
          style={{
            color: 'var(--text-tertiary)',
            fontSize: isBeginner ? 'var(--font-size-base)' : 'var(--font-size-sm)',
          }}
        >
          <div>
            {readonly ? '暂无学习大纲' : (isBeginner ? '点击上方按钮开始创建您的学习大纲' : '点击上方按钮添加第一个章节')}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineEditor;