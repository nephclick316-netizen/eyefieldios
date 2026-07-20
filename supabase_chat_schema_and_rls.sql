-- Enable the pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Table for conversations
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table for conversation participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (conversation_id, user_id)
);

-- Table for messages
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT,
    media_url TEXT,
    message_type TEXT DEFAULT 'text' NOT NULL,
    location_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Table for message read receipts
CREATE TABLE IF NOT EXISTS public.message_reads (
    message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    PRIMARY KEY (message_id, user_id)
);

-- Function to update conversation's updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation's updated_at on new messages
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON public.messages;
CREATE TRIGGER update_conversation_timestamp_trigger
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- RPC to get or create a conversation
DROP FUNCTION IF EXISTS public.get_or_create_conversation(UUID, UUID);
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(p_user1_id UUID, p_user2_id UUID)
RETURNS TABLE(conversation_id UUID) AS $$
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
        -- Insert participants with ON CONFLICT DO NOTHING to handle potential race conditions
        INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (v_conversation_id, p_user1_id) ON CONFLICT (conversation_id, user_id) DO NOTHING;
        INSERT INTO public.conversation_participants (conversation_id, user_id) VALUES (v_conversation_id, p_user2_id) ON CONFLICT (conversation_id, user_id) DO NOTHING;
    END IF;

    RETURN QUERY SELECT v_conversation_id;
END;
$$ LANGUAGE plpgsql;