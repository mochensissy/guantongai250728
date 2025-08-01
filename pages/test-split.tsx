/**
 * 文档拆分功能测试页面
 * 
 * 用于测试和演示大文档自动拆分功能
 */

import React, { useState } from 'react';
import DocumentUploader from '../src/components/DocumentUploader';
import { DocumentParseResult, APIConfig } from '../src/types';

const TestSplitPage: React.FC = () => {
  const [uploadResult, setUploadResult] = useState<DocumentParseResult | null>(null);
  const [apiConfig] = useState<APIConfig>({
    provider: 'openai',
    apiKey: 'test-key',
    model: 'gpt-3.5-turbo'
  });

  const handleUploadComplete = (result: DocumentParseResult) => {
    setUploadResult(result);
    console.log('上传完成:', result);
  };

  const resetTest = () => {
    setUploadResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📄 文档拆分功能测试
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            测试大文档（超过12000字）的自动拆分功能
          </p>
          
          {/* 测试说明 */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              🧪 测试说明
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 text-left space-y-1">
              <li>• 上传或粘贴超过12000字的文档</li>
              <li>• 系统将自动检测并提示拆分</li>
              <li>• 可以选择确认拆分或继续整篇学习</li>
              <li>• 拆分后可以选择任意部分开始学习</li>
            </ul>
          </div>
        </div>

        {!uploadResult ? (
          // 文档上传组件
          <div className="max-w-4xl mx-auto">
            <DocumentUploader
              onUploadComplete={handleUploadComplete}
              apiConfig={apiConfig}
            />
            
            {/* 测试建议 */}
            <div className="mt-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                💡 测试建议
              </h3>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-2">
                <p><strong>方法1 - 使用预制测试文档：</strong></p>
                <p>项目根目录下有一个 <code className="bg-green-100 dark:bg-green-800 px-1 rounded">test-long-document.txt</code> 文件（约15000字），可以直接上传测试。</p>
                
                <p className="mt-3"><strong>方法2 - 文本粘贴测试：</strong></p>
                <p>点击"文本粘贴"选项，复制大量文本内容（建议超过12000字）进行测试。</p>
                
                <p className="mt-3"><strong>预期效果：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>文档解析完成后会弹出拆分确认对话框</li>
                  <li>显示原文档信息和拆分预览</li>
                  <li>选择"确认拆分"会进入文档选择界面</li>
                  <li>可以选择任意片段开始学习</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          // 上传结果显示
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ✅ 文档处理完成
                </h2>
                <button
                  onClick={resetTest}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  重新测试
                </button>
              </div>

              {/* 处理结果信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      文档标题
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {uploadResult.title || '未知标题'}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      字数统计
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {uploadResult.content.length.toLocaleString()} 字
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      是否需要拆分
                    </label>
                    <div className={`p-3 rounded-lg ${
                      uploadResult.requiresSplit 
                        ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' 
                        : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    }`}>
                      {uploadResult.requiresSplit ? '是，已自动拆分' : '否，可直接学习'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    内容预览
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg h-40 overflow-y-auto text-sm">
                    {uploadResult.content.substring(0, 500)}...
                  </div>
                </div>
              </div>

              {/* 拆分信息 */}
              {uploadResult.splitDocuments && uploadResult.splitDocuments.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    📋 拆分结果
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadResult.splitDocuments.map((split, index) => (
                      <div key={split.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-sm line-clamp-2">
                            {split.title}
                          </div>
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {split.wordCount.toLocaleString()} 字
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 测试结果说明 */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  🎉 测试完成
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  文档处理功能正常工作！
                  {uploadResult.requiresSplit 
                    ? `文档已成功拆分为 ${uploadResult.splitDocuments?.length || 0} 个部分。`
                    : '文档无需拆分，可直接进行学习。'
                  }
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSplitPage;