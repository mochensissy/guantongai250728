/**
 * 拆分文档选择器组件
 * 
 * 当用户确认拆分大文档后，显示所有拆分片段供用户选择学习
 */

import React, { useState } from 'react';
import { DocumentSplit } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';

interface SplitDocumentSelectorProps {
  /** 拆分后的文档片段列表 */
  splitDocuments: DocumentSplit[];
  /** 选择文档片段的回调函数 */
  onSelectDocument: (selectedSplit: DocumentSplit) => void;
  /** 返回重新选择的回调函数 */
  onGoBack?: () => void;
}

/**
 * 拆分文档选择器组件
 * 
 * 功能特点：
 * - 以卡片形式展示所有拆分片段
 * - 显示每个片段的标题、字数和内容预览
 * - 支持选择任意片段开始学习
 * - 提供返回功能重新选择
 * - 响应式布局适配不同屏幕
 */
const SplitDocumentSelector: React.FC<SplitDocumentSelectorProps> = ({
  splitDocuments,
  onSelectDocument,
  onGoBack,
}) => {
  const [selectedSplitId, setSelectedSplitId] = useState<string | null>(null);

  /**
   * 获取内容预览文本
   * 截取前200字符作为预览
   */
  const getContentPreview = (content: string): string => {
    const preview = content.trim().substring(0, 200);
    return preview.length < content.trim().length ? preview + '...' : preview;
  };

  /**
   * 处理文档选择
   */
  const handleSelectSplit = (split: DocumentSplit) => {
    console.log(`🎯 用户选择了文档片段:`, {
      id: split.id,
      title: split.title,
      index: split.index,
      wordCount: split.wordCount,
      contentLength: split.content.length,
      contentPreview: split.content.substring(0, 100) + '...'
    });
    
    setSelectedSplitId(split.id);
    // 短暂延迟后执行选择，提供视觉反馈
    setTimeout(() => {
      console.log(`📤 调用 onSelectDocument 传递选中的文档片段`);
      onSelectDocument(split);
    }, 150);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* 标题和说明 */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          📚 选择学习内容
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-2">
          文档已成功拆分为 {splitDocuments.length} 个部分，请选择您想要学习的内容
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          💡 您可以按任意顺序学习，每完成一部分后可以继续选择其他部分
        </p>
      </div>

      {/* 原始文档信息 */}
      {splitDocuments.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📄 原始文档信息
          </h3>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <span>文档标题：{splitDocuments[0].originalTitle}</span>
            <span className="ml-6">
              总字数：{splitDocuments.reduce((sum, split) => sum + split.wordCount, 0).toLocaleString()} 字
            </span>
          </div>
        </div>
      )}

      {/* 文档片段列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {splitDocuments.map((split) => (
          <Card
            key={split.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
              selectedSplitId === split.id
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
            }`}
            onClick={() => handleSelectSplit(split)}
          >
            <div className="p-5">
              {/* 片段标题和序号 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
                    {split.title}
                  </h3>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded-full">
                    {split.index}
                  </span>
                </div>
              </div>

              {/* 字数信息 */}
              <div className="mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                  📊 {split.wordCount.toLocaleString()} 字
                </span>
              </div>

              {/* 内容预览 */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">
                  {getContentPreview(split.content)}
                </p>
              </div>

              {/* 上下文信息展示 */}
              {(split.fullDocumentSummary || split.previousChaptersSummary || (split.crossReferences && split.crossReferences.length > 0)) && (
                <div className="mb-4 text-xs">
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-1 mb-2 text-blue-700 dark:text-blue-300 font-medium">
                      🧠 智能上下文增强
                    </div>
                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      {split.fullDocumentSummary && (
                        <div className="flex items-center gap-1">
                          <span>📚</span>
                          <span>包含完整文档概览</span>
                        </div>
                      )}
                      {split.previousChaptersSummary && (
                        <div className="flex items-center gap-1">
                          <span>🔗</span>
                          <span>前文章节关联总结</span>
                        </div>
                      )}
                      {split.crossReferences && split.crossReferences.length > 0 && (
                        <div className="flex items-center gap-1">
                          <span>📎</span>
                          <span>{split.crossReferences.length} 个章节交叉引用</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 选择按钮 */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant={selectedSplitId === split.id ? "primary" : "secondary"}
                  size="sm"
                  className="w-full"
                  disabled={selectedSplitId === split.id}
                  onClick={(e) => {
                    e.stopPropagation(); // 防止冒泡到Card的onClick
                    handleSelectSplit(split);
                  }}
                >
                  {selectedSplitId === split.id ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      选择中...
                    </>
                  ) : (
                    '开始学习此部分'
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 底部操作区 */}
      <div className="flex justify-center space-x-4">
        {onGoBack && (
          <Button
            onClick={onGoBack}
            variant="secondary"
            className="px-6 py-2"
          >
            ← 返回重新选择
          </Button>
        )}
        
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
          💡 选择任意部分开始您的学习之旅
        </div>
      </div>

      {/* 学习建议 */}
      <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
          📖 学习建议
        </h3>
        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
          <li>• 建议先浏览各部分标题，了解整体结构</li>
          <li>• 可以从感兴趣的部分开始，或按顺序学习</li>
          <li>• 每完成一部分后，可以回到这里选择下一部分</li>
          <li>• 学习过程中可以随时切换难度级别</li>
        </ul>
      </div>
    </div>
  );
};

export default SplitDocumentSelector;