-- Disable RLS for tables before dropping policies and tables
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;

-- Drop RLS policies for messages table
DROP POLICY IF EXISTS "Allow participants to view messages" ON public.messages;
DROP POLICY IF EXISTS "Allow participants to insert messages" ON public.messages;
DROP POLICY IF EXISTS "Allow participants to update own messages" ON public.messages;
DROP POLICY IF EXISTS "Allow participants to delete own messages" ON public.messages;

-- Drop RLS policies for conversation_participants table
DROP POLICY IF EXISTS "Allow participants to view conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow participants to insert conversation participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "Allow participants to delete conversation participants" ON public.conversation_participants;

-- Drop RLS policies for conversations table
DROP POLICY IF EXISTS "Allow participants to view conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow participants to insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow participants to update conversations" ON public.conversations;
DROP POLICY IF EXISTS "Allow participants to delete conversations" ON public.conversations;

-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversation_participants CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- Drop the RPC function if it exists
DROP FUNCTION IF EXISTS public.get_or_create_private_chat(user_id_1 uuid, user_id_2 uuid);

-- Re-enable RLS for other tables if they were temporarily disabled (though this script only targets chat tables)
-- This is a safeguard, assuming other tables' RLS was not explicitly disabled by this script.
-- If you have other tables with RLS, ensure they are re-enabled if they were affected.