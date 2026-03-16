import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { User } from '../types';

export const adminService = {
  async getGlobalStats() {
    const [users, echoes, products, pulses] = await Promise.all([
      withTimeout(supabase.from('profiles').select('id', { count: 'exact', head: true }) as any, 10000, 'getGlobalStats_users'),
      withTimeout(supabase.from('echoes').select('id', { count: 'exact', head: true }) as any, 10000, 'getGlobalStats_echoes'),
      withTimeout(supabase.from('products').select('id', { count: 'exact', head: true }) as any, 10000, 'getGlobalStats_products'),
      withTimeout(supabase.from('pulses').select('id', { count: 'exact', head: true }) as any, 10000, 'getGlobalStats_pulses')
    ]);

    return {
      totalUsers: users?.count || 0,
      totalEchoes: echoes?.count || 0,
      totalProducts: products?.count || 0,
      totalPulses: pulses?.count || 0
    };
  },

  async getAllUsers(page: number = 0, limit: number = 50): Promise<User[]> {
    const { data, error } = await withTimeout(
      (supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1)) as any,
      10000,
      'admin_getAllUsers'
    );

    if (error) throw new Error(error.message);
    return (data || []).map((d: any) => ({
      id: d.id,
      username: d.username,
      displayName: d.display_name,
      avatar: d.avatar_url || 'https://picsum.photos/seed/default/200/200',
      isVerified: d.is_verified,
      phoneNumber: d.phone_number,
      bio: d.bio
    }));
  },

  async deleteUser(userId: string) {
    // Note: In a real app, this would likely be a Supabase Edge Function 
    // to handle auth.admin.deleteUser() securely.
    const { error } = await withTimeout(
      (supabase.from('profiles').delete().eq('id', userId)) as any,
      10000,
      'admin_deleteUser'
    );
    if (error) throw new Error(error.message);
  },

  async toggleVerification(userId: string, status: boolean) {
    const { error } = await withTimeout(
      (supabase.from('profiles').update({ is_verified: status }).eq('id', userId)) as any,
      10000,
      'admin_toggleVerification'
    );
    if (error) throw new Error(error.message);
  }
};