import { supabase } from '../utils/supabaseClient';
import { Echo } from '../types';
import { withTimeout } from '../utils/queryUtils';
import { profileService } from './profileService';
import { notificationService } from './notificationService';
import { storageService } from './storageService';
import { cacheUtils } from '../utils/cacheUtils';

const ECHO_COLUMNS = 'id, type, content, media_url, created_at, transform, user_id';
const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, is_verified';

export const echoService = {
  async getEchoes(page: number = 0, limit: number = 10): Promise<{ data: Echo[], hasMore: boolean }> {
    const from = page * limit;
    const to = from + limit;

    const { data, error } = await withTimeout(
      (supabase
        .from('echoes')
        .select(`${ECHO_COLUMNS}, echo_likes(count), echo_comments(count)`)
        .order('created_at', { ascending: false })
        .range(from, to)) as any,
      30000,
      'getEchoes'
    );

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) return { data: [], hasMore: false };

    const hasMore = data.length > limit;
    const rawItems = data.slice(0, limit);

    const userIds = [...new Set(rawItems.map(e => e.user_id))];
    const { data: profilesData } = await supabase.from('profiles').select(PROFILE_COLUMNS).in('id', userIds);
    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

    const echoesData = rawItems.map((e: any) => {
      const p = profilesMap.get(e.user_id);
      const userProfile = p ? {
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatar: p.avatar_url || 'https://picsum.photos/seed/default/200/200',
        isVerified: p.is_verified
      } : { id: e.user_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' };

      return {
        id: e.id,
        user: userProfile,
        type: e.type,
        content: e.content,
        mediaUrl: e.media_url,
        likes: e.echo_likes?.[0]?.count || 0,
        comments: e.echo_comments?.[0]?.count || 0,
        timestamp: new Date(e.created_at).toLocaleDateString(),
        tags: [],
        transform: e.transform
      };
    });

    return { data: echoesData, hasMore };
  },

  async getUserEchoes(userId: string, page: number = 0, limit: number = 12): Promise<{ data: Echo[], hasMore: boolean }> {
    const from = page * limit;
    const to = from + limit;
    const { data, error } = await withTimeout(
      (supabase
        .from('echoes')
        .select(`${ECHO_COLUMNS}, echo_likes(count), echo_comments(count)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to)) as any,
      30000,
      'getUserEchoes'
    );

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return { data: [], hasMore: false };

    const hasMore = data.length > limit;
    const rawItems = data.slice(0, limit);

    const userProfile = await profileService.getProfile(userId);

    const echoesData = rawItems.map((e: any) => {
      return {
        id: e.id,
        user: userProfile || { id: e.user_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' },
        type: e.type,
        content: e.content,
        mediaUrl: e.media_url,
        likes: e.echo_likes?.[0]?.count || 0,
        comments: e.echo_comments?.[0]?.count || 0,
        timestamp: new Date(e.created_at).toLocaleDateString(),
        tags: [],
        transform: e.transform
      };
    });
    return { data: echoesData, hasMore };
  },

  // Fixed: Added 'video' to the type parameter
  async createEcho(userId: string, content: string, type: 'text' | 'image' | 'video', mediaUrl?: string, transform?: any) {
    const { error } = await withTimeout(
      (supabase.from('echoes').insert({
        user_id: userId,
        content,
        type,
        media_url: mediaUrl,
        transform
      })) as any,
      30000,
      'createEcho'
    );
    if (error) throw new Error(error.message);
  },

  async deleteEcho(echoId: string) {
    const { data: echo } = await supabase
      .from('echoes')
      .select('media_url')
      .eq('id', echoId)
      .single();

    if (echo?.media_url) {
      await storageService.deleteFile(echo.media_url);
    }

    const { error } = await withTimeout(
      (supabase.from('echoes').delete().eq('id', echoId)) as any,
      30000,
      'deleteEcho'
    );
    if (error) throw new Error(error.message);

    // Update global caches to prevent deleted echoes from reappearing
    cacheUtils.removeByPredicate('cached_echoes', (e: any) => e.id !== echoId);
    cacheUtils.removeByPredicate('user_echoes_', (e: any) => e.id !== echoId);
  },

  async reportEcho(echoId: string, userId: string, reason: string) {
    const { error } = await withTimeout(
      (supabase.from('reports').insert({
        content_id: echoId,
        reporter_id: userId,
        reason,
        type: 'echo'
      })) as any,
      30000,
      'reportEcho'
    );
    return { success: !error };
  },

  async toggleLike(echoId: string, userId: string) {
    const { data: existing } = await withTimeout(
      (supabase
        .from('echo_likes')
        .select('id')
        .eq('echo_id', echoId)
        .eq('user_id', userId)
        .maybeSingle()) as any,
      30000,
      'checkLike'
    );

    if (existing) {
      await withTimeout(supabase.from('echo_likes').delete().eq('id', existing.id) as any, 30000, 'removeLike');
    } else {
      await withTimeout(supabase.from('echo_likes').insert({ echo_id: echoId, user_id: userId }) as any, 30000, 'addLike');

      const { data: echoData } = await withTimeout(supabase.from('echoes').select('user_id').eq('id', echoId).single() as any, 30000, 'getEchoAuthor');
      if (echoData) {
        await notificationService.createNotification({
          userId: echoData.user_id,
          actorId: userId,
          type: 'echo_like',
          contentId: echoId
        });
      }
    }
  },

  async getComments(echoId: string, page: number = 0, limit: number = 20) {
    const { data, error } = await withTimeout(
      (supabase
        .from('echo_comments')
        .select('id, text, created_at, user_id')
        .eq('echo_id', echoId)
        .order('created_at', { ascending: true })
        .range(page * limit, (page + 1) * limit - 1)) as any,
      30000,
      'getComments'
    );
    if (error) throw new Error(error.message);

    const commentsWithProfiles = await Promise.all((data || []).map(async (c: any) => {
      const userProfile = await profileService.getProfile(c.user_id);
      return {
        ...c,
        profiles: userProfile || { id: c.user_id, username: 'unknown', avatar_url: 'https://picsum.photos/seed/default/200/200' }
      };
    }));

    return { data: commentsWithProfiles, error: null };
  },

  async addComment(echoId: string, userId: string, text: string) {
    const { error } = await withTimeout(
      (supabase.from('echo_comments').insert({
        echo_id: echoId,
        user_id: userId,
        text
      })) as any,
      30000,
      'addComment'
    );
    if (error) throw new Error(error.message);

    const { data: echoData } = await withTimeout(supabase.from('echoes').select('user_id').eq('id', echoId).single() as any, 30000, 'getEchoAuthorComment');
    if (echoData) {
      await notificationService.createNotification({
        userId: echoData.user_id,
        actorId: userId,
        type: 'echo_comment',
        contentId: echoId,
        message: text
      });
    }
  },
};