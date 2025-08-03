/**
 * 卡片管理组件
 * 
 * 提供类似Anki的卡片管理功能：
 * - 卡片列表展示
 * - 卡片编辑和删除
 * - 复习提醒
 * - 艾宾浩斯遗忘曲线复习
 */

import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { 
  BookOpen, 
  Lightbulb, 
  Star, 
  Edit2, 
  Trash2, 
  Clock, 
  Plus,
  RefreshCw,
  Calendar,
  TrendingUp,
  Search,
  Tag,
  X
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { LearningCard } from '../types';
import { 
  getSessionCards, 
  getCardsForReview, 
  updateLearningCard, 
  deleteLearningCard,
  recordCardReview,
  addLearningCard
} from '../utils/storage';

interface CardManagerProps {
  /** 会话ID */
  sessionId: string;
  /** 卡片列表更新回调 */
  onCardsUpdate?: () => void;
}

const CardManager: React.FC<CardManagerProps> = ({
  sessionId,
  onCardsUpdate,
}) => {
  /**
   * 渲染Markdown内容并美化显示
   */
  const renderContent = (content: string): string => {
    if (!content) return '';
    
    try {
      // 配置marked选项
      marked.setOptions({
        breaks: true,        // 换行转为<br>
        gfm: true,          // GitHub风格
      });
      
      let html = marked(content);
      html = typeof html === 'string' ? html : content;
      
      // 清理和美化HTML
      html = html
        // 移除多余的段落标签
        .replace(/<p><\/p>/g, '')
        // 优化列表样式
        .replace(/<ul>/g, '<ul class="list-disc list-inside mb-2 ml-2">')
        .replace(/<ol>/g, '<ol class="list-decimal list-inside mb-2 ml-2">')
        .replace(/<li>/g, '<li class="mb-1">')
        // 优化标题样式
        .replace(/<h1>/g, '<h1 class="text-lg font-bold mb-2 text-gray-900">')
        .replace(/<h2>/g, '<h2 class="text-base font-bold mb-2 text-gray-800">')
        .replace(/<h3>/g, '<h3 class="text-sm font-bold mb-1 text-gray-800">')
        // 优化段落样式
        .replace(/<p>/g, '<p class="mb-2 leading-relaxed">')
        // 优化强调样式
        .replace(/<strong>/g, '<strong class="font-semibold text-gray-900">')
        .replace(/<em>/g, '<em class="italic text-gray-700">')
        // 优化代码样式
        .replace(/<code>/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">')
        // 优化引用样式
        .replace(/<blockquote>/g, '<blockquote class="border-l-4 border-blue-200 pl-3 ml-2 italic text-gray-600">');
      
      return html;
    } catch (error) {
      console.error('Markdown渲染失败:', error);
      // 如果渲染失败，进行基础文本格式化
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
        .replace(/^##\s+(.*$)/gm, '<h2 class="text-base font-bold mb-2 text-gray-800">$1</h2>')
        .replace(/^#\s+(.*$)/gm, '<h1 class="text-lg font-bold mb-2 text-gray-900">$1</h1>')
        .replace(/\n/g, '<br>');
    }
  };

  // 状态管理
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [reviewCards, setReviewCards] = useState<LearningCard[]>([]);
  const [currentView, setCurrentView] = useState<'all' | 'review' | 'stats'>('all');
  const [editingCard, setEditingCard] = useState<LearningCard | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewCard, setCurrentReviewCard] = useState<LearningCard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [newCard, setNewCard] = useState({
    title: '',
    content: '',
    userNote: '',
    tags: [] as string[],
    newTag: ''
  });

  /**
   * 加载卡片数据
   */
  const loadCards = () => {
    const allCards = getSessionCards(sessionId);
    const needReview = getCardsForReview(sessionId);
    
    setCards(allCards);
    setReviewCards(needReview);
  };

  /**
   * 生成卡片ID
   */
  const generateCardId = (): string => {
    return `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 获取所有标签
   */
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    cards.forEach(card => {
      card.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  /**
   * 过滤卡片
   */
  const getFilteredCards = (cardList: LearningCard[]): LearningCard[] => {
    return cardList.filter(card => {
      // 搜索过滤
      const matchesSearch = !searchTerm || 
        card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (card.userNote && card.userNote.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // 标签过滤
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => card.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    });
  };

  /**
   * 初始化和数据更新
   */
  useEffect(() => {
    loadCards();
  }, [sessionId]);

  /**
   * 定期检查卡片更新（避免重复卡片问题）
   */
  useEffect(() => {
    const interval = setInterval(() => {
      loadCards();
    }, 2000); // 每2秒检查一次卡片更新

    return () => clearInterval(interval);
  }, [sessionId]);

  /**
   * 格式化时间
   */
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  /**
   * 格式化下次复习时间
   */
  const formatNextReview = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = timestamp - now.getTime();
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime <= 0) {
      return '需要复习';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟后`;
    } else if (diffHours < 24) {
      return `${diffHours}小时后`;
    } else {
      return `${diffDays}天后`;
    }
  };

  /**
   * 开始编辑卡片
   */
  const handleEditCard = (card: LearningCard) => {
    setEditingCard({ ...card });
  };

  /**
   * 保存卡片编辑
   */
  const handleSaveCard = () => {
    if (!editingCard) return;

    const success = updateLearningCard(sessionId, editingCard.id, {
      title: editingCard.title,
      content: editingCard.content,
      userNote: editingCard.userNote,
      tags: editingCard.tags || [],
    });

    if (success) {
      loadCards();
      setEditingCard(null);
      onCardsUpdate?.();
    }
  };

  /**
   * 删除卡片
   */
  const handleDeleteCard = (cardId: string) => {
    if (window.confirm('确定要删除这张卡片吗？')) {
      const success = deleteLearningCard(sessionId, cardId);
      if (success) {
        loadCards();
        onCardsUpdate?.();
      }
    }
  };

  /**
   * 开始复习
   */
  const handleStartReview = (card: LearningCard) => {
    setCurrentReviewCard(card);
    setShowReviewModal(true);
  };

  /**
   * 完成复习
   */
  const handleCompleteReview = (quality: number) => {
    if (!currentReviewCard) return;

    const success = recordCardReview(sessionId, currentReviewCard.id, quality);
    if (success) {
      loadCards();
      setShowReviewModal(false);
      setCurrentReviewCard(null);
      onCardsUpdate?.();
    }
  };

  /**
   * 创建新卡片
   */
  const handleCreateNewCard = () => {
    if (!newCard.title.trim() || !newCard.content.trim()) return;

    const card: LearningCard = {
      id: generateCardId(),
      title: newCard.title.trim(),
      content: newCard.content.trim(),
      userNote: newCard.userNote.trim() || undefined,
      type: 'bookmark',
      tags: newCard.tags,
      createdAt: Date.now(),
      nextReviewAt: Date.now() + (1 * 60 * 1000), // 1分钟后复习
      reviewCount: 0,
      difficulty: 3,
      sessionId: sessionId,
      messageId: `manual-${Date.now()}`, // 手动创建的卡片使用特殊ID
    };

    const success = addLearningCard(sessionId, card);
    if (success) {
      loadCards();
      setShowNewCardModal(false);
      setNewCard({
        title: '',
        content: '',
        userNote: '',
        tags: [],
        newTag: ''
      });
      onCardsUpdate?.();
    }
  };

  /**
   * 添加标签到新卡片
   */
  const handleAddTagToNewCard = () => {
    const tag = newCard.newTag.trim();
    if (tag && !newCard.tags.includes(tag)) {
      setNewCard(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        newTag: ''
      }));
    }
  };

  /**
   * 从新卡片移除标签
   */
  const handleRemoveTagFromNewCard = (tagToRemove: string) => {
    setNewCard(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * 添加标签到编辑卡片
   */
  const handleAddTagToEditCard = (tag: string) => {
    if (!editingCard) return;
    
    if (tag.trim() && !editingCard.tags?.includes(tag.trim())) {
      setEditingCard(prev => prev ? {
        ...prev,
        tags: [...(prev.tags || []), tag.trim()]
      } : null);
    }
  };

  /**
   * 从编辑卡片移除标签
   */
  const handleRemoveTagFromEditCard = (tagToRemove: string) => {
    if (!editingCard) return;
    
    setEditingCard(prev => prev ? {
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    } : null);
  };

  /**
   * 切换标签过滤
   */
  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  /**
   * 渲染卡片项目
   */
  const renderCard = (card: LearningCard) => {
    const isOverdue = card.nextReviewAt <= Date.now();
    
    return (
      <div
        key={card.id}
        className={`
          bg-white border rounded-lg p-4 transition-all duration-200 hover:shadow-md
          ${isOverdue ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}
        `}
      >
        {/* 卡片头部 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {card.type === 'inspiration' ? (
              <Lightbulb className="w-4 h-4 text-yellow-500" />
            ) : (
              <Star className="w-4 h-4 text-blue-500" />
            )}
            <span className="text-xs text-gray-500">
              {card.type === 'inspiration' ? '灵感卡片' : '收藏卡片'}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditCard(card)}
              icon={<Edit2 className="w-3 h-3" />}
              className="text-gray-400 hover:text-gray-600"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteCard(card.id)}
              icon={<Trash2 className="w-3 h-3" />}
              className="text-gray-400 hover:text-red-600"
            />
          </div>
        </div>

        {/* 卡片内容 */}
        <div className="mb-3">
          <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2 leading-relaxed">
            {card.title || '无标题'}
          </h4>
          <div 
            className="text-xs text-gray-600 line-clamp-3 mb-2"
            dangerouslySetInnerHTML={{ __html: renderContent(card.content) }}
          />
          {card.userNote && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mt-2">
              <p className="text-xs text-yellow-800">
                💡 {card.userNote}
              </p>
            </div>
          )}
          
          {/* 标签显示 */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                >
                  <Tag className="w-2 h-2 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 卡片底部信息 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(card.createdAt)}
            </span>
            <span>复习 {card.reviewCount} 次</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`
              ${isOverdue ? 'text-orange-600 font-medium' : 'text-gray-500'}
            `}>
              {formatNextReview(card.nextReviewAt)}
            </span>
            {isOverdue && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStartReview(card)}
                className="text-xs px-2 py-1"
              >
                复习
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染统计信息
   */
  const renderStats = () => {
    const totalCards = cards.length;
    const reviewCardsCount = reviewCards.length;
    const inspirationCards = cards.filter(c => c.type === 'inspiration').length;
    const bookmarkCards = cards.filter(c => c.type === 'bookmark').length;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCards}</div>
            <div className="text-xs text-blue-600">总卡片数</div>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{reviewCardsCount}</div>
            <div className="text-xs text-orange-600">待复习</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-yellow-600">{inspirationCards}</div>
            <div className="text-xs text-yellow-600">灵感卡片</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{bookmarkCards}</div>
            <div className="text-xs text-green-600">收藏卡片</div>
          </div>
        </div>

        {reviewCardsCount > 0 && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCurrentView('review')}
            icon={<RefreshCw className="w-4 h-4" />}
            className="w-full"
          >
            开始复习 ({reviewCardsCount} 张)
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="h-full bg-white border-l border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-900 text-sm">卡片管理</h2>
          </div>
          
          {/* 搜索栏 */}
          <div className="mb-3">
            <Input
              placeholder="搜索卡片..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
              className="text-sm"
            />
          </div>

          {/* 标签过滤 */}
          {getAllTags().length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2">标签过滤：</div>
              <div className="flex flex-wrap gap-1">
                {getAllTags().map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Tag className="w-2 h-2 mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 视图切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setCurrentView('all')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                currentView === 'all' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setCurrentView('review')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                currentView === 'review' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              复习
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                currentView === 'stats' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              统计
            </button>
          </div>

          {/* 新建卡片按钮 */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewCardModal(true)}
            icon={<Plus className="w-4 h-4" />}
            className="w-full mt-3"
          >
            新建卡片
          </Button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {currentView === 'stats' ? (
            renderStats()
          ) : (
            <div className="space-y-3">
              {getFilteredCards(currentView === 'all' ? cards : reviewCards).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">
                    {searchTerm || selectedTags.length > 0 
                      ? '没有找到匹配的卡片' 
                      : currentView === 'all' ? '还没有收藏的卡片' : '暂无需要复习的卡片'
                    }
                  </p>
                  <p className="text-xs mt-1">
                    {searchTerm || selectedTags.length > 0
                      ? '尝试调整搜索条件或标签过滤'
                      : currentView === 'all' 
                      ? '在AI回答旁点击💡或⭐图标来收藏' 
                      : '继续学习，稍后会有卡片需要复习'
                    }
                  </p>
                </div>
              ) : (
                getFilteredCards(currentView === 'all' ? cards : reviewCards).map(renderCard)
              )}
            </div>
          )}
        </div>
      </div>

      {/* 编辑卡片模态框 */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              编辑卡片
            </h3>
            
            <div className="space-y-4">
              <Input
                label="卡片标题"
                value={editingCard.title}
                onChange={(e) => setEditingCard({ ...editingCard, title: e.target.value })}
                placeholder="为这张卡片起个标题..."
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  卡片内容
                </label>
                <textarea
                  value={editingCard.content || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, content: e.target.value })}
                  placeholder="编辑卡片的核心知识内容..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  您的笔记
                </label>
                <textarea
                  value={editingCard.userNote || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, userNote: e.target.value })}
                  placeholder="添加您的想法、感受或笔记..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 标签编辑 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(editingCard.tags || []).map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      <Tag className="w-2 h-2 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTagFromEditCard(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="添加标签..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToEditCard(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      if (input) {
                        handleAddTagToEditCard(input.value);
                        input.value = '';
                      }
                    }}
                    icon={<Plus className="w-3 h-3" />}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditingCard(null)}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveCard}
              >
                保存
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 复习模态框 */}
      {showReviewModal && currentReviewCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary-600" />
              复习卡片
            </h3>
            
            <div className="mb-6">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  {currentReviewCard.title || '无标题'}
                </h4>
                <div 
                  className="text-sm text-gray-600 mb-3 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderContent(currentReviewCard.content) }}
                />
                {currentReviewCard.userNote && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                    <p className="text-sm text-yellow-800">
                      💡 {currentReviewCard.userNote}
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-gray-600 text-center mb-4">
                请根据您对这张卡片内容的掌握程度选择：
              </p>
              
              {/* 五点量表横向布局 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>很困难</span>
                  <span>困难</span>
                  <span>一般</span>
                  <span>容易</span>
                  <span>很容易</span>
                </div>
                
                <div className="flex justify-between gap-2">
                  <button
                    onClick={() => handleCompleteReview(1)}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 border-red-300 hover:bg-red-50 transition-colors group"
                  >
                    <span className="text-xl mb-1">😰</span>
                    <span className="text-xs text-red-600 font-medium">1</span>
                  </button>
                  
                  <button
                    onClick={() => handleCompleteReview(2)}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 border-orange-300 hover:bg-orange-50 transition-colors group"
                  >
                    <span className="text-xl mb-1">😕</span>
                    <span className="text-xs text-orange-600 font-medium">2</span>
                  </button>
                  
                  <button
                    onClick={() => handleCompleteReview(3)}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 border-yellow-300 hover:bg-yellow-50 transition-colors group"
                  >
                    <span className="text-xl mb-1">😐</span>
                    <span className="text-xs text-yellow-600 font-medium">3</span>
                  </button>
                  
                  <button
                    onClick={() => handleCompleteReview(4)}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 border-blue-300 hover:bg-blue-50 transition-colors group"
                  >
                    <span className="text-xl mb-1">🙂</span>
                    <span className="text-xs text-blue-600 font-medium">4</span>
                  </button>
                  
                  <button
                    onClick={() => handleCompleteReview(5)}
                    className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 border-green-300 hover:bg-green-50 transition-colors group"
                  >
                    <span className="text-xl mb-1">😊</span>
                    <span className="text-xs text-green-600 font-medium">5</span>
                  </button>
                </div>
                
                <div className="text-center text-xs text-gray-400 mt-2">
                  点击选择您的掌握程度（1=完全忘记，5=完全掌握）
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowReviewModal(false);
                  setCurrentReviewCard(null);
                }}
              >
                稍后复习
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 新建卡片模态框 */}
      {showNewCardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              新建卡片
            </h3>
            
            <div className="space-y-4">
              <Input
                label="卡片标题"
                value={newCard.title}
                onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
                placeholder="输入卡片标题..."
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  卡片内容 *
                </label>
                <textarea
                  value={newCard.content}
                  onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
                  placeholder="输入卡片的主要内容..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  个人笔记
                </label>
                <textarea
                  value={newCard.userNote}
                  onChange={(e) => setNewCard({ ...newCard, userNote: e.target.value })}
                  placeholder="添加您的想法、感受或笔记..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* 标签添加 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newCard.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      <Tag className="w-2 h-2 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTagFromNewCard(tag)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="添加标签..."
                    value={newCard.newTag}
                    onChange={(e) => setNewCard({ ...newCard, newTag: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTagToNewCard();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddTagToNewCard}
                    disabled={!newCard.newTag.trim()}
                    icon={<Plus className="w-3 h-3" />}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCardModal(false);
                  setNewCard({
                    title: '',
                    content: '',
                    userNote: '',
                    tags: [],
                    newTag: ''
                  });
                }}
              >
                取消
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateNewCard}
                disabled={!newCard.title.trim() || !newCard.content.trim()}
              >
                创建卡片
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CardManager;