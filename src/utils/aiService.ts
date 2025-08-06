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
 * 修复常见的JSON语法错误
 * @param jsonString 原始JSON字符串
 * @returns 修复后的JSON字符串
 */
const fixCommonJsonErrors = (jsonString: string): string => {
  console.log('🔧 开始JSON修复，原始长度:', jsonString.length);
  console.log('🔧 原始内容前500字符:', jsonString.substring(0, 500));
  console.log('🔧 原始内容后500字符:', jsonString.substring(jsonString.length - 500));
  
  let fixed = jsonString;
  let fixCount = 0;
  
  // 1. 最严重问题：在数组中，对象之间缺少逗号
  // 先处理跨行的情况：} 后面换行跟 {
  fixed = fixed.replace(/}\s*\n\s*{/g, () => {
    fixCount++;
    return '},\n{';
  });
  
  // 2. 处理同一行的对象之间缺少逗号
  fixed = fixed.replace(/}\s*{/g, () => {
    fixCount++;
    return '}, {';
  });
  
  // 3. 处理对象结束后直接跟属性名的情况（说明是数组中的下一个对象）
  fixed = fixed.replace(/}\s*\n\s*"/g, '},\n"');
  
  // 4. 修复多余的逗号（JSON末尾的逗号）
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // 5. 更精细的行级修复
  const lines = fixed.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const currentLine = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    
    // 如果当前行以 } 结尾，下一行以 { 或 " 开头，则需要逗号
    if (currentLine.endsWith('}')) {
      if (nextLine.startsWith('{') || nextLine.startsWith('"')) {
        // 检查是否已经有逗号
        if (!currentLine.endsWith('},')) {
          lines[i] = lines[i].replace(/}\s*$/, '},');
          fixCount++;
          console.log(`🔧 在第 ${i + 1} 行添加缺少的逗号`);
        }
      }
    }
  }
  fixed = lines.join('\n');
  
  // 6. 处理特殊的嵌套JSON结构问题
  // 查找形如 }{"title": 的模式（对象间直接相邻）
  fixed = fixed.replace(/}\s*\{\s*"/g, () => {
    fixCount++;
    return '}, {"';
  });
  
  // 7. 针对数组中最后一个元素的处理
  // 确保数组正确闭合
  const arrayMatch = fixed.match(/\[\s*[\s\S]*\]/);
  if (arrayMatch) {
    let arrayContent = arrayMatch[0];
    // 移除数组内最后的多余逗号
    arrayContent = arrayContent.replace(/,(\s*\])/g, '$1');
    fixed = fixed.replace(arrayMatch[0], arrayContent);
  }
  
  console.log('🔧 总共修复了', fixCount, '个问题');
  console.log('🔧 修复后长度:', fixed.length);
  
  if (fixCount > 0) {
    console.log('🔧 修复后内容前500字符:', fixed.substring(0, 500));
    console.log('🔧 修复后内容后500字符:', fixed.substring(fixed.length - 500));
  }
  
  return fixed;
};

/**
 * 创建回退大纲结构
 * 当JSON解析完全失败时，从AI返回的文本中提取关键信息
 */
const createFallbackOutline = (content: string, documentTitle?: string) => {
  console.log('🚨 使用回退策略创建基础大纲');
  
  // 尝试从内容中提取章节标题
  const chapterPattern = /第\d+章[：:]\s*(.+?)(?:\n|$)/g;
  const sectionPattern = /\d+\.\d+[：:]\s*(.+?)(?:\n|$)/g;
  
  const chapters: any[] = [];
  const sections: any[] = [];
  
  let match;
  let order = 1;
  
  // 提取章节
  while ((match = chapterPattern.exec(content)) !== null) {
    chapters.push({
      title: `第${Math.ceil(order/2)}章 ${match[1].trim()}`,
      order: order++,
      type: 'chapter',
      level: 1,
      chapterNumber: Math.ceil(order/2)
    });
  }
  
  // 提取小节
  while ((match = sectionPattern.exec(content)) !== null) {
    const parentChapter = Math.ceil(order/2);
    sections.push({
      title: match[0].trim(),
      order: order++,
      type: 'section',
      level: 2,
      parentChapter,
      estimatedMinutes: 10
    });
  }
  
  // 如果没有找到结构化内容，创建基础大纲
  let outline = [...chapters, ...sections];
  
  if (outline.length === 0) {
    console.log('🚨 未找到结构化内容，创建默认大纲');
    outline = [
      { title: '第1章 文档概述', order: 1, type: 'chapter', level: 1, chapterNumber: 1 },
      { title: '1.1 主要内容', order: 2, type: 'section', level: 2, parentChapter: 1, estimatedMinutes: 15 },
      { title: '1.2 重点总结', order: 3, type: 'section', level: 2, parentChapter: 1, estimatedMinutes: 10 }
    ];
  }
  
  return {
    documentTitle: documentTitle || '文档大纲',
    outline
  };
};

/**
 * 基于错误位置精准修复JSON
 * @param jsonString 原始JSON字符串
 * @param errorMessage 错误信息
 * @returns 修复后的JSON字符串
 */
const fixJsonByErrorPosition = (jsonString: string, errorMessage: string): string => {
  console.log('🎯 开始精准修复JSON，错误信息:', errorMessage);
  
  // 解析错误位置信息
  const positionMatch = errorMessage.match(/position (\d+)/);
  const lineMatch = errorMessage.match(/line (\d+)/);
  const columnMatch = errorMessage.match(/column (\d+)/);
  
  let fixed = jsonString;
  
  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10);
    console.log(`🎯 错误位置: position ${position}`);
    
    // 检查错误位置附近的字符
    const start = Math.max(0, position - 50);
    const end = Math.min(jsonString.length, position + 50);
    const context = jsonString.substring(start, end);
    console.log(`🎯 错误位置附近的内容:`, context);
    
    // 找到错误位置的字符
    const errorChar = jsonString.charAt(position);
    console.log(`🎯 错误位置的字符: "${errorChar}" (ASCII: ${errorChar.charCodeAt(0)})`);
    
    // 如果错误位置是 { 并且前面是 }，说明缺少逗号
    if (errorChar === '{' && position > 0) {
      const beforeContext = jsonString.substring(Math.max(0, position - 50), position);
      if (beforeContext.includes('}')) {
        console.log('🎯 检测到对象间缺少逗号的问题');
        // 找到最近的 } 位置
        const lastBracePos = beforeContext.lastIndexOf('}');
        if (lastBracePos !== -1) {
          const actualBracePosition = position - beforeContext.length + lastBracePos;
          // 在 } 后面插入逗号
          fixed = jsonString.substring(0, actualBracePosition + 1) + 
                  ',' + 
                  jsonString.substring(actualBracePosition + 1);
          console.log('🎯 在对象间插入了逗号');
          return fixed;
        }
      }
    }
    
    // 如果错误位置是 " 并且前面是 }，也说明缺少逗号
    if (errorChar === '"' && position > 0) {
      const beforeContext = jsonString.substring(Math.max(0, position - 50), position);
      if (beforeContext.includes('}')) {
        console.log('🎯 检测到对象结束后直接跟属性名，缺少逗号');
        const lastBracePos = beforeContext.lastIndexOf('}');
        if (lastBracePos !== -1) {
          const actualBracePosition = position - beforeContext.length + lastBracePos;
          // 在 } 后面插入逗号
          fixed = jsonString.substring(0, actualBracePosition + 1) + 
                  ',' + 
                  jsonString.substring(actualBracePosition + 1);
          console.log('🎯 在对象结束和属性名之间插入了逗号');
          return fixed;
        }
      }
    }
  }
  
  // 如果有行号和列号信息，进行更精确的修复
  if (lineMatch && columnMatch) {
    const line = parseInt(lineMatch[1], 10);
    const column = parseInt(columnMatch[1], 10);
    
    // 按行分割JSON进行进一步处理
    const lines = jsonString.split('\n');
    
    if (line > 0 && line <= lines.length) {
      const problemLine = lines[line - 1]; // 数组索引从0开始
      console.log(`🎯 问题行内容: "${problemLine}"`);
      
      // 检查是否是缺少逗号的问题
      if (errorMessage.includes("Expected ',' or '}'") || errorMessage.includes("Expected ',' or ']'")) {
        // 如果当前行以 } 结尾，而下一行以 { 开头，则需要添加逗号
        if (problemLine.trim() === '}' && line < lines.length) {
          const nextLine = lines[line]; // line已经是1-based，所以这里是正确的下一行
          if (nextLine && nextLine.trim().startsWith('{')) {
            console.log('🎯 检测到缺少逗号的模式，在第', line, '行添加逗号');
            lines[line - 1] = problemLine.replace('}', '},');
            fixed = lines.join('\n');
            console.log('🎯 修复后该行内容:', lines[line - 1]);
          }
        }
        
        // 如果错误在行中间，可能是对象内缺少逗号
        if (column > 1 && column < problemLine.length) {
          const beforeChar = problemLine[column - 2];
          const afterChar = problemLine[column - 1];
          console.log(`🎯 错误位置字符: 前="${beforeChar}", 后="${afterChar}"`);
          
          // 如果前面是 } 后面是 "，说明两个对象之间缺少逗号
          if (beforeChar === '}' && afterChar === '"') {
            const newLine = problemLine.substring(0, column - 1) + ',' + problemLine.substring(column - 1);
            lines[line - 1] = newLine;
            fixed = lines.join('\n');
            console.log('🎯 在行中间添加逗号，修复后:', newLine);
          }
        }
      }
    }
  }
  
  console.log('🎯 精准修复完成');
  return fixed;
};

/**
 * 重新构建有效的JSON
 * @param content AI返回的原始内容
 * @returns 重新构建的有效JSON字符串
 */
const rebuildValidJson = (content: string): string => {
  console.log('🚀 开始重新构建JSON...');
  
  // 查找所有的标题行
  const titlePattern = /"title":\s*"([^"]*)"/g;
  
  const objects: any[] = [];
  
  // 找到所有标题
  const titleMatches = [...content.matchAll(titlePattern)];
  console.log('🚀 找到', titleMatches.length, '个标题');
  
  // 为每个标题构建完整的对象
  titleMatches.forEach((titleMatch, index) => {
    const title = titleMatch[1];
    const titleStartPos = titleMatch.index || 0;
    
    // 在标题附近查找其他属性
    const nearbyContent = content.substring(
      Math.max(0, titleStartPos - 200), 
      Math.min(content.length, titleStartPos + 200)
    );
    
    console.log(`🚀 处理标题 ${index + 1}: "${title}"`);
    console.log(`🚀 附近内容:`, nearbyContent);
    
    const obj: any = {
      title: title,
      order: index + 1,
      type: 'section',
      level: 2,
      estimatedMinutes: 10
    };
    
    // 尝试提取其他属性
    const orderMatch = nearbyContent.match(/"order":\s*(\d+)/);
    if (orderMatch) obj.order = parseInt(orderMatch[1], 10);
    
    const typeMatch = nearbyContent.match(/"type":\s*"([^"]*)"/);
    if (typeMatch) obj.type = typeMatch[1];
    
    const levelMatch = nearbyContent.match(/"level":\s*(\d+)/);
    if (levelMatch) obj.level = parseInt(levelMatch[1], 10);
    
    const chapterMatch = nearbyContent.match(/"chapterNumber":\s*(\d+)/);
    if (chapterMatch) obj.chapterNumber = parseInt(chapterMatch[1], 10);
    
    const parentMatch = nearbyContent.match(/"parentChapter":\s*(\d+)/);
    if (parentMatch) obj.parentChapter = parseInt(parentMatch[1], 10);
    
    const timeMatch = nearbyContent.match(/"estimatedMinutes":\s*(\d+)/);
    if (timeMatch) obj.estimatedMinutes = parseInt(timeMatch[1], 10);
    
    objects.push(obj);
    console.log(`🚀 构建对象:`, obj);
  });
  
  // 构建有效的JSON结构
  const result = {
    outline: objects
  };
  
  const rebuiltJson = JSON.stringify(result, null, 2);
  console.log('🚀 重新构建完成，对象数量:', objects.length);
  console.log('🚀 重新构建的JSON预览:', rebuiltJson.substring(0, 500) + '...');
  
  return rebuiltJson;
};

/**
 * 从损坏的JSON中提取有效的对象
 * @param content AI返回的原始内容
 * @returns 提取到的有效对象数组
 */
const extractValidJsonObjects = (content: string): any[] => {
  const objects: any[] = [];
  console.log('🔧 开始提取有效的JSON对象...');
  
  // 简单策略：查找所有完整的 {...} 块
  const objectRegex = /\{[^{}]*"title"[^{}]*\}/g;
  const matches = content.match(objectRegex);
  
  if (matches) {
    console.log('🔧 找到', matches.length, '个潜在的对象');
    
    matches.forEach((match, index) => {
      try {
        const obj = JSON.parse(match);
        if (obj.title) {
          objects.push(obj);
          console.log(`🔧 成功提取对象 ${index + 1}:`, obj.title);
        }
      } catch (e) {
        console.log(`🔧 对象 ${index + 1} 解析失败，尝试修复...`);
        try {
          const fixedMatch = fixCommonJsonErrors(match);
          const obj = JSON.parse(fixedMatch);
          if (obj.title) {
            objects.push(obj);
            console.log(`🔧 修复后成功提取对象 ${index + 1}:`, obj.title);
          }
        } catch (e2) {
          console.log(`🔧 对象 ${index + 1} 修复后仍失败`);
        }
      }
    });
  }
  
  // 如果没有找到对象，尝试更宽松的匹配
  if (objects.length === 0) {
    console.log('🔧 尝试更宽松的对象提取...');
    
    // 尝试提取包含标题的行，手工构造对象
    const titleMatches = content.match(/"title":\s*"([^"]*)"/g);
    if (titleMatches) {
      titleMatches.forEach((titleMatch, index) => {
        const titleValue = titleMatch.match(/"title":\s*"([^"]*)"/)?.[1];
        if (titleValue) {
          objects.push({
            title: titleValue,
            order: index + 1,
            type: titleValue.includes('章') ? 'chapter' : 'section',
            level: titleValue.includes('章') ? 1 : 2,
            estimatedMinutes: 10
          });
          console.log(`🔧 手工构造对象 ${index + 1}:`, titleValue);
        }
      });
    }
  }
  
  console.log('🔧 总共提取到', objects.length, '个有效对象');
  return objects;
};

/**
 * 直接从文本中解析大纲（不依赖JSON）
 * @param content AI返回的原始内容
 * @returns 解析出的大纲项目数组
 */
const parseOutlineFromText = (content: string): any[] => {
  console.log('📝 开始直接文本解析...');
  const items: any[] = [];
  
  // 将内容按行分割
  const lines = content.split('\n');
  let order = 1;
  
  // 查找章节和小节的模式
  const chapterPattern = /第(\d+)章\s*(.+)/;
  const sectionPattern = /(\d+)\.(\d+)\s*(.+)/;
  const titlePattern = /"title":\s*"([^"]*)"/;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过空行和明显的JSON语法
    if (!trimmedLine || trimmedLine.includes('{') || trimmedLine.includes('}') || trimmedLine.includes('[') || trimmedLine.includes(']')) {
      continue;
    }
    
    // 尝试匹配章节
    let chapterMatch = trimmedLine.match(chapterPattern);
    if (chapterMatch) {
      const chapterNumber = parseInt(chapterMatch[1], 10);
      const chapterTitle = chapterMatch[2];
      items.push({
        title: `第${chapterNumber}章 ${chapterTitle}`,
        order: order++,
        type: 'chapter',
        level: 1,
        chapterNumber: chapterNumber
      });
      console.log('📝 找到章节:', `第${chapterNumber}章 ${chapterTitle}`);
      continue;
    }
    
    // 尝试匹配小节
    let sectionMatch = trimmedLine.match(sectionPattern);
    if (sectionMatch) {
      const chapterNum = parseInt(sectionMatch[1], 10);
      const sectionNum = parseInt(sectionMatch[2], 10);
      const sectionTitle = sectionMatch[3];
      items.push({
        title: `${chapterNum}.${sectionNum} ${sectionTitle}`,
        order: order++,
        type: 'section',
        level: 2,
        parentChapter: chapterNum,
        estimatedMinutes: 10
      });
      console.log('📝 找到小节:', `${chapterNum}.${sectionNum} ${sectionTitle}`);
      continue;
    }
    
    // 尝试从JSON片段中提取标题
    let titleMatch = trimmedLine.match(titlePattern);
    if (titleMatch) {
      const title = titleMatch[1];
      if (title && !title.includes('estimatedMinutes') && !title.includes('order')) {
        const isChapter = title.includes('章');
        items.push({
          title: title,
          order: order++,
          type: isChapter ? 'chapter' : 'section',
          level: isChapter ? 1 : 2,
          estimatedMinutes: isChapter ? undefined : 10
        });
        console.log('📝 从JSON片段提取标题:', title);
      }
    }
  }
  
  // 如果没有找到任何内容，尝试更宽松的匹配
  if (items.length === 0) {
    console.log('📝 未找到结构化内容，尝试宽松匹配...');
    
    // 查找任何包含"章"或数字开头的行
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 3 && (trimmedLine.includes('章') || /^\d+/.test(trimmedLine))) {
        items.push({
          title: trimmedLine,
          order: order++,
          type: trimmedLine.includes('章') ? 'chapter' : 'section',
          level: trimmedLine.includes('章') ? 1 : 2,
          estimatedMinutes: 10
        });
        console.log('📝 宽松匹配找到:', trimmedLine);
      }
    }
  }
  
  console.log('📝 文本解析完成，总共找到', items.length, '个项目');
  return items;
};

/**
 * 严格重组大纲结构
 * 完全重建章节-小节关系，忽略AI的错误parentChapter设置
 * @param outlineItems 原始大纲项目数组
 * @returns 重新组织后的大纲项目数组
 * @deprecated 已被 fixOutlineStructure 替代，保留备用
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const strictlyReorganizeOutline = (outlineItems: any[]): any[] => {
  console.log('🔧 开始严格重组大纲结构...');
  
  // 第1步：提取所有章节（按order排序）
  const chapters = outlineItems
    .filter(item => item.type === 'chapter')
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  // 第2步：提取所有小节，并按标题中的编号分组
  const sections = outlineItems.filter(item => item.type === 'section');
  
  console.log('📋 找到章节:', chapters.map(c => c.title));
  console.log('📋 找到小节:', sections.map(s => s.title));
  
  // 第3步：为每个小节重新确定正确的父章节
  const correctedSections = sections.map(section => {
    const sectionNumber = extractChapterNumber(section.title);
    console.log(`🔍 小节 "${section.title}" 提取的章节编号: ${sectionNumber}`);
    
    return {
      ...section,
      parentChapter: sectionNumber, // 强制使用从标题提取的编号
      correctedParentChapter: sectionNumber
    };
  });
  
  // 第4步：重新构建大纲结构
  const result: any[] = [];
  let currentOrder = 1;
  
  chapters.forEach(chapter => {
    const chapterNumber = chapter.chapterNumber || extractChapterNumber(chapter.title);
    console.log(`\n📖 处理章节: "${chapter.title}" (编号: ${chapterNumber})`);
    
    // 添加章节
    result.push({
      ...chapter,
      order: currentOrder++,
      chapterNumber: chapterNumber
    });
    
    // 找到属于此章节的小节
    const chapterSections = correctedSections.filter(section => 
      section.correctedParentChapter === chapterNumber
    );
    
    console.log(`  找到 ${chapterSections.length} 个属于此章节的小节:`, 
      chapterSections.map(s => s.title));
    
    // 添加小节
    chapterSections
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach(section => {
        result.push({
          ...section,
          order: currentOrder++,
          parentChapter: chapterNumber
        });
      });
  });
  
  console.log('✅ 严格重组完成，新结构:');
  result.forEach((item, index) => {
    console.log(`${index}: ${item.type} - "${item.title}" (parentChapter: ${item.parentChapter})`);
  });
  
  return result;
};

/**
 * 确保每个章节都至少有一个小节
 * @param outlineItems 原始大纲项目数组
 * @returns 修复后的大纲项目数组
 * @deprecated 已被 fixOutlineStructure 替代，保留备用
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ensureChaptersHaveSections = (outlineItems: any[]): any[] => {
  console.log('🔧 开始重新整理大纲结构...');
  console.log('原始项目:', outlineItems.map(item => `${item.type}: ${item.title}`));
  
  // 第1步：分离章节和小节
  const chapters = outlineItems.filter(item => item.type === 'chapter');
  const sections = outlineItems.filter(item => item.type === 'section');
  
  console.log('章节:', chapters.map(c => c.title));
  console.log('小节:', sections.map(s => s.title));
  
  // 第2步：重新构建正确的结构
  const result: any[] = [];
  let currentOrder = 1;
  
  chapters.forEach((chapter, chapterIndex) => {
    const chapterNumber = chapter.chapterNumber || extractChapterNumber(chapter.title);
    console.log(`\n处理章节: "${chapter.title}", 编号: ${chapterNumber}`);
    
    // 添加章节
    const chapterItem = {
      ...chapter,
      order: currentOrder++,
      chapterNumber: chapterNumber
    };
    result.push(chapterItem);
    
    // 查找属于此章节的小节
    const belongingSections = sections.filter(section => {
      const titleMatch = section.title.startsWith(`${chapterNumber}.`);
      const parentMatch = section.parentChapter === chapterNumber;
      const extracted = extractChapterNumber(section.title);
      const extractedMatch = extracted === chapterNumber;
      
      console.log(`  检查小节 "${section.title}": titleMatch=${titleMatch}, parentMatch=${parentMatch}(${section.parentChapter}===${chapterNumber}), extractedMatch=${extractedMatch}(${extracted}===${chapterNumber})`);
      
      // 如果小节的标题编号与章节编号不匹配，但parentChapter匹配，说明有错位问题
      if (parentMatch && !titleMatch && !extractedMatch) {
        console.warn(`⚠️ 发现错位小节: "${section.title}" 声称属于第${section.parentChapter}章，但标题编号不匹配`);
      }
      
      return titleMatch || parentMatch || extractedMatch;
    });
    
    console.log(`  找到${belongingSections.length}个属于此章节的小节`);
    
    if (belongingSections.length > 0) {
      // 添加找到的小节
      belongingSections.forEach(section => {
        const sectionItem = {
          ...section,
          order: currentOrder++,
          parentChapter: chapterNumber,
          level: 2
        };
        result.push(sectionItem);
        console.log(`  添加小节: ${section.title}`);
      });
    } else {
      // 创建默认小节
      const defaultSection = {
        id: `section-${chapterNumber}-1-${Date.now()}`, // 添加时间戳确保唯一性
        title: `${chapterNumber}.1 本章要点`,
        order: currentOrder++,
        type: 'section',
        level: 2,
        parentChapter: chapterNumber,
        estimatedMinutes: 15,
        isCompleted: false
      };
      result.push(defaultSection);
      console.log(`  ✅ 创建默认小节: ${defaultSection.title} (ID: ${defaultSection.id})`);
    }
  });
  
  console.log('\n✅ 大纲结构重整完成');
  console.log('最终结构:', result.map(item => `${item.type}: ${item.title}`));
  
  return result;
};

/**
 * 从章节标题中提取章节编号
 * @param title 章节标题
 * @returns 章节编号
 */
const extractChapterNumber = (title: string): number => {
  console.log(`🔍 提取章节编号，输入标题: "${title}"`);
  
  // 匹配"第X章"、"Chapter X"、"X.Y"等格式 - 按优先级排序
  const patterns = [
    /第(\d+)章/,                    // 第X章 - 最高优先级
    /第([一二三四五六七八九十])章/,    // 第一章、第二章等
    /Chapter\s+(\d+)/i,            // Chapter X
    /^(\d+)\.\d+/,                 // X.Y (小节格式) - 提取章节编号 - 最低优先级
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      let num = match[1];
      console.log(`✅ 匹配到模式: ${pattern.source}, 提取值: "${num}"`);
      
      // 处理中文数字
      const chineseNumbers: { [key: string]: number } = {
        '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
        '六': 6, '七': 7, '八': 8, '九': 9, '十': 10
      };
      
      let result: number;
      if (chineseNumbers[num]) {
        result = chineseNumbers[num];
      } else {
        result = parseInt(num, 10);
      }
      
      console.log(`🎯 最终提取结果: ${result}`);
      return result;
    }
  }
  
  console.log(`⚠️ 未能提取章节编号，使用默认值1`);
  return 1; // 默认返回1
};

/**
 * 统一的大纲结构修复函数 - 强制重建版本
 * 彻底重建章节小节关系，不依赖原有的错误数据
 * @param outlineItems 原始大纲项目数组
 * @returns 修复后的大纲项目数组
 */
const fixOutlineStructure = (outlineItems: any[]): any[] => {
  console.log('🔧 开始强制重建大纲结构...');
  console.log('原始项目:', outlineItems.map(item => `${item.type}: ${item.title}`));
  
  // 第1步：分离章节和小节，按order排序
  const chapters = outlineItems
    .filter(item => item.type === 'chapter')
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const sections = outlineItems
    .filter(item => item.type === 'section')
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  
  console.log('📋 分离结果 - 章节:', chapters.map(c => c.title));
  console.log('📋 分离结果 - 小节:', sections.map(s => s.title));
  
  const result: any[] = [];
  let currentOrder = 1;
  
  // 第2步：为每个章节强制重建小节
  chapters.forEach((chapter, chapterIndex) => {
    const chapterNumber = chapterIndex + 1; // 强制使用顺序编号，不依赖标题解析
    console.log(`\n📖 处理章节 ${chapterIndex + 1}: "${chapter.title}" (强制编号: ${chapterNumber})`);
    
    // 修正章节标题编号（如果需要）
    let correctedTitle = chapter.title;
    const titleChapterMatch = correctedTitle.match(/^第(\d+)章/);
    if (!titleChapterMatch || parseInt(titleChapterMatch[1]) !== chapterNumber) {
      // 标题编号错误，需要修正
      correctedTitle = correctedTitle.replace(/^第\d+章/, `第${chapterNumber}章`);
      console.log(`  修正章节标题: "${chapter.title}" -> "${correctedTitle}"`);
    }
    
    // 添加章节
    const chapterItem = {
      ...chapter,
      title: correctedTitle,
      order: currentOrder++,
      chapterNumber: chapterNumber,
      type: 'chapter',
      level: 1
    };
    result.push(chapterItem);
    
    // 计算这个章节应该有多少个小节
    const sectionCountPerChapter = Math.ceil(sections.length / chapters.length);
    const startIndex = chapterIndex * sectionCountPerChapter;
    const endIndex = Math.min((chapterIndex + 1) * sectionCountPerChapter, sections.length);
    const chapterSections = sections.slice(startIndex, endIndex);
    
    console.log(`  分配给第${chapterNumber}章的小节: ${chapterSections.length}个 (索引 ${startIndex}-${endIndex-1})`);
    
    if (chapterSections.length > 0) {
      // 重新编号小节
      chapterSections.forEach((section, sectionIndex) => {
        const sectionNumber = sectionIndex + 1;
        
        // 修正小节标题编号
        let correctedSectionTitle = section.title;
        const originalContent = section.title.replace(/^\d+\.\d+\s*/, ''); // 移除原有编号，保留内容
        correctedSectionTitle = `${chapterNumber}.${sectionNumber} ${originalContent}`;
        
        const sectionItem = {
          ...section,
          title: correctedSectionTitle,
          order: currentOrder++,
          parentChapter: chapterNumber,
          type: 'section',
          level: 2,
          estimatedMinutes: section.estimatedMinutes || 10
        };
        result.push(sectionItem);
        console.log(`  ✅ 重建小节: "${section.title}" -> "${correctedSectionTitle}"`);
      });
    } else {
      // 没有小节，创建默认小节
      const defaultSection = {
        id: `section-${chapterNumber}-1-${Date.now()}`,
        title: `${chapterNumber}.1 本章要点`,
        order: currentOrder++,
        type: 'section',
        level: 2,
        parentChapter: chapterNumber,
        estimatedMinutes: 15,
        isCompleted: false
      };
      result.push(defaultSection);
      console.log(`  🔄 自动创建小节: ${defaultSection.title}`);
    }
  });
  
  console.log('\n✅ 强制重建完成');
  console.log('最终结构:', result.map(item => `${item.type}: ${item.title}`));
  
  return result;
};

/**
 * 修复现有大纲数据，确保每个章节都有小节
 * 这个函数可以用于修复现有的学习会话
 */
export const fixExistingOutline = (outlineItems: any[]): any[] => {
  console.log('🔧 开始修复现有大纲数据...');
  console.log('原始大纲项目数量:', outlineItems.length);
  
  const finalFixedItems = fixOutlineStructure(outlineItems);
  
  console.log('修复后大纲项目数量:', finalFixedItems.length);
  console.log('✅ 大纲修复完成');
  
  return finalFixedItems;
};

/**
 * 生成学习大纲
 * 基于文档内容生成结构化的学习大纲
 */
/**
 * 检测文档的章节结构
 * @param content 文档内容
 * @returns 章节信息数组
 */
const detectChapterStructure = (content: string): Array<{title: string; startIndex: number; order: number}> => {
  const chapters: Array<{title: string; startIndex: number; order: number}> = [];
  
  // 常见的章节标识模式 - 按优先级排序
  const chapterPatterns = [
    // 标准中文章节格式
    /^第[一二三四五六七八九十\d]+章\s+[^\n]+/gm,
    /^第[一二三四五六七八九十\d]+部分\s+[^\n]+/gm,
    
    // 英文章节格式
    /^Chapter\s+\d+[:\s•\-—]+[^\n]+/gmi,
    /^Chapter\s+[IVX]+[:\s•\-—]+[^\n]+/gmi,
    
    // 数字章节格式
    /^\d+[\.、]\s+[^\n]{5,100}$/gm,
    /^\d+\s+[^\n]{5,100}$/gm,
    
    // 中文序号格式
    /^[一二三四五六七八九十]\s*[、．.]\s*[^\n]{5,100}$/gm,
    
    // 其他可能的章节格式
    /^[^\n]*第\s*[一二三四五六七八九十\d]+\s*[章节部分]\s*[^\n]*$/gm,
    /^.*?Chapter.*?\d+.*?$/gmi,
  ];
  
  for (const pattern of chapterPatterns) {
    const matches = Array.from(content.matchAll(pattern));
    if (matches.length >= 3) { // 至少有3个章节才认为是有效结构
      matches.forEach((match, index) => {
        chapters.push({
          title: match[0].trim(),
          startIndex: match.index || 0,
          order: index + 1
        });
      });
      break; // 找到第一个有效的章节模式就停止
    }
  }
  
  return chapters;
};

/**
 * 智能截取文档内容，确保AI处理不会超出token限制
 * @param content 原始内容
 * @param maxLength 最大长度
 * @returns 截取后的内容摘要
 */
const smartContentTruncate = (content: string, maxLength: number = 8000): string => {
  if (content.length <= maxLength) {
    return content;
  }
  
  // 超大文档特殊处理策略
  if (content.length > 30000) {
    console.log(`检测到超大文档(${content.length}字)，启用高级截取策略`);
    
    // 尝试检测章节结构
    const chapters = detectChapterStructure(content);
    
    if (chapters.length > 0) {
      console.log(`检测到${chapters.length}个章节，基于完整章节结构进行截取`);
      console.log('章节列表:', chapters.map(c => c.title));
      
      // 新策略：优先保证所有章节标题都被包含，让AI看到完整的文档结构
      let result = '';
      
      // 1. 前言/序言部分 (第一章之前的内容)
      const preambleEnd = chapters[0].startIndex;
      const preamble = content.substring(0, Math.min(preambleEnd, maxLength * 0.2));
      result += preamble + '\n\n[基于完整章节结构的内容摘要]\n\n';
      
      // 2. 首先列出所有章节标题，让AI了解完整结构
      result += '【完整章节结构】\n';
      chapters.forEach((chapter) => {
        result += `${chapter.title}\n`;
      });
      result += '\n';
      
      // 3. 为章节内容分配剩余空间
      const usedLength = result.length;
      const remainingLength = maxLength - usedLength - 500; // 保留500字符给结尾
      
      // 智能选择章节：前几章 + 中间章节 + 后几章
      const selectedChapters = [];
      if (chapters.length <= 8) {
        // 如果章节不多，包含所有章节的部分内容
        selectedChapters.push(...chapters);
      } else {
        // 如果章节很多，选择代表性章节
        selectedChapters.push(chapters[0]); // 第一章
        selectedChapters.push(chapters[1]); // 第二章
        
        // 中间几章
        const middleStart = Math.floor(chapters.length * 0.3);
        const middleEnd = Math.floor(chapters.length * 0.7);
        for (let i = middleStart; i <= middleEnd && selectedChapters.length < 6; i++) {
          selectedChapters.push(chapters[i]);
        }
        
        // 最后几章
        if (chapters.length > 2) {
          selectedChapters.push(chapters[chapters.length - 2]); // 倒数第二章
          selectedChapters.push(chapters[chapters.length - 1]); // 最后一章
        }
      }
      
      // 为每个选中的章节分配内容空间
      const lengthPerChapter = Math.floor(remainingLength / selectedChapters.length);
      
      result += '\n【章节内容摘要】\n';
      for (const chapter of selectedChapters) {
        const nextChapterIndex = chapters.findIndex(c => c.order === chapter.order + 1);
        const nextChapterStart = nextChapterIndex !== -1 ? chapters[nextChapterIndex].startIndex : content.length;
        
        // 提取章节内容的前面部分
        const chapterContent = content.substring(
          chapter.startIndex, 
          Math.min(nextChapterStart, chapter.startIndex + lengthPerChapter)
        );
        
        result += `\n【${chapter.title}】\n${chapterContent.substring(0, lengthPerChapter)}\n`;
      }
      
      // 4. 文档结尾部分
      const ending = content.substring(Math.max(0, content.length - 300));
      result += '\n\n[文档结尾部分]\n' + ending;
      
      console.log(`章节结构截取完成: 包含${selectedChapters.length}个章节的详细内容，总长度${result.length}字符`);
      return result;
    }
  }
  
  // 标准的三段式截取策略（原有逻辑）
  const beginPortion = Math.floor(maxLength * 0.4); // 40%给开头
  const middlePortion = Math.floor(maxLength * 0.3); // 30%给中间
  const endPortion = Math.floor(maxLength * 0.3);   // 30%给结尾
  
  const beginning = content.substring(0, beginPortion);
  
  // 从中间位置开始截取
  const middleStart = Math.floor(content.length / 2) - Math.floor(middlePortion / 2);
  const middle = content.substring(middleStart, middleStart + middlePortion);
  
  // 从末尾开始截取
  const ending = content.substring(content.length - endPortion);
  
  return `${beginning}\n\n[...文档中间部分...]\n\n${middle}\n\n[...文档后续部分...]\n\n${ending}`;
};

/**
 * 超大文档分块处理策略
 * 当文档过大时，将其分为多个部分分别处理，然后合并结果
 */
const processLargeDocumentInChunks = async (
  config: APIConfig,
  documentContent: string,
  documentTitle?: string
): Promise<GenerateOutlineResponse> => {
  console.log('📚 开始分块处理超大文档:', {
    contentLength: documentContent.length,
    title: documentTitle
  });

  // 对于超大文档，采用更激进的截取策略
  // 取开头20%、中间10%、结尾20%的内容进行处理
  const totalLength = documentContent.length;
  const headLength = Math.floor(totalLength * 0.2); // 20%
  const middleLength = Math.floor(totalLength * 0.1); // 10%
  const tailLength = Math.floor(totalLength * 0.2); // 20%
  
  const middleStart = Math.floor((totalLength - middleLength) / 2);
  
  const headContent = documentContent.substring(0, headLength);
  const middleContent = documentContent.substring(middleStart, middleStart + middleLength);
  const tailContent = documentContent.substring(totalLength - tailLength);
  
  // 组合代表性内容
  const representativeContent = `${headContent}\n\n[...文档中间部分省略...]\n\n${middleContent}\n\n[...文档后续部分省略...]\n\n${tailContent}`;
  
  console.log('📚 使用代表性内容生成大纲:', {
    originalLength: totalLength,
    representativeLength: representativeContent.length,
    compressionRatio: `${((representativeContent.length / totalLength) * 100).toFixed(1)}%`
  });

  try {
    // 直接调用生成大纲，但使用更小的内容
    const result = await generateOutline(config, representativeContent, documentTitle);
    
    if (result.success && result.outline) {
      console.log('📚 超大文档分块处理成功，生成了', result.outline.length, '个大纲项');
      return result;
    } else {
      throw new Error('代表性内容生成大纲失败');
    }
  } catch (error) {
    console.error('📚 代表性内容处理失败，尝试极简版本:', error);
    
    // 如果还是失败，使用极简版本（仅开头和结尾各10%）
    const extremeSimpleContent = `${documentContent.substring(0, Math.floor(totalLength * 0.1))}\n\n[...文档主体内容省略...]\n\n${documentContent.substring(totalLength - Math.floor(totalLength * 0.1))}`;
    
    console.log('📚 使用极简内容:', {
      extremeLength: extremeSimpleContent.length,
      ratio: `${((extremeSimpleContent.length / totalLength) * 100).toFixed(1)}%`
    });
    
    try {
      const extremeResult = await generateOutline(config, extremeSimpleContent, documentTitle);
      return extremeResult;
    } catch (finalError) {
      console.error('📚 所有分块策略都失败了:', finalError);
      return {
        success: false,
        outline: [],
        documentTitle: documentTitle,
        error: '文档过大，无法生成完整大纲。请尝试将文档分割为更小的部分。'
      };
    }
  }
};

export const generateOutline = async (
  config: APIConfig,
  documentContent: string,
  documentTitle?: string
): Promise<GenerateOutlineResponse> => {
  console.log('🎯 generateOutline 开始处理:', {
    title: documentTitle,
    contentLength: documentContent.length,
    contentPreview: documentContent.substring(0, 300) + '...',
    provider: config.provider,
    model: config.model
  });

  // 对于超大文档（>80,000字符），使用分块处理策略
  if (documentContent.length > 80000) {
    console.log('📖 文档过大，切换到分块处理策略');
    return await processLargeDocumentInChunks(config, documentContent, documentTitle);
  }
  
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

    // 智能截取内容，避免超出AI token限制
    // 根据文档大小动态调整截取策略 - 更激进的压缩
    let maxLengthForOutline: number;
    if (documentContent.length > 100000) {
      maxLengthForOutline = 3000; // 超大文档，极度压缩
    } else if (documentContent.length > 50000) {
      maxLengthForOutline = 5000; // 大文档，大幅压缩
    } else if (documentContent.length > 30000) {
      maxLengthForOutline = 8000; // 中等文档，适度压缩
    } else if (documentContent.length > 15000) {
      maxLengthForOutline = 10000; // 较大文档
    } else {
      maxLengthForOutline = Math.min(documentContent.length, 12000); // 小文档
    }
    
    const truncatedContent = smartContentTruncate(documentContent, maxLengthForOutline);
    const isContentTruncated = truncatedContent.length < documentContent.length;
    
    if (isContentTruncated) {
      console.log(`内容过长已智能截取: ${documentContent.length} -> ${truncatedContent.length} 字符`);
    }

    const prompt = `请基于以下文档内容，生成一个结构化的学习大纲，包含章节和小节的层级结构。

${!documentTitle || documentTitle === '未知文档' || documentTitle === '文本内容' ? `
**首先**，请为这份文档生成一个8-20字的精确标题：
要求：概括主要知识点或概念，使用专业术语，避免口语化，不要包含"学习"、"了解"等动词。

然后，` : `文档标题：${documentTitle}
`}文档字数：${wordCount} 字${isContentTruncated ? ' (内容已智能截取用于大纲生成)' : ''}
总预估学习时间：${totalEstimatedMinutes} 分钟
推荐章节数：${documentStructureAnalysis.recommendedChapters}
推荐每章小节数：${documentStructureAnalysis.recommendedSectionsPerChapter}

${wordCount > 30000 ? `
**长篇文档处理说明**：
这是一份长篇文档(${wordCount}字)，已采用章节结构感知截取。内容包含：
1. 【完整章节结构】- 文档的所有章节标题
2. 【章节内容摘要】- 重点章节的详细内容
3. 前言和结尾部分

请严格按照提供的【完整章节结构】来规划学习大纲：
- 保持与原文档章节的一致性和完整性
- 为每个原始章节创建对应的学习章节
- 可以在章节下细分为合理的小节
- 确保覆盖文档的完整逻辑结构
- 学习大纲应该体现原文档的思想脉络
` : ''}

文档内容：
${truncatedContent}

**智能章节规划要求**：
${documentStructureAnalysis.instructions}

**通用要求**：
1. 章节标题格式：第X章 [标题]
2. 小节标题格式：X.1、X.2、X.3（数字编号开头）
3. 章节和小节标题要简洁明了，能准确概括该部分内容
4. 应该有逻辑顺序，从基础到高级
5. 只为小节估算学习时间（章节不需要时间，因为章节只是标题）
6. **关键要求：每个章节必须至少包含一个小节**，即使原文档没有明确的子章节划分，也要创建如"X.1 本章概要"或"X.1 核心内容"等小节，确保用户可以点击跳转学习

**⚠️ 极其重要：章节-小节关系规则（必须严格遵守）**：
- 第1章下面ONLY能有1.1、1.2、1.3等小节，绝不能有2.X、3.X等
- 第2章下面ONLY能有2.1、2.2、2.3等小节，绝不能有1.X、3.X等
- 第3章下面ONLY能有3.1、3.2、3.3等小节，绝不能有1.X、2.X等
- 小节编号的第一个数字必须等于其所属章节的编号
- parentChapter字段必须与小节标题中的第一个数字完全一致
- 例如："2.1 概述"的parentChapter必须是2，"3.2 实践"的parentChapter必须是3
- 🚫 严禁出现：第2章下面有"1.1"或"3.1"这样错误编号的小节

**JSON格式要求（非常重要）**：
- 必须返回有效的JSON格式
- 对象之间必须用逗号分隔
- 最后一个对象后不要添加逗号
- 确保所有引号正确匹配
- 返回格式必须是JSON对象，包含documentTitle（如果需要生成标题）和outline数组
- 小节编号必须与所属章节保持一致，例如第1章下的小节必须是1.1、1.2、1.3，第2章下的小节必须是2.1、2.2、2.3

${!documentTitle || documentTitle === '未知文档' || documentTitle === '文本内容' ? `
返回格式（需要生成标题）：
{
  "documentTitle": "生成的精确标题",
  "outline": [
    {"title": "第1章 基础概念介绍", "order": 1, "type": "chapter", "level": 1, "chapterNumber": 1},
    {"title": "1.1 核心概念", "order": 2, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 8},
    {"title": "1.2 重要性分析", "order": 3, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 7},
    {"title": "第2章 深入理解", "order": 4, "type": "chapter", "level": 1, "chapterNumber": 2},
    {"title": "2.1 本章要点", "order": 5, "type": "section", "level": 2, "parentChapter": 2, "estimatedMinutes": 10},
    {"title": "2.2 实践应用", "order": 6, "type": "section", "level": 2, "parentChapter": 2, "estimatedMinutes": 12},
    {"title": "第3章 高级应用", "order": 7, "type": "chapter", "level": 1, "chapterNumber": 3},
    {"title": "3.1 案例分析", "order": 8, "type": "section", "level": 2, "parentChapter": 3, "estimatedMinutes": 15}
  ]
}

❗️注意示例中的编号规律：
- 第1章的小节：1.1, 1.2 (parentChapter都是1)
- 第2章的小节：2.1, 2.2 (parentChapter都是2)  
- 第3章的小节：3.1 (parentChapter是3)
严格按照这个模式生成！` : `
返回格式（已有标题）：
{
  "outline": [
    {"title": "第1章 基础概念介绍", "order": 1, "type": "chapter", "level": 1, "chapterNumber": 1},
    {"title": "1.1 核心概念", "order": 2, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 8},
    {"title": "1.2 重要性分析", "order": 3, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 7},
    {"title": "第2章 深入理解", "order": 4, "type": "chapter", "level": 1, "chapterNumber": 2},
    {"title": "2.1 本章要点", "order": 5, "type": "section", "level": 2, "parentChapter": 2, "estimatedMinutes": 10},
    {"title": "2.2 实践应用", "order": 6, "type": "section", "level": 2, "parentChapter": 2, "estimatedMinutes": 12}
  ]
}`}`;

    // 使用重试机制调用API，提高大文档处理成功率
    const response = await makeAPIRequestWithRetry(config, [
      { role: 'user', content: prompt }
    ], 3, 2000);

    // 解析AI返回的JSON
    const content = response.content || '';
    console.log('AI原始返回内容:', content);
    
    let parsedResponse: any = {};
    let outlineItems: any[] = [];
    let generatedTitle: string | undefined;
    
    try {
      console.log('🔍 AI返回内容长度:', content.length);
      console.log('🔍 AI返回内容预览:', content.substring(0, 800) + (content.length > 800 ? '...' : ''));
      
      // 方法1: 查找完整的JSON对象
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        console.log('方法1: 提取的JSON字符串长度:', jsonMatch[0].length);
        console.log('方法1: 提取的JSON字符串预览:', jsonMatch[0].substring(0, 500) + '...');
        
        try {
          parsedResponse = JSON.parse(jsonMatch[0]);
          console.log('方法1: 解析后的响应对象类型:', typeof parsedResponse);
          console.log('方法1: 解析后的响应对象键:', Object.keys(parsedResponse));
        } catch (jsonError) {
          console.log('方法1失败，尝试精准修复JSON语法错误...');
          console.log('JSON错误详情:', jsonError instanceof Error ? jsonError.message : String(jsonError));
          
          // 尝试基于错误信息精准修复
          const fixedJson = fixJsonByErrorPosition(jsonMatch[0], jsonError instanceof Error ? jsonError.message : '');
          
          try {
            parsedResponse = JSON.parse(fixedJson);
            console.log('方法1: 精准修复成功，解析后的响应对象键:', Object.keys(parsedResponse));
          } catch (secondError) {
            console.log('精准修复失败，尝试通用修复...');
            try {
              const generalFixedJson = fixCommonJsonErrors(jsonMatch[0]);
              parsedResponse = JSON.parse(generalFixedJson);
              console.log('方法1: 通用修复成功，解析后的响应对象键:', Object.keys(parsedResponse));
            } catch (thirdError) {
              console.error('所有JSON修复方法都失败，使用错误恢复策略');
              // 作为最后手段，尝试提取部分内容创建基本的outline结构
              try {
                const fallbackOutline = createFallbackOutline(content, documentTitle);
                parsedResponse = fallbackOutline;
                console.log('✅ 使用回退策略成功创建基础大纲');
              } catch (fallbackError) {
                throw new Error(`JSON解析完全失败: ${thirdError instanceof Error ? thirdError.message : '未知错误'}`);
              }
            }
          }
        }
      } else {
        // 方法2: 查找代码块中的JSON
        const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (codeBlockMatch) {
          console.log('方法2: 从代码块提取JSON:', codeBlockMatch[1]);
          try {
            parsedResponse = JSON.parse(codeBlockMatch[1]);
            console.log('方法2: 解析后的响应对象:', parsedResponse);
          } catch (jsonError) {
            console.log('方法2失败，尝试修复JSON语法错误...');
            try {
              const fixedJson = fixCommonJsonErrors(codeBlockMatch[1]);
              parsedResponse = JSON.parse(fixedJson);
              console.log('方法2: JSON修复成功');
            } catch (fixError) {
              console.error('方法2: JSON修复失败:', fixError);
              throw new Error(`代码块JSON解析失败: ${fixError instanceof Error ? fixError.message : '未知错误'}`);
            }
          }
        } else {
          // 方法3: 尝试直接解析整个内容
          try {
            console.log('方法3: 尝试直接解析整个内容');
            parsedResponse = JSON.parse(content.trim());
            console.log('方法3: 解析成功:', parsedResponse);
          } catch (e) {
            try {
              console.log('方法3失败，尝试修复后解析整个内容...');
              const fixedJson = fixCommonJsonErrors(content.trim());
              parsedResponse = JSON.parse(fixedJson);
              console.log('方法3: JSON修复成功');
            } catch (e2) {
              // 方法4: 尝试解析旧格式（数组）
              const arrayMatch = content.match(/\[[\s\S]*\]/);
              if (arrayMatch) {
                console.log('方法4: 兼容旧格式，提取数组:', arrayMatch[0]);
                try {
                  outlineItems = JSON.parse(arrayMatch[0]);
                  console.log('方法4: 解析后的大纲数组:', outlineItems);
                } catch (e3) {
                  console.log('方法4失败，尝试修复数组格式...');
                  const fixedArrayJson = fixCommonJsonErrors(arrayMatch[0]);
                  outlineItems = JSON.parse(fixedArrayJson);
                  console.log('方法4: 数组JSON修复成功');
                }
              } else {
                console.error('所有方法失败，尝试最后的备用方案...');
                // 最后的备用方案1：重新构建有效的JSON
                try {
                  console.log('🚀 尝试重新构建JSON...');
                  const rebuiltJson = rebuildValidJson(content);
                  parsedResponse = JSON.parse(rebuiltJson);
                  console.log('🚀 重新构建JSON成功');
                } catch (e4) {
                  // 最后的备用方案2：提取有效对象
                  try {
                    console.log('🔧 尝试提取有效的JSON对象...');
                    const extractedObjects = extractValidJsonObjects(content);
                    if (extractedObjects.length > 0) {
                      console.log('🔧 备用方案成功：提取到', extractedObjects.length, '个有效对象');
                      outlineItems = extractedObjects;
                    } else {
                      throw new Error('无法提取有效的JSON对象');
                    }
                  } catch (e5) {
                    console.error('所有备用方案都失败，使用最后的文本解析方案:', e5);
                    // 最终备用方案：直接文本解析，不依赖JSON
                    try {
                      outlineItems = parseOutlineFromText(content);
                      console.log('📝 文本解析成功，提取到', outlineItems.length, '个大纲项目');
                    } catch (e6) {
                      console.error('文本解析也失败:', e6);
                      throw new Error(`所有解析方法都失败了。请尝试重新上传文档或检查网络连接。`);
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      // 处理新格式的响应
      if (parsedResponse && parsedResponse.outline) {
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
      console.error('❌ JSON解析失败:', parseError);
      console.error('❌ 原始内容长度:', content.length);
      console.error('❌ 原始内容预览:', content.substring(0, 1000));
      console.error('❌ 详细错误信息:', parseError instanceof Error ? parseError.message : String(parseError));
      
      // 针对拆分文档的简化诊断
      const isSplitDocument = documentTitle?.includes('(') || documentContent.length > 10000;
      if (isSplitDocument) {
        console.error('🔍 检测到这可能是拆分文档片段');
      }
      
      // 尝试提供更有用的错误信息
      let errorMessage = 'AI返回的JSON格式有误，无法解析';
      
      if (content.includes('```')) {
        errorMessage += '。检测到代码块标记，可能是格式问题。';
      }
      
      if (content.length === 0) {
        errorMessage = 'AI未返回任何内容，请检查API配置和网络连接。';
      } else if (content.length > 50000) {
        errorMessage += '。返回内容过长，可能被截断。';
      }
      
      if (content.includes('error') || content.includes('Error')) {
        errorMessage += '。AI响应中包含错误信息。';
      }
      
      if (isSplitDocument) {
        errorMessage += '。检测到这是拆分文档片段，可能是内容复杂导致的解析问题。';
      }
      
      throw new Error(errorMessage);
    }
    
    if (!Array.isArray(outlineItems)) {
      throw new Error('解析的大纲不是数组格式');
    }

    console.log('🔍 AI生成的原始大纲数据:');
    outlineItems.forEach((item, index) => {
      console.log(`${index}: ${item.type} - "${item.title}" (parentChapter: ${item.parentChapter})`);
    });

    // 使用统一的大纲修复逻辑，避免重复处理
    console.log('🔧 开始统一的大纲结构修复...');
    const fixedOutlineItems = fixOutlineStructure(outlineItems);
    
    // 处理大纲项目，添加必要的字段和时间预估
    const processedItems = fixedOutlineItems.map((item, index) => {
      const baseItem: any = {
        title: item.title || `项目 ${index + 1}`,
        order: item.order || index + 1,
        type: item.type || 'chapter',
        level: item.level || 1,
        estimatedMinutes: item.estimatedMinutes || (item.type === 'chapter' ? 15 : 8), // 默认时间预估
      };

      // 如果是小节，需要找到对应的父章节
      if (baseItem.type === 'section' && item.parentChapter) {
        // 按章节编号匹配，而不是order，使用修复后的数据
        const parentChapter = fixedOutlineItems.find(parent => 
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
    // 智能截取学习材料内容，避免token超限
    const truncatedDocumentContent = smartContentTruncate(documentContent, 6000); // 对话中给更多空间给其他内容
    const isContentTruncated = truncatedDocumentContent.length < documentContent.length;
    
    if (isContentTruncated) {
      console.log(`对话系统: 学习材料过长已智能截取: ${documentContent.length} -> ${truncatedDocumentContent.length} 字符`);
    }
    
    // 构建系统消息
    const systemMessage = {
      role: 'system' as const,
      content: `${getSystemPrompt(learningLevel)}

当前学习材料${isContentTruncated ? '(已智能截取关键部分)' : ''}：
${truncatedDocumentContent}

学习大纲：
${outline.map((item, index) => `${index + 1}. ${item.title}`).join('\n')}

用户学习水平：${learningLevel === 'beginner' ? '小白' : '高手'}

${isContentTruncated ? '注意：学习材料内容较长，已进行智能截取。请基于提供的关键部分进行教学，必要时可以要求用户提供更具体的问题或章节。' : ''}

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
    
    // 清理AI回复中的多余空白和格式问题
    let cleanedContent = response.content || '';
    
    // 移除多余的空白字符和空行
    cleanedContent = cleanedContent
      .replace(/\s{3,}/g, ' ')           // 将3个以上的连续空格替换为1个空格
      .replace(/\n\s*\n\s*\n/g, '\n\n') // 将3个以上的连续空行替换为2个空行
      .replace(/^\s+/gm, '')            // 移除每行开头的空白
      .replace(/\s+$/gm, '')            // 移除每行结尾的空白
      .replace(/\n{4,}/g, '\n\n\n')     // 限制最多3个连续换行
      .trim();                          // 移除开头和结尾的空白
    
    console.log('AI回复清理前长度:', response.content?.length || 0);
    console.log('AI回复清理后长度:', cleanedContent.length);
    
    return {
      success: true,
      data: cleanedContent,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '发送消息失败',
    };
  }
};

/**
 * 带重试机制的API请求函数
 * 处理大文档解析时的网络超时和服务错误
 */
const makeAPIRequestWithRetry = async (
  config: APIConfig,
  messages: Array<{ role: string; content: string }>,
  maxRetries: number = 3,
  retryDelay: number = 2000
): Promise<{ content: string }> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📡 API请求尝试 ${attempt}/${maxRetries}`, {
        provider: config.provider,
        model: config.model,
        messageLength: messages[0]?.content?.length || 0
      });
      
      const result = await makeAPIRequest(config, messages);
      console.log(`✅ API请求第${attempt}次尝试成功`);
      return result;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`⚠️ API请求第${attempt}次尝试失败:`, {
        attempt,
        maxRetries,
        error: lastError.message,
        provider: config.provider
      });
      
      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        break;
      }
      
      // 检查错误类型，决定是否重试
      const errorMessage = lastError.message.toLowerCase();
      const shouldRetry = 
        errorMessage.includes('503') ||  // 服务不可用
        errorMessage.includes('502') ||  // 网关错误
        errorMessage.includes('504') ||  // 网关超时
        errorMessage.includes('429') ||  // 请求过多
        errorMessage.includes('timeout') ||
        errorMessage.includes('network') ||
        errorMessage.includes('fetch');
      
      if (!shouldRetry) {
        console.log(`❌ 错误类型不适合重试，直接失败: ${lastError.message}`);
        break;
      }
      
      // 计算延迟时间（指数退避）
      const delay = retryDelay * Math.pow(2, attempt - 1);
      console.log(`⏳ 等待 ${delay}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // 所有重试都失败了
  throw new Error(`API请求失败，已重试${maxRetries}次。最后错误: ${lastError?.message || '未知错误'}`);
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

  // 添加超时控制 - 大文档处理需要更长时间
  const timeoutMs = 60000; // 60秒超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(finalUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`请求超时 (${timeoutMs/1000}秒)，请尝试使用更短的文档或分段上传`);
    }
    throw error;
  }

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