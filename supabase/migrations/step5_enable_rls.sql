-- ================================
-- 步骤5：启用RLS并创建安全策略
-- ================================

-- 启用所有表的行级安全
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

-- 添加schema注释
COMMENT ON SCHEMA public IS 'AI私教学习平台数据库架构 v1.0 - 支持用户管理、学习会话、对话记录和学习卡片功能';

-- 完成提示
SELECT 'Step 5: RLS policies created successfully! Database setup complete!' as result;