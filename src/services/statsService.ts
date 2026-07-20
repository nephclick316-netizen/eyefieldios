import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

export const statsService = {
  async getProfileStats(userId: string) {
    const [echoes, followers, following] = await Promise.all([
      withTimeout(supabase.from('echoes').select('id', { count: 'exact', head: true }).eq('user_id', userId) as any, 10000, 'getProfileStats_echoes'),
      withTimeout(supabase.from('follows').select('id', { count: 'exact', head: true }).eq('following_id', userId) as any, 10000, 'getProfileStats_followers'),
      withTimeout(supabase.from('follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId) as any, 10000, 'getProfileStats_following')
    ]);

    return {
      echoes: echoes?.count || 0,
      followers: followers?.count || 0,
      following: following?.count || 0
    };
  },
};