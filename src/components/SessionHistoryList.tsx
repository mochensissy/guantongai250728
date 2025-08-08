/**
 * 学习会话历史列表组件
 * 
 * 显示用户的所有学习会话记录：
 * - 会话列表展示
 * - 快速搜索和筛选
 * - 会话恢复功能
 * - 会话删除管理
 * - 状态标识和进度显示
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Clock, 
  FileText, 
  Trash2, 
  Play, 
  MoreVertical,
  Filter 
} from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import { LearningSession } from '../types';

interface SessionHistoryListProps {
  /** 会话列表 */
  sessions: LearningSession[];
  /** 进入会话回调 */
  onEnterSession: (sessionId: string) => void;
  /** 删除会话回调 */
  onDeleteSession: (sessionId: string) => void;
  /** 是否正在加载 */
  loading?: boolean;
}

const SessionHistoryList: React.FC<SessionHistoryListProps> = ({
  sessions,
  onEnterSession,
  onDeleteSession,
  loading = false,
}) => {
  // 状态管理
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'status'>('recent');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  /**
   * 过滤和排序会话
   */
  const filteredAndSortedSessions = useMemo(() => {
    let filtered = sessions;

    // 搜索过滤
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(session => 
        session.title.toLowerCase().includes(term) ||
        session.documentType.toLowerCase().includes(term)
      );
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }

    // 排序
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.updatedAt - a.updatedAt);
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'status':
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return filtered;
  }, [sessions, searchTerm, filterStatus, sortBy]);

  // 是否全选（基于当前过滤后的列表）
  const allSelected = filteredAndSortedSessions.length > 0 &&
    selectedIds.length === filteredAndSortedSessions.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAndSortedSessions.map(s => s.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`确定要删除选中的 ${selectedIds.length} 个学习记录吗？此操作不可恢复。`)) {
      return;
    }
    // 逐个调用外部删除回调
    selectedIds.forEach(id => onDeleteSession(id));
    setSelectedIds([]);
  };

  /**
   * 格式化日期
   */
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  /**
   * 获取文档类型显示名称
   */
  const getDocumentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'url': '网页链接',
      'pdf': 'PDF文档',
      'word': 'Word文档',
      'ppt': 'PPT演示',
      'markdown': 'Markdown',
      'text': '文本文档',
    };
    return typeMap[type] || type;
  };

  /**
   * 获取状态显示信息
   */
  const getStatusInfo = (status: LearningSession['status']) => {
    switch (status) {
      case 'draft':
        return { label: '草稿', color: 'text-gray-600', bgColor: 'bg-gray-100' };
      case 'active':
        return { label: '学习中', color: 'text-blue-600', bgColor: 'bg-blue-100' };
      case 'completed':
        return { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' };
      case 'paused':
        return { label: '已暂停', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
      default:
        return { label: '未知', color: 'text-gray-600', bgColor: 'bg-gray-100' };
    }
  };

  /**
   * 计算学习进度
   */
  const calculateProgress = (session: LearningSession): number => {
    if (session.outline.length === 0) return 0;
    const completedCount = session.outline.filter(item => item.isCompleted).length;
    return Math.round((completedCount / session.outline.length) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 搜索和筛选栏 */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* 搜索输入 */}
        <div className="flex-1">
          <Input
            placeholder="搜索学习记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* 状态筛选 + 批量操作 */}
        <div className="flex gap-2 items-center">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">所有状态</option>
            <option value="draft">草稿</option>
            <option value="active">学习中</option>
            <option value="completed">已完成</option>
            <option value="paused">已暂停</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="recent">最近更新</option>
            <option value="title">标题排序</option>
            <option value="status">状态排序</option>
          </select>

          {/* 批量选择与删除 */}
          {filteredAndSortedSessions.length > 0 && (
            <div className="flex items-center gap-3 ml-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4"
                />
                全选
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBatchDelete}
                disabled={selectedIds.length === 0}
              >
                批量删除{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* 会话列表 */}
      <div className="space-y-4">
        {filteredAndSortedSessions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? '没有找到匹配的记录' : '还没有学习记录'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchTerm || filterStatus !== 'all' 
                ? '试试调整搜索条件或筛选器' 
                : '上传您的第一个文档开始学习吧'
              }
            </p>
          </div>
        ) : (
          filteredAndSortedSessions.map((session) => {
            const statusInfo = getStatusInfo(session.status);
            const progress = calculateProgress(session);

            return (
              <Card
                key={session.id}
                hoverable
                className="transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  {/* 选择框 */}
                  <div className="mr-3 mt-1">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selectedIds.includes(session.id)}
                      onChange={() => toggleSelectOne(session.id)}
                    />
                  </div>
                  {/* 会话信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {session.title}
                      </h3>
                      
                      {/* 状态标签 */}
                      <span className={`
                        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                        ${statusInfo.color} ${statusInfo.bgColor}
                      `}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* 元数据 */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {getDocumentTypeLabel(session.documentType)}
                      </span>
                      
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDate(session.updatedAt)}
                      </span>

                      <span>
                        {session.outline.length} 个章节
                      </span>

                      <span>
                        {(() => {
                          const completed = session.outline.filter(item => item.isCompleted).length;
                          return `${completed} 个已完成`;
                        })()}
                      </span>

                      <span>
                        {session.messages.length} 条消息
                      </span>
                    </div>

                    {/* 进度条 */}
                    {session.outline.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>学习进度</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 当前章节信息 */}
                    {session.currentChapter && (
                      <div className="text-sm text-gray-600">
                        当前学习：
                        {session.outline.find(item => item.id === session.currentChapter)?.title || '未知章节'}
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onEnterSession(session.id)}
                      icon={<Play className="w-4 h-4" />}
                    >
                      继续学习
                    </Button>

                    <div className="relative group">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<MoreVertical className="w-4 h-4" />}
                      />
                      
                      {/* 下拉菜单 */}
                      <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                        <button
                          onClick={() => onDeleteSession(session.id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* 统计信息 */}
      {sessions.length > 0 && (
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
          共 {sessions.length} 个学习记录
          {filteredAndSortedSessions.length !== sessions.length && (
            <span> · 显示 {filteredAndSortedSessions.length} 个</span>
          )}
        </div>
      )}
    </div>
  );
};

export default SessionHistoryList;