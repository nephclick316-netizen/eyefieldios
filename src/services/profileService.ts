import { supabase } from '../utils/supabaseClient';
import { User, BusinessDetails } from '../types';
import { withTimeout, queryCache } from '../utils/queryUtils';

const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, bio, gender, phone_number, business_details, is_verified';

export const profileService = {
  async getProfile(userId: string): Promise<User | null> {
    if (!userId) return null;
    
    const cacheKey = `profile_${userId}`;
    const cached = queryCache.get<User>(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await withTimeout(
        (supabase
          .from('profiles')
          .select(PROFILE_COLUMNS)
          .eq('id', userId)
          .maybeSingle()) as any,
        12000,
        'getProfile'
      );

      if (error) {
        console.error(`[ProfileService] Error for ${userId}:`, error.message);
        return null;
      }
      
      if (!data) return null;

      const profile: User = {
        id: data.id,
        username: data.username || 'user_' + data.id.slice(0, 5),
        displayName: data.display_name || 'EyeField Member',
        avatar: data.avatar_url || 'https://picsum.photos/seed/default/200/200',
        bio: data.bio,
        gender: data.gender,
        phoneNumber: data.phone_number,
        businessDetails: data.business_details as BusinessDetails,
        isVerified: data.is_verified
      };

      queryCache.set(cacheKey, profile);
      return profile;
    } catch (err) {
      console.warn(`[ProfileService] Fetch timed out or failed for ${userId}`);
      return null;
    }
  },

  async getAllUsers(page: number = 0, limit: number = 20): Promise<User[]> {
    try {
      const { data, error } = await withTimeout(
        (supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .order('created_at', { ascending: false })
          .range(page * limit, (page + 1) * limit - 1)) as any,
        15000,
        'getAllUsers'
      );

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        username: d.username,
        displayName: d.display_name,
        avatar: d.avatar_url || 'https://picsum.photos/seed/default/200/200',
        isVerified: d.is_verified
      }));
    } catch (e) {
      return [];
    }
  },

  async getUsersByRegion(countryCode: string, page: number = 0, limit: number = 20): Promise<User[]> {
    try {
      const { data, error } = await withTimeout(
        (supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .like('phone_number', `${countryCode}%`)
          .order('created_at', { ascending: false })
          .range(page * limit, (page + 1) * limit - 1)) as any,
        15000,
        'getUsersByRegion'
      );

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        username: d.username,
        displayName: d.display_name,
        avatar: d.avatar_url || 'https://picsum.photos/seed/default/200/200',
        isVerified: d.is_verified
      }));
    } catch (e) {
      return [];
    }
  },

  async searchUsers(query: string, page: number = 0, limit: number = 20): Promise<User[]> {
    if (!query.trim()) return [];
    try {
      const { data, error } = await withTimeout(
        (supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .or(`display_name.ilike.%${query}%,username.ilike.%${query}%`)
          .order('created_at', { ascending: false })
          .range(page * limit, (page + 1) * limit - 1)) as any,
        15000,
        'searchUsers'
      );

      if (error) throw error;
      return (data || []).map((d: any) => ({
        id: d.id,
        username: d.username,
        displayName: d.display_name,
        avatar: d.avatar_url || 'https://picsum.photos/seed/default/200/200',
        isVerified: d.is_verified
      }));
    } catch (e) {
      return [];
    }
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { error } = await withTimeout(
      (supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: updates.username,
          display_name: updates.displayName,
          avatar_url: updates.avatar,
          bio: updates.bio,
          gender: updates.gender,
          phone_number: updates.phoneNumber,
          business_details: updates.businessDetails,
          updated_at: new Date()
        }, { onConflict: 'id' })) as any,
      15000,
      'updateProfile'
    );
    if (error) throw new Error(error.message);
    queryCache.invalidate(`profile_${userId}`);
    return { error: null };
  },
};