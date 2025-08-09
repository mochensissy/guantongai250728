/**
 * 应用仪表板页面 - 登录后的应用主界面
 * 
 * 功能：
 * - 学习会话历史管理
 * - 新建学习会话
 * - API配置管理
 * - 用户数据展示
 */

import React, { useState, useEffect, useRef } from 'react';
import { Settings, Upload, BookOpen, Brain, Zap, ArrowLeft, FileText, User } from 'lucide-react';
import dynamic from 'next/dynamic';
import Button from '../src/components/ui/Button';
import Card from '../src/components/ui/Card';
import OutlineEditor from '../src/components/OutlineEditor';
import APIConfigModal from '../src/components/APIConfigModal';
import SessionHistoryList from '../src/components/SessionHistoryList';
import SmartSyncControl from '../src/components/SmartSyncControl';
import DataLifecycleManager from '../src/components/DataLifecycleManager';
import { APIConfig, LearningSession, DocumentParseResult, OutlineItem } from '../src/types';
import { 
  getAllSessions, 
  deleteSession, 
  getAPIConfig, 
  saveAPIConfig 
} from '../src/utils/storageAdapter';
import { useAuth } from '../src/contexts/AuthContext';
import { useRouter } from 'next/router';
import { generateOutline, fixExistingOutline } from '../src/utils/aiService';
import { ThemeProvider } from '../src/contexts/ThemeContext';

// 动态导入上传组件，避免SSR问题
const DocumentUploader = dynamic(() => import('../src/components/DocumentUploader'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
    </div>
  )
});

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  // 状态管理
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [apiConfig, setApiConfig] = useState<APIConfig | null>(null);
  const [showAPIConfigModal, setShowAPIConfigModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 内嵌上传流程的本地状态（仅影响“欢迎区域”的呈现）
  const [currentStep, setCurrentStep] = useState<'upload' | 'uploaded' | 'outline' | 'level'>('upload');
  const [parseResult, setParseResult] = useState<DocumentParseResult | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [learningLevel, setLearningLevel] = useState<'beginner' | 'expert'>('beginner');
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const scrollToUploadSection = () => {
    // 使用requestAnimationFrame确保DOM已更新
    requestAnimationFrame(() => {
      if (uploadSectionRef.current) {
        uploadSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  /**
   * 初始化数据加载和用户认证检查
   */
  useEffect(() => {
    if (loading) {
      return; // 还在加载认证状态
    }

    if (!user) {
      console.log('用户未登录，跳转到首页');
      router.push('/');
      return;
    }

    const initializeData = () => {
      try {
        // 加载用户数据
        const loadedSessions = getAllSessions();
        const loadedConfig = getAPIConfig();
        
        setSessions(loadedSessions);
        setApiConfig(loadedConfig);
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [user, loading, router]);

  /**
   * 进入学习会话
   */
  const handleEnterSession = (sessionId: string) => {
    router.push(`/learn/${sessionId}`);
  };

  /**
   * 删除学习会话
   */
  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm('确定要删除这个学习记录吗？此操作不可恢复。')) return;

    // 乐观更新：先从界面移除
    const snapshot = sessions;
    setSessions(prev => prev.filter(s => s.id !== sessionId));

    try {
      const success = await deleteSession(sessionId);
      if (!success) {
        // 回滚
        setSessions(prev => {
          const restore = snapshot.find(s => s.id === sessionId);
          return restore ? [restore, ...prev] : prev;
        });
        alert('删除失败，请重试');
      }
    } catch (e) {
      console.error('删除失败:', e);
      // 回滚
      setSessions(snapshot);
      alert('删除失败，请重试');
    }
  };

  /**
   * 批量删除
   */
  const handleBatchDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!window.confirm(`确定要删除选中的 ${ids.length} 个学习记录吗？此操作不可恢复。`)) return;

    // 乐观更新：立即从界面移除
    const snapshot = sessions;
    setSessions(prev => prev.filter(s => !ids.includes(s.id)));

    try {
      console.log('[Dashboard] 开始批量删除', ids);
      const results = await Promise.allSettled(ids.map(id => deleteSession(id)));

      const failedIds: string[] = [];
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') {
          if (!r.value) failedIds.push(ids[idx]);
        } else {
          failedIds.push(ids[idx]);
        }
      });

      if (failedIds.length > 0) {
        // 局部回滚失败的记录
        setSessions(prev => {
          const toRestore = snapshot.filter(s => failedIds.includes(s.id));
          // 合并并按时间排序
          const merged = [...prev, ...toRestore];
          return merged.sort((a, b) => b.updatedAt - a.updatedAt);
        });
        alert(`有 ${failedIds.length} 个记录删除失败，已恢复到列表`);
      }
    } catch (e) {
      console.error('批量删除失败:', e);
      // 全量回滚
      setSessions(snapshot);
      alert('批量删除失败，请重试');
    }
  };

  /**
   * 保存API配置
   */
  const handleSaveAPIConfig = (config: APIConfig) => {
    const success = saveAPIConfig(config);
    if (success) {
      setApiConfig(config);
      setShowAPIConfigModal(false);
    } else {
      alert('保存配置失败，请重试');
    }
  };

  /**
   * 开始新的学习会话
   */
  const handleStartNewSession = () => {
    if (!apiConfig) {
      alert('请先配置AI服务');
      setShowAPIConfigModal(true);
      return;
    }
    router.push('/upload');
  };

  // 生成唯一ID（与上传页保持一致）
  const generateId = (): string => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return (crypto as any).randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // 文档上传完成 → 生成大纲（与上传页逻辑等价）
  const handleInlineDocumentUploaded = async (result: DocumentParseResult) => {
    setParseResult(result);
    scrollToUploadSection();

    if (!apiConfig) {
      alert('需要先配置AI服务');
      setShowAPIConfigModal(true);
      return;
    }

    setIsGeneratingOutline(true);
    try {
      const outlineResponse = await generateOutline(
        apiConfig,
        result.content,
        result.title
      );

      if (outlineResponse.success) {
        if (outlineResponse.generatedTitle) {
          result.title = outlineResponse.generatedTitle;
        }

        const fixed = fixExistingOutline(outlineResponse.outline);
        const withIds = fixed.map((item: any, index: number) => {
          const base: any = { ...item, order: index + 1 };
          if (item.type === 'chapter') {
            base.id = `chapter-${item.chapterNumber || index + 1}`;
          } else if (item.type === 'section') {
            base.id = `section-${index + 1}`;
            if (item.parentChapter) base.parentId = `chapter-${item.parentChapter}`;
          }
          return base;
        });

        setOutline(withIds);
        setCurrentStep('outline');
        scrollToUploadSection();
      } else {
        throw new Error(outlineResponse.error || '生成大纲失败');
      }
    } catch (error) {
      console.error('生成大纲失败:', error);
      setIsGeneratingOutline(false);
      setCurrentStep('uploaded');
      scrollToUploadSection();
    }
  };

  const retryInlineGenerateOutline = () => {
    if (parseResult) {
      handleInlineDocumentUploaded(parseResult);
    }
  };

  const handleInlineConfirmOutline = () => {
    if (outline.length === 0) {
      alert('请至少添加一个章节');
      return;
    }
    setCurrentStep('level');
    scrollToUploadSection();
  };

  const handleInlineCreateSession = async () => {
    if (!parseResult || !apiConfig) {
      alert('缺少必要的解析结果或API配置');
      return;
    }
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
        documentType: 'text',
        outline,
        messages: [],
        status: 'active',
        cards: [],
      };

      const { saveSession } = await import('../src/utils/storage');
      const ok = saveSession(session);
      if (ok) {
        window.location.href = `/learn/${sessionId}`;
      } else {
        throw new Error('本地存储失败');
      }
    } catch (e: any) {
      alert(`创建失败: ${e?.message || '未知错误'}`);
    } finally {
      setIsCreatingSession(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果用户未登录，不渲染内容（useEffect会处理跳转）
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo和标题 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI学习私教</h1>
                <p className="text-sm text-gray-500">应用仪表板</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              {/* 紧凑同步状态 */}
              <SmartSyncControl compact={true} showDetails={false} />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/cards')}
                icon={<BookOpen className="w-4 h-4" />}
              >
                卡片管理
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAPIConfigModal(true)}
                icon={<Settings className="w-4 h-4" />}
              >
                API设置
              </Button>
              
              <Button
                variant="primary"
                onClick={handleStartNewSession}
                icon={<Upload className="w-4 h-4" />}
              >
                开始新学习
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{/* 移除重复的同步控件，只保留顶部的 */}

        {/* 欢迎区域替换为：内嵌上传流程 */}
        <div className="mb-12">
          <ThemeProvider>
          <div className="max-w-4xl mx-auto" ref={uploadSectionRef} style={{ scrollMarginTop: 80 }}>
            {/* 第一步：上传文档 */}
            {currentStep === 'upload' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">上传您的学习材料</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    支持多种格式：PDF、Word、PowerPoint、Markdown、文本等。上传后AI将自动解析并生成学习大纲。
                  </p>
                </div>

                <DocumentUploader
                  onUploadComplete={handleInlineDocumentUploaded}
                  loading={isGeneratingOutline}
                  apiConfig={apiConfig}
                />

                {isGeneratingOutline && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      <span className="text-blue-900 font-medium">AI正在分析文档内容并生成学习大纲，请稍候...</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 文档已上传但大纲失败时的友好提示（与上传页一致） */}
            {currentStep === 'uploaded' && parseResult && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">文档解析完成</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">您的文档已成功上传并解析。请选择下一步操作。</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <FileText className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-2">{parseResult.title || '未命名文档'}</h3>
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

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-600 text-sm">⚠️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-amber-900 mb-2">大纲生成遇到问题</h3>
                      <p className="text-amber-700 text-sm mb-4">可能是网络、API配置或文档内容复杂导致。您可以重试或使用基础大纲。</p>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button variant="primary" onClick={retryInlineGenerateOutline} loading={isGeneratingOutline}>
                          重试生成大纲
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            // 使用上传页中的备用大纲策略：简化起见，引导用户去上传页完整处理
                            setCurrentStep('upload');
                            setParseResult(null);
                          }}
                        >
                          返回重新上传
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 第二步：确认/编辑大纲 */}
            {currentStep === 'outline' && parseResult && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">确认学习大纲</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">AI已为您生成学习大纲，可根据需要进行调整。</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-start gap-4">
                    <FileText className="w-8 h-8 text-gray-400 flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 mb-2">{parseResult.title || '未命名文档'}</h3>
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

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">学习大纲（{outline.length} 个章节）</h3>
                  <OutlineEditor items={outline} onChange={setOutline} readonly={false} showNumbers={true} />
                </div>

                <div className="flex justify-center">
                  <Button variant="primary" size="lg" onClick={handleInlineConfirmOutline} disabled={outline.length === 0}>
                    确认大纲，下一步
                  </Button>
                </div>
              </div>
            )}

            {/* 第三步：选择学习水平并创建会话 */}
            {currentStep === 'level' && (
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">选择您的学习水平</h2>
                  <p className="text-gray-600 max-w-2xl mx-auto">AI私教将根据您选择的水平调整教学方式。</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                  <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      learningLevel === 'beginner' ? 'border-primary-500 bg-primary-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setLearningLevel('beginner')}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        learningLevel === 'beginner' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <User className="w-8 h-8" />
                      </div>
                      <h3 className={`text-xl font-semibold mb-3 ${learningLevel === 'beginner' ? 'text-primary-900' : 'text-gray-900'}`}>小白模式</h3>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4 text-left">
                        <li>• 节奏缓慢，循序渐进</li>
                        <li>• 详细解释每个概念</li>
                        <li>• 提供具体的操作步骤</li>
                      </ul>
                    </div>
            </div>

                  <div
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      learningLevel === 'expert' ? 'border-secondary-500 bg-secondary-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                    }`}
                    onClick={() => setLearningLevel('expert')}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        learningLevel === 'expert' ? 'bg-secondary-600 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Zap className="w-8 h-8" />
                      </div>
                      <h3 className={`text-xl font-semibold mb-3 ${learningLevel === 'expert' ? 'text-secondary-900' : 'text-gray-900'}`}>高手模式</h3>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4 text-left">
                        <li>• 节奏较快，直击要点</li>
                        <li>• 聚焦核心概念和差异</li>
                        <li>• 讨论设计原理和最佳实践</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button variant="primary" size="lg" onClick={handleInlineCreateSession} loading={isCreatingSession} icon={<FileText className="w-5 h-5" />}>
                    开始学习
            </Button>
                </div>
              </div>
            )}
          </div>
          </ThemeProvider>
        </div>

        {/* 学习历史区域 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              学习历史 ({sessions.length})
            </h3>
            {sessions.length > 0 && (
              <p className="text-sm text-gray-500">
                点击任一记录可继续学习
              </p>
            )}
          </div>
          
          <SessionHistoryList
            sessions={sessions}
            onEnterSession={handleEnterSession}
            onDeleteSession={handleDeleteSession}
            onBatchDelete={handleBatchDelete}
          />
        </div>

        {/* 数据生命周期管理 */}
        <div className="mb-8">
          <DataLifecycleManager />
        </div>

        {/* 配置状态提示 */}
        {!apiConfig && (
          <Card className="p-6 border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">需要配置AI服务</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  请先配置您的AI API密钥，才能开始学习体验
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAPIConfigModal(true)}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                立即配置
              </Button>
            </div>
          </Card>
        )}
      </main>

      {/* API配置模态框 */}
      {showAPIConfigModal && (
        <APIConfigModal
          isOpen={showAPIConfigModal}
          onClose={() => setShowAPIConfigModal(false)}
          currentConfig={apiConfig}
          onSave={handleSaveAPIConfig}
        />
      )}
    </div>
  );
};

export default DashboardPage;