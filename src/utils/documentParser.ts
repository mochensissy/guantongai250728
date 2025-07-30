/**
 * 文档解析工具类
 * 
 * 支持多种文档格式的解析：
 * - URL网页内容抓取
 * - PDF文档解析
 * - Word文档解析
 * - PowerPoint演示文稿解析
 * - Markdown文档解析
 * - 纯文本文档处理
 */

import { DocumentParseResult } from '../types';

/**
 * 通用文档解析函数
 * 根据文件类型或URL自动选择合适的解析方法
 */
export const parseDocument = async (
  input: File | string,
  type?: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text'
): Promise<DocumentParseResult> => {
  try {
    // 如果输入是字符串，判断是URL还是文本内容
    if (typeof input === 'string') {
      if (type === 'url' || isValidURL(input)) {
        return await parseURL(input);
      } else if (type === 'markdown' || input.includes('# ') || input.includes('## ')) {
        return parseMarkdown(input);
      } else {
        return parseText(input);
      }
    }

    // 如果输入是文件，根据文件类型选择解析方法
    const fileType = type || getFileTypeFromFile(input);
    
    switch (fileType) {
      case 'pdf':
        return await parsePDF(input);
      case 'word':
        return await parseWord(input);
      case 'ppt':
        return await parsePowerPoint(input);
      case 'markdown':
        const markdownContent = await readFileAsText(input);
        return parseMarkdown(markdownContent);
      case 'text':
      default:
        const textContent = await readFileAsText(input);
        return parseText(textContent);
    }
  } catch (error) {
    console.error('文档解析失败:', error);
    return {
      success: false,
      content: '',
      error: error instanceof Error ? error.message : '未知解析错误',
    };
  }
};

/**
 * 判断字符串是否为有效URL
 */
const isValidURL = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

/**
 * 从文件对象推断文件类型
 */
const getFileTypeFromFile = (file: File): string => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  if (extension === 'pdf' || mimeType.includes('pdf')) {
    return 'pdf';
  }
  if (extension === 'docx' || extension === 'doc' || mimeType.includes('word')) {
    return 'word';
  }
  if (extension === 'pptx' || extension === 'ppt' || mimeType.includes('presentation')) {
    return 'ppt';
  }
  if (extension === 'md' || extension === 'markdown') {
    return 'markdown';
  }
  
  return 'text';
};

/**
 * 将文件读取为文本内容
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string || '');
    reader.onerror = (e) => reject(new Error('文件读取失败'));
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * 解析URL内容
 * 使用多个代理服务轮询，提高成功率
 */
const parseURL = async (url: string): Promise<DocumentParseResult> => {
  // 多个代理服务，按优先级排序
  const proxyServices = [
    // 方法1: cors-anywhere (需要先访问 https://cors-anywhere.herokuapp.com/corsdemo 激活)
    `https://cors-anywhere.herokuapp.com/${url}`,
    // 方法2: AllOrigins
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    // 方法3: corsproxy.io
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    // 方法4: 尝试直接访问（某些情况下可能有效）
    url
  ];

  let lastError: string = '';
  let html = '';

  try {
    // 轮询尝试各个代理服务
    for (let i = 0; i < proxyServices.length; i++) {
      try {
        const proxyUrl = proxyServices[i];
        console.log(`尝试代理服务 ${i + 1}/${proxyServices.length}: ${proxyUrl}`);
        
        const response = await fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          // 设置超时
          signal: AbortSignal.timeout(10000), // 10秒超时
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 处理不同代理服务的响应格式
        if (i === 1) {
          // AllOrigins 返回 JSON 格式
          const data = await response.json();
          if (data.contents && data.contents.trim()) {
            html = data.contents;
            break;
          } else {
            throw new Error('代理服务返回空内容');
          }
        } else {
          // 其他服务直接返回HTML
          const responseText = await response.text();
          if (responseText && responseText.trim().length > 100) {
            html = responseText;
            break;
          } else {
            throw new Error('返回内容过短或为空');
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        lastError = `代理服务 ${i + 1} 失败: ${errorMsg}`;
        console.warn(lastError);
        
        // 如果不是最后一个服务，继续尝试下一个
        if (i < proxyServices.length - 1) {
          continue;
        }
      }
    }

    // 如果所有代理都失败了
    if (!html) {
      throw new Error(`所有代理服务都无法访问该URL。最后错误: ${lastError}`);
    }
    
    // 简单的HTML文本提取（实际项目中可能需要更复杂的解析）
    const textContent = extractTextFromHTML(html);
    let title = extractTitleFromHTML(html);
    
    // 如果无法从HTML提取标题，尝试从URL生成一个友好的标题
    if (!title || title.trim() === '') {
      title = generateTitleFromURL(url);
      console.log('从URL生成备用标题:', title);
    }

    // 验证提取的内容
    if (!textContent || textContent.trim().length < 50) {
      throw new Error('提取的文本内容过少，可能是动态加载页面或被反爬虫保护');
    }
    
    return {
      success: true,
      content: textContent,
      title,
      metadata: {
        wordCount: textContent.split(/\s+/).length,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 提供更详细的错误信息和解决建议
    let userFriendlyMessage = `URL解析失败: ${errorMessage}`;
    
    if (errorMessage.includes('CORS')) {
      userFriendlyMessage += '\n\n💡 解决建议：由于浏览器安全限制，某些网站无法直接访问。请尝试：\n1. 复制网页内容，使用"文本粘贴"功能\n2. 或者尝试其他公开可访问的URL';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
      userFriendlyMessage += '\n\n💡 解决建议：网络超时，请检查网络连接或稍后重试';
    } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      userFriendlyMessage += '\n\n💡 解决建议：URL不存在，请检查链接是否正确';
    } else if (errorMessage.includes('动态加载') || errorMessage.includes('反爬虫')) {
      userFriendlyMessage += '\n\n💡 解决建议：该网站使用了动态加载或反爬虫保护。请手动复制网页内容，然后使用"文本粘贴"功能';
    }
    
    return {
      success: false,
      content: '',
      error: userFriendlyMessage,
    };
  }
};

/**
 * 从HTML中提取纯文本内容
 */
const extractTextFromHTML = (html: string): string => {
  try {
    // 创建一个临时DOM元素来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // 移除script和style标签
    const scripts = tempDiv.querySelectorAll('script, style, nav, header, footer, aside');
    scripts.forEach(el => el.remove());
    
    // 移除广告和无关内容
    const ads = tempDiv.querySelectorAll('[class*="ad"], [id*="ad"], [class*="advertisement"]');
    ads.forEach(el => el.remove());
    
    // 提取文本内容
    let textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // 清理文本：移除多余空白和换行
    textContent = textContent
      .replace(/\s+/g, ' ')  // 多个空白字符替换为单个空格
      .replace(/\n\s*\n/g, '\n\n')  // 多个换行替换为双换行
      .trim();
    
    return textContent;
  } catch (error) {
    console.error('HTML文本提取失败:', error);
    // 如果DOM解析失败，使用正则表达式简单清理
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
};

/**
 * 从HTML中提取标题
 */
const extractTitleFromHTML = (html: string): string => {
  // 尝试多种方式提取标题
  
  // 方法1: 标准的 <title> 标签
  let titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    const title = titleMatch[1].trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, ' ');
    console.log('从 <title> 标签提取到标题:', title);
    return title;
  }

  // 方法2: Open Graph 标题
  titleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  if (titleMatch && titleMatch[1].trim()) {
    const title = titleMatch[1].trim();
    console.log('从 og:title 提取到标题:', title);
    return title;
  }

  // 方法3: Twitter Card 标题
  titleMatch = html.match(/<meta[^>]*name="twitter:title"[^>]*content="([^"]*)"[^>]*>/i);
  if (titleMatch && titleMatch[1].trim()) {
    const title = titleMatch[1].trim();
    console.log('从 twitter:title 提取到标题:', title);
    return title;
  }

  // 方法4: 第一个 h1 标签
  titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (titleMatch && titleMatch[1].trim()) {
    // 移除HTML标签
    const title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    if (title.length > 0 && title.length < 200) { // 确保标题长度合理
      console.log('从 h1 标签提取到标题:', title);
      return title;
    }
  }

  // 方法5: 从URL中提取文件名（作为最后的备选方案）
  console.log('所有标题提取方法都失败了，返回空字符串');
  return '';
};

/**
 * 从URL生成友好的标题
 */
const generateTitleFromURL = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // 提取域名
    const domain = urlObj.hostname.replace(/^www\./, '');
    
    // 提取路径的最后一部分
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    const lastPath = pathParts[pathParts.length - 1];
    
    if (lastPath && lastPath !== '') {
      // 如果路径有内容，格式化它
      const title = lastPath
        .replace(/[-_]/g, ' ') // 替换连字符和下划线为空格
        .replace(/\.(html?|php|jsp|asp)$/i, '') // 移除文件扩展名
        .replace(/\b\w/g, l => l.toUpperCase()) // 首字母大写
        .trim();
      
      if (title.length > 0) {
        return `${title} - ${domain}`;
      }
    }
    
    // 如果没有有用的路径，只返回域名
    return `${domain}的文章`;
    
  } catch (error) {
    // 如果URL解析失败，返回默认标题
    return '网页文章';
  }
};

/**
 * 解析PDF文档
 * 使用pdf.js库来提取PDF中的文本内容
 */
const parsePDF = async (file: File): Promise<DocumentParseResult> => {
  try {
    // 使用CDN版本的PDF.js worker来避免构建问题
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // 设置worker路径
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // 逐页提取文本
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter(item => 'str' in item)
        .map(item => (item as any).str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return {
      success: true,
      content: fullText.trim(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      metadata: {
        pageCount: pdf.numPages,
        wordCount: fullText.split(/\s+/).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `PDF解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
};

/**
 * 解析Word文档
 * 使用mammoth.js库来处理.docx文件
 */
const parseWord = async (file: File): Promise<DocumentParseResult> => {
  try {
    // 动态导入mammoth，处理可能的导入错误
    let mammoth;
    try {
      mammoth = await import('mammoth');
    } catch (error) {
      throw new Error('Word文档解析库加载失败，请刷新页面重试');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    return {
      success: true,
      content: result.value,
      title: file.name.replace(/\.[^/.]+$/, ''),
      metadata: {
        wordCount: result.value.split(/\s+/).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Word文档解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
};

/**
 * 解析PowerPoint演示文稿
 * 使用JSZip来提取.pptx文件中的文本内容
 */
const parsePowerPoint = async (file: File): Promise<DocumentParseResult> => {
  try {
    // 动态导入JSZip，处理可能的导入错误
    let JSZip;
    try {
      JSZip = (await import('jszip')).default;
    } catch (error) {
      throw new Error('PowerPoint解析库加载失败，请刷新页面重试');
    }
    
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    
    let fullText = '';
    let slideCount = 0;
    
    // 遍历所有幻灯片文件
    const slideFiles = Object.keys(zip.files).filter(name => 
      name.match(/ppt\/slides\/slide\d+\.xml/)
    );
    
    for (const slideFile of slideFiles) {
      const slideXml = await zip.files[slideFile].async('text');
      const slideText = extractTextFromXML(slideXml);
      if (slideText.trim()) {
        fullText += `幻灯片 ${slideCount + 1}:\n${slideText}\n\n`;
        slideCount++;
      }
    }
    
    return {
      success: true,
      content: fullText.trim(),
      title: file.name.replace(/\.[^/.]+$/, ''),
      metadata: {
        pageCount: slideCount,
        wordCount: fullText.split(/\s+/).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `PowerPoint解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
};

/**
 * 从XML中提取文本内容
 */
const extractTextFromXML = (xml: string): string => {
  // 使用正则表达式提取文本内容
  const textMatches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g);
  if (!textMatches) return '';
  
  return textMatches
    .map(match => match.replace(/<[^>]*>/g, ''))
    .join(' ')
    .trim();
};

/**
 * 解析Markdown文档
 */
const parseMarkdown = (content: string): DocumentParseResult => {
  try {
    // 移除Markdown语法，保留纯文本
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
      .replace(/`(.*?)`/g, '$1') // 移除代码标记
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 移除链接，保留文本
      .replace(/^\s*[-*+]\s+/gm, '') // 移除列表标记
      .replace(/^\s*\d+\.\s+/gm, '') // 移除数字列表标记
      .replace(/^\s*>\s+/gm, '') // 移除引用标记
      .trim();
    
    // 尝试提取标题（第一个一级标题）
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : '';
    
    return {
      success: true,
      content: plainText,
      title,
      metadata: {
        wordCount: plainText.split(/\s+/).length,
      },
    };
  } catch (error) {
    return {
      success: false,
      content: '',
      error: `Markdown解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
};

/**
 * 从文本内容智能生成标题
 * 通过分析文本结构和关键词来生成合适的标题
 */
const generateTitleFromText = (content: string): string => {
  if (!content || content.trim().length === 0) {
    return '文本内容';
  }

  const text = content.trim();
  
  // 1. 尝试提取明显的标题模式
  const titlePatterns = [
    /^(.{4,30})\n[\s]*[-=]{3,}/, // 下划线标题
    /^#{1,3}\s*(.{4,30})/, // Markdown标题
    /^(.{4,30})\n\n/, // 首行后有空行
    /^【(.{2,20})】/, // 中文标题括号
    /^《(.{2,20})》/, // 书名号标题
    /^第[一二三四五六七八九十\d]+[章节课讲部分]\s*(.{2,30})/, // 章节标题
    /^(\d+[\.\、]\s*.{4,30})/, // 数字编号标题
  ];

  for (const pattern of titlePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let title = match[1].trim();
      // 清理标题
      title = title.replace(/[。！？\.!?]+$/, ''); // 移除结尾标点
      title = title.replace(/^(关于|论|浅谈|深入理解|学习)/, ''); // 移除常见前缀
      if (title.length >= 4 && title.length <= 30) {
        return title;
      }
    }
  }

  // 2. 尝试提取关键主题词
  const keywordPatterns = [
    /([^。，！？\n]{4,20})(?:是什么|的概念|的定义|简介|概述)/, // 概念介绍
    /(?:什么是|关于)([^。，！？\n]{4,20})/, // 什么是...
    /([^。，！？\n]{4,20})(?:的特点|的优势|的作用|的意义)/, // 特征描述
    /([^。，！？\n]{4,20})(?:分析|研究|探讨|讨论)/, // 分析类
    /([^。，！？\n]{4,20})(?:方法|技术|技巧|策略)/, // 方法类
    /([^。，！？\n]{4,20})(?:原理|机制|过程|流程)/, // 原理类
    /如何([^。，！？\n]{4,20})/, // 如何...
    /([^。，！？\n]{4,20})教程/, // 教程类
  ];

  for (const pattern of keywordPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      let keyword = match[1].trim();
      // 清理关键词
      keyword = keyword.replace(/^(学习|了解|掌握|认识)/, '');
      keyword = keyword.replace(/(的内容|相关|方面)$/, '');
      if (keyword.length >= 3 && keyword.length <= 20) {
        return keyword;
      }
    }
  }

  // 3. 提取文本开头的关键句子作为标题
  const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 0);
  if (sentences.length > 0) {
    let firstSentence = sentences[0].trim();
    
    // 移除常见的开场白
    firstSentence = firstSentence.replace(/^(大家好|各位|同学们|朋友们|今天|现在|首先|那么)[，,]?\s*/, '');
    firstSentence = firstSentence.replace(/^(我们来|让我们|下面|接下来)[，,]?\s*(学习|了解|看看|讨论)\s*/, '');
    
    // 如果句子长度合适，使用它作为标题
    if (firstSentence.length >= 6 && firstSentence.length <= 25) {
      return firstSentence;
    }
    
    // 如果第一句太长，尝试截取前面有意义的部分
    if (firstSentence.length > 25) {
      const cutPoints = [
        /^(.{8,22})[，,]/, // 在逗号处截断
        /^(.{8,22})(?=的|是|为)/, // 在关键词前截断
        /^(.{8,22})(?=\s)/, // 在空格处截断
      ];
      
      for (const cutPattern of cutPoints) {
        const cutMatch = firstSentence.match(cutPattern);
        if (cutMatch && cutMatch[1]) {
          return cutMatch[1].trim();
        }
      }
      
      // 最后的备用方案：取前20个字符
      return firstSentence.substring(0, 20).replace(/[，。！？]*$/, '');
    }
  }

  // 4. 最终备用方案：提取文本中最常见的词汇组合
  const words = text.replace(/[^\u4e00-\u9fa5\w\s]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
  if (words.length >= 2) {
    // 取前几个有意义的词汇
    const meaningfulWords = words.slice(0, 3).join('');
    if (meaningfulWords.length >= 4 && meaningfulWords.length <= 15) {
      return meaningfulWords;
    }
  }

  // 如果所有方法都失败，返回默认标题
  return '文本内容';
};

/**
 * 解析纯文本内容
 * 智能生成标题并返回解析结果
 */
const parseText = (content: string): DocumentParseResult => {
  const trimmedContent = content.trim();
  
  // 生成智能标题
  const title = generateTitleFromText(trimmedContent);
  
  return {
    success: true,
    content: trimmedContent,
    title,
    metadata: {
      wordCount: trimmedContent.split(/\s+/).length,
    },
  };
};

/**
 * 验证解析结果的质量
 * 检查内容是否足够用于生成学习大纲
 */
export const validateParseResult = (result: DocumentParseResult): boolean => {
  if (!result.success || !result.content) {
    return false;
  }
  
  // 检查内容长度（至少100个字符）
  if (result.content.length < 100) {
    return false;
  }
  
  // 检查是否有实际的文字内容（不只是空白字符）
  const meaningfulContent = result.content.replace(/\s+/g, ' ').trim();
  if (meaningfulContent.length < 50) {
    return false;
  }
  
  return true;
};