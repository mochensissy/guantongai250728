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
   * 获取章节编号
   */
  const getItemNumber = (item: OutlineItem): string | number => {
    if (item.type === 'chapter') {
      const match = item.title.match(/第(\d+)章/);
      if (match) {
        return match[1];
      }
      // 计算章节在所有章节中的位置
      const chapters = items.filter(i => i.type === 'chapter');
      const chapterIndex = chapters.findIndex(i => i.id === item.id);
      return chapterIndex >= 0 ? chapterIndex + 1 : 1;
    } else if (item.type === 'section') {
      const sectionMatch = item.title.match(/(\d+)\.(\d+)/);
      if (sectionMatch) {
        return sectionMatch[2]; // 返回小节编号
      }
      // 如果标题中没有编号，计算在同一章节中的位置
      const parentChapter = items.find(i => i.id === item.parentId);
      if (parentChapter) {
        const siblings = items.filter(i => i.type === 'section' && i.parentId === item.parentId);
        const sectionIndex = siblings.findIndex(i => i.id === item.id);
        return sectionIndex >= 0 ? sectionIndex + 1 : 1;
      }
      return '•';
    }
    return '•';
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
            group relative bg-white border rounded-lg transition-all duration-200
            ${activeChapterId === item.id 
              ? 'border-primary-300 bg-primary-50 shadow-sm' 
              : 'border-gray-200 hover:border-gray-300'
            }
            ${draggedId === item.id ? 'opacity-50' : ''}
            ${readonly ? 'cursor-pointer hover:bg-gray-50' : ''}
            ${isChild ? 'ml-6 mt-2' : 'mb-2'}
          `}
          draggable={!readonly && editingId !== item.id}
          onDragStart={(e) => handleDragStart(e, item.id)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, item.id)}
          onClick={() => handleChapterClick(item.id)}
        >
          <div className="flex items-center p-3">
            {/* 拖拽手柄 */}
            {!readonly && (
              <div className="opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
              </div>
            )}

            {/* 章节序号 */}
            {showNumbers && (
              <div className={`
                flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs font-medium relative
                ${activeChapterId === item.id 
                  ? 'bg-primary-600 text-white' 
                  : isChapter
                  ? 'bg-gray-200 text-gray-700'
                  : 'bg-gray-100 text-gray-600'
                }
                ${isChapter && readonly ? 'cursor-default' : ''}
              `}>
                {getItemNumber(item)}
                
                {/* 完成状态标志 */}
                {item.isCompleted && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-2 h-2 text-white" />
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
                  <span className={`
                    text-sm truncate flex items-center gap-2
                    ${activeChapterId === item.id ? 'text-primary-900' : 'text-gray-900'}
                    ${isChapter ? 'font-bold text-gray-800' : 'font-medium'}
                    ${isChapter && readonly ? 'cursor-default' : ''}
                  `}>
                    {item.title}
                    {item.isCompleted && (
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        已完成
                      </span>
                    )}
                    {/* 预估时间显示 */}
                    {item.estimatedMinutes && !isChapter && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full ml-2">
                        约 {item.estimatedMinutes} 分钟
                      </span>
                    )}
                  </span>
                  {readonly && !isChapter && (
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {!readonly && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {editingId === item.id ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={saveEdit}
                      icon={<Check className="w-3 h-3" />}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      icon={<X className="w-3 h-3" />}
                      className="text-gray-500 hover:text-gray-700"
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
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        title="添加小节"
                      />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(item)}
                      icon={<Edit2 className="w-3 h-3" />}
                      className="text-gray-500 hover:text-gray-700"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItem(item.id)}
                      icon={<Trash2 className="w-3 h-3" />}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
    <div className="space-y-2">
      {/* 大纲列表 - 只显示顶级章节，子节点在renderOutlineItem中处理 */}
      {getTopLevelChapters().map((chapter, index) => 
        renderOutlineItem(chapter, index)
      )}

      {/* 添加新章节按钮 */}
      {!readonly && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addNewItem('chapter')}
            icon={<Plus className="w-4 h-4" />}
            className="w-full border-dashed text-gray-600 hover:text-gray-900 hover:border-solid"
          >
            添加章节
          </Button>
        </div>
      )}

      {/* 空状态 */}
      {items.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-sm">
            {readonly ? '暂无学习大纲' : '点击上方按钮添加第一个章节'}
          </div>
        </div>
      )}
    </div>
  );
};

export default OutlineEditor;