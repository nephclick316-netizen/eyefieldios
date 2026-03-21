import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { profileService } from './profileService';
import { toast } from 'react-hot-toast';

export type NotificationType = 'follow' | 'echo_like' | 'echo_comment' | 'pulse_like' | 'pulse_comment' | 'system' | 'message' | 'product_rating' | 'product_comment';

export interface Notification {
  id: string;
  userId: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
  };
  type: NotificationType;
  contentId?: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}


export const notificationService = {
  async registerPush(userId: string) {
    // Native push notifications disabled in web mode
    console.log("Push notifications (native) disabled for user:", userId);
  },

  async getNotifications(userId: string, limit: number = 20): Promise<Notification[]> {
    const { data, error } = await withTimeout(
      (supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)) as any,
      30000,
      'getNotifications'
    );

    if (error) throw error;

    const notifications = await Promise.all((data || []).map(async (n: any) => {
      const actorProfile = await profileService.getProfile(n.actor_id);
      return {
        id: n.id,
        userId: n.user_id,
        actor: actorProfile || { id: n.actor_id, username: 'unknown', displayName: 'Unknown User', avatar: 'https://picsum.photos/seed/default/200/200' },
        type: n.type as NotificationType,
        contentId: n.content_id,
        message: n.message,
        isRead: n.is_read,
        createdAt: n.created_at
      };
    }));

    return notifications;
  },

  async createNotification(payload: {
    userId: string;
    actorId: string;
    type: NotificationType;
    contentId?: string;
    message?: string;
  }) {
    if (payload.userId === payload.actorId) return;

    const { error } = await withTimeout(
      (supabase.from('notifications').insert({
        user_id: payload.userId,
        actor_id: payload.actorId,
        type: payload.type,
        content_id: payload.contentId,
        message: payload.message
      })) as any,
      30000,
      'createNotification'
    );

    if (error) {
      // Always log so developers can see failures in the browser console.
      console.error("Failed to create notification:", error);
    }
  },

  async markAsRead(notificationId: string) {
    await withTimeout(
      (supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)) as any,
      30000,
      'markAsRead'
    );
  },

  async markAllAsRead(userId: string) {
    await withTimeout(
      (supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)) as any,
      30000,
      'markAllAsRead'
    );
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await withTimeout(
      (supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false)) as any,
      30000,
      'getUnreadCount'
    );

    if (error) return 0;
    return count || 0;
  }
};