-- Migration: Create device_tokens table for FCM push notification support
-- This table stores each user's Firebase Cloud Messaging device token
-- so the backend can send real-time call wake-up notifications.

CREATE TABLE IF NOT EXISTS public.device_tokens (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token     TEXT NOT NULL,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)  -- one active token per user (latest wins via upsert)
);

-- Index for fast lookup by user_id
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);

-- Row-level security: users can only read/write their own token
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own device token"
    ON public.device_tokens
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role (edge functions) can read any token to send notifications
CREATE POLICY "Service role can read all device tokens"
    ON public.device_tokens
    FOR SELECT
    USING (auth.role() = 'service_role');
