import { supabase } from '../utils/supabaseClient';
import { User } from '../types';
import { withTimeout } from '../utils/queryUtils';
import { profileService } from './profileService';
import { notificationService } from './notificationService';

export const followService = {
  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await withTimeout(
      (supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })) as any,
      10000,
      'getFollowers'
    );

    if (error) throw new Error(error.message);
    const followerProfiles = await Promise.all((data || []).map(async (item: any) => {
      return await profileService.getProfile(item.follower_id);
    }));
    return followerProfiles.filter((p): p is User => p !== null);
  },

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await withTimeout(
      (supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })) as any,
      10000,
      'getFollowing'
    );

    if (error) throw new Error(error.message);
    const followingProfiles = await Promise.all((data || []).map(async (item: any) => {
      return await profileService.getProfile(item.following_id);
    }));
    return followingProfiles.filter((p): p is User => p !== null);
  },

  async followUser(followerId: string, followingId: string) {
    const { error } = await withTimeout(
      (supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })) as any,
      10000,
      'followUser'
    );
    if (error) throw new Error(error.message);

    // Trigger Notification
    await notificationService.createNotification({
      userId: followingId,
      actorId: followerId,
      type: 'follow'
    });
  },

  async unfollowUser(followerId: string, followingId: string) {
    const { error } = await withTimeout(
      (supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)) as any,
      10000,
      'unfollowUser'
    );
    if (error) throw new Error(error.message);
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await withTimeout(
      (supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .maybeSingle()) as any,
      10000,
      'isFollowing'
    );
    return !!data;
  },
};