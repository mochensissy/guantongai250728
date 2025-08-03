/**
 * 卡片管理页面
 * 
 * 提供统一的卡片管理界面：
 * - 查看所有会话的卡片
 * - 搜索和过滤功能
 * - 卡片编辑和删除
 * - 复习管理
 * - 统计信息
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Search, Tag, Plus, Filter, TrendingUp, RefreshCw, Download } from 'lucide-react';
import { useRouter } from 'next/router';
import { marked } from 'marked';
import Button from '../src/components/ui/Button';
import Input from '../src/components/ui/Input';
import Select from '../src/components/ui/Select';
import Card from '../src/components/ui/Card';
import { LearningCard, LearningSession } from '../src/types';
import { 
  getAllCards, 
  getAllSessions,
  updateLearningCard, 
  deleteLearningCard,
  recordCardReview,
  addLearningCard
} from '../src/utils/storage';

const CardsPage: React.FC = () => {
  const router = useRouter();
  
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
  const [allCards, setAllCards] = useState<LearningCard[]>([]);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [filteredCards, setFilteredCards] = useState<LearningCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [cardType, setCardType] = useState<string>('all');
  const [reviewStatus, setReviewStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'review'>('recent');
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<LearningCard | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewCard, setCurrentReviewCard] = useState<LearningCard | null>(null);
  const [batchReviewMode, setBatchReviewMode] = useState(false);
  const [batchReviewCards, setBatchReviewCards] = useState<LearningCard[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [newCard, setNewCard] = useState({
    title: '',
    content: '',
    userNote: '',
    tags: [] as string[],
    newTag: ''
  });

  /**
   * 加载数据
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 过滤和排序卡片
   */
  useEffect(() => {
    filterAndSortCards();
  }, [allCards, searchTerm, selectedTags, selectedSession, cardType, reviewStatus, sortBy]);

  /**
   * 加载所有数据
   */
  const loadData = () => {
    const cards = getAllCards();
    const sessionList = getAllSessions();
    
    setAllCards(cards);
    setSessions(sessionList);
  };

  /**
   * 过滤和排序卡片
   */
  const filterAndSortCards = () => {
    let filtered = [...allCards];

    // 搜索过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(term) ||
        card.content.toLowerCase().includes(term) ||
        (card.userNote && card.userNote.toLowerCase().includes(term))
      );
    }

    // 标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter(card => 
        selectedTags.some(tag => card.tags?.includes(tag))
      );
    }

    // 会话过滤
    if (selectedSession !== 'all') {
      filtered = filtered.filter(card => card.sessionId === selectedSession);
    }

    // 类型过滤
    if (cardType !== 'all') {
      filtered = filtered.filter(card => card.type === cardType);
    }

    // 复习状态过滤
    if (reviewStatus !== 'all') {
      const now = Date.now();
      if (reviewStatus === 'due') {
        filtered = filtered.filter(card => card.nextReviewAt <= now);
      } else if (reviewStatus === 'upcoming') {
        filtered = filtered.filter(card => card.nextReviewAt > now);
      }
    }

    // 排序
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'review':
        filtered.sort((a, b) => a.nextReviewAt - b.nextReviewAt);
        break;
    }

    setFilteredCards(filtered);
  };

  /**
   * 生成UUID格式的卡片ID
   */
  const generateCardId = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c == 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  };

  /**
   * 获取所有标签
   */
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    allCards.forEach(card => {
      card.tags?.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  /**
   * 获取会话名称
   */
  const getSessionName = (sessionId: string): string => {
    const session = sessions.find(s => s.id === sessionId);
    return session ? session.title : '未知会话';
  };

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
   * 创建新卡片
   */
  const handleCreateNewCard = () => {
    if (!newCard.title.trim() || !newCard.content.trim()) return;

    // 选择一个默认会话ID（使用最近的会话）
    const defaultSessionId = sessions.length > 0 ? sessions[0].id : 'default';

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
      sessionId: defaultSessionId,
      messageId: generateCardId(), // 使用UUID格式的messageId
    };

    const success = addLearningCard(defaultSessionId, card);
    if (success) {
      loadData();
      setShowNewCardModal(false);
      setNewCard({
        title: '',
        content: '',
        userNote: '',
        tags: [],
        newTag: ''
      });
    }
  };

  /**
   * 编辑卡片
   */
  const handleEditCard = (card: LearningCard) => {
    setEditingCard({ ...card });
  };

  /**
   * 保存卡片编辑
   */
  const handleSaveCard = () => {
    if (!editingCard) return;

    const success = updateLearningCard(editingCard.sessionId, editingCard.id, {
      title: editingCard.title,
      content: editingCard.content,
      userNote: editingCard.userNote,
      tags: editingCard.tags || [],
    });

    if (success) {
      loadData();
      setEditingCard(null);
    }
  };

  /**
   * 删除卡片
   */
  const handleDeleteCard = (card: LearningCard) => {
    if (window.confirm('确定要删除这张卡片吗？')) {
      const success = deleteLearningCard(card.sessionId, card.id);
      if (success) {
        loadData();
      }
    }
  };

  /**
   * 获取需要复习的卡片
   */
  const getFilteredCards = (cards: LearningCard[]) => {
    const now = Date.now();
    return cards.filter(card => card.nextReviewAt <= now);
  };

  /**
   * 开始批量复习
   */
  const handleStartBatchReview = () => {
    const cardsToReview = getFilteredCards(filteredCards);
    if (cardsToReview.length === 0) {
      alert('没有需要复习的卡片');
      return;
    }
    
    setBatchReviewCards(cardsToReview);
    setCurrentBatchIndex(0);
    setCurrentReviewCard(cardsToReview[0]);
    setBatchReviewMode(true);
    setShowReviewModal(true);
  };

  /**
   * 开始复习
   */
  const handleStartReview = (card: LearningCard) => {
    setBatchReviewMode(false);
    setCurrentReviewCard(card);
    setShowReviewModal(true);
  };

  /**
   * 完成复习
   */
  const handleCompleteReview = (quality: number) => {
    if (!currentReviewCard) return;

    const success = recordCardReview(currentReviewCard.sessionId, currentReviewCard.id, quality);
    if (success) {
      loadData();
    }
      
      // 如果是批量复习模式
      if (batchReviewMode && batchReviewCards.length > 0) {
        const nextIndex = currentBatchIndex + 1;
        
        if (nextIndex < batchReviewCards.length) {
          // 还有下一张卡片，继续复习
          setCurrentBatchIndex(nextIndex);
          setCurrentReviewCard(batchReviewCards[nextIndex]);
        } else {
          // 批量复习完成
          setBatchReviewMode(false);
          setBatchReviewCards([]);
          setCurrentBatchIndex(0);
          setShowReviewModal(false);
          setCurrentReviewCard(null);
          alert(`批量复习完成！共复习了 ${batchReviewCards.length} 张卡片 🎉`);
        }
      } else {
        // 单张卡片复习
        setShowReviewModal(false);
        setCurrentReviewCard(null);
      }
  };

  /**
   * 获取统计信息
   */
  const getStats = () => {
    const totalCards = allCards.length;
    const reviewCards = allCards.filter(card => card.nextReviewAt <= Date.now()).length;
    const inspirationCards = allCards.filter(card => card.type === 'inspiration').length;
    const bookmarkCards = allCards.filter(card => card.type === 'bookmark').length;
    
    return { totalCards, reviewCards, inspirationCards, bookmarkCards };
  };

  const stats = getStats();
  const reviewCardsCount = getFilteredCards(filteredCards).length;

  /**
   * 导出卡片数据为CSV格式
   */
  const handleExportCards = async () => {
    try {
      // 获取当前筛选后的卡片数据
      const cardsToExport = filteredCards;
      
      if (cardsToExport.length === 0) {
        alert('没有可导出的卡片数据');
        return;
      }

      // 定义CSV表头
      const headers = [
        '标题',
        '内容',
        '笔记',
        '类型',
        '标签',
        '创建时间',
        '最后复习时间',
        '下次复习时间',
        '复习次数',
        '难度',
        '会话ID',
        '章节ID'
      ];

     /**
      * 清理HTML实体和格式化内容
      */
     const cleanHtmlContent = async (content: string): Promise<string> => {
       if (!content) return '';
       
       // 将Markdown转换为HTML
       let html = marked.parse(content);
       
       // 如果是Promise，等待解析
       if (html instanceof Promise) {
         html = await html;
       }
       
       // 清理所有HTML实体，将常见的实体转换回原字符
       html = html
         .replace(/&#x39;/g, "'")           // 单引号
         .replace(/&#39;/g, "'")            // 单引号（十进制）
         .replace(/&quot;/g, '"')           // 双引号
         .replace(/&#x22;/g, '"')           // 双引号（十六进制）
         .replace(/&#34;/g, '"')            // 双引号（十进制）
         .replace(/&lt;/g, '<')             // 小于号
         .replace(/&gt;/g, '>')             // 大于号
         .replace(/&#x2F;/g, '/')           // 斜杠
         .replace(/&#x2F;/g, '/')           // 斜杠
         .replace(/&#x60;/g, '`')           // 反引号
         .replace(/&#x3D;/g, '=')           // 等号
         .replace(/&#61;/g, '=')            // 等号（十进制）
         .replace(/&#x20;/g, ' ')           // 空格
         .replace(/&#32;/g, ' ')            // 空格（十进制）
         .replace(/&#x2C;/g, ',')           // 逗号
         .replace(/&#44;/g, ',')            // 逗号（十进制）
         .replace(/&#x3A;/g, ':')           // 冒号
         .replace(/&#58;/g, ':')            // 冒号（十进制）
         .replace(/&#x3B;/g, ';')           // 分号
         .replace(/&#59;/g, ';')            // 分号（十进制）
         .replace(/&#x21;/g, '!')           // 感叹号
         .replace(/&#33;/g, '!')            // 感叹号（十进制）
         .replace(/&#x3F;/g, '?')           // 问号
         .replace(/&#63;/g, '?')            // 问号（十进制）
         .replace(/&#x28;/g, '(')           // 左括号
         .replace(/&#40;/g, '(')            // 左括号（十进制）
         .replace(/&#x29;/g, ')')           // 右括号
         .replace(/&#41;/g, ')')            // 右括号（十进制）
         .replace(/&#x5B;/g, '[')           // 左方括号
         .replace(/&#91;/g, '[')            // 左方括号（十进制）
         .replace(/&#x5D;/g, ']')           // 右方括号
         .replace(/&#93;/g, ']')            // 右方括号（十进制）
         .replace(/&#x7B;/g, '{')           // 左花括号
         .replace(/&#123;/g, '{')           // 左花括号（十进制）
         .replace(/&#x7D;/g, '}')           // 右花括号
         .replace(/&#125;/g, '}')           // 右花括号（十进制）
         .replace(/&amp;/g, '&');           // &符号（最后处理，避免影响其他实体）
       
       // 移除多余的换行符，但保留段落结构
       html = html.replace(/\n+/g, '');
       
       // 将HTML的段落标签转换为换行，让Anki能正确显示
       html = html
         .replace(/<\/p><p>/g, '\n\n')      // 段落之间添加双换行
         .replace(/<p>/g, '')               // 移除开始段落标签
         .replace(/<\/p>/g, '')             // 移除结束段落标签
         .replace(/<br\s*\/?>/g, '\n')      // br标签转换为换行
         .replace(/<\/div><div>/g, '\n')    // div换行
         .replace(/<div>/g, '')             // 移除div标签
         .replace(/<\/div>/g, '');          // 移除div结束标签
       
       // 移除表情符号（Unicode表情符号范围）
       html = html
         .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // 表情符号
         .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // 符号和象形文字
         .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // 交通和地图符号
         .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // 国旗
         .replace(/[\u{2600}-\u{26FF}]/gu, '')   // 杂项符号
         .replace(/[\u{2700}-\u{27BF}]/gu, '')   // 装饰符号
         .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // 补充符号和象形文字
         .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // 扩展A符号和象形文字
         .replace(/👍|👎|😊|😃|😄|😁|😆|😅|🤣|😂|🙂|🙃|😉|😊|😇|🥰|😍|🤩|😘|😗|😚|😙|😋|😛|😜|🤪|😝|🤑|🤗|🤭|🤫|🤔|🤐|🤨|😐|😑|😶|😏|😒|🙄|😬|🤥|😌|😔|😪|🤤|😴|😷|🤒|🤕|🤢|🤮|🤧|🥵|🥶|🥴|😵|🤯|🤠|🥳|😎|🤓|🧐|😕|😟|🙁|☹️|😮|😯|😲|😳|🥺|😦|😧|😨|😰|😥|😢|😭|😱|😖|😣|😞|😓|😩|😫|🥱|😤|😡|🤬|😠|💡|⭐|✨|🎉|🔥|💪|👏|🙌|👋|🤝|💯/g, '');
       
       return html.trim();
     };
      // 转换卡片数据为CSV行
      const csvRows = await Promise.all(cardsToExport.map(async card => {
       // 处理卡片内容和用户笔记
       const contentHtml = await cleanHtmlContent(card.content || '');
       const noteHtml = await cleanHtmlContent(card.userNote || '');
        
        // 格式化时间
        const formatDateTime = (timestamp?: number) => {
          if (!timestamp) return '';
          return new Date(timestamp).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }).replace(/\//g, '-');
        };

        // 处理标签（用空格分隔，符合Anki习惯）
        const tagsString = (card.tags || []).join(' ');
        
        // 类型转换为中文
        const typeLabel = card.type === 'inspiration' ? '灵感' : '收藏';

        return [
          card.title || '',
          contentHtml,
          noteHtml,
          typeLabel,
          tagsString,
          formatDateTime(card.createdAt),
          formatDateTime(card.lastReviewedAt),
          formatDateTime(card.nextReviewAt),
          card.reviewCount.toString(),
          card.difficulty.toString(),
          card.sessionId,
          card.chapterId || ''
        ];
      }));

      // CSV字段转义函数
      const escapeCSVField = (field: string): string => {
        // 如果字段包含逗号、双引号或换行符，需要用双引号包裹
        if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
          // 将字段中的双引号转义为两个双引号
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      // 构建CSV内容
      const csvContent = [
        // 表头
        headers.map(escapeCSVField).join(','),
        // 数据行
        ...csvRows.map(row => row.map(escapeCSVField).join(','))
      ].join('\n');

      // 添加UTF-8 BOM，确保Excel等软件正确识别编码
      const csvWithBOM = '\uFEFF' + csvContent;

      // 创建Blob对象
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      
      // 创建下载链接
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      // 生成文件名（包含当前日期）
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `learning_cards_export_${today}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理URL对象
      URL.revokeObjectURL(url);
      
      // 显示成功消息
      alert(`成功导出 ${cardsToExport.length} 张卡片到文件：${filename}`);
      
    } catch (error) {
      console.error('导出卡片失败:', error);
      alert('导出失败，请重试');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* 头部导航 */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/')}
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  返回
                </Button>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">卡片管理</h1>
                    <p className="text-sm text-gray-500">管理您的所有学习卡片</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {reviewCardsCount > 0 && (
                  <Button
                    variant="secondary"
                    onClick={handleStartBatchReview}
                    icon={<TrendingUp className="w-4 h-4" />}
                  >
                    开始批量复习 ({reviewCardsCount} 张)
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleExportCards}
                  icon={<Download className="w-4 h-4" />}
                >
                  导出卡片
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setShowNewCardModal(true)}
                  icon={<Plus className="w-4 h-4" />}
                >
                  新建卡片
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalCards}</div>
              <div className="text-sm text-gray-600">总卡片数</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">{stats.reviewCards}</div>
              <div className="text-sm text-gray-600">待复习</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.inspirationCards}</div>
              <div className="text-sm text-gray-600">灵感卡片</div>
            </Card>
            <Card className="text-center p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">{stats.bookmarkCards}</div>
              <div className="text-sm text-gray-600">收藏卡片</div>
            </Card>
          </div>

          {/* 搜索和过滤区域 */}
          <Card className="p-6 mb-8">
            <div className="space-y-4">
              {/* 搜索栏 */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="搜索卡片标题、内容或笔记..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    leftIcon={<Search className="w-4 h-4" />}
                  />
                </div>
              </div>

              {/* 过滤器 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Select
                  label="会话"
                  value={selectedSession}
                  onChange={setSelectedSession}
                  options={[
                    { value: 'all', label: '所有会话' },
                    ...sessions.map(session => ({
                      value: session.id,
                      label: session.title
                    }))
                  ]}
                />

                <Select
                  label="类型"
                  value={cardType}
                  onChange={setCardType}
                  options={[
                    { value: 'all', label: '所有类型' },
                    { value: 'inspiration', label: '灵感卡片' },
                    { value: 'bookmark', label: '收藏卡片' }
                  ]}
                />

                <Select
                  label="复习状态"
                  value={reviewStatus}
                  onChange={setReviewStatus}
                  options={[
                    { value: 'all', label: '所有状态' },
                    { value: 'due', label: '需要复习' },
                    { value: 'upcoming', label: '即将复习' }
                  ]}
                />

                <Select
                  label="排序方式"
                  value={sortBy}
                  onChange={(value) => setSortBy(value as typeof sortBy)}
                  options={[
                    { value: 'recent', label: '最近创建' },
                    { value: 'title', label: '标题排序' },
                    { value: 'review', label: '复习时间' }
                  ]}
                />
              </div>

              {/* 标签过滤 */}
              {getAllTags().length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">标签过滤：</div>
                  <div className="flex flex-wrap gap-2">
                    {getAllTags().map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTagFilter(tag)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* 卡片列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || selectedTags.length > 0 || selectedSession !== 'all' || cardType !== 'all' || reviewStatus !== 'all'
                    ? '没有找到匹配的卡片' 
                    : '还没有学习卡片'
                  }
                </h3>
                <p className="text-gray-500">
                  {searchTerm || selectedTags.length > 0 || selectedSession !== 'all' || cardType !== 'all' || reviewStatus !== 'all'
                    ? '尝试调整搜索条件或过滤器'
                    : '开始学习并收藏重要内容，或点击上方按钮新建卡片'
                  }
                </p>
              </div>
            ) : (
              filteredCards.map(card => {
                const isOverdue = card.nextReviewAt <= Date.now();
                
                return (
                  <Card
                    key={card.id}
                    className={`transition-all duration-200 hover:shadow-lg ${
                      isOverdue ? 'border-orange-300 bg-orange-50' : ''
                    }`}
                  >
                    <div className="p-6">
                      {/* 卡片头部 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {card.type === 'inspiration' ? (
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                              <span className="text-yellow-600 text-sm">💡</span>
                            </div>
                          ) : (
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm">⭐</span>
                            </div>
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
                            className="text-gray-400 hover:text-gray-600"
                          >
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCard(card)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            删除
                          </Button>
                        </div>
                      </div>

                      {/* 卡片内容 */}
                      <div className="mb-4">
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
                      <div className="space-y-2 text-xs text-gray-500">
                        <div className="flex items-center justify-between">
                          <span>来源：{getSessionName(card.sessionId)}</span>
                          <span>{formatTime(card.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>复习 {card.reviewCount} 次</span>
                          <span className={`
                            ${isOverdue ? 'text-orange-600 font-medium' : 'text-gray-500'}
                          `}>
                            {formatNextReview(card.nextReviewAt)}
                          </span>
                        </div>
                        {isOverdue && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStartReview(card)}
                            className="w-full text-xs"
                          >
                            开始复习
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </main>
      </div>

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
                        onClick={() => setNewCard(prev => ({
                          ...prev,
                          tags: prev.tags.filter(t => t !== tag)
                        }))}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
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
                        const tag = newCard.newTag.trim();
                        if (tag && !newCard.tags.includes(tag)) {
                          setNewCard(prev => ({
                            ...prev,
                            tags: [...prev.tags, tag],
                            newTag: ''
                          }));
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const tag = newCard.newTag.trim();
                      if (tag && !newCard.tags.includes(tag)) {
                        setNewCard(prev => ({
                          ...prev,
                          tags: [...prev.tags, tag],
                          newTag: ''
                        }));
                      }
                    }}
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
                        onClick={() => setEditingCard(prev => prev ? {
                          ...prev,
                          tags: (prev.tags || []).filter(t => t !== tag)
                        } : null)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        ×
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
                        const tag = e.currentTarget.value.trim();
                        if (tag && !editingCard.tags?.includes(tag)) {
                          setEditingCard(prev => prev ? {
                            ...prev,
                            tags: [...(prev.tags || []), tag]
                          } : null);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.parentElement?.querySelector('input');
                      if (input) {
                        const tag = input.value.trim();
                        if (tag && !editingCard.tags?.includes(tag)) {
                          setEditingCard(prev => prev ? {
                            ...prev,
                            tags: [...(prev.tags || []), tag]
                          } : null);
                          input.value = '';
                        }
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-primary-600" />
                {batchReviewMode ? '批量复习' : '复习卡片'}
              </h3>
              
              {/* 批量复习进度指示器 */}
              {batchReviewMode && (
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {currentBatchIndex + 1} / {batchReviewCards.length}
                </div>
              )}
            </div>
            
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

            <div className="flex justify-center gap-3">
              {batchReviewMode && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setBatchReviewMode(false);
                    setBatchReviewCards([]);
                    setCurrentBatchIndex(0);
                    setShowReviewModal(false);
                    setCurrentReviewCard(null);
                  }}
                >
                  退出批量复习
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  if (batchReviewMode) {
                    setBatchReviewMode(false);
                    setBatchReviewCards([]);
                    setCurrentBatchIndex(0);
                  }
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
    </>
  );
};

export default CardsPage;