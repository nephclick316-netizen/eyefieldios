-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;
DROP POLICY IF EXISTS "Participants can delete messages" ON messages;

-- Create a new policy allowing any participant of the conversation to delete a message
CREATE POLICY "Participants can delete messages" ON messages
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        WHERE cp.conversation_id = messages.conversation_id
        AND cp.user_id = auth.uid()
    )
);