/**
 * Next.js应用入口文件
 * 
 * 配置全局样式和应用级别的组件：
 * - 导入Tailwind CSS样式
 * - 设置全局字体和主题
 * - 应用状态管理
 */

import type { AppProps } from 'next/app';
import '../src/index.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}