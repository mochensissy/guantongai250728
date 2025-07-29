/**
 * AI服务工具类
 * 
 * 提供与各种大语言模型API的统一接口：
 * - 支持多个主流AI服务商
 * - 统一的请求和响应格式
 * - 错误处理和重试机制
 * - API配置管理
 */

import { APIConfig, APIResponse, GenerateOutlineResponse, ChatMessage } from '../types';

/**
 * AI服务提供商配置
 */
const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-3.5-turbo',
    chatEndpoint: '/chat/completions',
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    chatEndpoint: '/models/gemini-2.0-flash:generateContent',
  },
  claude: {
    name: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-3-sonnet-20240229',
    chatEndpoint: '/messages',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    chatEndpoint: '/chat/completions',
  },
  kimi: {
    name: 'Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    chatEndpoint: '/chat/completions',
  },
  openrouter: {
    name: 'OpenRouter Gemini 2.0',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'google/gemini-2.0-flash-001',
    chatEndpoint: '/chat/completions',
  },
};

/**
 * 获取学习引导私教的系统提示词
 * 这是整个AI对话系统的核心，严格按照PRD中的要求设计
 */
const getSystemPrompt = (): string => {
  return `You are a helpful AI assistant.`;
};

/**
 * 测试API连接
 * 发送一个简单的请求来验证API配置是否有效
 */
export const testAPIConnection = async (config: APIConfig): Promise<APIResponse<boolean>> => {
  try {
    const provider = AI_PROVIDERS[config.provider];
    if (!provider) {
      return {
        success: false,
        error: '不支持的AI服务提供商',
      };
    }

    const response = await makeAPIRequest(config, [
      { role: 'user', content: 'Hello' }
    ]);

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'API连接测试失败',
    };
  }
};

/**
 * 分析文档结构，确定最佳的章节划分策略
 */
const analyzeDocumentStructure = (content: string, wordCount: number) => {
  // 检查文档是否已有明显的章节结构
  const hasObviousChapters = /第[一二三四五六七八九十\d]+章|Chapter\s*\d+|第[一二三四五六七八九十\d]+部分|[一二三四五六七八九十\d]+\.|Part\s*\d+/gi.test(content);
  const chapterMatches = content.match(/第[一二三四五六七八九十\d]+章|Chapter\s*\d+/gi) || [];
  const obviousChapterCount = chapterMatches.length;

  // 根据字数确定章节策略
  if (wordCount <= 1500) {
    // 短文档：最多3章，每章3-5节
    return {
      recommendedChapters: hasObviousChapters && obviousChapterCount <= 3 ? obviousChapterCount : Math.min(3, Math.max(2, Math.ceil(wordCount / 500))),
      recommendedSectionsPerChapter: '3-5',
      instructions: `1. 这是一个短文档（${wordCount}字），生成${hasObviousChapters && obviousChapterCount <= 3 ? obviousChapterCount : Math.min(3, Math.max(2, Math.ceil(wordCount / 500)))}个主要章节
2. 每个章节下包含3-5个小节，确保内容分布均匀
3. 重点是增加小节的数量和细分度，而不是章节数量
4. 小节应该更加细致，每个小节控制在2-4分钟的学习时间`
    };
  } else if (wordCount <= 5000) {
    // 中等文档：3-5章，每章2-4节
    const recommendedChapters = hasObviousChapters && obviousChapterCount <= 8 ? Math.min(obviousChapterCount, 5) : Math.min(5, Math.max(3, Math.ceil(wordCount / 1000)));
    return {
      recommendedChapters,
      recommendedSectionsPerChapter: '2-4',
      instructions: `1. 这是一个中等长度文档（${wordCount}字），生成${recommendedChapters}个主要章节
2. 每个章节下包含2-4个小节
3. 章节划分应该遵循逻辑结构，从基础到高级
4. 小节时长建议5-8分钟`
    };
  } else {
    // 长文档：根据内容结构灵活处理
    if (hasObviousChapters && obviousChapterCount > 8) {
      // 文档本身就有很多章节，保持原结构
      return {
        recommendedChapters: Math.min(obviousChapterCount, 20), // 最多20章，避免过于冗长
        recommendedSectionsPerChapter: '2-3',
        instructions: `1. 文档本身包含${obviousChapterCount}个明显的章节结构，保持原有章节划分
2. 每个章节下包含2-3个小节
3. 严格按照文档原有的章节标题和结构进行划分
4. 如果原章节数量超过20个，请合并相似主题的章节`
      };
    } else {
      // 长文档但没有明显章节，限制在8章以内
      const recommendedChapters = Math.min(8, Math.max(5, Math.ceil(wordCount / 1500)));
      return {
        recommendedChapters,
        recommendedSectionsPerChapter: '3-4',
        instructions: `1. 这是一个长文档（${wordCount}字），生成${recommendedChapters}个主要章节（最多8章）
2. 每个章节下包含3-4个小节
3. 章节划分要有清晰的主题区分，避免内容重叠
4. 小节时长建议8-12分钟`
      };
    }
  }
};

/**
 * 生成学习大纲
 * 基于文档内容生成结构化的学习大纲
 */
export const generateOutline = async (
  config: APIConfig,
  documentContent: string,
  documentTitle?: string
): Promise<GenerateOutlineResponse> => {
  try {
    // 计算文档字数用于时间预估
    const wordCount = documentContent.length;
    const averageReadingSpeed = 300; // 每分钟阅读字数
    const totalEstimatedMinutes = Math.ceil(wordCount / averageReadingSpeed);

    // 智能分析文档结构，确定章节数量
    const documentStructureAnalysis = analyzeDocumentStructure(documentContent, wordCount);
    console.log('文档结构分析结果:', {
      wordCount,
      recommendedChapters: documentStructureAnalysis.recommendedChapters,
      recommendedSectionsPerChapter: documentStructureAnalysis.recommendedSectionsPerChapter,
      instructions: documentStructureAnalysis.instructions
    });

    const prompt = `请基于以下文档内容，生成一个结构化的学习大纲，包含章节和小节的层级结构。

文档标题：${documentTitle || '未知文档'}
文档字数：${wordCount} 字
总预估学习时间：${totalEstimatedMinutes} 分钟
推荐章节数：${documentStructureAnalysis.recommendedChapters}
推荐每章小节数：${documentStructureAnalysis.recommendedSectionsPerChapter}

文档内容：
${documentContent}

**智能章节规划要求**：
${documentStructureAnalysis.instructions}

**通用要求**：
1. 章节标题格式：第X章 [标题]
2. 小节标题格式：X.1、X.2、X.3（数字编号开头）
3. 章节和小节标题要简洁明了，能准确概括该部分内容
4. 应该有逻辑顺序，从基础到高级
5. 只为小节估算学习时间（章节不需要时间，因为章节只是标题）
6. 只返回JSON格式的大纲列表，不要其他文字
7. **重要：小节编号必须与所属章节保持一致**，例如第1章下的小节必须是1.1、1.2、1.3，第2章下的小节必须是2.1、2.2、2.3

返回格式示例（章节不设置时间，只有小节设置时间）：
[
  {"title": "第1章 基础概念介绍", "order": 1, "type": "chapter", "level": 1, "chapterNumber": 1},
  {"title": "1.1 什么是解释", "order": 2, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 8},
  {"title": "1.2 解释的重要性", "order": 3, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 7},
  {"title": "1.3 基本原理", "order": 4, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 10},
  {"title": "第2章 核心功能详解", "order": 5, "type": "chapter", "level": 1, "chapterNumber": 2},
  {"title": "2.1 功能特点", "order": 6, "type": "section", "level": 2, "parentChapter": 2, "estimatedMinutes": 10},
  {"title": "2.2 使用方法", "order": 7, "type": "section", "level": 2, "parentChapter": 2, "estimatedMinutes": 10}
]`;

    const response = await makeAPIRequest(config, [
      { role: 'user', content: prompt }
    ]);

    // 解析AI返回的JSON
    const content = response.content || '';
    console.log('AI原始返回内容:', content);
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      console.error('无法找到JSON格式的大纲');
      throw new Error('AI返回的内容格式不正确');
    }

    console.log('提取的JSON字符串:', jsonMatch[0]);
    const outlineItems = JSON.parse(jsonMatch[0]);
    console.log('解析后的大纲数组:', outlineItems);
    
    if (!Array.isArray(outlineItems)) {
      throw new Error('解析的大纲不是数组格式');
    }

    // 处理大纲项目，添加必要的字段和时间预估
    const processedItems = outlineItems.map((item, index) => {
      const baseItem: any = {
        title: item.title || `项目 ${index + 1}`,
        order: item.order || index + 1,
        type: item.type || 'chapter',
        level: item.level || 1,
        estimatedMinutes: item.estimatedMinutes || (item.type === 'chapter' ? 15 : 8), // 默认时间预估
      };

      // 如果是小节，需要找到对应的父章节
      if (baseItem.type === 'section' && item.parentChapter) {
        // 按章节编号匹配，而不是order
        const parentChapter = outlineItems.find(parent => 
          parent.type === 'chapter' && (parent.chapterNumber === item.parentChapter || parent.order === item.parentChapter)
        );
        if (parentChapter) {
          baseItem.parentId = `chapter-${parentChapter.chapterNumber || parentChapter.order}`;
        }
      }

      return baseItem;
    });
    return {
      success: true,
      outline: processedItems,
    };
  } catch (error) {
    return {
      success: false,
      outline: [],
      error: error instanceof Error ? error.message : '生成大纲失败',
    };
  }
};

/**
 * 生成卡片标题摘要
 * 将长文本内容提炼为12字以内的简洁标题
 */
export const summarizeCardTitle = async (
  config: APIConfig,
  content: string
): Promise<APIResponse<string>> => {
  try {
    console.log('开始生成卡片标题，内容长度:', content.length);
    
    // 如果内容本身就很短，直接返回
    if (content.length <= 12) {
      return {
        success: true,
        data: content.trim(),
      };
    }

    // 首先从内容中提取核心主题关键词
    const coreContent = content
      .replace(/^(好的|那么|现在|我们|开始学习).*?[。，：]/g, '') // 移除开场白
      .replace(/[你我们觉得怎么样？！。，；：]/g, '') // 移除对话词汇
      .replace(/[😊😄😆🤔💡👍📚✨🎯🚀🔧🎨]/g, '') // 移除表情
      .trim();
    
    console.log('提取核心内容用于标题生成:', coreContent.substring(0, 50) + '...');

    // 构建更精确的提示词
    const prompt = `请为以下知识内容生成一个精确的标题：

**要求**：
1. 标题长度8-12个汉字
2. 概括主要知识点或概念
3. 使用专业术语，避免口语化
4. 不要包含"学习"、"了解"等动词
5. 只返回标题文字，不要其他内容

**知识内容**：
${coreContent.substring(0, 300)}

请直接回复标题：`;

    const response = await makeAPIRequest(config, [
      { role: 'user', content: prompt }
    ]);

    let title = response.content?.trim() || '';
    
    // 清理AI可能添加的引号或其他符号
    title = title.replace(/^["'「『]|["'」』]$/g, '');
    title = title.replace(/^标题[:：]\s*/, '');
    title = title.replace(/^关于\s*/, '');
    title = title.replace(/的(介绍|学习|了解)$/, '');
    
    // 确保长度不超过12个字符
    if (title.length > 12) {
      title = title.substring(0, 12);
    }
    
    console.log('AI生成的标题:', title);
    
    // 如果AI生成失败或为空，使用智能提取的备用标题
    if (!title || title.length === 0) {
      title = generateFallbackTitle(coreContent);
    }

    return {
      success: true,
      data: title,
    };
  } catch (error) {
    console.error('AI标题生成失败:', error);
    // 如果AI调用失败，使用智能提取的备用方案
    const fallbackTitle = generateFallbackTitle(content);
    
    return {
      success: true,
      data: fallbackTitle,
    };
  }
};

/**
 * 生成备用标题（当AI调用失败时使用）
 */
const generateFallbackTitle = (content: string): string => {
  // 尝试提取关键概念词
  const keywordPatterns = [
    /(\w+)(?:是|为|的定义|概念)/,  // 概念定义
    /(\w+)(?:包括|分为|有)/,     // 分类内容
    /(\w+)(?:数据|指标|比例)/,   // 数据相关
    /(\w+)(?:分析|方法|策略)/,   // 方法分析
  ];
  
  for (const pattern of keywordPatterns) {
    const match = content.match(pattern);
    if (match && match[1].length >= 2 && match[1].length <= 8) {
      return match[1];
    }
  }
  
  // 如果没有匹配到关键词，提取第一个有意义的词汇
  const meaningfulContent = content
    .replace(/^(好的|那么|现在|我们|开始学习).*?[。，：]/g, '')
    .replace(/[你我们觉得怎么样？！]/g, '')
    .trim();
    
  // 提取前8-12个字符作为标题
  const title = meaningfulContent.substring(0, 10).replace(/[，。；：]/g, '');
  return title || '知识卡片';
};

/**
 * 强化清理对话内容，移除对话性语言但保持原格式
 */
const cleanDialogueContent = (content: string): string => {
  // 先处理编码问题，移除非中文字符
  let cleanedContent = content
    // 移除非中文、数字、英文、常见标点的字符（解决乱码）
    .replace(/[^\u4e00-\u9fa5\u0030-\u0039\u0041-\u005A\u0061-\u007A\s，。！？：；""''（）【】《》\-\+\*\/\=\%\&\|\^\~\`\.]/g, '')
    
    // 移除完整的鼓励和夸奖句子
    .replace(/^.*?你说得.*?[很非常]*[好对正确棒].*?[！!].*$/gm, '')
    .replace(/^.*?[太很非常]好[了的啊]?[！!].*$/gm, '')
    .replace(/^.*?你的[看法想法理解分析].*?[很非常]*[好深刻正确到位].*?[！!].*$/gm, '')
    .replace(/^.*?[赞同支持认可]你的[观点看法想法].*?[！!].*$/gm, '')
    
    // 移除反思和选择引导
    .replace(/^.*?通过.*?反思.*?你是不是.*?[？?].*$/gm, '')
    .replace(/^.*?你可以选择.*?[：:].*$/gm, '')
    .replace(/^.*?你希望.*?选择.*?[？?].*$/gm, '')
    .replace(/^.*?现在.*?你可以.*?[：:].*$/gm, '')
    
    // 移除学习进度和章节引导
    .replace(/^.*?[既然太好].*?[那么现在就].*?[一起看学习分析总结].*?$/gm, '')
    .replace(/^.*?[接下来下面].*?[我们就来看学习分析].*?$/gm, '')
    .replace(/^.*?进入.*?[章节学习].*?$/gm, '')
    .replace(/^.*?结束.*?[章节学习].*?进入.*?$/gm, '')
    
    // 移除编号选项和引导
    .replace(/^\d+\.\s*结束.*?进入.*?$/gm, '')
    .replace(/^\d+\.\s*继续.*?探讨.*?$/gm, '')
    
    // 移除疑问句和互动语言
    .replace(/^.*?你觉得.*?[？?].*$/gm, '')
    .replace(/^.*?你认为.*?[？?].*$/gm, '')
    .replace(/^.*?你是不是.*?[？?].*$/gm, '')
    .replace(/^.*?[是吗对吧怎么样如何][？?].*$/gm, '')
    .replace(/^.*?明白了吗[？?].*$/gm, '')
    
    // 移除过渡语句
    .replace(/^.*?为了让.*?更好地.*?理解.*?[，。].*$/gm, '')
    .replace(/^.*?[我们来].*?做.*?[练习总结分析].*?$/gm, '')
    .replace(/^.*?简单来说.*?就像.*?$/gm, '')
    
    // 移除常见的对话开头词汇
    .replace(/^(好的|那么|现在|我们现在|接下来|让我们|首先|然后)[，。：]*\s*/gm, '')
    .replace(/^(我们来|我们开始|开始|来看|来分析)[学习讲解分析探讨了解看]*[一下]?[，。：]*\s*/gm, '')
    
    // 移除表情符号
    .replace(/[😊😄😆🤔💡👍📚✨🎯🚀🔧🎨🎉]/g, '')
    
    // 清理空行和格式
    .replace(/^\s*$/gm, '') // 移除空行
    .replace(/\n{3,}/g, '\n\n') // 限制连续空行
    .replace(/^\s+/gm, '') // 移除行首空格
    .replace(/\s+$/gm, '') // 移除行尾空格
    
    // 清理标点
    .replace(/[，。]{2,}/g, '。')
    .replace(/[？！]{2,}/g, '！')
    .replace(/\s{2,}/g, ' ')
    .trim();
  
  // 如果清理后内容为空或过短，返回原内容的简化版本
  if (!cleanedContent || cleanedContent.length < 10) {
    cleanedContent = content
      .replace(/[^\u4e00-\u9fa5\u0030-\u0039\u0041-\u005A\u0061-\u007A\s，。！？：；""''（）【】《》\-\+\*\/\=\%\&\|\^\~\`\.]/g, '')
      .replace(/[😊😄😆🤔💡👍📚✨🎯🚀🔧🎨🎉]/g, '')
      .trim();
  }
  
  return cleanedContent;
};

/**
 * 提纯对话内容为纯知识卡片
 * 移除对话性语言，保留核心知识点
 */
export const purifyCardContent = async (
  config: APIConfig,
  dialogueContent: string,
  userNote?: string
): Promise<APIResponse<string>> => {
  try {
    console.log('开始清理对话内容:', dialogueContent.substring(0, 100) + '...');
    
    // 直接使用规则清理，保持原格式
    const purifiedContent = cleanDialogueContent(dialogueContent) + 
      (userNote ? `\n\n学习感受：${userNote}` : '');
    
    console.log('清理后内容:', purifiedContent.substring(0, 100) + '...');

    return {
      success: true,
      data: purifiedContent,
    };
  } catch (error) {
    console.error('内容清理失败:', error);
    // 如果清理失败，返回基础清理的内容
    const fallbackContent = dialogueContent
      // 移除乱码字符
      .replace(/[^\u4e00-\u9fa5\u0030-\u0039\u0041-\u005A\u0061-\u007A\s，。！？：；""''（）【】《》\-\+\*\/\=\%\&\|\^\~\`\.]/g, '')
      // 移除表情符号
      .replace(/[😊😄😆🤔💡👍📚✨🎯🚀🔧🎨🎉]/g, '')
      // 移除常见对话语句
      .replace(/你好[！!]*\s*/g, '')
      .replace(/你说得.*?[！!]/g, '')
      .replace(/太好了[！!]*/g, '')
      .replace(/你可以选择.*?[：:]/g, '')
      .replace(/你希望.*?选择.*?[？?]/g, '')
      .replace(/通过.*?反思.*?你是不是.*?[？?]/g, '')
      .replace(/我们[来去]?[学习讲解分析探讨]*\s*/g, '')
      .replace(/你觉得.*?[？?]/g, '')
      .replace(/明白了吗[？?]/g, '')
      .trim() + (userNote ? `\n\n学习感受：${userNote}` : '');
    
    return {
      success: true,
      data: fallbackContent,
    };
  }
};

/**
 * 发送聊天消息
 * 处理与AI私教的对话交互
 */
export const sendChatMessage = async (
  config: APIConfig,
  messages: ChatMessage[],
  documentContent: string,
  outline: any[],
  learningLevel: 'beginner' | 'expert'
): Promise<APIResponse<string>> => {
  try {
    // 构建系统消息
    const systemMessage = {
      role: 'system' as const,
      content: `${getSystemPrompt()}

当前学习材料：
${documentContent}

学习大纲：
${outline.map((item, index) => `${index + 1}. ${item.title}`).join('\n')}

用户学习水平：${learningLevel === 'beginner' ? '小白' : '高手'}

请严格按照上述要求进行教学指导。`,
    };

    // 转换消息格式
    const apiMessages = [
      systemMessage,
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }))
    ];

    const response = await makeAPIRequest(config, apiMessages);
    
    return {
      success: true,
      data: response.content || '',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '发送消息失败',
    };
  }
};

/**
 * 通用API请求处理函数
 * 处理不同AI服务商的API调用差异
 */
const makeAPIRequest = async (
  config: APIConfig,
  messages: Array<{ role: string; content: string }>
): Promise<{ content: string }> => {
  const provider = AI_PROVIDERS[config.provider];
  const baseUrl = config.baseUrl || provider.baseUrl;
  const model = config.model || provider.defaultModel;

  const url = `${baseUrl}${provider.chatEndpoint}`;
  
  // 构建请求头
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // 根据不同服务商设置认证头
  switch (config.provider) {
    case 'openai':
    case 'deepseek':
    case 'kimi':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      break;
    case 'openrouter':
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      headers['HTTP-Referer'] = 'http://localhost:3003'; 
      headers['X-Title'] = 'AI Learning Platform'; 
      break;
    case 'claude':
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      break;
    case 'gemini':
      headers['X-goog-api-key'] = config.apiKey;
      break;
  }

  // 构建请求体
  let requestBody: any;
  
  switch (config.provider) {
    case 'openai':
    case 'deepseek':
    case 'kimi':
      requestBody = {
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      };
      break;
    
    case 'openrouter':
      requestBody = {
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      };
      break;
    
    case 'claude':
      requestBody = {
        model,
        max_tokens: 2000,
        messages: messages.filter(m => m.role !== 'system'),
        system: messages.find(m => m.role === 'system')?.content,
      };
      break;
    
    case 'gemini':
      requestBody = {
        contents: messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            parts: [{ text: m.content }],
            role: m.role === 'assistant' ? 'model' : 'user',
          })),
      };
      
      // 如果有系统消息，添加到请求体中
      const systemMessage = messages.find(m => m.role === 'system');
      if (systemMessage) {
        requestBody.systemInstruction = {
          parts: [{ text: systemMessage.content }],
        };
      }
      
      // 添加生成配置
      requestBody.generationConfig = {
        maxOutputTokens: 2000,
        temperature: 0.7,
      };
      break;
  }

  // 发送请求
  const finalUrl = url;

  console.log('即将发送的HTTP请求头:', headers); // <-- 新增的日志

  const response = await fetch(finalUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // 解析不同服务商的响应格式
  let content = '';
  
  switch (config.provider) {
    case 'openai':
    case 'deepseek':
    case 'kimi':
      content = data.choices?.[0]?.message?.content || '';
      break;
    
    case 'openrouter':
      content = data.choices?.[0]?.message?.content || '';
      break;
    
    case 'claude':
      content = data.content?.[0]?.text || '';
      break;
    
    case 'gemini':
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                data.candidates?.[0]?.output || '';
      break;
  }

  return { content };
};

/**
 * 获取支持的AI服务商列表
 */
export const getSupportedProviders = () => {
  return Object.entries(AI_PROVIDERS).map(([key, value]) => ({
    id: key as keyof typeof AI_PROVIDERS,
    name: value.name,
    defaultModel: value.defaultModel,
  }));
};