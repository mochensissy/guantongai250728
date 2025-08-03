/**
 * 产品首页组件 - 现代化SaaS Landing Page
 * 
 * 功能：
 * - 现代化的产品展示页面
 * - 符合SaaS产品标准的布局结构
 * - 为Supabase认证系统做准备
 * - 响应式设计，适配各种设备
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  Brain, 
  Zap, 
  Users, 
  FileText, 
  MessageCircle,
  Star,
  Check,
  Menu,
  X,
  ArrowRight,
  Play,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import AuthModal from './AuthModal';
import { useAuth } from '../contexts/AuthContext';

interface LandingPageProps {
  onGetStarted?: () => void;
  onLogin?: () => void;
  onAuthSuccess?: (user: any) => void;
}

/**
 * 产品首页组件
 */
const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onAuthSuccess,
}) => {
  // 认证状态
  const { user } = useAuth();
  
  // 状态管理
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  /**
   * 处理登录按钮点击
   */
  const handleLoginClick = () => {
    if (onLogin) {
      onLogin();
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  /**
   * 处理免费试用按钮点击
   */
  const handleGetStartedClick = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      setAuthMode('signup');
      setShowAuthModal(true);
    }
  };

  /**
   * 处理认证成功
   */
  const handleAuthSuccess = (user: any) => {
    if (onAuthSuccess) {
      onAuthSuccess(user);
    }
    setShowAuthModal(false);
  };

  /**
   * 处理演示按钮点击
   */
  const handleDemoClick = () => {
    // 滚动到功能展示区域
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 1. Header 导航栏 */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo区域 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI学习私教</h1>
                <p className="text-xs text-gray-500 hidden sm:block">智能文档学习引导平台</p>
              </div>
            </div>

            {/* 桌面端导航 */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                功能特色
              </a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">
                核心优势
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                价格方案
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                用户评价
              </a>
            </nav>

            {/* 操作按钮 */}
            <div className="flex items-center gap-3">
              {user ? (
                /* 已登录状态 */
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 hidden sm:block">
                    欢迎，{user.email}
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard'}
                  >
                    进入应用
                  </Button>
                </div>
              ) : (
                /* 未登录状态 */
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoginClick}
                    className="hidden sm:block"
                  >
                    登录
                  </Button>
                  
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleGetStartedClick}
                  >
                    免费使用
                  </Button>
                </>
              )}

              {/* 移动端菜单按钮 */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                {showMobileMenu ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* 移动端菜单 */}
          {showMobileMenu && (
            <div className="lg:hidden border-t border-gray-100 py-4">
              <nav className="flex flex-col gap-4">
                <a 
                  href="#features" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  功能特色
                </a>
                <a 
                  href="#benefits" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  核心优势
                </a>
                <a 
                  href="#pricing" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  价格方案
                </a>
                <a 
                  href="#testimonials" 
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  用户评价
                </a>
                {user ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.location.href = '/dashboard'}
                    className="w-full justify-center sm:hidden"
                  >
                    进入应用
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoginClick}
                    className="w-full justify-center sm:hidden"
                  >
                    登录
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* 2. Hero Section 标题区 */}
      <section className="relative py-20 sm:py-32 bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              让AI成为您的
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
                专属学习导师
              </span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed">
              上传任何文档，AI会为您生成个性化学习路径，提供互动式教学体验。
              告别枯燥的自学，开启智能引导的学习新时代。
            </p>

            {/* CTA按钮组 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGetStartedClick}
                icon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto text-lg px-8 py-4"
              >
                立即开始14天免费试用
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                onClick={handleDemoClick}
                icon={<Play className="w-5 h-5" />}
                className="w-full sm:w-auto text-lg px-8 py-4"
              >
                了解更多
              </Button>
            </div>

            {/* 产品预览图占位 */}
            <div className="relative max-w-5xl mx-auto">
              <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                  <div className="text-center">
                    <Brain className="w-16 h-16 text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">产品演示视频</p>
                    <p className="text-gray-500 text-sm">智能文档学习体验</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Benefits 核心优势 */}
      <section id="benefits" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              为什么选择AI学习私教？
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我们重新定义了文档学习体验，让每一次学习都变得高效且愉悦
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* 优势1：智能引导 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">智能引导学习</h4>
              <p className="text-gray-600 leading-relaxed">
                AI导师采用苏格拉底式对话，不再是简单问答，而是启发式引导，
                让您在思考中掌握知识，培养批判性思维能力。
              </p>
            </Card>

            {/* 优势2：个性化教学 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">双模式教学</h4>
              <p className="text-gray-600 leading-relaxed">
                小白模式温和友善，注重基础建设；高手模式直击核心，探讨深层原理。
                AI自动调整教学节奏和深度，完美匹配您的学习水平。
              </p>
            </Card>

            {/* 优势3：全能解析 */}
            <Card className="text-center p-8 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-4">全格式解析</h4>
              <p className="text-gray-600 leading-relaxed">
                支持PDF、Word、PPT、Markdown等多种格式，还能解析网页内容。
                无论什么形式的学习资料，都能智能提取并生成学习路径。
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 4. Features 功能介绍 */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              功能特色一览
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              从文档上传到知识沉淀，完整的学习闭环体验
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* 功能1：智能大纲生成 */}
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    智能大纲生成 + 自由编辑
                  </h4>
                  <p className="text-gray-600">
                    AI自动分析文档结构，生成逻辑清晰的学习大纲。您可以自由调整章节顺序、
                    修改标题，完全按照个人喜好定制学习路径。
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-secondary-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    探索式对话学习
                  </h4>
                  <p className="text-gray-600">
                    采用"教学节点+探索选项"模式，AI讲解完知识点后提供选择按钮，
                    让您主导学习方向，激发学习兴趣和主动性。
                  </p>
                </div>
              </div>
            </div>

            {/* 功能演示图 */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-primary-200 rounded w-5/6"></div>
                    <div className="flex gap-2 mt-6">
                      <div className="h-8 bg-primary-100 rounded-full px-4 flex items-center text-xs">
                        深入了解
                      </div>
                      <div className="h-8 bg-secondary-100 rounded-full px-4 flex items-center text-xs">
                        查看示例
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">
            {/* 知识卡片演示图 */}
            <div className="order-2 lg:order-1 relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h5 className="font-medium text-gray-700">知识卡片管理</h5>
                </div>
                <div className="p-6 space-y-4">
                  <Card className="p-4 border-l-4 border-primary-500">
                    <div className="flex items-start justify-between">
                      <div>
                        <h6 className="font-medium text-gray-900">React Hooks核心概念</h6>
                        <p className="text-sm text-gray-600 mt-1">使用状态管理的最佳实践...</p>
                      </div>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                  </Card>
                  <Card className="p-4 border-l-4 border-secondary-500">
                    <div className="flex items-start justify-between">
                      <div>
                        <h6 className="font-medium text-gray-900">组件生命周期</h6>
                        <p className="text-sm text-gray-600 mt-1">理解组件挂载和更新过程...</p>
                      </div>
                      <Star className="w-4 h-4 text-yellow-500" />
                    </div>
                  </Card>
                </div>
              </div>
            </div>

            {/* 功能2：知识卡片系统 */}
            <div className="order-1 lg:order-2 space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-accent-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-accent-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    一键收藏知识卡片
                  </h4>
                  <p className="text-gray-600">
                    学习过程中遇到重要知识点，一键收藏为灵感💡或重点⭐卡片。
                    AI自动生成精炼标题，建立个人知识库。
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    科学复习 + Anki导出
                  </h4>
                  <p className="text-gray-600">
                    基于艾宾浩斯遗忘曲线，智能安排复习计划。支持导出到Anki，
                    与您现有的学习工具无缝衔接。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Testimonials 用户证言 */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              用户怎么说
            </h3>
            <p className="text-xl text-gray-600">
              已有数千用户体验了AI私教的学习魅力
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* 用户证言1 */}
            <Card className="p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "作为编程新手，我一直觉得技术文档很难懂。用了AI学习私教后，
                复杂的概念都能用生活化的比喻解释清楚，学习效率提升了至少3倍！"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">张</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">张同学</div>
                  <div className="text-sm text-gray-500">前端开发新手</div>
                </div>
              </div>
            </Card>

            {/* 用户证言2 */}
            <Card className="p-8">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "高手模式真的很棒！不会浪费时间在基础概念上，直接深入核心原理。
                AI能够引导我思考架构设计，这种对话式学习让我收获很大。"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">李</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">李工程师</div>
                  <div className="text-sm text-gray-500">资深技术架构师</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 6. CTA 行动召唤 */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            准备开始您的AI学习之旅了吗？
          </h3>
          <p className="text-xl text-primary-100 mb-8">
            立即体验个性化AI私教服务，让学习变得更高效、更愉悦
          </p>
          
          <Button
            variant="secondary"
            size="lg"
            onClick={handleGetStartedClick}
            className="bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-4"
          >
            立即开始14天免费试用
          </Button>
          
          <p className="text-primary-200 text-sm mt-4">
            无需信用卡 · 随时可取消 · 全功能体验
          </p>
        </div>
      </section>

      {/* 7. Pricing 价格方案 */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              选择适合您的方案
            </h3>
            <p className="text-xl text-gray-600">
              从个人学习到团队协作，总有一款适合您
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* 基础版 */}
            <Card className="p-8 relative">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">基础版</h4>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">免费</span>
                  <span className="text-gray-500">/月</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">每月5个文档解析</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">基础AI对话功能</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">20张知识卡片</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">社区支持</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full" onClick={handleGetStartedClick}>
                  开始使用
                </Button>
              </div>
            </Card>

            {/* 专业版 */}
            <Card className="p-8 relative border-2 border-primary-500">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  推荐
                </span>
              </div>
              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">专业版</h4>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">¥99</span>
                  <span className="text-gray-500">/月</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">无限文档解析</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">高级AI对话功能</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">无限知识卡片</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Anki导出功能</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">优先客服支持</span>
                  </li>
                </ul>
                <Button variant="primary" className="w-full" onClick={handleGetStartedClick}>
                  立即升级
                </Button>
              </div>
            </Card>

            {/* 企业版 */}
            <Card className="p-8 relative">
              <div className="text-center">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">企业版</h4>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">联系</span>
                  <span className="text-gray-500">销售</span>
                </div>
                <ul className="space-y-3 mb-8 text-left">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">专业版所有功能</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">团队协作功能</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">数据安全保障</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">专属客户经理</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">定制化功能开发</span>
                  </li>
                </ul>
                <Button variant="outline" className="w-full">
                  联系我们
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* 8. Footer 页脚 */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* 品牌信息 */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">AI学习私教</h1>
                </div>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed">
                让AI成为您的专属学习导师，开启智能引导的学习新时代。
              </p>
              <div className="flex gap-4">
                {/* 社交媒体链接占位 */}
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="text-sm">微</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="text-sm">博</span>
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors">
                  <span className="text-sm">知</span>
                </a>
              </div>
            </div>

            {/* 产品链接 */}
            <div>
              <h3 className="font-semibold mb-4">产品</h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors">功能特色</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors">价格方案</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">更新日志</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">路线图</a></li>
              </ul>
            </div>

            {/* 支持链接 */}
            <div>
              <h3 className="font-semibold mb-4">支持</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">使用指南</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">常见问题</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">联系客服</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">反馈建议</a></li>
              </ul>
            </div>

            {/* 公司信息 */}
            <div>
              <h3 className="font-semibold mb-4">公司</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">关于我们</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">隐私政策</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">服务条款</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">加入我们</a></li>
              </ul>
            </div>
          </div>

          {/* 版权信息 */}
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-400">
              © 2024 AI学习私教. 保留所有权利.
            </p>
          </div>
        </div>
      </footer>

      {/* 认证模态框 */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onModeChange={setAuthMode}
          onAuthSuccess={handleAuthSuccess}
        />
      )}
    </div>
  );
};

export default LandingPage;