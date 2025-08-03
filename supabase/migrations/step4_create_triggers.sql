-- ================================
-- 步骤4：创建触发器
-- ================================

-- 时间戳更新触发器
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_learning_sessions_updated_at
    BEFORE UPDATE ON public.learning_sessions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_learning_cards_updated_at
    BEFORE UPDATE ON public.learning_cards
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 统计数据更新触发器
CREATE TRIGGER trigger_update_session_message_count
    AFTER INSERT OR DELETE ON public.chat_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_session_message_count();

CREATE TRIGGER trigger_update_session_card_count
    AFTER INSERT OR DELETE ON public.learning_cards
    FOR EACH ROW EXECUTE FUNCTION public.update_session_card_count();

CREATE TRIGGER trigger_update_user_session_count
    AFTER INSERT OR DELETE ON public.learning_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_user_session_count();

-- 用户注册触发器
CREATE TRIGGER trigger_handle_new_user
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 完成提示
SELECT 'Step 4: Triggers created successfully!' as result;