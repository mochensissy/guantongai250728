/** @type {import('next').NextConfig} */
const nextConfig = {

  // 添加对外部资源的支持
  images: {
    domains: ['cdnjs.cloudflare.com'],
  },
  // 配置webpack以正确处理PDF.js
  webpack: (config) => {
    // 处理PDF.js的worker文件
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.js': false,
    };
    
    // 处理node模块的兼容性
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    
    return config;
  },
}

module.exports = nextConfig