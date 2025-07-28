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
import { generateOutline } from '../src/utils/aiService';
import { saveSession, getAPIConfig } from '../src/utils/storage';

// 动态导入DocumentUploader组件，禁用SSR
const DocumentUploader = dynamic(() => import('../src/components/DocumentUploader'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
    </div>
  )
});

const UploadPage: React.FC = () => {
  const router = useRouter();

  // 状态管理
  const [currentStep, setCurrentStep] = useState<'upload' | 'outline' | 'level'>('upload');
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
    const config = getAPIConfig();
    if (!config) {
      router.push('/');
      return;
    }
    setApiConfig(config);
    setIsInitialLoading(false);
  }, [router]);

  /**
   * 生成唯一ID
   */
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * 处理文档上传完成
   */
  const handleDocumentUploaded = async (result: DocumentParseResult) => {
    setParseResult(result);
    
    if (!apiConfig) {
      alert('API配置丢失，请重新设置');
      router.push('/');
      return;
    }

    // 自动生成大纲
    setIsGeneratingOutline(true);
    
    try {
      const outlineResponse = await generateOutline(
        apiConfig,
        result.content,
        result.title
      );

      if (outlineResponse.success) {
        const outlineWithIds = outlineResponse.outline.map((item, index) => ({
          ...item,
          id: item.type === 'chapter' 
            ? `chapter-${item.order || index + 1}` 
            : `section-${item.order || index + 1}`,
          order: index + 1,
        }));
        
        setOutline(outlineWithIds);
        setCurrentStep('outline');
      } else {
        throw new Error(outlineResponse.error || '生成大纲失败');
      }
    } catch (error) {
      console.error('生成大纲失败:', error);
      alert(`生成大纲失败: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsGeneratingOutline(false);
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
      };

      const success = saveSession(session);
      
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

export default UploadPage;