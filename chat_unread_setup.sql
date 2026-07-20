-- 1. Ensure the messages table has the is_read column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

-- 2. Create an index to make counting unread messages extremely fast
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, sender_id, is_read) WHERE is_read = false;

-- 3. Create a helper function to get the total unread count for a user across all chats
CREATE OR REPLACE FUNCTION get_total_unread_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_unread INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO total_unread
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = p_user_id
      AND m.sender_id != p_user_id
      AND m.is_read = false;
      
    RETURN COALESCE(total_unread, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Create a helper function to get unread count for a specific conversation
CREATE OR REPLACE FUNCTION get_conversation_unread_count(p_conversation_id UUID, p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    unread_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unread_count
    FROM messages
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_user_id
      AND is_read = false;
      
    RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql;