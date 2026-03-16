import { createClient } from '@supabase/supabase-js';

// Use the integrated credentials directly to ensure connection
const SUPABASE_URL = "https://ftazgdijrbmbkrgcbuas.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YXpnZGlqcmJtYmtyZ2NidWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTk4NzcsImV4cCI6MjA4NzM3NTg3N30.tjT66l6HsHsxa3UpRL1EQNRM_S-unJu-Gxs0ikrC7U4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Supabase connection check failed:", err);
    return false;
  }
};

export const supabaseAdmin = supabase; // Fallback for client-side