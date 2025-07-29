/**
 * 调试工具函数
 * 用于排查和解决可能的缓存或状态问题
 */

/**
 * 清理所有本地存储数据
 * 可以在浏览器控制台中调用：window.clearAllData()
 */
export const clearAllLocalStorage = (): void => {
  console.log('🧹 开始清理所有本地存储数据...');
  
  const keys = [
    'ai-tutor-learning-level',
    'ai-tutor-ui-theme', 
    'ai-tutor-sessions',
    'ai-tutor-api-config',
    'ai-tutor-cards'
  ];
  
  keys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️ 删除: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ 本地存储清理完成！请刷新页面。');
};

/**
 * 检查当前存储状态
 */
export const checkStorageStatus = (): void => {
  console.log('📊 当前本地存储状态：');
  
  const keys = [
    'ai-tutor-learning-level',
    'ai-tutor-ui-theme',
    'ai-tutor-sessions', 
    'ai-tutor-api-config',
    'ai-tutor-cards'
  ];
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`✅ ${key}:`, value.length > 100 ? `${value.substring(0, 100)}...` : value);
    } else {
      console.log(`❌ ${key}: 不存在`);
    }
  });
};

/**
 * 修复会话的学习模式
 */
export const fixSessionLearningModes = (): void => {
  console.log('🔧 检查并修复会话学习模式...');
  
  try {
    const sessionsData = localStorage.getItem('ai-tutor-sessions');
    if (!sessionsData) {
      console.log('❌ 没有找到会话数据');
      return;
    }
    
    const sessions = JSON.parse(sessionsData);
    let hasChanges = false;
    
    sessions.forEach((session: any) => {
      // 确保每个会话都有正确的学习模式字段
      if (!session.learningLevel) {
        session.learningLevel = 'beginner'; // 默认设为初学者
        hasChanges = true;
        console.log(`🔧 修复会话 "${session.title}" 的学习模式`);
      }
      
      // 确保消息历史中有正确的系统消息
      if (session.messages && session.messages.length > 0) {
        const systemMessage = session.messages.find((m: any) => m.role === 'system');
        if (systemMessage && !systemMessage.content.includes('学习水平')) {
          // 更新系统消息包含学习水平信息
          systemMessage.content = `学习会话已开始。文档标题：${session.title}，学习水平：${session.learningLevel === 'beginner' ? '小白' : '高手'}模式。`;
          hasChanges = true;
          console.log(`🔧 修复会话 "${session.title}" 的系统消息`);
        }
      }
    });
    
    if (hasChanges) {
      localStorage.setItem('ai-tutor-sessions', JSON.stringify(sessions));
      console.log('✅ 会话数据已修复，请刷新页面');
    } else {
      console.log('✅ 会话数据无需修复');
    }
    
  } catch (error) {
    console.error('❌ 修复会话数据时出错:', error);
  }
};

/**
 * 在浏览器全局注册调试函数
 */
export const registerDebugFunctions = (): void => {
  if (typeof window !== 'undefined') {
    (window as any).clearAllData = clearAllLocalStorage;
    (window as any).checkStorage = checkStorageStatus;
    (window as any).fixSessions = fixSessionLearningModes;
    
    console.log('🛠️ 调试工具已注册到全局:');
    console.log('- window.clearAllData() - 清理所有本地数据');
    console.log('- window.checkStorage() - 检查存储状态');
    console.log('- window.fixSessions() - 修复会话数据');
  }
}; 