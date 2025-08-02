/**
 * 主题差异化演示页面
 * 
 * 用于展示小白模式和高手模式的视觉差异
 */

import React, { useState } from 'react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { ThemedChatMessage, ThemedMessageList } from './ThemedChatMessage';
import ThemedChatInput from './ThemedChatInput';
import ThemedOutlineSidebar, { OutlineItem } from './ThemedOutlineSidebar';

// 演示数据
const mockMessages = [
  {
    role: 'assistant' as const,
    content: '你好！欢迎来到AI学习助手。我可以帮助你理解各种知识点，并根据你的学习水平调整讲解方式。',
    timestamp: '14:30'
  },
  {
    role: 'user' as const,
    content: '请解释一下什么是递归？',
    timestamp: '14:31'
  },
  {
    role: 'assistant' as const,
    content: '递归是一种编程技巧，就像俄罗斯套娃一样，函数调用自己来解决问题。每次调用都会处理问题的一小部分，直到问题简单到可以直接解决为止。\n\n例如：计算阶乘 5! = 5 × 4 × 3 × 2 × 1，我们可以把它看作 5 × (4!)，而 4! 又是 4 × (3!)，以此类推。',
    timestamp: '14:32'
  },
  {
    role: 'user' as const,
    content: '能给个具体的代码例子吗？',
    timestamp: '14:33'
  }
];

const mockOutline: OutlineItem[] = [
  {
    id: '1',
    title: '编程基础概念',
    description: '学习编程的基本概念和思维方式',
    estimatedMinutes: 15,
    completed: true
  },
  {
    id: '2',
    title: '函数与递归',
    description: '深入理解函数调用和递归算法',
    estimatedMinutes: 25,
    current: true
  },
  {
    id: '3',
    title: '数据结构入门',
    description: '数组、链表、栈和队列的基本操作',
    estimatedMinutes: 30,
    completed: false
  },
  {
    id: '4',
    title: '算法思维训练',
    description: '培养解决问题的算法思维',
    estimatedMinutes: 40,
    completed: false
  }
];

/**
 * 演示页面内容组件
 */
const DemoContent: React.FC = () => {
  const { currentLevel, switchToBeginner, switchToExpert } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [currentChapter, setCurrentChapter] = useState('2');
  
  const handleSend = () => {
    console.log('发送消息:', inputValue);
    setInputValue('');
  };
  
  const handleChapterSelect = (chapterId: string) => {
    setCurrentChapter(chapterId);
    console.log('选择章节:', chapterId);
  };
  
  return (
    <div className="h-screen bg-[var(--bg-primary)] flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-[var(--surface-primary)] border-b border-[var(--border-secondary)] p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            🎨 主题差异化演示
          </h1>
          
          {/* 模式切换按钮 */}
          <div className="flex gap-2">
            <button
              onClick={switchToBeginner}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${currentLevel === 'beginner' 
                  ? 'bg-[var(--surface-message-user)] text-[var(--text-inverse)]' 
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                }
              `}
            >
              🌱 小白模式
            </button>
            <button
              onClick={switchToExpert}
              className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${currentLevel === 'expert' 
                  ? 'bg-[var(--surface-message-user)] text-[var(--text-inverse)]' 
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]'
                }
              `}
            >
              ⚡ 高手模式
            </button>
          </div>
        </div>
        
        {/* 当前模式说明 */}
        <div className="mt-2 text-sm text-[var(--text-secondary)]">
          当前模式: <span className="font-medium text-[var(--surface-message-user)]">
            {currentLevel === 'beginner' ? '🌱 小白模式 - 温和友好，详细讲解' : '⚡ 高手模式 - 简洁高效，专业设计'}
          </span>
        </div>
      </div>
      
      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 */}
        <div className="w-80 flex-shrink-0">
          <ThemedOutlineSidebar
            outline={mockOutline}
            currentChapter={currentChapter}
            onChapterSelect={handleChapterSelect}
          />
        </div>
        
        {/* 聊天区域 */}
        <div className="flex-1 flex flex-col">
          {/* 消息列表 */}
          <div className="flex-1 overflow-hidden">
            <ThemedMessageList className="h-full">
              {mockMessages.map((message, index) => (
                <ThemedChatMessage
                  key={index}
                  role={message.role}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ))}
            </ThemedMessageList>
          </div>
          
          {/* 输入区域 */}
          <ThemedChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            loading={false}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * 主题差异化演示页面
 */
export const ThemeDemoPage: React.FC = () => {
  return (
    <ThemeProvider initialLevel="beginner">
      <DemoContent />
    </ThemeProvider>
  );
};

export default ThemeDemoPage;