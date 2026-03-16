import { supabase } from '../utils/supabaseClient';
import { CallRecord } from '../types';
export const callService = {
  generateChannelId(): string {
    return `ef_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  },

  async sendSignal(targetUserId: string, event: string, payload: any) {
    const channel = supabase.channel(`calls_tx:${Date.now()}`);
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await supabase.channel(`calls:${targetUserId}`).send({
          type: 'broadcast',
          event: event,
          payload: payload
        });
        supabase.removeChannel(channel);
      }
    });
  },

  subscribeToCalls(userId: string, callbacks: {
    onIncoming: (payload: any) => void;
    onAccepted: (payload: any) => void;
    onRejected: (payload: any) => void;
    onEnded: (payload: any) => void;
  }) {
    const channel = supabase.channel(`calls:${userId}`);
    
    channel
      .on('broadcast', { event: 'incoming_call' }, (p) => callbacks.onIncoming(p.payload))
      .on('broadcast', { event: 'call_accepted' }, (p) => callbacks.onAccepted(p.payload))
      .on('broadcast', { event: 'call_rejected' }, (p) => callbacks.onRejected(p.payload))
      .on('broadcast', { event: 'call_ended' }, (p) => callbacks.onEnded(p.payload))
      .subscribe();
      
    return channel;
  },

  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  },

  async logCall(callerId: string, receiverId: string, type: 'voice' | 'video', status: 'completed' | 'missed' | 'rejected') {
    const { error } = await supabase.from('call_history').insert({
      caller_id: callerId,
      receiver_id: receiverId,
      type,
      status
    });
    if (error) console.error("Error logging call:", error);
  },

  async getCallHistory(userId: string, page: number = 0, limit: number = 15): Promise<{data: CallRecord[], hasMore: boolean}> {
    const from = page * limit;
    const to = from + limit;

    const { data, error } = await supabase
      .from('call_history')
      .select(`
        *,
        caller:profiles!caller_id(id, username, display_name, avatar_url, is_verified),
        receiver:profiles!receiver_id(id, username, display_name, avatar_url, is_verified)
      `)
      .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const hasMore = (data || []).length > limit;
    const itemsToProcess = (data || []).slice(0, limit);

    const mappedData = itemsToProcess.map((call: any) => {
      const isCaller = call.caller_id === userId;
      const otherProfile = isCaller ? call.receiver : call.caller;
      return {
        id: call.id,
        caller_id: call.caller_id,
        receiver_id: call.receiver_id,
        type: call.type,
        status: call.status,
        created_at: call.created_at,
        is_caller: isCaller,
        other_user: {
          id: otherProfile.id,
          username: otherProfile.username,
          displayName: otherProfile.display_name || otherProfile.displayName,
          avatar: otherProfile.avatar_url || otherProfile.avatar || 'https://picsum.photos/seed/default/200/200',
          isVerified: otherProfile.is_verified || otherProfile.isVerified
        }
      };
    });

    return { data: mappedData, hasMore };
  }
};