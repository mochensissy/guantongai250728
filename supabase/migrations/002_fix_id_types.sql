-- ================================
-- 修复ID字段类型 - 从UUID改为TEXT
-- ================================
-- 
-- 将所有自定义ID字段从UUID类型改为TEXT类型
-- 这样可以支持现有的ID生成逻辑（timestamp + random string）

-- 1. 修改 learning_cards 表的ID字段
ALTER TABLE public.learning_cards ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.learning_cards ALTER COLUMN id DROP DEFAULT;

-- 2. 修改 learning_sessions 表的ID字段  
ALTER TABLE public.learning_sessions ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.learning_sessions ALTER COLUMN id DROP DEFAULT;

-- 3. 修改 chat_messages 表的ID字段
ALTER TABLE public.chat_messages ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN id DROP DEFAULT;

-- 4. 修改外键字段类型
ALTER TABLE public.learning_cards ALTER COLUMN session_id TYPE TEXT;
ALTER TABLE public.learning_cards ALTER COLUMN message_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN session_id TYPE TEXT;
ALTER TABLE public.chat_messages ALTER COLUMN card_id TYPE TEXT;

-- 5. 重新创建外键约束
ALTER TABLE public.learning_cards DROP CONSTRAINT IF EXISTS learning_cards_session_id_fkey;
ALTER TABLE public.learning_cards DROP CONSTRAINT IF EXISTS learning_cards_message_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_session_id_fkey;
ALTER TABLE public.chat_messages DROP CONSTRAINT IF EXISTS fk_chat_messages_card_id;

-- 重新添加外键约束
ALTER TABLE public.learning_cards 
ADD CONSTRAINT learning_cards_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.learning_cards 
ADD CONSTRAINT learning_cards_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.chat_messages(id) ON DELETE SET NULL;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_session_id_fkey 
FOREIGN KEY (session_id) REFERENCES public.learning_sessions(id) ON DELETE CASCADE;

ALTER TABLE public.chat_messages 
ADD CONSTRAINT fk_chat_messages_card_id 
FOREIGN KEY (card_id) REFERENCES public.learning_cards(id) ON DELETE SET NULL;

-- 6. 创建索引
DROP INDEX IF EXISTS idx_learning_cards_session_id;
DROP INDEX IF EXISTS idx_chat_messages_session_id;

CREATE INDEX idx_learning_cards_session_id ON public.learning_cards(session_id);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);