-- Function to get the total unread message count for a specific user
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
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
      
    RETURN total_unread;
END;
$$ LANGUAGE plpgsql;