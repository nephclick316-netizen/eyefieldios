import { supabase } from '../utils/supabaseClient';

class PresenceService {
    // 1. App-wide online status (Global channel)
    subscribeToGlobalPresence(userId: string, onPresenceChange: (onlineUsers: string[]) => void) {
        const channel = supabase.channel('global_presence', {
            config: {
                presence: {
                    key: userId,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                const onlineUserIds = Object.keys(state);
                onPresenceChange(onlineUserIds);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ online_at: new Date().toISOString() });
                }
            });

        return channel;
    }

    unsubscribeFromPresence(channel: any) {
        supabase.removeChannel(channel);
    }

    // 2. Chat-specific Typing Indicators (Broadcast)
    subscribeToTypingEvents(conversationId: string, onTyping: (userId: string, isTyping: boolean) => void) {
        const channel = supabase.channel(`typing:${conversationId}`);

        channel
            .on('broadcast', { event: 'typing' }, (payload) => {
                onTyping(payload.payload.userId, payload.payload.isTyping);
            })
            .subscribe();

        return channel;
    }

    async sendTypingEvent(channel: any, userId: string, isTyping: boolean) {
        if (channel && channel.state === 'joined') {
            await channel.send({
                type: 'broadcast',
                event: 'typing',
                payload: { userId, isTyping },
            });
        }
    }
}

export const presenceService = new PresenceService();
