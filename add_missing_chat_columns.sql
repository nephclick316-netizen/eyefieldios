-- Add missing columns to the messages table in case it was created
-- before these fields were added to the schema.
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' NOT NULL,
    ADD COLUMN IF NOT EXISTS location_data JSONB;

-- Force Supabase to reload its schema cache so it knows these columns exist
NOTIFY pgrst, 'reload schema';
