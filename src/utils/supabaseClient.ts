import { createClient } from '@supabase/supabase-js';

// Use placeholders during build time to prevent crashes
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const checkConnection = async () => {
  if (SUPABASE_URL.includes('placeholder')) {
    console.warn("Supabase environment variables are missing.");
    return false;
  }
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (err) {
    console.warn("Supabase connection check failed:", err);
    return false;
  }
};

export const supabaseAdmin = supabase;