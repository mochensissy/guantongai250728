-- ================================
-- 步骤1：创建基础表结构
-- ================================

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    avatar_url TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'team')),
    subscription_expires_at TIMESTAMPTZ,
    subscription_features JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{
        "defaultLearningLevel": "beginner",
        "theme": "light", 
        "language": "zh",
        "soundEnabled": true,
        "autoSave": true
    }',
    total_sessions INTEGER DEFAULT 0,
    total_cards INTEGER DEFAULT 0,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建学习会话表
CREATE TABLE IF NOT EXISTS public.learning_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    document_content TEXT,
    document_type TEXT NOT NULL CHECK (document_type IN ('url', 'pdf', 'word', 'ppt', 'markdown', 'text')),
    learning_level TEXT NOT NULL CHECK (learning_level IN ('beginner', 'expert')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'paused')),
    outline JSONB DEFAULT '[]',
    current_chapter TEXT,
    progress JSONB DEFAULT '{}',
    message_count INTEGER DEFAULT 0,
    card_count INTEGER DEFAULT 0,
    completion_percentage FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 创建对话消息表
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    chapter_id TEXT,
    is_bookmarked BOOLEAN DEFAULT FALSE,
    card_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创建学习卡片表
CREATE TABLE IF NOT EXISTS public.learning_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    session_id UUID REFERENCES public.learning_sessions(id) ON DELETE CASCADE NOT NULL,
    message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_note TEXT,
    type TEXT NOT NULL CHECK (type IN ('inspiration', 'bookmark')),
    tags TEXT[] DEFAULT '{}',
    chapter_id TEXT,
    difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
    review_count INTEGER DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    next_review_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 完成提示
SELECT 'Step 1: Tables created successfully!' as result;