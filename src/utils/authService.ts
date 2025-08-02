/**
 * 用户认证服务
 * 
 * 功能：
 * - 本地用户注册和登录验证
 * - 用户数据存储管理
 * - 为未来Supabase集成做准备
 */

interface User {
  id: string;
  email: string;
  username: string;
  password: string; // 在生产环境中应该加密存储
  createdAt: number;
  lastLoginAt?: number;
}

interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
}

const USERS_STORAGE_KEY = 'ai-tutor-users';
const CURRENT_USER_KEY = 'ai-tutor-current-user';

/**
 * 获取所有用户（仅用于验证）
 */
const getUsers = (): User[] => {
  try {
    const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch (error) {
    console.error('获取用户数据失败:', error);
    return [];
  }
};

/**
 * 保存用户数据
 */
const saveUsers = (users: User[]): boolean => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('保存用户数据失败:', error);
    return false;
  }
};

/**
 * 生成用户ID
 */
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 简单的密码加密（生产环境应使用更安全的方法）
 */
const hashPassword = (password: string): string => {
  // 这里使用简单的Base64编码，实际项目应该使用更安全的加密方法
  return btoa(password + 'ai-tutor-salt');
};

/**
 * 验证密码
 */
const verifyPassword = (password: string, hashedPassword: string): boolean => {
  return hashPassword(password) === hashedPassword;
};

/**
 * 用户注册
 */
export const registerUser = async (userData: {
  email: string;
  username: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const users = getUsers();
    
    // 检查邮箱是否已被使用
    const existingUserByEmail = users.find(user => user.email === userData.email);
    if (existingUserByEmail) {
      return {
        success: false,
        message: '该邮箱已被注册，请使用其他邮箱或直接登录'
      };
    }
    
    // 检查用户名是否已被使用
    const existingUserByUsername = users.find(user => user.username === userData.username);
    if (existingUserByUsername) {
      return {
        success: false,
        message: '该用户名已被使用，请选择其他用户名'
      };
    }
    
    // 创建新用户
    const newUser: User = {
      id: generateUserId(),
      email: userData.email,
      username: userData.username,
      password: hashPassword(userData.password),
      createdAt: Date.now()
    };
    
    // 保存用户
    users.push(newUser);
    const saved = saveUsers(users);
    
    if (!saved) {
      return {
        success: false,
        message: '注册失败，请稍后重试'
      };
    }
    
    // 自动登录新注册的用户
    const userWithoutPassword = { ...newUser };
    delete (userWithoutPassword as any).password;
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    return {
      success: true,
      message: '注册成功！欢迎使用AI学习私教',
      user: userWithoutPassword
    };
    
  } catch (error) {
    console.error('注册失败:', error);
    return {
      success: false,
      message: '注册过程中发生错误，请稍后重试'
    };
  }
};

/**
 * 用户登录
 */
export const loginUser = async (credentials: {
  email: string;
  password: string;
}): Promise<AuthResponse> => {
  try {
    const users = getUsers();
    
    // 查找用户
    const user = users.find(u => u.email === credentials.email);
    if (!user) {
      return {
        success: false,
        message: '邮箱或密码错误，请检查后重试'
      };
    }
    
    // 验证密码
    if (!verifyPassword(credentials.password, user.password)) {
      return {
        success: false,
        message: '邮箱或密码错误，请检查后重试'
      };
    }
    
    // 更新最后登录时间
    user.lastLoginAt = Date.now();
    const userIndex = users.findIndex(u => u.id === user.id);
    users[userIndex] = user;
    saveUsers(users);
    
    // 保存当前用户信息
    const userWithoutPassword = { ...user };
    delete (userWithoutPassword as any).password;
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userWithoutPassword));
    
    return {
      success: true,
      message: '登录成功！欢迎回来',
      user: userWithoutPassword
    };
    
  } catch (error) {
    console.error('登录失败:', error);
    return {
      success: false,
      message: '登录过程中发生错误，请稍后重试'
    };
  }
};

/**
 * 获取当前登录用户
 */
export const getCurrentUser = (): Omit<User, 'password'> | null => {
  try {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('获取当前用户失败:', error);
    return null;
  }
};

/**
 * 用户登出
 */
export const logoutUser = (): boolean => {
  try {
    localStorage.removeItem(CURRENT_USER_KEY);
    return true;
  } catch (error) {
    console.error('登出失败:', error);
    return false;
  }
};

/**
 * 检查用户是否已登录
 */
export const isUserLoggedIn = (): boolean => {
  return getCurrentUser() !== null;
};

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 验证密码强度
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 6) {
    return {
      isValid: false,
      message: '密码至少需要6位字符'
    };
  }
  
  if (password.length > 50) {
    return {
      isValid: false,
      message: '密码不能超过50位字符'
    };
  }
  
  // 可以添加更多密码规则，如包含大小写字母、数字等
  
  return { isValid: true };
};

/**
 * 验证用户名
 */
export const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  if (username.length < 2) {
    return {
      isValid: false,
      message: '用户名至少需要2位字符'
    };
  }
  
  if (username.length > 20) {
    return {
      isValid: false,
      message: '用户名不能超过20位字符'
    };
  }
  
  // 检查是否包含特殊字符
  const validUsernameRegex = /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/;
  if (!validUsernameRegex.test(username)) {
    return {
      isValid: false,
      message: '用户名只能包含字母、数字、中文、下划线和连字符'
    };
  }
  
  return { isValid: true };
};