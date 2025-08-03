/**
 * Next.js应用入口文件
 * 
 * 配置全局样式和应用级别的组件：
 * - 导入Tailwind CSS样式
 * - 设置全局字体和主题
 * - 应用状态管理
 * - 认证提供者
 */

import type { AppProps } from 'next/app';
import '../src/index.css';
import { AuthProvider } from '../src/contexts/AuthContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
}