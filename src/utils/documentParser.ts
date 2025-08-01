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
 * - 大文档智能拆分处理
 */

import { DocumentParseResult, DocumentSplit } from '../types';

/**
 * 通用文档解析函数
 * 根据文件类型或URL自动选择合适的解析方法
 * 
 * @param input 文件对象或文本字符串
 * @param type 可选的文件类型指定
 * @param progressCallback 可选的进度回调函数，主要用于大文件解析
 * @returns Promise<DocumentParseResult> 解析结果
 */
export const parseDocument = async (
  input: File | string,
  type?: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text',
  progressCallback?: (progress: number, status: string) => void
): Promise<DocumentParseResult> => {
  try {
    // 如果输入是字符串，判断是URL还是文本内容
    if (typeof input === 'string') {
      if (type === 'url' || isValidURL(input)) {
        progressCallback?.(50, '正在抓取网页内容...');
        const result = await parseURL(input);
        progressCallback?.(100, '网页解析完成！');
        return result;
      } else if (type === 'markdown' || input.includes('# ') || input.includes('## ')) {
        progressCallback?.(50, '正在解析Markdown内容...');
        const result = parseMarkdown(input);
        progressCallback?.(100, 'Markdown解析完成！');
        return result;
      } else {
        progressCallback?.(50, '正在处理文本内容...');
        const result = parseText(input);
        progressCallback?.(100, '文本处理完成！');
        return result;
      }
    }

    // 如果输入是文件，根据文件类型选择解析方法
    const fileType = type || getFileTypeFromFile(input);
    
    switch (fileType) {
      case 'pdf':
        // PDF解析支持进度回调
        return await parsePDF(input, progressCallback);
      case 'word':
        progressCallback?.(50, '正在解析Word文档...');
        const wordResult = await parseWord(input);
        progressCallback?.(100, 'Word文档解析完成！');
        return wordResult;
      case 'ppt':
        progressCallback?.(50, '正在解析PowerPoint文档...');
        const pptResult = await parsePowerPoint(input);
        progressCallback?.(100, 'PowerPoint文档解析完成！');
        return pptResult;
      case 'markdown':
        progressCallback?.(25, '正在读取Markdown文件...');
        const markdownContent = await readFileAsText(input);
        progressCallback?.(75, '正在解析Markdown内容...');
        const markdownResult = parseMarkdown(markdownContent);
        progressCallback?.(100, 'Markdown文件解析完成！');
        return markdownResult;
      case 'text':
      default:
        progressCallback?.(25, '正在读取文本文件...');
        const textContent = await readFileAsText(input);
        progressCallback?.(75, '正在处理文本内容...');
        const textResult = parseText(textContent);
        progressCallback?.(100, '文本文件处理完成！');
        return textResult;
    }
  } catch (error) {
    console.error('文档解析失败:', error);
    progressCallback?.(0, '解析失败');
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
    reader.onerror = () => reject(new Error('文件读取失败'));
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
 * 解析PDF文档（优化版 - 支持大文件分批处理）
 * 使用pdf.js库来提取PDF中的文本内容
 * 
 * @param file PDF文件对象
 * @param progressCallback 可选的进度回调函数，用于显示解析进度
 * @returns Promise<DocumentParseResult> 解析结果
 */
const parsePDF = async (
  file: File, 
  progressCallback?: (progress: number, status: string) => void
): Promise<DocumentParseResult> => {
  try {
    // 更新进度: 开始加载PDF.js
    progressCallback?.(5, '正在初始化PDF解析器...');
    
    // 使用CDN版本的PDF.js worker来避免构建问题
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js');
    
    // 设置worker路径
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    // 更新进度: 正在读取文件
    progressCallback?.(10, '正在读取PDF文件...');
    
    // 分块读取大文件，避免内存溢出
    const arrayBuffer = await readFileInChunks(file, (progress) => {
      progressCallback?.(10 + progress * 0.1, '正在读取PDF文件...');
    });
    
    // 更新进度: 正在解析PDF结构
    progressCallback?.(20, '正在解析PDF文档结构...');
    
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const totalPages = pdf.numPages;
    
    // 检查页数，对大文档进行优化处理
    if (totalPages > 100) {
      console.warn(`PDF文档页数较多(${totalPages}页)，将采用分批处理模式`);
    }
    
    let fullText = '';
    const batchSize = totalPages > 50 ? 10 : 5; // 大文档使用更大的批次
    
    // 分批处理页面，避免内存压力过大
    for (let startPage = 1; startPage <= totalPages; startPage += batchSize) {
      const endPage = Math.min(startPage + batchSize - 1, totalPages);
      const batchProgress = ((startPage - 1) / totalPages) * 70; // 页面解析占70%进度
      
      progressCallback?.(
        20 + batchProgress, 
        `正在解析第 ${startPage}-${endPage} 页 (共 ${totalPages} 页)...`
      );
      
      // 并行处理批次内的页面
      const batchPromises = [];
      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        batchPromises.push(extractPageText(pdf, pageNum));
      }
      
      try {
        const batchTexts = await Promise.all(batchPromises);
        fullText += batchTexts.join('\n\n') + '\n\n';
      } catch (batchError) {
        console.warn(`批次 ${startPage}-${endPage} 解析部分失败:`, batchError);
        // 对失败的页面进行单独重试
        for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
          try {
            const pageText = await extractPageText(pdf, pageNum);
            fullText += pageText + '\n\n';
          } catch (pageError) {
            console.warn(`第 ${pageNum} 页解析失败，跳过:`, pageError);
            fullText += `[第${pageNum}页解析失败]\n\n`;
          }
        }
      }
      
      // 在大文档处理过程中主动释放内存
      if (totalPages > 100 && startPage % 50 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 给浏览器时间进行垃圾回收
      }
    }
    
    // 更新进度: 完成解析
    progressCallback?.(90, '正在整理解析结果...');
    
    const wordCount = fullText.trim().split(/\s+/).length;
    
    // 对超大文档进行内容优化
    if (wordCount > 50000) {
      console.info(`文档内容较长(${wordCount}字)，建议用户考虑分段处理`);
    }
    
    progressCallback?.(100, '解析完成！');
    
    const trimmedContent = fullText.trim();
    const documentTitle = file.name.replace(/\.[^/.]+$/, '');
    const requiresSplit = shouldSplitDocument(trimmedContent);
    
    const result: DocumentParseResult = {
      success: true,
      content: trimmedContent,
      title: documentTitle,
      metadata: {
        pageCount: totalPages,
        wordCount: wordCount,
        // 注意：fileSize 不在 DocumentParseResult.metadata 类型定义中
        // processingTime: Date.now(), // 可用于性能分析
      },
      requiresSplit,
    };
    
    // 如果需要拆分，提前生成拆分结果
    if (requiresSplit) {
      result.splitDocuments = splitDocument(trimmedContent, documentTitle);
      console.log(`PDF文档需要拆分: ${documentTitle} (${wordCount}字) -> ${result.splitDocuments.length}个片段`);
    }
    
    return result;
  } catch (error) {
    console.error('PDF解析失败:', error);
    
    // 增强错误信息，帮助用户理解问题
    let errorMessage = 'PDF解析失败';
    
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes('memory') || errorMsg.includes('allocation')) {
        errorMessage = '文件过大导致内存不足，请尝试较小的PDF文件或联系技术支持';
      } else if (errorMsg.includes('invalid') || errorMsg.includes('corrupt')) {
        errorMessage = 'PDF文件格式不正确或已损坏，请检查文件完整性';
      } else if (errorMsg.includes('password') || errorMsg.includes('encrypted')) {
        errorMessage = '不支持加密或受密码保护的PDF文件';
      } else {
        errorMessage = `PDF解析失败: ${error.message}`;
      }
    }
    
    return {
      success: false,
      content: '',
      error: errorMessage,
    };
  }
};

/**
 * 分块读取大文件，避免内存溢出
 * @param file 要读取的文件
 * @param progressCallback 进度回调
 * @returns Promise<ArrayBuffer> 文件内容
 */
const readFileInChunks = async (
  file: File,
  progressCallback?: (progress: number) => void
): Promise<ArrayBuffer> => {
  // 对于小文件，直接读取
  if (file.size < 10 * 1024 * 1024) { // 小于10MB
    return await file.arrayBuffer();
  }
  
  // 大文件分块读取
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        progressCallback?.(progress);
      }
    };
    
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('文件读取结果格式错误'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * 提取单页文本内容
 * @param pdf PDF文档对象
 * @param pageNum 页码
 * @returns Promise<string> 页面文本内容
 */
const extractPageText = async (pdf: any, pageNum: number): Promise<string> => {
  try {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    const pageText = textContent.items
      .filter((item: any) => 'str' in item)
      .map((item: any) => item.str)
      .join(' ');
    
    return pageText;
  } catch (error) {
    console.warn(`第 ${pageNum} 页文本提取失败:`, error);
    return `[第${pageNum}页提取失败]`;
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
  
  const wordCount = trimmedContent.length;
  const requiresSplit = shouldSplitDocument(trimmedContent);
  
  const result: DocumentParseResult = {
    success: true,
    content: trimmedContent,
    title,
    metadata: {
      wordCount: trimmedContent.split(/\s+/).length,
    },
    requiresSplit,
  };
  
  // 如果需要拆分，提前生成拆分结果
  if (requiresSplit) {
    result.splitDocuments = splitDocument(trimmedContent, title);
    console.log(`文档需要拆分: ${title} (${wordCount}字) -> ${result.splitDocuments.length}个片段`);
  }
  
  return result;
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

/**
 * 检查文档是否需要拆分（超过12000字）
 * @param content 文档内容
 * @returns 是否需要拆分
 */
export const shouldSplitDocument = (content: string): boolean => {
  const wordCount = content.trim().length;
  return wordCount > 12000;
};

/**
 * 生成唯一ID
 * 使用时间戳+随机数确保唯一性
 */
const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 智能拆分文档为多个片段
 * 根据文档结构（章节、段落）进行智能拆分，确保每个片段内容完整且在12000字以内
 * 
 * @param content 原始文档内容
 * @param title 原始文档标题
 * @param maxWordsPerSplit 每个片段的最大字数（默认12000）
 * @returns DocumentSplit[] 拆分后的文档片段数组
 */
export const splitDocument = (
  content: string, 
  title: string = '文档', 
  maxWordsPerSplit: number = 12000
): DocumentSplit[] => {
  const trimmedContent = content.trim();
  
  // 如果内容不需要拆分，返回原文档
  if (trimmedContent.length <= maxWordsPerSplit) {
    return [{
      id: generateUniqueId(),
      title: `${title}`,
      content: trimmedContent,
      index: 1,
      wordCount: trimmedContent.length,
      originalTitle: title
    }];
  }

  console.log(`开始智能拆分文档: ${title} (${trimmedContent.length}字)`);
  
  // 生成基础时间戳用于这次拆分
  const baseTimestamp = Date.now();
  
  // 生成全文档概要
  const fullDocumentSummary = generateDocumentSummary(trimmedContent, title);
  
  // 尝试按章节拆分
  const chapterSplits = splitByChapters(trimmedContent, title, maxWordsPerSplit, baseTimestamp);
  if (chapterSplits.length > 1) {
    console.log(`按章节拆分成功，共${chapterSplits.length}个片段:`);
    
    // 为每个片段添加上下文信息
    const enrichedSplits = enrichSplitsWithContext(chapterSplits, trimmedContent, fullDocumentSummary);
    
    enrichedSplits.forEach((split, index) => {
      console.log(`  片段${index + 1}: ${split.title} (${split.wordCount}字) ID: ${split.id}`);
    });
    return enrichedSplits;
  }
  
  // 如果没有明显章节结构，按段落拆分
  const paragraphSplits = splitByParagraphs(trimmedContent, title, maxWordsPerSplit, baseTimestamp);
  console.log(`按段落拆分成功，共${paragraphSplits.length}个片段:`);
  
  // 为段落拆分也添加上下文信息
  const enrichedSplits = enrichSplitsWithContext(paragraphSplits, trimmedContent, fullDocumentSummary);
  
  enrichedSplits.forEach((split, index) => {
    console.log(`  片段${index + 1}: ${split.title} (${split.wordCount}字) ID: ${split.id}`);
  });
  return enrichedSplits;
};

/**
 * 按章节结构拆分文档
 * 识别章节标题模式，按章节进行拆分
 */
const splitByChapters = (
  content: string, 
  title: string, 
  maxWordsPerSplit: number,
  baseTimestamp: number
): DocumentSplit[] => {
  // 章节标题识别模式
  const chapterPatterns = [
    /^第[一二三四五六七八九十\d]+章\s+[^\n]+/gm,      // 第X章 标题
    /^第[一二三四五六七八九十\d]+部分\s+[^\n]+/gm,    // 第X部分 标题
    /^Chapter\s+\d+[:\s]+[^\n]+/gmi,                // Chapter X: Title
    /^\d+\.\s+[^\n]{8,80}$/gm,                      // 1. 标题形式
    /^[一二三四五六七八九十]\s*[、\.]\s*[^\n]{8,80}$/gm, // 一、标题形式
    /^#{1,3}\s+[^\n]{8,80}$/gm,                     // Markdown标题
  ];

  let chapters: Array<{title: string, startIndex: number, content?: string}> = [];
  
  // 尝试所有模式，找到最合适的章节划分
  for (const pattern of chapterPatterns) {
    const matches = [...content.matchAll(pattern)];
    
    if (matches.length >= 2) { // 至少需要2个章节才认为是有效的章节结构
      chapters = matches.map(match => ({
        title: match[0].trim(),
        startIndex: match.index || 0
      }));
      break;
    }
  }

  // 如果没有找到章节结构，返回空数组
  if (chapters.length < 2) {
    return [];
  }

  // 提取每个章节的内容
  const splits: DocumentSplit[] = [];
  
  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i];
    const nextChapter = chapters[i + 1];
    
    // 确定章节内容范围
    const startIndex = chapter.startIndex;
    const endIndex = nextChapter ? nextChapter.startIndex : content.length;
    const chapterContent = content.substring(startIndex, endIndex).trim();
    
    // 如果单个章节过长，需要进一步拆分
    if (chapterContent.length > maxWordsPerSplit) {
      const subSplits = splitLongChapter(chapterContent, chapter.title, title, maxWordsPerSplit, splits.length, baseTimestamp);
      splits.push(...subSplits);
    } else {
      splits.push({
        id: `${baseTimestamp}-${splits.length + 1}-${Math.random().toString(36).substr(2, 6)}`,
        title: `${title}（${splits.length + 1}）- ${chapter.title}`,
        content: chapterContent,
        index: splits.length + 1,
        wordCount: chapterContent.length,
        originalTitle: title
      });
    }
  }

  return splits;
};

/**
 * 拆分过长的章节
 */
const splitLongChapter = (
  chapterContent: string,
  chapterTitle: string,
  originalTitle: string,
  maxWordsPerSplit: number,
  currentIndex: number,
  baseTimestamp: number
): DocumentSplit[] => {
  const splits: DocumentSplit[] = [];
  
  // 按段落拆分章节
  const paragraphs = chapterContent.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  let currentSplit = '';
  let splitIndex = currentIndex + 1;
  
  for (const paragraph of paragraphs) {
    const testContent = currentSplit + (currentSplit ? '\n\n' : '') + paragraph;
    
    if (testContent.length > maxWordsPerSplit && currentSplit.length > 0) {
      // 当前片段已经达到上限，保存并开始新片段
      splits.push({
        id: `${baseTimestamp}-${splitIndex}-${Math.random().toString(36).substr(2, 6)}`,
        title: `${originalTitle}（${splitIndex}）- ${chapterTitle}${splits.length > 0 ? ` (续${splits.length + 1})` : ''}`,
        content: currentSplit.trim(),
        index: splitIndex,
        wordCount: currentSplit.length,
        originalTitle: originalTitle
      });
      
      currentSplit = paragraph;
      splitIndex++;
    } else {
      currentSplit = testContent;
    }
  }
  
  // 添加最后一个片段
  if (currentSplit.trim().length > 0) {
    splits.push({
      id: `${baseTimestamp}-${splitIndex}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${originalTitle}（${splitIndex}）- ${chapterTitle}${splits.length > 0 ? ` (续${splits.length + 1})` : ''}`,
      content: currentSplit.trim(),
      index: splitIndex,
      wordCount: currentSplit.length,
      originalTitle: originalTitle
    });
  }
  
  return splits;
};

/**
 * 按段落拆分文档
 * 当没有明显章节结构时使用
 */
const splitByParagraphs = (
  content: string, 
  title: string, 
  maxWordsPerSplit: number,
  baseTimestamp: number
): DocumentSplit[] => {
  const splits: DocumentSplit[] = [];
  
  // 按段落分割（双换行符或多个换行符）
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentSplit = '';
  let splitIndex = 1;
  
  for (const paragraph of paragraphs) {
    const testContent = currentSplit + (currentSplit ? '\n\n' : '') + paragraph;
    
    if (testContent.length > maxWordsPerSplit && currentSplit.length > 0) {
      // 当前片段已达上限，保存并开始新片段
      splits.push({
        id: `${baseTimestamp}-${splitIndex}-${Math.random().toString(36).substr(2, 6)}`,
        title: `${title}（${splitIndex}）`,
        content: currentSplit.trim(),
        index: splitIndex,
        wordCount: currentSplit.length,
        originalTitle: title
      });
      
      currentSplit = paragraph;
      splitIndex++;
    } else {
      currentSplit = testContent;
    }
  }
  
  // 添加最后一个片段
  if (currentSplit.trim().length > 0) {
    splits.push({
      id: `${baseTimestamp}-${splitIndex}-${Math.random().toString(36).substr(2, 6)}`,
      title: `${title}（${splitIndex}）`,
      content: currentSplit.trim(),
      index: splitIndex,
      wordCount: currentSplit.length,
      originalTitle: title
    });
  }
  
  return splits;
};

/**
 * 生成文档概要摘要
 * 提取文档的核心主题、结构和关键概念
 */
const generateDocumentSummary = (content: string, title: string): string => {
  // 提取前500字作为开头概要
  const intro = content.substring(0, 500);
  
  // 尝试识别主要章节标题
  const chapterPatterns = [
    /第[一二三四五六七八九十\d]+章[：:\s]*([^\n]{10,50})/g,
    /Chapter\s+\d+[：:\s]*([^\n]{10,50})/gi,
    /^\d+[\.、]\s*([^\n]{8,80})/gm,
    /^[一二三四五六七八九十][、．]\s*([^\n]{8,80})/gm,
    /^#{1,3}\s+([^\n]{8,80})/gm,
  ];

  const chapterTitles: string[] = [];
  
  for (const pattern of chapterPatterns) {
    const matches = [...content.matchAll(pattern)];
    if (matches.length >= 2) {
      matches.slice(0, 8).forEach(match => {
        const title = match[1]?.trim();
        if (title && title.length > 0) {
          chapterTitles.push(title);
        }
      });
      break;
    }
  }

  let summary = `【${title}】全文概要:\n\n`;
  
  if (chapterTitles.length > 0) {
    summary += `主要章节结构:\n`;
    chapterTitles.forEach((chapterTitle, index) => {
      summary += `${index + 1}. ${chapterTitle}\n`;
    });
    summary += `\n`;
  }
  
  summary += `文档开头内容:\n${intro}...\n\n`;
  summary += `总字数: ${content.length} 字\n`;
  summary += `文档类型: ${detectDocumentType(content)}\n`;
  
  return summary;
};

/**
 * 检测文档类型
 */
const detectDocumentType = (content: string): string => {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('class ') || lowerContent.includes('function ') || lowerContent.includes('import ')) {
    return '技术文档/代码';
  } else if (lowerContent.includes('第一章') || lowerContent.includes('chapter')) {
    return '书籍/教材';
  } else if (lowerContent.includes('摘要') || lowerContent.includes('abstract')) {
    return '学术论文';
  } else if (lowerContent.includes('目标') || lowerContent.includes('方案')) {
    return '项目文档';
  } else {
    return '一般文档';
  }
};

/**
 * 为拆分片段添加上下文信息
 * 包括全文概要、前后章节总结、交叉引用等
 */
const enrichSplitsWithContext = (
  splits: DocumentSplit[], 
  _fullContent: string, 
  fullDocumentSummary: string
): DocumentSplit[] => {
  console.log(`📚 正在为 ${splits.length} 个片段添加上下文信息...`);
  
  return splits.map((split, index) => {
    // 生成前面章节的总结
    let previousChaptersSummary = '';
    if (index > 0) {
      const previousSplits = splits.slice(0, index);
      previousChaptersSummary = `前面章节概要:\n`;
      previousSplits.forEach((prevSplit, prevIndex) => {
        const preview = prevSplit.content.substring(0, 200);
        previousChaptersSummary += `${prevIndex + 1}. ${prevSplit.title}: ${preview}...\n`;
      });
    }
    
    // 生成后续章节的预览
    let nextChaptersPreview = '';
    if (index < splits.length - 1) {
      const nextSplits = splits.slice(index + 1, Math.min(index + 4, splits.length)); // 最多显示后3章
      nextChaptersPreview = `后续章节预览:\n`;
      nextSplits.forEach((nextSplit, nextIndex) => {
        const preview = nextSplit.content.substring(0, 150);
        nextChaptersPreview += `${index + nextIndex + 2}. ${nextSplit.title}: ${preview}...\n`;
      });
    }
    
    // 查找交叉引用
    const crossReferences = findCrossReferences(split.content, splits, index);
    
    // 创建增强的内容，包含上下文信息
    let enhancedContent = split.content;
    
    // 暂时禁用上下文增强，直接使用原始内容
    // TODO: 后续优化上下文增强策略
    enhancedContent = split.content;
    
    console.log(`  ✅ 片段 ${index + 1} 上下文增强完成 (原${split.wordCount}字 → 增强后${enhancedContent.length}字)`);
    console.log(`  🔍 片段 ${index + 1} 内容检查:`, {
      hasSpecialChars: /[\u0000-\u001F\u007F-\u009F]/.test(enhancedContent),
      hasQuotes: enhancedContent.includes('"'),
      hasBackslashes: enhancedContent.includes('\\'),
      contentPreview: enhancedContent.substring(0, 200) + '...'
    });
    
    return {
      ...split,
      content: enhancedContent,
      wordCount: enhancedContent.length,
      fullDocumentSummary,
      previousChaptersSummary: previousChaptersSummary || undefined,
      nextChaptersPreview: nextChaptersPreview || undefined,
      crossReferences
    };
  });
};

/**
 * 查找章节间的交叉引用
 */
const findCrossReferences = (currentContent: string, _allSplits: DocumentSplit[], _currentIndex: number): string[] => {
  const references: string[] = [];
  
  // 查找对其他章节的引用模式
  const referencePatterns = [
    /第[一二三四五六七八九十\d]+章/g,
    /前面提到的?([^\n，。]{10,30})/g,
    /如前所述([^\n，。]{0,20})/g,
    /上一章([^\n，。]{0,20})/g,
    /下一章将([^\n，。]{0,30})/g,
  ];
  
  for (const pattern of referencePatterns) {
    const matches = [...currentContent.matchAll(pattern)];
    matches.slice(0, 3).forEach(match => { // 最多3个引用
      references.push(`- ${match[0]}`);
    });
  }
  
  return references;
};

/**
 * 清理内容中可能导致JSON解析问题的特殊字符
 * 注意：这里不对内容进行JSON转义，只是清理可能有问题的字符
 */
const cleanContentForJSON = (content: string): string => {
  return content
    // 移除控制字符，但保留常用的空白字符
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    // 移除可能的BOM标记
    .replace(/^\uFEFF/, '')
    // 规范化换行符
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // 移除连续的多个空行，最多保留两个换行
    .replace(/\n{3,}/g, '\n\n')
    // 确保内容以合法字符结尾
    .trim();
};