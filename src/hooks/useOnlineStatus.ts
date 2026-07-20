import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

interface PresenceState {
  [key: string]: { user_id: string; online_at: string }[];
}

export const useOnlineStatus = (currentUserId: string) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const presenceChannelRef = useRef<any | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const channelTopic = 'online-users';

    // If already subscribed, do nothing
    if (presenceChannelRef.current && presenceChannelRef.current.topic === channelTopic) {
      return;
    }

    // Clean up previous subscription if it exists
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }

    const channel = supabase.channel(channelTopic, {
      config: {
        presence: {
          key: currentUserId, // Use currentUserId as the presence key
        },
      },
    });
    presenceChannelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        if (!isMounted.current) return;
        const state: PresenceState = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.values(state).forEach((presences) => {
          presences.forEach((p) => onlineIds.add(p.user_id));
        });
        setOnlineUsers(onlineIds);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (!isMounted.current) return;
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newPresences.forEach((p) => newSet.add(p.user_id));
          return newSet;
        });
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (!isMounted.current) return;
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          leftPresences.forEach((p) => newSet.delete(p.user_id));
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Presence] Subscribed to online-users channel for user: ${currentUserId}`);
          try {
            await withTimeout(channel.track({ user_id: currentUserId, online_at: new Date().toISOString() }) as any, 5000, 'useOnlineStatus_track');
          } catch (error) {
            console.error("[Presence] Error tracking user presence:", error);
          }
        } else if (status === 'CHANNEL_ERROR') {
          console.error("[Presence] Error subscribing to online-users channel.");
        }
      });

    return () => {
      if (presenceChannelRef.current) {
        console.log(`[Presence] Unsubscribing from online-users channel for user: ${currentUserId}`);
        // Untrack presence before removing the channel
        try {
          withTimeout(presenceChannelRef.current.untrack() as any, 1000, 'useOnlineStatus_untrack'); // Small timeout for untrack
        } catch (error) {
          console.warn("[Presence] Error untracking presence during cleanup:", error);
        }
        supabase.removeChannel(presenceChannelRef.current);
        presenceChannelRef.current = null;
      }
      if (isMounted.current) setOnlineUsers(new Set());
    };
  }, [currentUserId]);

  return onlineUsers;
};