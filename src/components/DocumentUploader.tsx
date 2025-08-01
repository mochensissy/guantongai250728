/**
 * 文档上传组件
 * 
 * 支持多种方式上传学习材料：
 * - 文件拖拽上传
 * - 点击选择文件
 * - URL输入
 * - 支持多种文档格式
 * - 上传进度和状态显示
 */

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, Link, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import { parseDocument, validateParseResult } from '../utils/documentParser';
import { DocumentParseResult, APIConfig } from '../types';

interface DocumentUploaderProps {
  /** 文档上传完成回调 */
  onUploadComplete: (result: DocumentParseResult) => void;
  /** 是否正在处理 */
  loading?: boolean;
  /** API配置，用于AI增强标题生成 */
  apiConfig?: APIConfig | null;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  onUploadComplete,
  loading = false,
  // apiConfig, // 暂时未使用，保留用于未来功能扩展
}) => {
  // 状态管理
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'text'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    message: string;
    type: 'info' | 'success' | 'error';
    progress?: number; // 新增进度字段
  }>({
    isProcessing: false,
    message: '',
    type: 'info',
    progress: 0,
  });

  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的文件类型
  const supportedFileTypes = [
    '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.md', '.txt'
  ];

  const supportedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/markdown',
    'text/plain',
  ];

  /**
   * 更新处理状态
   */
  const updateProcessingStatus = (
    isProcessing: boolean, 
    message: string, 
    type: 'info' | 'success' | 'error' = 'info',
    progress?: number
  ) => {
    setProcessingStatus({ isProcessing, message, type, progress });
  };

  /**
   * 验证文件类型
   */
  const validateFileType = (file: File): boolean => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeTypeValid = supportedMimeTypes.includes(file.type);
    const extensionValid = supportedFileTypes.includes(fileExtension);
    
    return mimeTypeValid || extensionValid;
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // 验证文件类型
    if (!validateFileType(file)) {
      updateProcessingStatus(
        false, 
        `不支持的文件类型。当前支持的格式：${supportedFileTypes.join(', ')}`, 
        'error'
      );
      return;
    }

    // 验证文件大小（限制为20MB）
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      updateProcessingStatus(false, '文件大小不能超过20MB', 'error');
      return;
    }

    updateProcessingStatus(true, '正在准备解析文件...', 'info', 0);
    
    try {
      // 定义进度回调函数
      const progressCallback = (progress: number, status: string) => {
        updateProcessingStatus(true, status, 'info', Math.round(progress));
      };
      
      const result = await parseDocument(file, undefined, progressCallback);
      
      if (validateParseResult(result)) {
        updateProcessingStatus(false, '文件解析成功！', 'success', 100);
        onUploadComplete(result);
      } else {
        updateProcessingStatus(false, '文件解析失败，请检查文件格式', 'error', 0);
      }
    } catch (error) {
      updateProcessingStatus(
        false, 
        `文件处理失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        'error',
        0
      );
    }
  };

  /**
   * 处理URL输入
   */
  const handleURLSubmit = async () => {
    const url = urlInput.trim();
    
    if (!url) {
      updateProcessingStatus(false, '请输入有效的URL', 'error');
      return;
    }

    // 简单的URL格式验证
    try {
      new URL(url);
    } catch {
      updateProcessingStatus(false, '请输入有效的URL格式', 'error');
      return;
    }

    updateProcessingStatus(true, '正在解析URL...', 'info');
    
    try {
      const result = await parseDocument(url);
      
      if (validateParseResult(result)) {
        updateProcessingStatus(false, 'URL解析成功！', 'success');
        onUploadComplete(result);
      } else {
        updateProcessingStatus(false, 'URL解析失败，请检查链接是否有效', 'error');
      }
    } catch (error) {
      updateProcessingStatus(
        false, 
        `URL解析失败: ${error instanceof Error ? error.message : '未知错误'}。提示：由于浏览器安全限制，某些网站可能无法直接访问。建议复制网页内容后使用文本粘贴功能。`, 
        'error'
      );
    }
  };

  /**
   * 处理文本输入
   */
  const handleTextSubmit = async () => {
    const text = textInput.trim();
    
    if (!text) {
      updateProcessingStatus(false, '请输入文本内容', 'error');
      return;
    }

    if (text.length < 100) {
      updateProcessingStatus(false, '文本内容太少，请输入至少100个字符的内容', 'error');
      return;
    }

    updateProcessingStatus(true, '正在解析文本...', 'info');
    
    try {
      // 首先进行基础解析
      const result = await parseDocument(text);
      
      if (!validateParseResult(result)) {
        updateProcessingStatus(false, '文本解析失败，请检查内容格式', 'error');
        return;
      }

      // 注意：标题生成现在集成在大纲生成阶段进行，这里不再单独调用AI
      
      updateProcessingStatus(false, '文本解析成功！', 'success');
      onUploadComplete(result);
      
    } catch (error) {
      updateProcessingStatus(
        false, 
        `文本处理失败: ${error instanceof Error ? error.message : '未知错误'}`, 
        'error'
      );
    }
  };

  /**
   * 拖拽事件处理
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  /**
   * 文件选择处理
   */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
  };

  /**
   * 触发文件选择
   */
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const isProcessing = processingStatus.isProcessing || loading;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 上传方式选择 */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <Button
          variant={uploadMethod === 'file' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setUploadMethod('file')}
          disabled={isProcessing}
          className="flex-1"
        >
          文件上传
        </Button>
        <Button
          variant={uploadMethod === 'url' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setUploadMethod('url')}
          disabled={isProcessing}
          className="flex-1"
        >
          URL链接
        </Button>
        <Button
          variant={uploadMethod === 'text' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setUploadMethod('text')}
          disabled={isProcessing}
          className="flex-1"
        >
          文本粘贴
        </Button>
      </div>

      {uploadMethod === 'file' ? (
        // 文件上传区域
        <div
          className={`
            border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
            ${isDragOver 
              ? 'border-primary-400 bg-primary-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileSelect}
        >
          <div className="space-y-4">
            <div className="flex justify-center">
              <Upload className={`w-12 h-12 ${
                isDragOver ? 'text-primary-500' : 'text-gray-400'
              }`} />
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isDragOver ? '松开鼠标上传文件' : '上传学习文档'}
              </h3>
              <p className="text-gray-600 mb-4">
                拖拽文件到此处，或点击选择文件
              </p>
              
              <div className="text-sm text-gray-500">
                <p>支持格式：PDF、Word、PowerPoint、Markdown、文本文件</p>
                <p>文件大小限制：20MB以内</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              disabled={isProcessing}
              icon={<FileText className="w-4 h-4" />}
            >
              选择文件
            </Button>
          </div>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={supportedFileTypes.join(',')}
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
        </div>
      ) : uploadMethod === 'url' ? (
        // URL输入区域
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <Link className="w-12 h-12 text-gray-400" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                通过URL链接学习
              </h3>
              <p className="text-gray-600 mb-4">
                输入网页或在线文档的URL地址
              </p>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="https://example.com/article 或 https://docs.google.com/document/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={isProcessing}
                leftIcon={<Link className="w-4 h-4" />}
              />
              
              <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
                <p><strong>💡 使用提示：</strong></p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• 支持大部分公开网页（博客、新闻、文档等）</li>
                  <li>• 微信公众号文章可能需要手动复制</li>
                  <li>• 如果解析失败，请使用"文本粘贴"功能</li>
                  <li>• 示例：https://example.com/article</li>
                </ul>
              </div>
              
              <Button
                variant="primary"
                size="lg"
                onClick={handleURLSubmit}
                disabled={isProcessing || !urlInput.trim()}
                loading={isProcessing}
                className="w-full"
              >
                开始解析
              </Button>
            </div>
          </div>
        </div>
      ) : (
        // 文本粘贴区域
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                粘贴文本内容
              </h3>
              <p className="text-gray-600 mb-4">
                直接粘贴您想要学习的文本内容
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <textarea
                  placeholder="请粘贴您的文本内容..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  disabled={isProcessing}
                  rows={8}
                  className="
                    w-full px-4 py-3 border border-gray-300 rounded-lg resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                    disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
                    text-sm leading-relaxed transition-colors duration-200
                  "
                />
                <div className="mt-2 text-xs text-gray-500">
                  已输入 {textInput.length} 个字符（建议至少100个字符）
                </div>
              </div>
              
              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                <p>💡 提示：您可以从网页、文档或任何地方复制文本内容，然后粘贴到这里进行学习。</p>
              </div>
              
              <Button
                variant="primary"
                size="lg"
                onClick={handleTextSubmit}
                disabled={isProcessing || textInput.trim().length < 100}
                loading={isProcessing}
                className="w-full"
              >
                开始解析
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 处理状态显示 */}
      {processingStatus.message && (
        <div className={`mt-6 rounded-lg p-4 ${
          processingStatus.type === 'success' 
            ? 'bg-green-50 border border-green-200' 
            : processingStatus.type === 'error'
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {processingStatus.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              ) : processingStatus.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              ) : (
                <div className="w-5 h-5 flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                </div>
              )}
              
              <span className={`text-sm font-medium ${
                processingStatus.type === 'success' 
                  ? 'text-green-900' 
                  : processingStatus.type === 'error'
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}>
                {processingStatus.message}
              </span>
            </div>
            
            {/* 进度条 - 仅在处理中且有进度数据时显示 */}
            {processingStatus.isProcessing && typeof processingStatus.progress === 'number' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-600">解析进度</span>
                  <span className="text-gray-900 font-medium">{processingStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.max(0, Math.min(100, processingStatus.progress))}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;