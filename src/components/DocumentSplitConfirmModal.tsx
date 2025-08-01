/**
 * 文档拆分确认对话框组件
 * 
 * 当检测到文档超过12000字时，显示拆分确认对话框
 * 让用户选择是否将大文档拆分成多个小文档进行学习
 */

import React from 'react';
import { DocumentSplit } from '../types';
import Modal from './ui/Modal';
import Button from './ui/Button';

interface DocumentSplitConfirmModalProps {
  /** 是否显示对话框 */
  isOpen: boolean;
  /** 原始文档标题 */
  originalTitle: string;
  /** 原始文档字数 */
  originalWordCount: number;
  /** 拆分后的文档片段 */
  splitDocuments: DocumentSplit[];
  /** 确认拆分的回调函数 */
  onConfirm: () => void;
  /** 取消拆分的回调函数 */
  onCancel: () => void;
  /** 关闭对话框的回调函数 */
  onClose: () => void;
}

/**
 * 文档拆分确认对话框组件
 * 
 * 功能特点：
 * - 显示原始文档信息和拆分预览
 * - 提供友好的拆分建议说明
 * - 支持确认或取消拆分操作
 * - 响应式设计，适配不同屏幕尺寸
 */
const DocumentSplitConfirmModal: React.FC<DocumentSplitConfirmModalProps> = ({
  isOpen,
  originalTitle,
  originalWordCount,
  splitDocuments,
  onConfirm,
  onCancel,
  onClose,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        {/* 标题 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            📄 文档过长，建议拆分学习
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            您上传的文档内容较多，为了更好的学习体验，建议拆分成多个部分进行学习。
          </p>
        </div>

        {/* 文档信息 */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 文档信息
          </h3>
          <div className="space-y-1 text-sm">
            <div>
              <span className="text-blue-700 dark:text-blue-300">原始文档：</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100">{originalTitle}</span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">文档长度：</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100">
                {originalWordCount.toLocaleString()} 字
              </span>
            </div>
            <div>
              <span className="text-blue-700 dark:text-blue-300">建议拆分：</span>
              <span className="ml-2 text-gray-900 dark:text-gray-100">
                {splitDocuments.length} 个部分
              </span>
            </div>
          </div>
        </div>

        {/* 拆分预览 */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
            📋 拆分预览
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {splitDocuments.map((split, index) => (
              <div
                key={split.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {split.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    约 {split.wordCount.toLocaleString()} 字
                  </div>
                </div>
                <div className="ml-4 text-xs text-gray-400 dark:text-gray-500">
                  第 {index + 1} 部分
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 拆分优势说明 */}
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✨ 拆分学习的优势
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• 每个部分内容适中，学习更有针对性</li>
            <li>• 可以根据自己的时间安排，灵活选择学习顺序</li>
            <li>• 更好的学习进度控制和成就感</li>
            <li>• 避免因内容过多而产生学习压力</li>
          </ul>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="px-6 py-2"
          >
            继续整篇学习
          </Button>
          <Button
            onClick={onConfirm}
            variant="primary"
            className="px-6 py-2"
          >
            确认拆分学习
          </Button>
        </div>

        {/* 提示说明 */}
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          💡 提示：拆分后，您可以自由选择学习顺序和难度级别
        </div>
      </div>
    </Modal>
  );
};

export default DocumentSplitConfirmModal;