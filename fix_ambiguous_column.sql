-- Drop the existing ambiguous function
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID);

-- Recreate with a non-ambiguous return column name
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user1_id UUID, p_user2_id UUID)
RETURNS TABLE(chat_id UUID) AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Check if a conversation already exists between the two users
    SELECT cp1.conversation_id
    INTO v_conversation_id
    FROM public.conversation_participants cp1
    WHERE cp1.user_id = p_user1_id
      AND EXISTS (
        SELECT 1
        FROM public.conversation_participants cp2
        WHERE cp2.conversation_id = cp1.conversation_id
          AND cp2.user_id = p_user2_id
      )
    LIMIT 1;

    -- If no conversation exists, create a new one
    IF v_conversation_id IS NULL THEN
        INSERT INTO public.conversations DEFAULT VALUES RETURNING id INTO v_conversation_id;
        
        -- Insert participants cleanly without ambiguous column names interfering with ON CONFLICT
        INSERT INTO public.conversation_participants (conversation_id, user_id) 
        VALUES (v_conversation_id, p_user1_id) 
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
        
        INSERT INTO public.conversation_participants (conversation_id, user_id) 
        VALUES (v_conversation_id, p_user2_id) 
        ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    -- Return the ID explicitly as our new unique return column
    RETURN QUERY SELECT v_conversation_id AS chat_id;
END;
$$ LANGUAGE plpgsql;
