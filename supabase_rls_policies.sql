-- RLS for messages table
DROP POLICY IF EXISTS "Users can read messages in their conversations" ON public.messages;
CREATE POLICY "Users can read messages in their conversations" ON public.messages
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.messages;
CREATE POLICY "Users can insert messages into their conversations" ON public.messages
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
  )
  AND messages.sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
CREATE POLICY "Users can update their own messages" ON public.messages
FOR UPDATE USING (messages.sender_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;
CREATE POLICY "Users can delete their own messages" ON public.messages
FOR DELETE USING (messages.sender_id = auth.uid());

-- RLS for message_reads table
DROP POLICY IF EXISTS "Users can read their own message_reads" ON public.message_reads;
CREATE POLICY "Users can read their own message_reads" ON public.message_reads
FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own message_reads" ON public.message_reads;
CREATE POLICY "Users can insert their own message_reads" ON public.message_reads
FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own message_reads" ON public.message_reads;
CREATE POLICY "Users can delete their own message_reads" ON public.message_reads
FOR DELETE USING (user_id = auth.uid());