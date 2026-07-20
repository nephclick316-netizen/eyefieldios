-- SQL to create client_telemetry table in Supabase
-- Run this in your Supabase SQL editor as a project owner

CREATE TABLE IF NOT EXISTS public.client_telemetry (
  id bigserial PRIMARY KEY,
  user_id text,
  permission_denied_count integer,
  wake_failures integer,
  ts bigint
);
