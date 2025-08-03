-- ================================
-- 步骤3：创建触发器函数 (简化版)
-- ================================

-- 自动更新时间戳函数
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- 用户注册时自动创建档案函数
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

-- 完成提示
SELECT 'Step 3: Functions created successfully!' as result;