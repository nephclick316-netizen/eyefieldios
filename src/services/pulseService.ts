import { supabase } from '../utils/supabaseClient';
import { Pulse } from '../types';
import { withTimeout } from '../utils/queryUtils';
import { profileService } from './profileService';
import { notificationService } from './notificationService';
import { cacheUtils } from '../utils/cacheUtils';

export const pulseService = {
  async getPulses(): Promise<Pulse[]> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log("pulseService: Fetching pulses since", twentyFourHoursAgo);

    const { data, error } = await withTimeout(
      (supabase
        .from('pulses')
        .select('*, pulse_likes(count), pulse_comments(count)')
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false })) as any,
      10000,
      'getPulses'
    );

    if (error) {
      console.error("pulseService: getPulses error", error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      console.log("pulseService: No pulses found in last 24h");
      return [];
    }

    // Bulk fetch profiles
    const userIds = [...new Set(data.map(p => p.user_id))];
    const { data: profilesData } = await supabase.from('profiles').select('id, username, display_name, avatar_url, is_verified').in('id', userIds);
    const profilesMap = new Map((profilesData || []).map(p => [p.id, p]));

    const pulsesData = data.map((p: any) => {
      const prof = profilesMap.get(p.user_id);
      const userProfile = prof ? {
        id: prof.id,
        username: prof.username,
        displayName: prof.display_name,
        avatar: prof.avatar_url || 'https://picsum.photos/seed/default/200/200',
        isVerified: prof.is_verified
      } : { id: p.user_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' };

      return {
        id: p.id,
        user: userProfile,
        mediaUrl: p.media_url,
        type: p.type,
        createdAt: p.created_at,
        likes: p.pulse_likes?.[0]?.count || 0,
        comments: p.pulse_comments?.[0]?.count || 0,
        transform: p.transform,
        caption: p.caption
      };
    });
    return pulsesData;
  },

  async createPulse(userId: string, mediaUrl: string, type: 'image' | 'video', caption: string, transform?: any) {
    const { error } = await withTimeout(
      (supabase.from('pulses').insert({
        user_id: userId,
        media_url: mediaUrl,
        type,
        caption,
        transform
      })) as any,
      10000,
      'createPulse'
    );
    if (error) throw new Error(error.message);
  },

  async deletePulse(pulseId: string) {
    const { error } = await withTimeout(
      (supabase.from('pulses').delete().eq('id', pulseId)) as any,
      10000,
      'deletePulse'
    );
    if (error) throw new Error(error.message);

    // Update global caches to prevent deleted pulses from reappearing
    cacheUtils.removeByPredicate('cached_pulses', (p: any) => p.id !== pulseId);
    cacheUtils.removeByPredicate('user_pulses_', (p: any) => p.id !== pulseId);
  },

  async togglePulseLike(pulseId: string, userId: string) {
    const { data: existing } = await withTimeout(
      (supabase
        .from('pulse_likes')
        .select('id')
        .eq('pulse_id', pulseId)
        .eq('user_id', userId)
        .maybeSingle()) as any,
      10000,
      'checkPulseLike'
    );

    if (existing) {
      await withTimeout(supabase.from('pulse_likes').delete().eq('id', existing.id) as any, 10000, 'removePulseLike');
    } else {
      await withTimeout(supabase.from('pulse_likes').insert({ pulse_id: pulseId, user_id: userId }) as any, 10000, 'addPulseLike');

      // Trigger Notification
      const { data: pulseData } = await withTimeout(supabase.from('pulses').select('user_id').eq('id', pulseId).single() as any, 10000, 'getPulseAuthor');
      if (pulseData) {
        await notificationService.createNotification({
          userId: pulseData.user_id,
          actorId: userId,
          type: 'pulse_like',
          contentId: pulseId
        });
      }
    }
  },

  async getPulseComments(pulseId: string) {
    const { data, error } = await withTimeout(
      (supabase
        .from('pulse_comments')
        .select('*, user_id')
        .eq('pulse_id', pulseId)
        .order('created_at', { ascending: true })) as any,
      10000,
      'getPulseComments'
    );
    if (error) throw new Error(error.message);

    const commentsWithProfiles = await Promise.all((data || []).map(async (c: any) => {
      const userProfile = await profileService.getProfile(c.user_id);
      return {
        ...c,
        profiles: userProfile || { id: c.user_id, username: 'unknown', avatar_url: 'https://picsum.photos/seed/default/200/200' }
      };
    }));
    return commentsWithProfiles;
  },

  async addPulseComment(pulseId: string, userId: string, text: string) {
    const { error } = await withTimeout(
      (supabase.from('pulse_comments').insert({
        pulse_id: pulseId,
        user_id: userId,
        text
      })) as any,
      10000,
      'addPulseComment'
    );
    if (error) throw new Error(error.message);

    // Trigger Notification
    const { data: pulseData } = await withTimeout(supabase.from('pulses').select('user_id').eq('id', pulseId).single() as any, 10000, 'getPulseAuthorComment');
    if (pulseData) {
      await notificationService.createNotification({
        userId: pulseData.user_id,
        actorId: userId,
        type: 'pulse_comment',
        contentId: pulseId,
        message: text
      });
    }
  },
};