import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

// Log status to console for debugging (only in development or if placeholders are detected)
if (typeof window !== 'undefined' && SUPABASE_URL.includes('placeholder')) {
  console.error("🚨 EyeField Error: Supabase environment variables are missing at runtime. Please check your Cloudflare dashboard settings and redeploy.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const checkConnection = async () => {
  if (SUPABASE_URL.includes('placeholder')) {
    return { success: false, error: "Environment variables not set" };
  }
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn("Supabase connection check failed:", err);
    return { success: false, error: err.message };
  }
};

export const supabaseAdmin = supabase;