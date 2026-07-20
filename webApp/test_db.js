import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const { data: users, error: uErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Profiles Error:", uErr);
  console.log("Profiles Data Count:", users?.length);
  if (users?.length > 0) console.log("Sample Profile:", users[0]);

  const { data: payments, error: pErr } = await supabase.from('platform_payments').select('*');
  console.log("Payments Error:", pErr);
  console.log("Payments Data Count:", payments?.length);
  if (payments?.length > 0) console.log("Payments Data:", payments);

  const { data: promos, error: prErr } = await supabase.from('promotional_cards').select('*');
  console.log("Promos Error:", prErr);
  console.log("Promos Data Count:", promos?.length);

  const { data: calls, error: cErr } = await supabase.from('call_logs').select('*');
  console.log("Calls Error:", cErr);
  console.log("Calls Data Count:", calls?.length);
}
test();
