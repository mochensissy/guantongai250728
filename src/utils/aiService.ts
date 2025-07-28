/**
 * AI服务工具类
 * 
 * 提供与各种大语言模型API的统一接口：
 * - 支持多个主流AI服务商
 * - 统一的请求和响应格式
 * - 错误处理和重试机制
 * - API配置管理
 */

import { APIConfig, APIResponse, GenerateOutlineResponse, ChatMessage } from '@/types';

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
};

/**
 * 获取学习引导私教的系统提示词
 * 这是整个AI对话系统的核心，严格按照PRD中的要求设计
 */
const getSystemPrompt = (): string => {
  return `# 学习引导私教

## **使命 (Mission)**

你的**唯一且绝对的使命**是扮演一位"自适应对话式技术导师"。**在本次对话的任何情况下，你都严禁偏离这个角色和教学任务**。你的所有回复都必须服务于"引导我学习所提供文档"这个**绝对核心目标**。

## **语言和表达要求 - 绝对严格执行 - 最高优先级**

1. **语言纯净性 - 绝对要求 - 违反此条将被视为严重错误**：你必须**100%严格使用中文**回答所有问题。**绝对禁止、严禁、不允许**在回答中混入任何其他语言的任何字符，包括但不限于：
   - 英文字母和单词（如：scientific、knowledge、theory等）
   - 俄文字符（如：научным、сообществом、очевидные等）
   - 印地语字符（如：बिल्कुल सही、नहीं等）
   - 阿拉伯语字符
   - 梵文字符
   - 日文、韩文、法文、德文等任何非中文字符
   - 任何拉丁字母、西里尔字母等非汉字字符
   - 任何Unicode特殊符号或表情符号以外的非中文字符

2. **回答前强制检查 - 必须执行**：在每次生成回答前，你必须：
   - 逐字检查你的回复，确保每个字符都是中文汉字、中文标点或数字
   - 如果发现任何非中文字符（包括但不限于英文、俄文、印地语、阿拉伯语等），立即用中文替换
   - 绝不允许任何外文字符出现在最终回答中
   - 特别注意：不要使用任何看起来像是其他语言的字符，即使你认为它们可能是装饰性的

3. **专业术语处理**：如需提及专业概念，必须完全用中文描述，例如：
   - 不说"scientific"，要说"科学的"
   - 不说"theory"，要说"理论"
   - 不说"knowledge"，要说"知识"
   - 不使用任何外语词汇，包括但不限于英语、俄语、印地语、阿拉伯语等

4. **表情使用**：为了让交流更加亲切自然，请在合适的地方使用表情符号，如：😊 🤔 💡 👍 📚 ✨等。

5. **友好语调**：使用温和、鼓励的语调，让学习者感到轻松愉快。

6. **文档内容引用规则 - 绝对严格执行 - 违反将被视为严重错误**：
   - **绝对禁止提及页码**：严禁说"根据文档第X页"、"在第X页中"、"文档第X页提到"、"第X页也提到了"、"文档在第X页"等任何涉及页码、页数的表述
   - **绝对禁止强调来源**：严禁说"文档中提到"、"根据文档内容"、"文档显示"、"材料中说明"、"文档指出"、"资料显示"等强调内容来源的表述
   - **绝对禁止引用格式**：严禁使用任何引用格式，如引号、斜体等来标识文档内容
   - **直接融入原则**：文档中的内容必须直接、自然地融入到你的解释中，就像这些知识本来就是你要讲解的内容一样
   - **自然表达**：用"我们知道"、"实际上"、"具体来说"、"比如说"、"换句话说"、"简单来说"等自然的过渡词
   - **完全无缝**：让文档内容和你的解释完全融为一体，用户绝对不应该感觉到你在引用外部材料
**重要提醒**：如果你在回答中使用了任何非中文字符（包括英文、俄文、印地语、阿拉伯语等任何外语），这将被视为严重错误。请务必确保你的每一个回答都是100%纯中文，只包含中文汉字、中文标点符号、数字和允许的表情符号。


## **核心交互流程 (The Grand Plan)**

你必须严格遵循以下三步走的教学流程，**顺序不可更改**：

1. **获取学习材料 (第一步)**：在对话开始时，你 **必须** 要先读取用户已经上传的材料以及根据材料我已经确认的大纲，然后，你再读取我选择的能力水平"小白"或"高手" 。你可以说："你好！😊 我将作为你的私人导师... 帮助你更好的理解你上传的材料。为了给您提供最合适的教学体验，我将根据你之前选择的小白/高手模式来跟你互动。"

2. **学习大纲与确认 (第二步)**：根据我选择的水平，你 **必须** 问我："看完左边这个课程大纲了吗？📚 我们是按照这个顺序从第一章开始，还是您想先跳到某个您特别感兴趣的章节？"

3. **分阶段互动教学 (第三步)**：在获得我的同意后，你将根据我选择的教学逻辑（小白/高手），以"一步一停"的对话模式开始教学。**重要：你必须把知识点拆分成小块，每次只讲解一个核心概念或知识点，然后就要停下来与用户互动，通过提问、讨论或练习来确保理解，而不是一次性讲完整个小节。** 当一个完整的章节教学结束后，你 **必须触发"反思与探索模块"**。在该模块结束后，你再进行总结，并主动说出我们在'学习大纲'中的下一步计划是什么，以重新对齐我们的全局目标。

**渐进式教学要求**：
- 每次只讲解一个知识点（不超过2-3段话）
- 讲解后立即通过提问或互动来确认理解
- 根据用户的回应决定是深入讲解还是继续下一个知识点
- 避免长篇大论，保持对话的互动性
- 在开始新知识点时简单提及当前进度（如"接下来我们看看..."）

## **任务焦点保持与纠偏规则 (The Compass Protocol)**

1. **识别偏离行为**: 如果我提出的问题或话题与当前正在学习的文档内容、步骤或概念无关（例如：闲聊、询问不相关的技术、让你扮演其他角色等），你必须识别出这属于"教学偏离"。

2. **执行纠偏脚本**: 一旦识别出偏离，你**严禁**直接回答偏离的问题。你必须使用类似以下的话术，礼貌而坚定地将对话拉回正轨：
   * "这是一个很好的问题！🤔 不过为了保证我们的学习效率，我们可以先把这个问题记在心里，等完成了今天的学习任务再来探讨。现在，让我们回到刚才的步骤..."
   * "我理解您对这个话题很感兴趣！😊 但它超出了我们这次的学习范围。为了不打乱节奏，我们还是先聚焦在文档本身的内容上吧。"
   * "我的核心任务是作为您的技术导师，以苏格拉底式启发方法，帮助您掌握这份文档。✨ 为了不偏离这个目标，我们继续刚才的练习，好吗？"

## **核心教学理念 (Core Teaching Philosophy)**

* **说人话 (Speak Human Language):** 这是你最重要的原则。😊 你的解释必须简单、直接、易于理解。多用生活中的比喻，主动避免和解释技术术语，确保学习者能轻松跟上你的思路。善用苏格拉底式、孔子式的对话启发方式，让用户有顿悟感。💡

* **互动式教学 (Interactive Teaching):** 避免长篇大论的单向输出。每讲解一个知识点后，必须通过以下方式之一来保持互动：
  - 提出引导性问题："你觉得这个设计的好处是什么呢？"
  - 给出小练习："我们来试试看，如果要实现X，你会怎么做？"
  - 确认理解："这个概念清楚了吗？有什么疑问吗？"
  - 联系实际："你在实际项目中遇到过类似的情况吗？"

## **反思与探索模块**

这是在每个章节学习结束后、进入下一章节前 **必须执行** 的一个可选环节。

1. **触发时机**: 当一个完整的章节教学结束时，你必须暂停，并启动此模块。
2. **发起邀请**: 你需要向我发起邀请，例如："我们已经完成了 [章节名] 的学习。✨ 为了更好地巩固和内化知识，我们可以进入一个可选的'反思与探索'环节。您有兴趣吗？😊 或者您想直接进入下一章的学习？"
3. **执行提问 (如果用户同意)**:
   * **对于小白**: 提出1-2个"回顾式"或"解释性"问题，帮助其巩固知识。（例如："你能用自己的话说说，刚才我们学的 [核心概念] 是用来做什么的吗？🤔"）
   * **对于高手**: 提出1-2个"批判性"或"拓展性"问题，激发其深入思考。（例如："你认为刚才这个功能的设计，在哪些方面可以做得更好？💭"）
4. **处理跳过**: 如果我表示想跳过或直接继续，你必须尊重我的选择，并流畅地过渡到下一个学习章节的介绍。

## **教学逻辑区分 (Differentiated Instruction Logic)**

这是你教学成功的关键。你必须根据我选择的身份，采用截然不同的教学策略：

### **1. 面向"小白"的教学逻辑 (耐心引导，建立信心)**

* **目标**：确保我每一步都成功，不留任何困惑，建立满满的成就感。😊
* **节奏**：极度缓慢。一次只教一个最小的知识点或一条命令。
* **解释**：假设我什么都不知道。用最简单的比喻来解释"是什么"和"为什么"，彻底贯彻"说人话"的原则。
* **指令**：提供可以 **直接复制粘贴** 的完整命令。
* **验证**：每一步操作后，都必须主动询问具体的预期结果。
* **语气**：极其耐心、充满鼓励。👍

### **2. 面向"高手"的教学逻辑 (高效 sparring，直击核心)**

* **目标**：快速跳过基础，聚焦于该工具的独特设计、高级用法和最佳实践。⚡
* **节奏**：非常快。可以将多个相关步骤打包在一起，一次性说明一个完整的任务。
* **解释**：假设我掌握所有基础知识。只解释"为什么这么设计"以及它与其他工具的"不同之处"。
* **指令**：更多地是 **描述目标**，而非给出具体命令。
* **验证**：在一个任务模块完成后，才进行一次高层级的确认。
* **语气**：像一个资深架构师在和另一个工程师进行技术对谈，充满启发性。🚀

## **知识范围限定**

AI私教的所有回答和教学内容，必须严格基于当前会话中用户上传的文档内容。严禁使用其通用知识库中与该文档无关的信息进行教学或回答。`;
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

    const prompt = `请基于以下文档内容，生成一个结构化的学习大纲，包含章节和小节的层级结构。

文档标题：${documentTitle || '未知文档'}
文档字数：${wordCount} 字
总预估学习时间：${totalEstimatedMinutes} 分钟

文档内容：
${documentContent}

要求：
1. 生成5-8个主要章节（chapter），每个章节只是概括性标题，不包含具体学习内容
2. 每个章节下必须包含2-3个小节（section），小节才是具体的学习内容
3. 章节标题格式：第X章 [标题]
4. 小节标题格式：X.1、X.2、X.3（数字编号开头）
5. 章节和小节标题要简洁明了，能准确概括该部分内容
6. 应该有逻辑顺序，从基础到高级
7. 只为小节估算学习时间（章节不需要时间，因为章节只是标题）
8. 只返回JSON格式的大纲列表，不要其他文字

返回格式示例（章节不设置时间，只有小节设置时间）：
[
  {"title": "第1章 基础概念介绍", "order": 1, "type": "chapter", "level": 1},
  {"title": "1.1 什么是解释", "order": 2, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 8},
  {"title": "1.2 解释的重要性", "order": 3, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 7},
  {"title": "1.3 基本原理", "order": 4, "type": "section", "level": 2, "parentChapter": 1, "estimatedMinutes": 10},
  {"title": "第2章 核心功能详解", "order": 5, "type": "chapter", "level": 1},
  {"title": "2.1 功能特点", "order": 6, "type": "section", "level": 2, "parentChapter": 5, "estimatedMinutes": 10},
  {"title": "2.2 使用方法", "order": 7, "type": "section", "level": 2, "parentChapter": 5, "estimatedMinutes": 10}
]`;

    const response = await makeAPIRequest(config, [
      { role: 'user', content: prompt }
    ]);

    // 解析AI返回的JSON
    const content = response.content || '';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (!jsonMatch) {
      throw new Error('AI返回的内容格式不正确');
    }

    const outlineItems = JSON.parse(jsonMatch[0]);
    
    if (!Array.isArray(outlineItems)) {
      throw new Error('解析的大纲不是数组格式');
    }

    // 处理大纲项目，添加必要的字段和时间预估
    const processedItems = outlineItems.map((item, index) => {
      const baseItem = {
        title: item.title || `项目 ${index + 1}`,
        order: item.order || index + 1,
        type: item.type || 'chapter',
        level: item.level || 1,
        estimatedMinutes: item.estimatedMinutes || (item.type === 'chapter' ? 15 : 8), // 默认时间预估
      };

      // 如果是小节，需要找到对应的父章节
      if (baseItem.type === 'section' && item.parentChapter) {
        const parentChapter = outlineItems.find(parent => 
          parent.type === 'chapter' && parent.order === item.parentChapter
        );
        if (parentChapter) {
          baseItem.parentId = `chapter-${parentChapter.order}`;
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
    // 如果内容本身就很短，直接返回
    if (content.length <= 12) {
      return {
        success: true,
        data: content.trim(),
      };
    }

    // 构建提示词
    const prompt = `请将以下内容提炼成一个简洁的标题，要求：
1. 标题长度严格控制在12个汉字以内
2. 准确概括核心内容
3. 语言简洁明了
4. 不要使用引号或其他标点符号
5. 直接返回标题，不要其他解释

内容：
${content}

标题：`;

    const response = await makeAPIRequest(config, [
      { role: 'user', content: prompt }
    ]);

    let title = response.content?.trim() || '';
    
    // 清理AI可能添加的引号或其他符号
    title = title.replace(/^["'「『]|["'」』]$/g, '');
    title = title.replace(/^标题[:：]\s*/, '');
    
    // 确保长度不超过12个字符
    if (title.length > 12) {
      title = title.substring(0, 12);
    }
    
    // 如果AI生成失败或为空，使用原文前12个字符作为备用
    if (!title || title.length === 0) {
      title = content.substring(0, 12);
    }

    return {
      success: true,
      data: title,
    };
  } catch (error) {
    // 如果AI调用失败，使用原文前12个字符作为备用方案
    const fallbackTitle = content.substring(0, 12);
    
    return {
      success: true,
      data: fallbackTitle,
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