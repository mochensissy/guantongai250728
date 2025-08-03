-- ================================
-- AI私教学习平台 - 初始数据库架构 (修复版)
-- ================================
-- 
-- 此迁移文件创建了平台的核心数据表结构：
-- 1. 用户表 (users) - 扩展默认auth.users表
-- 2. 学习会话表 (learning_sessions) - 对应 LearningSession 类型
-- 3. 对话消息表 (chat_messages) - 对应 ChatMessage 类型  
-- 4. 学习卡片表 (learning_cards) - 对应 LearningCard 类型
-- 5. 配置相应的RLS策略确保数据安全

-- ================================
-- 1. 扩展用户表
-- ================================

CREATE TABLE IF NOT EXISTS public.users (
    -- 基础字段
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    
    -- 订阅相关字段 (为未来商业化准备)
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
    subscription_expires_at TIMESTAMPTZ,
    subscription_features JSONB DEFAULT '{}',
    
    -- 用户偏好设置
    preferences JSONB DEFAULT '{
        "defaultLearningLevel": "beginner",
        "theme": "light", 
        "language": "zh",
        "soundEnabled": true,
        "autoSave": true
    }',
    
    -- 统计字段
    total_sessions INTEGER DEFAULT 0,
    total_cards INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建用户名索引
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ================================
-- 2. 学习会话表
-- ================================

CREATE TABLE IF NOT EXISTS public.learning_sessions (
    -- 基础字段
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    
    -- 会话基本信息
    title TEXT NOT NULL,
    document_content TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('url', 'pdf', 'word', 'ppt', 'markdown', 'text')),
    
    -- 学习配置
    learning_level TEXT NOT NULL CHECK (learning_level IN ('beginner', 'expert')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
    
    -- 大纲和进度
    outline JSONB DEFAULT '[]',
    current_chapter TEXT,
    progress JSONB DEFAULT '{}',
    
    -- 统计信息
    message_count INTEGER DEFAULT 0,
    card_count INTEGER DEFAULT 0,
    completion_percentage FLOAT DEFAULT 0.0,
    
    -- 时间戳  
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON public.learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_updated_at ON public.learning_sessions(updated_at DESC);

-- ================================
-- 3. 对话消息表
-- ================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
    -- 基础字段
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE NOT NULL,
    
    -- 消息内容
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- 关联信息
    chapter_id TEXT,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    card_id UUID, -- 将在创建learning_cards表后添加外键约束
    
    -- 元数据
    metadata JSONB DEFAULT '{}',
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chapter_id ON public.chat_messages(chapter_id);

-- ================================
-- 4. 学习卡片表
-- ================================

CREATE TABLE IF NOT EXISTS public.learning_cards (
    -- 基础字段
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    
    -- 卡片内容
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_note TEXT,
    
    -- 卡片分类
    type TEXT NOT NULL CHECK (type IN ('inspiration', 'bookmark')),
    tags TEXT[] DEFAULT '{}',
    chapter_id TEXT,
    
    -- 复习相关 (艾宾浩斯遗忘曲线算法)
    difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    review_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_learning_cards_user_id ON public.learning_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_session_id ON public.learning_cards(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_next_review_at ON public.learning_cards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_learning_cards_tags ON public.learning_cards USING GIN(tags);

-- 添加chat_messages表的外键约束
ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_card_id 
FOREIGN KEY (card_id) REFERENCES public.learning_cards(id) ON DELETE SET NULL;

-- ================================
-- 5. 触发器函数 - 自动更新时间戳
-- ================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加updated_at触发器
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_learning_sessions_updated_at
    BEFORE UPDATE ON public.learning_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_learning_cards_updated_at
    BEFORE UPDATE ON public.learning_cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ================================
-- 6. 触发器函数 - 统计数据自动更新
-- ================================

-- 会话消息计数更新函数
CREATE OR REPLACE FUNCTION public.update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.learning_sessions 
        SET message_count = message_count + 1 
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.learning_sessions 
        SET message_count = message_count - 1 
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 会话卡片计数更新函数
CREATE OR REPLACE FUNCTION public.update_session_card_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.learning_sessions 
        SET card_count = card_count + 1 
        WHERE id = NEW.session_id;
        
        UPDATE public.users 
        SET total_cards = total_cards + 1 
        WHERE id = NEW.user_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.learning_sessions 
        SET card_count = card_count - 1 
        WHERE id = OLD.session_id;
        
        UPDATE public.users 
        SET total_cards = total_cards - 1 
        WHERE id = OLD.user_id;
        
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 用户会话计数更新函数
CREATE OR REPLACE FUNCTION public.update_user_session_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.users 
        SET total_sessions = total_sessions + 1 
        WHERE id = NEW.user_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.users 
        SET total_sessions = total_sessions - 1 
        WHERE id = OLD.user_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trigger_update_session_message_count
    AFTER INSERT OR DELETE ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_session_message_count();

CREATE TRIGGER trigger_update_session_card_count
    AFTER INSERT OR DELETE ON public.learning_cards
    FOR EACH ROW EXECUTE FUNCTION public.update_session_card_count();

CREATE TRIGGER trigger_update_user_session_count
    AFTER INSERT OR DELETE ON public.learning_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_user_session_count();

-- ================================
-- 7. RLS (行级安全) 策略
-- ================================

-- 启用所有表的RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_cards ENABLE ROW LEVEL SECURITY;

-- 用户表策略：用户只能访问自己的数据
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 学习会话表策略：用户只能访问自己的会话
CREATE POLICY "sessions_all_own" ON public.learning_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 对话消息表策略：用户只能访问自己会话的消息
CREATE POLICY "messages_all_own" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.learning_sessions 
            WHERE id = chat_messages.session_id 
            AND user_id = auth.uid()
        )
    );

-- 学习卡片表策略：用户只能访问自己的卡片
CREATE POLICY "cards_all_own" ON public.learning_cards
    FOR ALL USING (auth.uid() = user_id);

-- ================================
-- 8. 辅助函数
-- ================================

-- 创建用户档案函数 (注册时自动调用)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, username)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册时自动创建档案
CREATE TRIGGER trigger_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 获取用户统计信息函数
CREATE OR REPLACE FUNCTION public.get_user_stats(user_uuid UUID)
RETURNS TABLE (
    total_sessions INTEGER,
    total_cards INTEGER,
    total_messages INTEGER,
    cards_due_review INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.total_sessions,
        u.total_cards,
        COALESCE(
            (SELECT SUM(ls.message_count) 
             FROM public.learning_sessions ls 
             WHERE ls.user_id = user_uuid), 
            0
        )::INTEGER as total_messages,
        COALESCE(
            (SELECT COUNT(*)
             FROM public.learning_cards lc 
             WHERE lc.user_id = user_uuid 
             AND lc.next_review_at <= NOW()),
            0
        )::INTEGER as cards_due_review
    FROM public.users u
    WHERE u.id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================
-- 迁移完成
-- ================================

-- 提交说明
COMMENT ON SCHEMA public IS 'AI私教学习平台数据库架构 v1.0 - 支持用户管理、学习会话、对话记录和学习卡片功能';