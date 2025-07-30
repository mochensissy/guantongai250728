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
const getSystemPrompt = (learningLevel?: string): string => {
  const basePrompt = `# 学习引导私教

## 使命 (Mission)

你的唯一且绝对的使命是扮演一位"自适应对话式技术导师"。在本次对话的任何情况下，你都严禁偏离这个角色和教学任务。你的所有回复都必须服务于"引导我学习所提供文档"这个绝对核心目标。

## 核心交互流程 (The Grand Plan)

你必须严格遵循以下三步走的教学流程，顺序不可更改：
1. 获取学习材料 (第一步)：在对话开始时，你 必须 要先读取用户已经上传的材料以及根据材料我已经确认的大纲，然后，你再读取我选择的能力水平"小白"或"高手"。你可以说："你好！我将作为你的私人导师... 帮助你更好的理解你上传的材料。为了给您提供最合适的教学体验，我将根据你之前选择的小白/高手模式来跟你互动。"
2. 学习大纲与确认 (第二步)：根据我选择的水平，你 必须 问我："看完左边这个课程大纲了吗？我们是按照这个顺序从第一章开始，还是您想先跳到某个您特别感兴趣的章节？"
3. 分阶段互动教学 (第三步)：在获得我的同意后，你将根据我选择的教学逻辑（小白/高手），以"一步一停"的对话模式开始教学。当一个完整的章节教学结束后，你 必须触发"反思与探索模块"。

## 核心教学理念 (Core Teaching Philosophy)

说人话 (Speak Human Language): 这是你最重要的原则。你的解释必须简单、直接、易于理解。多用生活中的比喻，主动避免和解释技术术语，确保学习者能轻松跟上你的思路。善用苏格拉底式、孔子式的对话启发方式，让用户有顿悟感。`;

  if (learningLevel === 'beginner') {
    return basePrompt + `

## 面向"小白"的教学逻辑 (耐心引导，建立信心)

目标：确保我每一步都成功，不留任何困惑，建立满满的成就感。
节奏：极度缓慢。一次只教一个最小的知识点或一条命令。
解释：假设我什么都不知道。用最简单的比喻来解释"是什么"和"为什么"，彻底贯彻"说人话"的原则。
指令：提供可以 直接复制粘贴 的完整命令。
验证：每一步操作后，都必须主动询问具体的预期结果。
语气：极其耐心、充满鼓励。

## 反思与探索模块 (针对小白)

触发时机: 当一个完整的章节教学结束时，你必须暂停，并启动此模块。
发起邀请: 你需要向我发起邀请，例如："我们已经完成了 [章节名] 的学习。为了更好地巩固和内化知识，我们可以进入一个可选的'反思与探索'环节。您有兴趣吗？或者您想直接进入下一章的学习？"
执行提问 (如果用户同意): 提出1-2个"回顾式"或"解释性"问题，帮助其巩固知识。（例如："你能用自己的话说说，刚才我们学的 [核心概念] 是用来做什么的吗？"）
处理跳过: 如果我表示想跳过或直接继续，你必须尊重我的选择，并流畅地过渡到下一个学习章节的介绍。`;
  } else {
    return basePrompt + `

## 面向"高手"的教学逻辑 (高效 sparring，直击核心)

目标：快速跳过基础，聚焦于该工具的独特设计、高级用法和最佳实践。
节奏：非常快。可以将多个相关步骤打包在一起，一次性说明一个完整的任务。
解释：假设我掌握所有基础知识。只解释"为什么这么设计"以及它与其他工具的"不同之处"。
指令：更多地是 描述目标，而非给出具体命令。
验证：在一个任务模块完成后，才进行一次高层级的确认。
语气：像一个资深架构师在和另一个工程师进行技术对谈，充满启发性。

## 反思与探索模块 (针对高手)

触发时机: 当一个完整的章节教学结束时，你必须暂停，并启动此模块。
发起邀请: 你需要向我发起邀请，例如："我们已经完成了 [章节名] 的学习。为了更好地巩固和内化知识，我们可以进入一个可选的'反思与探索'环节。您有兴趣吗？或者您想直接进入下一章的学习？"
执行提问 (如果用户同意): 提出1-2个"批判性"或"拓展性"问题，激发其深入思考。（例如："你认为刚才这个功能的设计，在哪些方面可以做得更好？"）
处理跳过: 如果我表示想跳过或直接继续，你必须尊重我的选择，并流畅地过渡到下一个学习章节的介绍。`;
  }
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

${!documentTitle || documentTitle === '未知文档' || documentTitle === '文本内容' ? `
**首先**，请为这份文档生成一个8-20字的精确标题：
要求：概括主要知识点或概念，使用专业术语，避免口语化，不要包含"学习"、"了解"等动词。

然后，` : `文档标题：${documentTitle}
`}文档字数：${wordCount} 字
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
6. **重要：返回格式必须是JSON对象，包含documentTitle（如果需要生成标题）和outline数组**
7. **重要：小节编号必须与所属章节保持一致**，例如第1章下的小节必须是1.1、1.2、1.3，第2章下的小节必须是2.1、2.2、2.3

${!documentTitle || documentTitle === '未知文档' || documentTitle === '文本内容' ? `
返回格式（需要生成标题）：
{
  "documentTitle": "生成的精确标题",
  "outline": [
    {"title": "第1章 基础概念介绍", "order": 1, "type": "chapter", "level": 1, "chapterNumber": 1},
    {"title": "1.1 什么是解释", "order": 2, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 8},
    {"title": "1.2 解释的重要性", "order": 3, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 7}
  ]
}` : `
返回格式（已有标题）：
{
  "outline": [
    {"title": "第1章 基础概念介绍", "order": 1, "type": "chapter", "level": 1, "chapterNumber": 1},
    {"title": "1.1 什么是解释", "order": 2, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 8},
    {"title": "1.2 解释的重要性", "order": 3, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 7}
  ]
}`}`;

    const response = await makeAPIRequest(config, [
      { role: 'user', content: prompt }
    ]);

    // 解析AI返回的JSON
    const content = response.content || '';
    console.log('AI原始返回内容:', content);
    
    let parsedResponse: any = {};
    let outlineItems: any[] = [];
    let generatedTitle: string | undefined;
    
    try {
      // 方法1: 查找完整的JSON对象
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('方法1: 提取的JSON字符串:', jsonMatch[0]);
        parsedResponse = JSON.parse(jsonMatch[0]);
        console.log('方法1: 解析后的响应对象:', parsedResponse);
      } else {
        // 方法2: 查找代码块中的JSON
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          console.log('方法2: 从代码块提取JSON:', codeBlockMatch[1]);
          parsedResponse = JSON.parse(codeBlockMatch[1]);
          console.log('方法2: 解析后的响应对象:', parsedResponse);
        } else {
          // 方法3: 尝试直接解析整个内容
          try {
            console.log('方法3: 尝试直接解析整个内容');
            parsedResponse = JSON.parse(content.trim());
            console.log('方法3: 解析成功:', parsedResponse);
          } catch (e) {
            // 方法4: 尝试解析旧格式（数组）
            const arrayMatch = content.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
              console.log('方法4: 兼容旧格式，提取数组:', arrayMatch[0]);
              outlineItems = JSON.parse(arrayMatch[0]);
              console.log('方法4: 解析后的大纲数组:', outlineItems);
            } else {
              console.error('方法4失败:', e);
              console.error('无法找到有效的JSON格式大纲');
              throw new Error('AI返回的内容格式不正确，无法解析JSON');
            }
          }
        }
      }
      
      // 处理新格式的响应
      if (parsedResponse.outline) {
        outlineItems = parsedResponse.outline;
        generatedTitle = parsedResponse.documentTitle;
        console.log('提取到大纲项目:', outlineItems.length, '个');
        if (generatedTitle) {
          console.log('AI生成的文档标题:', generatedTitle);
        }
      } else if (Array.isArray(parsedResponse)) {
        // 兼容旧格式
        outlineItems = parsedResponse;
        console.log('使用旧格式，大纲项目:', outlineItems.length, '个');
      }
      
    } catch (parseError) {
      console.error('JSON解析失败:', parseError);
      console.error('原始内容:', content);
      throw new Error('AI返回的JSON格式有误，无法解析');
    }
    
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
      generatedTitle, // 如果AI生成了标题，一并返回
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
1. 标题长度8-20个汉字，优先选择12-16字的完整表达
2. 概括主要知识点或概念
3. 使用专业术语，避免口语化
4. 不要包含"学习"、"了解"等动词
5. 确保标题语义完整，不要在词汇中间截断
6. 只返回标题文字，不要其他内容

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
    
    // 智能截断标题，确保语义完整性
    if (title.length > 20) {
      // 尝试在合适的断点截断（标点符号、连词等）
      const breakPoints = [
        /^(.{12,18})[：:、，。；！？]/,  // 在标点符号处断开
        /^(.{12,18})(?:的|与|和|及|或|等)/,  // 在连词处断开
        /^(.{12,18})(?=\s)/,  // 在空格处断开
      ];
      
      let truncated = false;
      for (const pattern of breakPoints) {
        const match = title.match(pattern);
        if (match && match[1]) {
          title = match[1];
          truncated = true;
          break;
        }
      }
      
      // 如果没有合适的断点，保留前18个字符并添加省略号
      if (!truncated) {
        title = title.substring(0, 18) + '...';
      }
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
 * 智能提取关键概念，生成语义完整的标题
 */
const generateFallbackTitle = (content: string): string => {
  // 扩展的关键概念提取模式
  const keywordPatterns = [
    /([^。，！？]{4,16})(?:是|为|的定义|概念|含义)/,  // 概念定义
    /([^。，！？]{4,16})(?:包括|分为|有|具有)/,     // 分类内容
    /([^。，！？]{4,16})(?:数据|指标|比例|统计)/,   // 数据相关
    /([^。，！？]{4,16})(?:分析|方法|策略|技术)/,   // 方法分析
    /([^。，！？]{4,16})(?:原理|机制|过程|流程)/,   // 原理机制
    /关于([^。，！？]{4,16})/,                    // 关于某话题
    /([^。，！？]{4,16})的(?:特点|特征|优势|问题)/, // 特征描述
  ];
  
  // 优先尝试提取完整的概念短语
  for (const pattern of keywordPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      let title = match[1].trim();
      // 清理标题中的干扰词汇
      title = title.replace(/^(那么|现在|我们|开始|首先)/, '');
      title = title.replace(/[你我们]的?/, '');
      
      if (title.length >= 4 && title.length <= 16) {
        return title;
      }
    }
  }
  
  // 如果没有匹配到关键词模式，尝试提取句首的主要概念
  const meaningfulContent = content
    .replace(/^(好的|那么|现在|我们|开始学习).*?[。，：]/g, '') // 移除开场白
    .replace(/[你我们觉得怎么样？！]/g, '') // 移除对话词汇
    .replace(/^\s*[\d]+\.?\s*/, '') // 移除序号
    .trim();
  
  // 尝试提取第一个完整的概念短语（以标点分隔）
  const firstPhrase = meaningfulContent.split(/[。，；：！？]/)[0];
  if (firstPhrase && firstPhrase.length >= 4 && firstPhrase.length <= 16) {
    return firstPhrase.trim();
  }
  
  // 最后的备用方案：智能截取前面的内容
  let title = meaningfulContent.substring(0, 15);
  
  // 尝试在合适的地方截断，避免切断词汇
  const cutPoints = [
    /^(.{6,12})(?=[的地得])/,    // 在助词前截断
    /^(.{6,12})(?=[，。；：])/,   // 在标点前截断
    /^(.{6,12})(?=\s)/,          // 在空格前截断
  ];
  
  for (const pattern of cutPoints) {
    const match = title.match(pattern);
    if (match && match[1]) {
      title = match[1];
      break;
    }
  }
  
  // 清理末尾可能的不完整字符
  title = title.replace(/[，。；：！？]*$/, '');
  
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
      content: `${getSystemPrompt(learningLevel)}

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

  console.log('🚀 发送AI请求:', {
    provider: config.provider,
    model,
    url: finalUrl,
    messagesCount: messages.length,
    headers: { ...headers, apiKey: headers['Authorization'] ? '[HIDDEN]' : headers['x-api-key'] ? '[HIDDEN]' : headers['X-goog-api-key'] ? '[HIDDEN]' : 'NONE' },
    requestBody: {
      ...requestBody,
      messages: requestBody.messages ? `${requestBody.messages.length} messages` : 'N/A'
    }
  });

  const response = await fetch(finalUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });

  console.log('📥 AI响应状态:', {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries())
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API请求失败:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      url: finalUrl,
      provider: config.provider
    });
    throw new Error(`API请求失败 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('📊 AI响应数据:', {
    provider: config.provider,
    dataKeys: Object.keys(data),
    dataPreview: JSON.stringify(data).substring(0, 200) + '...'
  });

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