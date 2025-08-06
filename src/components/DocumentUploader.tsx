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
import { DocumentParseResult, APIConfig, DocumentSplit } from '../types';
import DocumentSplitConfirmModal from './DocumentSplitConfirmModal';
import SplitDocumentSelector from './SplitDocumentSelector';

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
    canRetry?: boolean; // 新增重试字段
  }>({
    isProcessing: false,
    message: '',
    type: 'info',
    progress: 0,
    canRetry: false,
  });

  // 重试相关状态
  const [lastUploadData, setLastUploadData] = useState<{
    type: 'file' | 'url' | 'text';
    data: File | string;
  } | null>(null);

  // 文档拆分相关状态
  const [showSplitConfirm, setShowSplitConfirm] = useState(false);
  const [showSplitSelector, setShowSplitSelector] = useState(false);
  const [currentParseResult, setCurrentParseResult] = useState<DocumentParseResult | null>(null);

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

  // 文件类型对应的友好名称
  const fileTypeNames = {
    '.pdf': 'PDF文档',
    '.doc': 'Word文档',
    '.docx': 'Word文档',
    '.ppt': 'PowerPoint演示文稿',
    '.pptx': 'PowerPoint演示文稿',
    '.md': 'Markdown文档',
    '.txt': '文本文件'
  };

  /**
   * 更新处理状态
   */
  const updateProcessingStatus = (
    isProcessing: boolean, 
    message: string, 
    type: 'info' | 'success' | 'error' = 'info',
    progress?: number,
    canRetry: boolean = false
  ) => {
    setProcessingStatus({ isProcessing, message, type, progress, canRetry });
  };

  /**
   * 验证文件类型
   */
  const validateFileType = (file: File): { valid: boolean; detectedType?: string } => {
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const mimeTypeValid = supportedMimeTypes.includes(file.type);
    const extensionValid = supportedFileTypes.includes(fileExtension);
    
    const detectedType = fileTypeNames[fileExtension as keyof typeof fileTypeNames] || '未知类型';
    
    return {
      valid: mimeTypeValid || extensionValid,
      detectedType
    };
  };

  /**
   * 处理文件上传
   */
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // 验证文件类型
    const validation = validateFileType(file);
    if (!validation.valid) {
      updateProcessingStatus(
        false, 
        `不支持的文件类型（检测到：${validation.detectedType}）\n\n💡 支持的文件格式：\n• PDF文档 (.pdf)\n• Word文档 (.doc, .docx)\n• PowerPoint演示文稿 (.ppt, .pptx)\n• Markdown文档 (.md)\n• 文本文件 (.txt)\n\n建议：如果是其他格式，可以复制内容后使用"文本粘贴"功能`, 
        'error'
      );
      return;
    }

    // 验证文件大小（限制为20MB）
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      updateProcessingStatus(
        false, 
        `文件过大（${fileSizeMB}MB，限制20MB）\n\n💡 建议解决方案：\n1. 压缩PDF文件大小\n2. 将大文档分页导出为多个小文件\n3. 或复制文档内容，使用"文本粘贴"功能`, 
        'error'
      );
      return;
    }

    // 保存上传数据用于重试
    setLastUploadData({ type: 'file', data: file });
    
    updateProcessingStatus(true, '正在准备解析文件...', 'info', 0);
    
    try {
      // 定义进度回调函数
      const progressCallback = (progress: number, status: string) => {
        updateProcessingStatus(true, status, 'info', Math.round(progress));
      };
      
      const result = await parseDocument(file, undefined, progressCallback);
      
      if (validateParseResult(result)) {
        updateProcessingStatus(false, '文件解析成功！', 'success', 100);
        
        // 检查是否需要拆分
        if (result.requiresSplit && result.splitDocuments && result.splitDocuments.length > 1) {
          setCurrentParseResult(result);
          setShowSplitConfirm(true);
        } else {
          onUploadComplete(result);
        }
      } else {
        updateProcessingStatus(
          false, 
          '文件解析失败\n\n💡 可能的原因：\n• 文件格式不完整或损坏\n• 文件内容过少（少于100字符）\n• 网络连接问题\n\n建议：尝试其他文件或使用"文本粘贴"功能', 
          'error', 
          0
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      // 检查是否是网络相关错误
      const isNetworkError = errorMessage.toLowerCase().includes('network') || 
                           errorMessage.toLowerCase().includes('fetch') ||
                           errorMessage.toLowerCase().includes('connection');
      
      const finalMessage = isNetworkError 
        ? `网络连接问题导致处理失败\n\n💡 建议解决方案：\n1. 点击重试按钮\n2. 检查网络连接\n3. 或使用"文本粘贴"功能\n\n详细错误：${errorMessage}`
        : `文件处理失败: ${errorMessage}\n\n💡 建议解决方案：\n1. 点击重试按钮\n2. 检查文件完整性\n3. 或使用"文本粘贴"功能`;
        
      updateProcessingStatus(false, finalMessage, 'error', 0, true);
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

    // 保存上传数据用于重试
    setLastUploadData({ type: 'url', data: url });
    
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
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      
      updateProcessingStatus(
        false, 
        `URL解析失败: ${errorMessage}\n\n💡 常见问题及解决方案：\n• CORS限制：许多网站禁止跨域访问\n• 网络连接：检查网络连接是否正常\n• 页面保护：某些网站有反爬虫保护\n\n建议：点击重试或复制网页内容后使用"文本粘贴"功能`, 
        'error',
        undefined,
        true
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

    // 保存上传数据用于重试
    setLastUploadData({ type: 'text', data: text });
    
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
      
      // 检查是否需要拆分
      if (result.requiresSplit && result.splitDocuments && result.splitDocuments.length > 1) {
        setCurrentParseResult(result);
        setShowSplitConfirm(true);
      } else {
        onUploadComplete(result);
      }
      
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

  /**
   * 处理确认拆分文档
   */
  const handleConfirmSplit = () => {
    if (currentParseResult?.splitDocuments) {
      setShowSplitConfirm(false);
      setShowSplitSelector(true);
    }
  };

  /**
   * 处理取消拆分，继续整篇学习
   */
  const handleCancelSplit = () => {
    if (currentParseResult) {
      setShowSplitConfirm(false);
      onUploadComplete(currentParseResult);
      setCurrentParseResult(null);
    }
  };

  /**
   * 处理选择拆分文档片段
   */
  const handleSelectSplitDocument = (selectedSplit: DocumentSplit) => {
    console.log(`📥 DocumentUploader 收到选中的文档片段:`, {
      id: selectedSplit.id,
      title: selectedSplit.title,
      contentLength: selectedSplit.content.length,
      wordCount: selectedSplit.wordCount
    });
    
    // 创建一个新的解析结果，包含选中的片段内容
    const splitResult: DocumentParseResult = {
      success: true,
      content: selectedSplit.content,
      title: selectedSplit.title,
      metadata: {
        wordCount: selectedSplit.wordCount,
      },
      requiresSplit: false, // 拆分后的文档不再需要拆分
    };

    console.log(`🔄 准备传递拆分结果给上级组件:`, {
      title: splitResult.title,
      contentLength: splitResult.content.length,
      wordCount: splitResult.metadata?.wordCount
    });

    setShowSplitSelector(false);
    setCurrentParseResult(null);
    
    console.log(`📤 调用 onUploadComplete 传递拆分后的文档`);
    onUploadComplete(splitResult);
  };

  /**
   * 处理返回重新选择
   */
  const handleGoBackToSelection = () => {
    // 重置所有状态，回到初始上传界面
    setShowSplitSelector(false);
    setShowSplitConfirm(false);
    setCurrentParseResult(null);
    setLastUploadData(null);
    setProcessingStatus({
      isProcessing: false,
      message: '',
      type: 'info',
      progress: 0,
      canRetry: false,
    });
  };

  /**
   * 重试处理
   */
  const handleRetry = async () => {
    if (!lastUploadData) return;

    // 清除当前错误状态
    setProcessingStatus({
      isProcessing: false,
      message: '',
      type: 'info',
      progress: 0,
      canRetry: false,
    });

    // 根据类型重新执行相应的处理函数
    switch (lastUploadData.type) {
      case 'file':
        if (lastUploadData.data instanceof File) {
          await handleFileUpload([lastUploadData.data] as any);
        }
        break;
      case 'url':
        if (typeof lastUploadData.data === 'string') {
          setUrlInput(lastUploadData.data);
          await handleURLSubmit();
        }
        break;
      case 'text':
        if (typeof lastUploadData.data === 'string') {
          setTextInput(lastUploadData.data);
          await handleTextSubmit();
        }
        break;
    }
  };

  const isProcessing = processingStatus.isProcessing || loading;

  // 如果正在显示拆分选择器，渲染拆分选择器界面
  if (showSplitSelector && currentParseResult?.splitDocuments) {
    return (
      <SplitDocumentSelector
        splitDocuments={currentParseResult.splitDocuments}
        onSelectDocument={handleSelectSplitDocument}
        onGoBack={handleGoBackToSelection}
      />
    );
  }

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
              
              <div className={`text-sm ${
                processingStatus.type === 'success' 
                  ? 'text-green-900' 
                  : processingStatus.type === 'error'
                  ? 'text-red-900'
                  : 'text-blue-900'
              }`}>
                <div className="font-medium mb-1">
                  {processingStatus.message.split('\n')[0]}
                </div>
                {processingStatus.message.includes('\n') && (
                  <div className="text-xs leading-relaxed whitespace-pre-line opacity-90">
                    {processingStatus.message.split('\n').slice(1).join('\n')}
                  </div>
                )}
              </div>
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

            {/* 重试按钮 - 仅在错误状态且可重试时显示 */}
            {processingStatus.type === 'error' && processingStatus.canRetry && !processingStatus.isProcessing && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="text-xs"
                >
                  🔄 重试
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 文档拆分确认对话框 */}
      {showSplitConfirm && currentParseResult && currentParseResult.splitDocuments && (
        <DocumentSplitConfirmModal
          isOpen={showSplitConfirm}
          originalTitle={currentParseResult.title || '文档'}
          originalWordCount={currentParseResult.content.length}
          splitDocuments={currentParseResult.splitDocuments}
          onConfirm={handleConfirmSplit}
          onCancel={handleCancelSplit}
          onClose={handleCancelSplit}
        />
      )}
    </div>
  );
};

export default DocumentUploader;