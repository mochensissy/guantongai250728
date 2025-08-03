-- ================================
-- 步骤2：创建索引
-- ================================

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- 学习会话表索引
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_status ON public.learning_sessions(status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_updated_at ON public.learning_sessions(updated_at DESC);

-- 对话消息表索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_chapter_id ON public.chat_messages(chapter_id);

-- 学习卡片表索引
CREATE INDEX IF NOT EXISTS idx_learning_cards_user_id ON public.learning_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_session_id ON public.learning_cards(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_cards_next_review_at ON public.learning_cards(next_review_at);
CREATE INDEX IF NOT EXISTS idx_learning_cards_tags ON public.learning_cards USING GIN(tags);

-- 添加外键约束
ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_card_id 
FOREIGN KEY (card_id) REFERENCES public.learning_cards(id) ON DELETE SET NULL;

-- 完成提示
SELECT 'Step 2: Indexes created successfully!' as result;