/**
 * 文档上传页面
 * 
 * 功能：
 * - 文档上传和解析
 * - 大纲生成和编辑
 * - 学习水平选择
 * - 创建新的学习会话
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Zap, FileText } from 'lucide-react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Button from '../src/components/ui/Button';
import OutlineEditor from '../src/components/OutlineEditor';
import { DocumentParseResult, OutlineItem, LearningSession, APIConfig } from '../src/types';
import { generateOutline, fixExistingOutline } from '../src/utils/aiService';
import { storageAdapter } from '../src/utils/storageAdapter';
import { ThemeProvider } from '../src/contexts/ThemeContext';

/**
 * 生成UUID格式的唯一ID
 */
const generateId = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c == 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
};

// 动态导入DocumentUploader组件，禁用SSR
const DocumentUploader = dynamic(() => import('../src/components/DocumentUploader'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
    </div>
  )
});

const UploadPageContent: React.FC = () => {
  const router = useRouter();

  // 状态管理
  const [currentStep, setCurrentStep] = useState<'upload' | 'uploaded' | 'outline' | 'level'>('upload');
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'expert'>('beginner');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  /**
   * 检查API配置
   */
  useEffect(() => {
    const loadConfig = async () => {
      console.log('开始加载API配置...');
      try {
        // 使用同步方法避免async/await问题
        const config = storageAdapter.getAPIConfig_sync();
        console.log('API配置结果:', config);
        
        if (!config) {
          console.log('未找到API配置，跳转到首页');
          router.push('/');
          return;
        }
        setApiConfig(config);
        setIsInitialLoading(false);
        console.log('API配置加载完成');
      } catch (error) {
        console.error('加载API配置失败:', error);
        // 发生错误时也跳转到首页
        router.push('/');
      }
    };
    
    // 设置超时机制，防止页面卡死
    const timeout = setTimeout(() => {
      console.log('加载API配置超时，跳转到首页');
      router.push('/');
    }, 5000);
    
    loadConfig().then(() => {
      clearTimeout(timeout);
    });
    
    return () => clearTimeout(timeout);
  }, [router]);

  /**
   * 生成唯一ID
   */
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 创建备用大纲
   * 当AI大纲生成失败时，基于文档内容创建简单的学习大纲
   */
  const createFallbackOutline = (content: string, title: string) => {
    console.log('📝 开始创建备用大纲...');
    
    const outline = [];
    const contentLength = content.length;
    
    // 根据内容长度决定章节数量
    let chapterCount = Math.min(5, Math.max(2, Math.ceil(contentLength / 3000)));
    
    // 尝试检测现有的章节结构
    const chapterPatterns = [
      /第[一二三四五六七八九十\d]+章[：:\s]*([^\n]{10,50})/g,
      /Chapter\s+\d+[：:\s]*([^\n]{10,50})/gi,
      /^\d+[\.、]\s*([^\n]{10,50})/gm,
      /^[一二三四五六七八九十][、．]\s*([^\n]{10,50})/gm,
    ];
    
    let detectedChapters = [];
    for (const pattern of chapterPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length >= 2 && matches.length <= 8) {
        detectedChapters = matches.map((match, index) => ({
          title: match[1].trim(),
          index: index + 1
        }));
        chapterCount = matches.length;
        break;
      }
    }
    
    console.log(`📝 检测到 ${detectedChapters.length} 个现有章节`);
    
    if (detectedChapters.length > 0) {
      // 使用检测到的章节结构
      detectedChapters.forEach((chapter, index) => {
        outline.push({
          id: `chapter-${index + 1}`,
          title: chapter.title,
          type: 'chapter',
          level: 1,
          order: outline.length + 1,
          chapterNumber: index + 1,
          estimatedMinutes: 15
        });
        
        // 为每个章节添加2-3个小节
        const sectionCount = Math.min(3, Math.max(2, Math.ceil(contentLength / (chapterCount * 1500))));
        for (let j = 0; j < sectionCount; j++) {
          outline.push({
            id: `section-${index + 1}-${j + 1}`,
            title: `${chapter.title} - 第${j + 1}部分`,
            type: 'section',
            level: 2,
            order: outline.length + 1,
            parentChapter: index + 1,
            parentId: `chapter-${index + 1}`,
            estimatedMinutes: 8
          });
        }
      });
    } else {
      // 创建通用章节结构
      console.log(`📝 创建 ${chapterCount} 个通用章节`);
      
      const chapterTitles = [
        '基础概念与入门',
        '核心原理深入理解',
        '实践应用与案例',
        '高级技巧与进阶',
        '总结与展望'
      ];
      
      for (let i = 0; i < chapterCount; i++) {
        const chapterTitle = i < chapterTitles.length ? 
          chapterTitles[i] : 
          `第${i + 1}章 核心内容学习`;
        
        outline.push({
          id: `chapter-${i + 1}`,
          title: chapterTitle,
          type: 'chapter',
          level: 1,
          order: outline.length + 1,
          chapterNumber: i + 1,
          estimatedMinutes: 15
        });
        
        // 为每个章节添加小节
        const sectionCount = 3;
        for (let j = 0; j < sectionCount; j++) {
          const sectionTitles = [
            '基础知识点',
            '详细解析',
            '实践应用'
          ];
          
          outline.push({
            id: `section-${i + 1}-${j + 1}`,
            title: `${j + 1}. ${sectionTitles[j]}`,
            type: 'section',
            level: 2,
            order: outline.length + 1,
            parentChapter: i + 1,
            parentId: `chapter-${i + 1}`,
            estimatedMinutes: 8
          });
        }
      }
    }
    
    console.log(`📝 备用大纲创建完成，共 ${outline.length} 项`);
    return outline;
  };

  /**
   * 获取用户友好的错误信息
   */
  const getUserFriendlyErrorMessage = (errorMessage: string): string => {
    if (errorMessage.includes('JSON')) {
      return 'AI返回格式异常，可能是网络不稳定导致';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
      return '请求超时，请检查网络连接';
    }
    if (errorMessage.includes('API') || errorMessage.includes('401') || errorMessage.includes('403')) {
      return 'API配置问题，请检查密钥是否正确';
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('限制')) {
      return 'API调用次数限制，请稍后再试';
    }
    if (errorMessage.includes('insufficient') || errorMessage.includes('余额')) {
      return 'API余额不足，请检查账户状态';
    }
    return errorMessage;
  };

  /**
   * 处理文档上传完成
   */
  const handleDocumentUploaded = async (result: DocumentParseResult) => {
    console.log('🔍 handleDocumentUploaded 收到的文档结果:', {
      title: result.title,
      contentLength: result.content.length,
      contentPreview: result.content.substring(0, 300) + '...',
      requiresSplit: result.requiresSplit,
      splitDocuments: result.splitDocuments?.length || 0
    });
    
    setParseResult(result);
    
    if (!apiConfig) {
      alert('API配置丢失，请重新设置');
      router.push('/');
      return;
    }

    // 自动生成大纲
    setIsGeneratingOutline(true);
    
    try {
      console.log('📤 开始调用 generateOutline，参数:', {
        title: result.title,
        contentLength: result.content.length,
        contentType: typeof result.content,
        contentStart: result.content.substring(0, 100),
        apiProvider: apiConfig.provider,
        apiModel: apiConfig.model
      });
      
      const outlineResponse = await generateOutline(
        apiConfig,
        result.content,
        result.title
      );
      
      console.log('📥 generateOutline 返回结果:', {
        success: outlineResponse.success,
        outlineLength: outlineResponse.outline?.length || 0,
        error: outlineResponse.error,
        generatedTitle: outlineResponse.generatedTitle
      });

      if (outlineResponse.success) {
        // 如果AI生成了新标题，更新result.title
        if (outlineResponse.generatedTitle) {
          result.title = outlineResponse.generatedTitle;
          console.log('使用AI生成的标题:', outlineResponse.generatedTitle);
        }
        
        console.log('🔧 AI生成大纲后，立即应用强制重建...');
        
        // 使用强制重建逻辑修复AI生成的大纲
        const fixedOutline = fixExistingOutline(outlineResponse.outline);
        
        // 为修复后的大纲添加必要的ID
        const outlineWithIds = fixedOutline.map((item: any, index) => {
          const baseItem: any = {
            ...item,
            order: index + 1,
          };

          if (item.type === 'chapter') {
            baseItem.id = `chapter-${item.chapterNumber || index + 1}`;
          } else if (item.type === 'section') {
            baseItem.id = `section-${index + 1}`;
            if (item.parentChapter) {
              baseItem.parentId = `chapter-${item.parentChapter}`;
            }
          }

          return baseItem;
        });
        
        console.log('✅ 强制重建后的大纲:', outlineWithIds);
        
        setOutline(outlineWithIds);
        setCurrentStep('outline');
      } else {
        throw new Error(outlineResponse.error || '生成大纲失败');
      }
    } catch (error) {
      console.error('生成大纲失败:', error);
      setIsGeneratingOutline(false);
      
      // 尝试创建一个基础大纲作为备用方案
      try {
        console.log('🔧 大纲生成失败，尝试创建备用大纲...');
        const fallbackOutline = createFallbackOutline(result.content, result.title || '文档');
        
        if (fallbackOutline.length > 0) {
          console.log('✅ 备用大纲创建成功:', fallbackOutline);
          setOutline(fallbackOutline);
          setCurrentStep('outline');
          
          // 显示友好的提示信息
          alert('AI大纲生成遇到问题，已为您创建基础学习大纲。您可以在下一步中自定义调整。');
          return;
        }
      } catch (fallbackError) {
        console.error('备用大纲创建也失败:', fallbackError);
      }
      
      // 如果备用方案也失败，提供更友好的错误处理
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      const userFriendlyMessage = getUserFriendlyErrorMessage(errorMessage);
      
      alert(`生成大纲失败: ${userFriendlyMessage}\n\n您可以：\n1. 检查网络连接后重试\n2. 尝试上传较小的文档\n3. 检查API配置是否正确`);
      
      // 重置到文档已上传状态，允许用户重试
      setCurrentStep('uploaded');
    }
  };

  /**
   * 重试生成大纲
   */
  const retryGenerateOutline = () => {
    if (parseResult) {
      handleDocumentUploaded(parseResult);
    }
  };

  /**
   * 确认大纲，进入水平选择
   */
  const handleConfirmOutline = () => {
    if (outline.length === 0) {
      alert('请至少添加一个章节');
      return;
    }
    setCurrentStep('level');
  };

  /**
   * 创建学习会话
   */
  const handleCreateSession = async () => {
    if (!parseResult || !apiConfig) return;

    setIsCreatingSession(true);

    try {
      const sessionId = generateId();
      const session: LearningSession = {
        id: sessionId,
        title: parseResult.title || '未命名文档',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        learningLevel,
        documentContent: parseResult.content,
        documentType: 'text', // 这里可以根据实际解析结果设置
        outline,
        messages: [],
        status: 'active',
        cards: [], // 初始化为空数组
      };

      const success = await storageAdapter.saveSession(session);
      
      if (success) {
        router.push(`/learn/${sessionId}`);
      } else {
        throw new Error('保存会话失败');
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      alert(`创建会话失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  /**
   * 返回上一步
   */
  const handleGoBack = () => {
    switch (currentStep) {
      case 'outline':
        setCurrentStep('upload');
        setParseResult(null);
        setOutline([]);
        break;
      case 'level':
        setCurrentStep('outline');
        break;
      default:
        router.push('/');
        break;
    }
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">正在检查配置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoBack}
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                返回
              </Button>
              
              <h1 className="text-xl font-semibold text-gray-900">
                创建新的学习会话
              </h1>
            </div>

            {/* 步骤指示器 */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 text-sm ${
                currentStep === 'upload' ? 'text-primary-600 font-medium' : 'text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === 'upload' 
                    ? 'bg-primary-600 text-white' 
                    : parseResult 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  1
                </div>
                上传文档
              </div>

              <div className={`w-8 h-px ${parseResult ? 'bg-green-500' : 'bg-gray-300'}`} />

              <div className={`flex items-center gap-2 text-sm ${
                currentStep === 'outline' ? 'text-primary-600 font-medium' : 'text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === 'outline' 
                    ? 'bg-primary-600 text-white' 
                    : outline.length > 0
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  2
                </div>
                编辑大纲
              </div>

              <div className={`w-8 h-px ${outline.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`} />

              <div className={`flex items-center gap-2 text-sm ${
                currentStep === 'level' ? 'text-primary-600 font-medium' : 'text-gray-500'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  currentStep === 'level' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  3
                </div>
                选择水平
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 第一步：上传文档 */}
        {currentStep === 'upload' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                上传您的学习材料
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                支持多种格式的文档，包括PDF、Word、PowerPoint、Markdown等。
                上传后AI将自动解析内容并生成学习大纲。
              </p>
            </div>

            <DocumentUploader
              onUploadComplete={handleDocumentUploaded}
              loading={isGeneratingOutline}
              apiConfig={apiConfig}
            />

            {isGeneratingOutline && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-blue-900 font-medium">
                    AI正在分析文档内容并生成学习大纲，请稍候...
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 文档已上传，等待生成大纲或显示错误 */}
        {currentStep === 'uploaded' && parseResult && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                文档解析完成
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                您的文档已成功上传并解析。请选择下一步操作。
              </p>
            </div>

            {/* 文档信息 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {parseResult.title || '未命名文档'}
                  </h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    {parseResult.metadata?.wordCount && (
                      <p>字数：{parseResult.metadata.wordCount.toLocaleString()} 字</p>
                    )}
                    {parseResult.metadata?.pageCount && (
                      <p>页数：{parseResult.metadata.pageCount} 页</p>
                    )}
                    <p className="text-green-600 font-medium">✅ 文档解析成功</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作选项 */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-600 text-sm">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-amber-900 mb-2">
                    大纲生成遇到问题
                  </h3>
                  <p className="text-amber-700 text-sm mb-4">
                    AI大纲生成失败，这可能是由于网络问题、API配置问题或文档内容过于复杂导致的。
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      onClick={retryGenerateOutline}
                      loading={isGeneratingOutline}
                      icon={<div className="w-4 h-4">🔄</div>}
                    >
                      重试生成大纲
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const fallbackOutline = createFallbackOutline(parseResult.content, parseResult.title || '文档');
                        setOutline(fallbackOutline);
                        setCurrentStep('outline');
                      }}
                    >
                      使用基础大纲
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCurrentStep('upload');
                        setParseResult(null);
                      }}
                    >
                      重新上传
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 第二步：编辑大纲 */}
        {currentStep === 'outline' && parseResult && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                确认学习大纲
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                AI已为您生成了学习大纲，您可以根据需要进行调整。
                可以编辑章节标题、调整顺序或添加新章节。
              </p>
            </div>

            {/* 文档信息 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start gap-4">
                <FileText className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {parseResult.title || '未命名文档'}
                  </h3>
                  <div className="text-sm text-gray-500 space-y-1">
                    {parseResult.metadata?.wordCount && (
                      <p>字数：{parseResult.metadata.wordCount.toLocaleString()} 字</p>
                    )}
                    {parseResult.metadata?.pageCount && (
                      <p>页数：{parseResult.metadata.pageCount} 页</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 大纲编辑器 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                学习大纲（{outline.length} 个章节）
              </h3>
              
              <OutlineEditor
                items={outline}
                onChange={setOutline}
                readonly={false}
                showNumbers={true}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleConfirmOutline}
                disabled={outline.length === 0}
              >
                确认大纲，下一步
              </Button>
            </div>
          </div>
        )}

        {/* 第三步：选择学习水平 */}
        {currentStep === 'level' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                选择您的学习水平
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                AI私教将根据您选择的水平调整教学方式。
                您可以随时在学习过程中调整这个设置。
              </p>
            </div>

            {/* 水平选择卡片 */}
            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* 小白模式 */}
              <div
                className={`
                  p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${learningLevel === 'beginner'
                    ? 'border-primary-500 bg-primary-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
                onClick={() => setLearningLevel('beginner')}
              >
                <div className="text-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                    ${learningLevel === 'beginner'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <User className="w-8 h-8" />
                  </div>
                  
                  <h3 className={`text-xl font-semibold mb-3 ${
                    learningLevel === 'beginner' ? 'text-primary-900' : 'text-gray-900'
                  }`}>
                    小白模式
                  </h3>
                  
                  <div className="text-sm space-y-2 text-left">
                    <p className="text-gray-600">
                      <strong>适合对象：</strong>初学者或对主题不熟悉的用户
                    </p>
                    <p className="text-gray-600">
                      <strong>教学特点：</strong>
                    </p>
                    <ul className="text-gray-600 space-y-1 ml-4">
                      <li>• 节奏缓慢，循序渐进</li>
                      <li>• 详细解释每个概念</li>
                      <li>• 提供具体的操作步骤</li>
                      <li>• 使用通俗易懂的比喻</li>
                      <li>• 频繁确认学习效果</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 高手模式 */}
              <div
                className={`
                  p-6 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${learningLevel === 'expert'
                    ? 'border-secondary-500 bg-secondary-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
                onClick={() => setLearningLevel('expert')}
              >
                <div className="text-center">
                  <div className={`
                    w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
                    ${learningLevel === 'expert'
                      ? 'bg-secondary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <Zap className="w-8 h-8" />
                  </div>
                  
                  <h3 className={`text-xl font-semibold mb-3 ${
                    learningLevel === 'expert' ? 'text-secondary-900' : 'text-gray-900'
                  }`}>
                    高手模式
                  </h3>
                  
                  <div className="text-sm space-y-2 text-left">
                    <p className="text-gray-600">
                      <strong>适合对象：</strong>有相关基础或经验的用户
                    </p>
                    <p className="text-gray-600">
                      <strong>教学特点：</strong>
                    </p>
                    <ul className="text-gray-600 space-y-1 ml-4">
                      <li>• 节奏较快，直击要点</li>
                      <li>• 聚焦核心概念和差异</li>
                      <li>• 讨论设计原理和最佳实践</li>
                      <li>• 启发式深度思考</li>
                      <li>• 高层级的技术对话</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleCreateSession}
                loading={isCreatingSession}
                icon={<FileText className="w-5 h-5" />}
              >
                开始学习
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const UploadPage: React.FC = () => {
  return (
    <ThemeProvider>
      <UploadPageContent />
    </ThemeProvider>
  );
};

export default UploadPage;