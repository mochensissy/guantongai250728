/**
 * 主题上下文提供者
 * 
 * 提供全局主题管理功能：
 * - 主题状态管理（小白模式/高手模式）
 * - 主题切换功能
 * - CSS变量动态更新
 * - 主题持久化存储
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LearningLevel } from '../types';
import { ThemeConfig, getTheme, generateCSSVariables, ThemeUtils } from '../styles/themes';

/**
 * 主题上下文接口
 */
interface ThemeContextType {
  /** 当前学习水平/模式 */
  currentLevel: LearningLevel;
  /** 当前主题配置 */
  currentTheme: ThemeConfig;
  /** 是否为小白模式 */
  isBeginner: boolean;
  /** 是否为高手模式 */
  isExpert: boolean;
  /** 切换到指定学习水平 */
  switchToLevel: (level: LearningLevel) => void;
  /** 切换到小白模式 */
  switchToBeginner: () => void;
  /** 切换到高手模式 */
  switchToExpert: () => void;
  /** 获取当前模式名称 */
  getModeName: () => string;
  /** 获取当前模式描述 */
  getModeDescription: () => string;
}

/**
 * 主题上下文
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * 主题上下文Hook
 * 用于在组件中获取主题相关状态和方法
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme 必须在 ThemeProvider 内部使用');
  }
  return context;
};

/**
 * 主题提供者组件属性
 */
interface ThemeProviderProps {
  /** 子组件 */
  children: React.ReactNode;
  /** 初始学习水平（可选，默认从localStorage读取或使用beginner） */
  initialLevel?: LearningLevel;
}

/**
 * 本地存储键名
 */
const STORAGE_KEY = 'ai-tutor-ui-theme';

/**
 * 主题提供者组件
 * 
 * 功能：
 * 1. 管理当前学习水平状态
 * 2. 动态更新CSS变量
 * 3. 持久化主题设置
 * 4. 提供主题切换方法
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialLevel,
}) => {
  // 初始化学习水平
  const [currentLevel, setCurrentLevel] = useState<LearningLevel>(() => {
    // 优先使用传入的初始值
    if (initialLevel) {
      return initialLevel;
    }
    
    // 在服务端渲染时，直接返回默认值
    if (typeof window === 'undefined') {
      return 'beginner';
    }
    
    // 尝试从localStorage读取
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored === 'beginner' || stored === 'expert')) {
        return stored as LearningLevel;
      }
    } catch (error) {
      console.warn('读取主题设置失败:', error);
    }
    
    // 默认返回小白模式
    return 'beginner';
  });

  // 获取当前主题配置
  const currentTheme = getTheme(currentLevel);

  /**
   * 更新CSS自定义属性
   * 将主题配置应用到DOM根元素
   */
  const updateCSSVariables = useCallback((theme: ThemeConfig) => {
    const root = document.documentElement;
    const variables = generateCSSVariables(theme);
    
    // 批量设置CSS变量
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, []);

  /**
   * 保存学习水平到localStorage
   */
  const saveToStorage = useCallback((level: LearningLevel) => {
    try {
      localStorage.setItem(STORAGE_KEY, level);
    } catch (error) {
      console.warn('保存主题设置失败:', error);
    }
  }, []);

  /**
   * 切换到指定学习水平
   */
  const switchToLevel = useCallback((level: LearningLevel) => {
    setCurrentLevel(level);
    saveToStorage(level);
  }, [saveToStorage]);

  /**
   * 切换到小白模式
   */
  const switchToBeginner = useCallback(() => {
    switchToLevel('beginner');
  }, [switchToLevel]);

  /**
   * 切换到高手模式
   */
  const switchToExpert = useCallback(() => {
    switchToLevel('expert');
  }, [switchToLevel]);

  /**
   * 获取当前模式名称
   */
  const getModeName = useCallback(() => {
    return ThemeUtils.getModeName(currentLevel);
  }, [currentLevel]);

  /**
   * 获取当前模式描述
   */
  const getModeDescription = useCallback(() => {
    return ThemeUtils.getModeDescription(currentLevel);
  }, [currentLevel]);

  // 当主题变化时更新CSS变量
  useEffect(() => {
    updateCSSVariables(currentTheme);
  }, [currentTheme, updateCSSVariables]);

  // 提供给子组件的上下文值
  const contextValue: ThemeContextType = {
    currentLevel,
    currentTheme,
    isBeginner: ThemeUtils.isBeginner(currentLevel),
    isExpert: ThemeUtils.isExpert(currentLevel),
    switchToLevel,
    switchToBeginner,
    switchToExpert,
    getModeName,
    getModeDescription,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 主题切换Hook
 * 提供简化的主题切换功能
 */
export const useThemeToggle = () => {
  const { currentLevel, switchToBeginner, switchToExpert } = useTheme();
  
  const toggle = useCallback(() => {
    if (currentLevel === 'beginner') {
      switchToExpert();
    } else {
      switchToBeginner();
    }
  }, [currentLevel, switchToBeginner, switchToExpert]);

  return { toggle, currentLevel };
};

/**
 * 获取主题相关的样式类名Hook
 * 根据当前主题返回对应的CSS类名
 */
export const useThemeStyles = () => {
  const { currentLevel, currentTheme } = useTheme();
  
  const getButtonClass = useCallback((variant: 'primary' | 'secondary' | 'outline' = 'primary') => {
    const baseClass = 'transition-all duration-200 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    if (currentLevel === 'beginner') {
      // 小白模式：圆润样式
      const roundedClass = 'rounded-xl';
      switch (variant) {
        case 'primary':
          return `${baseClass} ${roundedClass} bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shadow-md hover:shadow-lg`;
        case 'secondary':
          return `${baseClass} ${roundedClass} bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white shadow-md hover:shadow-lg`;
        case 'outline':
          return `${baseClass} ${roundedClass} bg-white border-2 border-[var(--border-primary)] hover:border-[var(--border-focus)] text-[var(--text-primary)]`;
        default:
          return `${baseClass} ${roundedClass}`;
      }
    } else {
      // 高手模式：锐利样式
      const sharpClass = 'rounded-lg';
      switch (variant) {
        case 'primary':
          return `${baseClass} ${sharpClass} bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white shadow-sm hover:shadow-md`;
        case 'secondary':
          return `${baseClass} ${sharpClass} bg-[var(--color-secondary-600)] hover:bg-[var(--color-secondary-700)] text-white shadow-sm hover:shadow-md`;
        case 'outline':
          return `${baseClass} ${sharpClass} bg-white border border-[var(--border-primary)] hover:border-[var(--border-focus)] text-[var(--text-primary)]`;
        default:
          return `${baseClass} ${sharpClass}`;
      }
    }
  }, [currentLevel]);

  const getCardClass = useCallback(() => {
    const baseClass = 'bg-[var(--surface-primary)] border border-[var(--border-secondary)] transition-all duration-200';
    
    if (currentLevel === 'beginner') {
      // 小白模式：圆润卡片
      return `${baseClass} rounded-xl shadow-md hover:shadow-lg`;
    } else {
      // 高手模式：锐利卡片  
      return `${baseClass} rounded-lg shadow-sm hover:shadow-md`;
    }
  }, [currentLevel]);

  const getInputClass = useCallback(() => {
    const baseClass = 'w-full px-3 py-2 bg-[var(--surface-primary)] border border-[var(--border-primary)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:border-transparent transition-all duration-200';
    
    if (currentLevel === 'beginner') {
      // 小白模式：圆润输入框
      return `${baseClass} rounded-xl`;
    } else {
      // 高手模式：锐利输入框
      return `${baseClass} rounded-lg`;
    }
  }, [currentLevel]);

  return {
    getButtonClass,
    getCardClass,
    getInputClass,
    currentLevel,
    currentTheme,
  };
}; 