-- Migration: Enable Realtime for call_logs table
-- This allows the WebApp to receive instant incoming call events via Supabase Realtime.

ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
