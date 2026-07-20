-- 1. ADD NEW COLUMNS TO MESSAGES TABLE
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_forwarded') THEN
        ALTER TABLE public.messages ADD COLUMN is_forwarded BOOLEAN DEFAULT false NOT NULL;
    END IF;
    
    -- Support an array of media URLs for multiple images
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='media_urls') THEN
        ALTER TABLE public.messages ADD COLUMN media_urls TEXT[] DEFAULT '{}'::TEXT[];
    END IF;
END $$;


-- 2. CREATE STORAGE BUCKETS
-- Create the chat_media bucket (for images, videos, documents)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_media', 'chat_media', true)
ON CONFLICT (id) DO NOTHING;

-- Create the chat_audio bucket (for voice notes)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat_audio', 'chat_audio', true)
ON CONFLICT (id) DO NOTHING;


-- 3. STORAGE POLICIES FOR chat_media
-- Allow authenticated users to view media
CREATE POLICY "Anyone can view chat media" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat_media' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload media
CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'chat_media' AND auth.role() = 'authenticated');

-- Allow users to delete their own media
CREATE POLICY "Users can delete own media" ON storage.objects
    FOR DELETE USING (bucket_id = 'chat_media' AND auth.uid() = owner);


-- 4. STORAGE POLICIES FOR chat_audio
-- Allow authenticated users to view audio
CREATE POLICY "Anyone can view chat audio" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat_audio' AND auth.role() = 'authenticated');

-- Allow authenticated users to upload audio
CREATE POLICY "Authenticated users can upload audio" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'chat_audio' AND auth.role() = 'authenticated');

-- Allow users to delete their own audio
CREATE POLICY "Users can delete own audio" ON storage.objects
    FOR DELETE USING (bucket_id = 'chat_audio' AND auth.uid() = owner);
