/**
 * 学习模式主题配置系统
 * 
 * 为小白模式和高手模式提供差异化的视觉设计：
 * - 小白模式：温和友好，圆润设计，降低学习压力
 * - 高手模式：专业高效，锐利设计，提升专业感
 */

import { LearningLevel } from '../types';

/**
 * 主题配置接口
 * 定义了完整的主题色彩和样式规范
 */
export interface ThemeConfig {
  /** 主色调 - 用于主要按钮、链接等 */
  primary: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
    900: string;
  };
  /** 次要色调 - 用于次要操作、辅助元素 */
  secondary: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
    900: string;
  };
  /** 强调色 - 用于重要提示、警告等 */
  accent: {
    50: string;
    100: string;
    500: string;
    600: string;
    700: string;
  };
  /** 背景色系 */
  background: {
    primary: string;    // 主背景
    secondary: string;  // 次要背景
    tertiary: string;   // 第三级背景
    chat: string;       // 聊天区域背景
  };
  /** 表面色（卡片、弹窗等） */
  surface: {
    primary: string;
    elevated: string;   // 悬浮状态
    selected: string;   // 选中状态
    message: {
      user: string;     // 用户消息背景
      assistant: string; // AI消息背景
    };
  };
  /** 文字色系 */
  text: {
    primary: string;    // 主要文字
    secondary: string;  // 次要文字
    tertiary: string;   // 辅助文字
    inverse: string;    // 反色文字（用于深色背景）
    muted: string;      // 弱化文字
  };
  /** 边框色系 */
  border: {
    primary: string;
    secondary: string;
    focus: string;      // 聚焦边框
    light: string;      // 轻边框
  };
  /** 圆角设置 */
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
    message: string;    // 消息气泡圆角
  };
  /** 阴影设置 */
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    message: string;    // 消息阴影
  };
  /** 字体设置 */
  typography: {
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
    };
    lineHeight: {
      tight: string;
      normal: string;
      relaxed: string;
    };
    weight: {
      normal: string;
      medium: string;
      semibold: string;
      bold: string;
    };
  };
  /** 间距设置 */
  spacing: {
    multiplier: number;
    container: string;  // 容器内边距
    section: string;    // 区块间距
    element: string;    // 元素间距
    message: string;    // 消息间距
  };
  /** 动画设置 */
  transitions: {
    fast: string;       // 快速动画
    normal: string;     // 标准动画  
    slow: string;       // 慢速动画
  };
  /** 特殊效果 */
  effects: {
    blur: string;       // 模糊效果
    scale: {
      hover: string;    // 悬停缩放
      active: string;   // 点击缩放
    };
  };
}

/**
 * 小白模式主题配置
 * 特点：温和友好、降低学习压力、圆润设计
 */
export const beginnerTheme: ThemeConfig = {
  primary: {
    50: '#ecfdf5',    // 非常浅的绿色 - 背景使用
    100: '#d1fae5',   // 浅绿色 - 浅色背景
    500: '#10b981',   // 温和的绿色 - 主色调
    600: '#059669',   // 稍深的绿色 - 按钮默认
    700: '#047857',   // 深绿色 - 按钮悬停
    900: '#064e3b',   // 最深绿色 - 重要文字
  },
  secondary: {
    50: '#eff6ff',    // 非常浅的蓝色
    100: '#dbeafe',   // 浅蓝色
    500: '#3b82f6',   // 友好的蓝色
    600: '#2563eb',   // 稍深蓝色
    700: '#1d4ed8',   // 深蓝色
    900: '#1e3a8a',   // 最深蓝色
  },
  accent: {
    50: '#fffbeb',    // 非常浅的橙色
    100: '#fef3c7',   // 浅橙色
    500: '#f59e0b',   // 温馨的橙色
    600: '#d97706',   // 稍深橙色
    700: '#b45309',   // 深橙色
  },
  background: {
    primary: '#f9fafb',     // 非常浅的灰色 - 主背景
    secondary: '#f3f4f6',   // 浅灰色 - 次要区域背景
    tertiary: '#e5e7eb',    // 稍深灰色 - 分割区域
    chat: '#fefefe',        // 聊天区域背景 - 温馨白色
  },
  surface: {
    primary: '#ffffff',      // 纯白色 - 卡片背景
    elevated: '#ffffff',     // 纯白色 - 悬浮卡片
    selected: '#ecfdf5',     // 浅绿色 - 选中状态背景
    message: {
      user: '#10b981',       // 用户消息 - 主绿色
      assistant: '#ffffff',  // AI消息 - 白色
    },
  },
  text: {
    primary: '#374151',      // 深灰色 - 主要文字
    secondary: '#6b7280',    // 中灰色 - 次要文字
    tertiary: '#9ca3af',     // 浅灰色 - 辅助文字
    inverse: '#ffffff',      // 白色 - 反色文字
    muted: '#d1d5db',        // 弱化文字
  },
  border: {
    primary: '#d1d5db',      // 浅灰色边框
    secondary: '#e5e7eb',    // 更浅的边框
    focus: '#10b981',        // 绿色聚焦边框
    light: '#f3f4f6',        // 轻边框
  },
  borderRadius: {
    sm: '0.5rem',       // 8px - 圆润的小圆角
    md: '0.75rem',      // 12px - 圆润的中等圆角
    lg: '1rem',         // 16px - 圆润的大圆角
    xl: '1.5rem',       // 24px - 非常圆润
    full: '9999px',     // 完全圆形
    message: '1.25rem', // 20px - 消息气泡圆角
  },
  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    message: '0 2px 8px 0 rgba(0, 0, 0, 0.08), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px - 舒适阅读
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
    },
    lineHeight: {
      tight: '1.25',    // 紧密行高
      normal: '1.5',    // 标准行高
      relaxed: '1.75',  // 宽松行高 - 小白模式偏爱
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    multiplier: 1.2,        // 稍大的间距，营造轻松感
    container: '2rem',      // 32px - 宽裕的容器内边距
    section: '1.5rem',      // 24px - 区块间距
    element: '1rem',        // 16px - 元素间距
    message: '1.25rem',     // 20px - 消息间距
  },
  transitions: {
    fast: '0.15s ease-out',     // 快速动画
    normal: '0.3s ease-out',    // 标准动画 - 舒缓
    slow: '0.5s ease-out',      // 慢速动画
  },
  effects: {
    blur: 'blur(4px)',          // 模糊效果
    scale: {
      hover: '1.02',            // 轻微悬停缩放
      active: '0.98',           // 点击缩放
    },
  },
};

/**
 * 高手模式主题配置
 * 特点：专业高效、简洁精准、锐利设计
 */
export const expertTheme: ThemeConfig = {
  primary: {
    50: '#eef2ff',    // 非常浅的紫色
    100: '#e0e7ff',   // 浅紫色
    500: '#6366f1',   // 专业的紫色 - 主色调
    600: '#5b21b6',   // 稍深紫色
    700: '#4c1d95',   // 深紫色
    900: '#312e81',   // 最深紫色
  },
  secondary: {
    50: '#faf5ff',    // 非常浅的紫罗兰
    100: '#f3e8ff',   // 浅紫罗兰
    500: '#8b5cf6',   // 高级的紫罗兰
    600: '#7c3aed',   // 稍深紫罗兰
    700: '#6d28d9',   // 深紫罗兰
    900: '#581c87',   // 最深紫罗兰
  },
  accent: {
    50: '#fef2f2',    // 非常浅的红色
    100: '#fecaca',   // 浅红色
    500: '#ef4444',   // 警示的红色
    600: '#dc2626',   // 稍深红色
    700: '#b91c1c',   // 深红色
  },
  background: {
    primary: '#f8fafc',     // 非常浅的蓝灰色 - 专业感
    secondary: '#f1f5f9',   // 浅蓝灰色
    tertiary: '#e2e8f0',    // 稍深蓝灰色
    chat: '#fcfcfd',        // 聊天区域背景 - 简洁白色
  },
  surface: {
    primary: '#ffffff',      // 纯白色
    elevated: '#ffffff',     // 纯白色 - 保持简洁
    selected: '#eef2ff',     // 浅紫色 - 选中状态
    message: {
      user: '#6366f1',       // 用户消息 - 主紫色
      assistant: '#ffffff',  // AI消息 - 白色
    },
  },
  text: {
    primary: '#1f2937',      // 深灰色 - 高对比度
    secondary: '#4b5563',    // 中灰色
    tertiary: '#6b7280',     // 浅灰色
    inverse: '#ffffff',      // 白色
    muted: '#9ca3af',        // 弱化文字
  },
  border: {
    primary: '#e5e7eb',      // 浅灰色边框 - 清晰边界
    secondary: '#f3f4f6',    // 更浅边框
    focus: '#6366f1',        // 紫色聚焦边框
    light: '#f1f5f9',        // 轻边框
  },
  borderRadius: {
    sm: '0.25rem',      // 4px - 锐利的小圆角
    md: '0.5rem',       // 8px - 锐利的中等圆角
    lg: '0.625rem',     // 10px - 锐利的大圆角
    xl: '0.75rem',      // 12px - 适度圆角
    full: '9999px',     // 完全圆形（仅用于特殊元素）
    message: '0.75rem', // 12px - 消息气泡圆角
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    lg: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    xl: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    message: '0 1px 4px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.1)',
  },
  typography: {
    fontSize: {
      xs: '0.75rem',    // 12px（提高最低阅读舒适度）
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px - 提升为常规阅读字号
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
    },
    lineHeight: {
      tight: '1.25',    // 稍加放松，避免拥挤
      normal: '1.5',    // 标准行高
      relaxed: '1.75',  // 更宽松行高，提升可读性
    },
    weight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  spacing: {
    multiplier: 1.0,        // 标准间距，保持紧凑高效
    container: '1.5rem',    // 24px - 紧凑的容器内边距
    section: '1rem',        // 16px - 区块间距
    element: '0.75rem',     // 12px - 元素间距
    message: '0.875rem',    // 14px - 消息间距
  },
  transitions: {
    fast: '0.1s ease-in-out',   // 快速动画 - 高效感
    normal: '0.2s ease-in-out', // 标准动画
    slow: '0.3s ease-in-out',   // 慢速动画
  },
  effects: {
    blur: 'blur(2px)',          // 轻微模糊效果
    scale: {
      hover: '1.01',            // 细微悬停缩放
      active: '0.99',           // 点击缩放
    },
  },
};

/**
 * 主题映射表
 * 根据学习水平快速获取对应主题
 */
export const themeMap: Record<LearningLevel, ThemeConfig> = {
  beginner: beginnerTheme,
  expert: expertTheme,
};

/**
 * 获取指定学习水平的主题配置
 * @param level 学习水平
 * @returns 对应的主题配置
 */
export const getTheme = (level: LearningLevel): ThemeConfig => {
  return themeMap[level];
};

/**
 * 生成CSS变量字符串
 * 用于动态设置CSS自定义属性
 * @param theme 主题配置
 * @returns CSS变量对象
 */
export const generateCSSVariables = (theme: ThemeConfig): Record<string, string> => {
  return {
    // 主色调变量
    '--color-primary-50': theme.primary[50],
    '--color-primary-100': theme.primary[100],
    '--color-primary-500': theme.primary[500],
    '--color-primary-600': theme.primary[600],
    '--color-primary-700': theme.primary[700],
    '--color-primary-900': theme.primary[900],
    
    // 次要色调变量
    '--color-secondary-50': theme.secondary[50],
    '--color-secondary-100': theme.secondary[100],
    '--color-secondary-500': theme.secondary[500],
    '--color-secondary-600': theme.secondary[600],
    '--color-secondary-700': theme.secondary[700],
    '--color-secondary-900': theme.secondary[900],
    
    // 强调色变量
    '--color-accent-50': theme.accent[50],
    '--color-accent-100': theme.accent[100],
    '--color-accent-500': theme.accent[500],
    '--color-accent-600': theme.accent[600],
    '--color-accent-700': theme.accent[700],
    
    // 背景色变量
    '--bg-primary': theme.background.primary,
    '--bg-secondary': theme.background.secondary,
    '--bg-tertiary': theme.background.tertiary,
    '--bg-chat': theme.background.chat,
    
    // 表面色变量
    '--surface-primary': theme.surface.primary,
    '--surface-elevated': theme.surface.elevated,
    '--surface-selected': theme.surface.selected,
    '--surface-message-user': theme.surface.message.user,
    '--surface-message-assistant': theme.surface.message.assistant,
    
    // 文字色变量
    '--text-primary': theme.text.primary,
    '--text-secondary': theme.text.secondary,
    '--text-tertiary': theme.text.tertiary,
    '--text-inverse': theme.text.inverse,
    '--text-muted': theme.text.muted,
    
    // 边框色变量
    '--border-primary': theme.border.primary,
    '--border-secondary': theme.border.secondary,
    '--border-focus': theme.border.focus,
    '--border-light': theme.border.light,
    
    // 圆角变量
    '--radius-sm': theme.borderRadius.sm,
    '--radius-md': theme.borderRadius.md,
    '--radius-lg': theme.borderRadius.lg,
    '--radius-xl': theme.borderRadius.xl,
    '--radius-full': theme.borderRadius.full,
    '--radius-message': theme.borderRadius.message,
    
    // 阴影变量
    '--shadow-sm': theme.shadows.sm,
    '--shadow-md': theme.shadows.md,
    '--shadow-lg': theme.shadows.lg,
    '--shadow-xl': theme.shadows.xl,
    '--shadow-message': theme.shadows.message,
    
    // 字体变量
    '--font-size-xs': theme.typography.fontSize.xs,
    '--font-size-sm': theme.typography.fontSize.sm,
    '--font-size-base': theme.typography.fontSize.base,
    '--font-size-lg': theme.typography.fontSize.lg,
    '--font-size-xl': theme.typography.fontSize.xl,
    '--line-height-tight': theme.typography.lineHeight.tight,
    '--line-height-normal': theme.typography.lineHeight.normal,
    '--line-height-relaxed': theme.typography.lineHeight.relaxed,
    '--font-weight-normal': theme.typography.weight.normal,
    '--font-weight-medium': theme.typography.weight.medium,
    '--font-weight-semibold': theme.typography.weight.semibold,
    '--font-weight-bold': theme.typography.weight.bold,
    
    // 间距变量
    '--spacing-multiplier': theme.spacing.multiplier.toString(),
    '--spacing-container': theme.spacing.container,
    '--spacing-section': theme.spacing.section,
    '--spacing-element': theme.spacing.element,
    '--spacing-message': theme.spacing.message,
    
    // 动画变量
    '--transition-fast': theme.transitions.fast,
    '--transition-normal': theme.transitions.normal,
    '--transition-slow': theme.transitions.slow,
    
    // 效果变量
    '--effect-blur': theme.effects.blur,
    '--effect-scale-hover': theme.effects.scale.hover,
    '--effect-scale-active': theme.effects.scale.active,
  };
};

/**
 * 主题工具类
 * 提供主题相关的工具方法
 */
export class ThemeUtils {
  /**
   * 检查是否为小白模式
   */
  static isBeginner(level: LearningLevel): boolean {
    return level === 'beginner';
  }
  
  /**
   * 检查是否为高手模式
   */
  static isExpert(level: LearningLevel): boolean {
    return level === 'expert';
  }
  
  /**
   * 获取模式的友好显示名称
   */
  static getModeName(level: LearningLevel): string {
    return level === 'beginner' ? '友好风格' : '专业风格';
  }
  
  /**
   * 获取模式的描述
   */
  static getModeDescription(level: LearningLevel): string {
    return level === 'beginner' 
      ? '温和友好的界面设计' 
      : '简洁专业的界面设计';
  }
} 