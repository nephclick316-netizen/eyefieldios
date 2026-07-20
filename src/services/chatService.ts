import { supabase } from '../utils/supabaseClient';
import { Conversation, Message, User } from '../types';
import { storageService } from './storageService';
import { notificationService } from './notificationService';
import { cacheUtils } from '../utils/cacheUtils';

class ChatService {
    private mapProfileToUser(profile: any): User {
        return {
            id: profile.id,
            username: profile.username,
            displayName: profile.display_name || profile.displayName,
            avatar: profile.avatar_url || profile.avatar || 'https://picsum.photos/seed/default/200/200',
            isVerified: profile.is_verified || profile.isVerified
        };
    }

    // --- Caching Logic ---
    async getCachedMessages(conversationId: string): Promise<Message[]> {
        return await cacheUtils.get<Message[]>(`msgs_${conversationId}`) || [];
    }

    async setCachedMessages(conversationId: string, messages: Message[]) {
        // Keep only the last 50 messages in cache to save space
        const toCache = messages.slice(-50);
        await cacheUtils.set(`msgs_${conversationId}`, toCache);
    }

    async updateMessageInCache(conversationId: string, newMessage: Message) {
        const cached = await this.getCachedMessages(conversationId);
        if (cached.find(m => m.id === newMessage.id)) return;
        const updated = [...cached, newMessage];
        await this.setCachedMessages(conversationId, updated);
    }

    async getConversations(userId: string, page: number = 0, limit: number = 15): Promise<{data: Conversation[], hasMore: boolean}> {
        const from = page * limit;
        const to = from + limit;

        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                created_at,
                updated_at,
                participants:conversation_participants (
                    user_id,
                    profiles:profiles!user_id (
                        id,
                        username,
                        display_name,
                        avatar_url,
                        is_verified
                    )
                )
            `)
            .order('updated_at', { ascending: false })
            .range(from, to);

        if (error) {
            console.error('Error fetching conversations:', error);
            return { data: [], hasMore: false };
        }

        const filteredData = (data as any[]).filter(c =>
            c.participants && c.participants.some((p: any) => p.user_id === userId)
        );

        const hasMore = filteredData.length > limit;
        const itemsToProcess = filteredData.slice(0, limit);

        const seenUserIds = new Set<string>();
        const dedupedData = itemsToProcess.filter(item => {
            const otherParticipant = item.participants.find((p: any) => p.user_id !== userId);
            if (!otherParticipant) return false;
            if (seenUserIds.has(otherParticipant.user_id)) return false;
            seenUserIds.add(otherParticipant.user_id);
            return true;
        });

        const conversations = await Promise.all(dedupedData.map(async item => {
            const otherParticipant = item.participants.find((p: any) => p.user_id !== userId);

            const { count } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', item.id)
                .neq('sender_id', userId)
                .eq('is_read', false);

            const { data: lastMsgData } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', item.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            return {
                id: item.id,
                created_at: item.created_at,
                updated_at: item.updated_at,
                unread_count: count || 0,
                last_message: lastMsgData || undefined,
                participants: otherParticipant ? [{
                    conversation_id: item.id,
                    user_id: otherParticipant.user_id,
                    profiles: this.mapProfileToUser(otherParticipant.profiles)
                }] : []
            };
        }));

        return { data: conversations, hasMore };
    }

    async deleteAllConversations(userId: string) {
        const { data: participants } = await supabase
            .from('conversation_participants')
            .select('conversation_id')
            .eq('user_id', userId);

        if (!participants || participants.length === 0) return;

        const conversationIds = participants.map(p => p.conversation_id);

        const { error } = await supabase
            .from('conversation_participants')
            .delete()
            .eq('user_id', userId)
            .in('conversation_id', conversationIds);

        if (error) throw error;
    }

    async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('conversation_participants')
            .delete()
            .eq('conversation_id', conversationId)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting conversation:', error);
            throw error;
        }
        // Clear cache
        await cacheUtils.remove(`msgs_${conversationId}`);
        return true;
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        const { data, error } = await supabase
            .from('messages')
            .select(`
                *,
                profiles:profiles!sender_id (
                    id,
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching messages:', error);
            return [];
        }

        const msgs = (data as any[]).map(msg => ({
            ...msg,
            profiles: msg.profiles ? this.mapProfileToUser(msg.profiles) : undefined
        }));

        // Update cache
        await this.setCachedMessages(conversationId, msgs);
        return msgs;
    }

    async sendMessage(
        senderId: string,
        conversationId: string,
        content: string,
        type: Message['message_type'] = 'text',
        mediaUrl?: string,
        mediaUrls?: string[],
        isForwarded: boolean = false
    ): Promise<Message | null> {
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: conversationId,
                sender_id: senderId,
                content: content,
                message_type: type,
                media_url: mediaUrl || null,
                media_urls: mediaUrls || [],
                is_read: false,
                is_forwarded: isForwarded
            })
            .select(`
                *,
                profiles:profiles!sender_id (
                    id,
                    username,
                    display_name,
                    avatar_url
                )
            `)
            .single();

        if (error) {
            console.error('Error sending message:', error);
            return null;
        }

        const sentMsg = {
            ...data,
            profiles: data.profiles ? this.mapProfileToUser(data.profiles) : undefined
        } as Message;

        // Update cache immediately
        await this.updateMessageInCache(conversationId, sentMsg);

        await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);

        const { data: participants } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', senderId);

        if (participants && participants.length > 0) {
            const recipientId = participants[0].user_id;
            await notificationService.createNotification({
                userId: recipientId,
                actorId: senderId,
                type: 'message',
                contentId: conversationId,
                message: type === 'text' ? content : `Sent a ${type}`
            });
        }

        return sentMsg;
    }

    async deleteMessage(messageId: string, userId: string): Promise<boolean> {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', messageId);

        if (error) {
            console.error('Error deleting message:', error);
            throw error;
        }
        return true;
    }

    async uploadChatMedia(file: File, userId: string, bucketName: 'chat_media' | 'chat_audio' | 'chat' = 'chat_media'): Promise<string | null> {
        try {
            // Try specific bucket first
            const url = await storageService.uploadChatMedia(userId, file, bucketName);
            if (url) return url;
            
            // Fallback to generic 'chat' bucket if specific one fails or is null
            if (bucketName !== 'chat') {
                return await storageService.uploadChatMedia(userId, file, 'chat');
            }
            return null;
        } catch (error) {
            console.error(`Error uploading to ${bucketName}, trying fallback:`, error);
            try {
                return await storageService.uploadChatMedia(userId, file, 'chat');
            } catch (fallbackError) {
                console.error("Fallback upload also failed:", fallbackError);
                return null;
            }
        }
    }

    async markAsRead(conversationId: string, userId: string) {
        await supabase
            .from('messages')
            .update({ is_read: true })
            .eq('conversation_id', conversationId)
            .neq('sender_id', userId)
            .eq('is_read', false);
    }

    async getOrCreateConversation(userId1: string, userId2: string): Promise<string | null> {
        const { data, error } = await supabase
            .rpc('get_or_create_conversation', {
                p_user1_id: userId1,
                p_user2_id: userId2
            });

        if (error) {
            console.error('Error getting or creating conversation:', error);
            return null;
        }

        return data && data.length > 0 ? data[0].chat_id : null;
    }

    subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
        return supabase
            .channel(`chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                async (payload) => {
                    const { data } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            profiles:profiles!sender_id (
                                id,
                                username,
                                display_name,
                                avatar_url
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        const msg = {
                            ...data,
                            profiles: data.profiles ? this.mapProfileToUser(data.profiles) : undefined
                        } as Message;
                        // Update cache
                        await this.updateMessageInCache(conversationId, msg);
                        callback(msg);
                    }
                }
            )
            .subscribe();
    }

    subscribeToReadReceipts(conversationId: string, callback: (messageId: string) => void) {
        return supabase
            .channel(`read_receipts:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    if (payload.new.is_read === true && payload.old.is_read === false) {
                        callback(payload.new.id);
                    }
                }
            )
            .subscribe();
    }

    subscribeToAllUserMessages(userId: string, callback: (payload: any) => void) {
        return supabase
            .channel(`user_messages:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                async (payload) => {
                    // When a message arrives globally, we fetch the full object to update cache
                    const { data } = await supabase
                        .from('messages')
                        .select(`
                            *,
                            profiles:profiles!sender_id (
                                id,
                                username,
                                display_name,
                                avatar_url
                            )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (data) {
                        const msg = {
                            ...data,
                            profiles: data.profiles ? this.mapProfileToUser(data.profiles) : undefined
                        } as Message;
                        await this.updateMessageInCache(msg.conversation_id, msg);
                        callback(msg);
                    }
                }
            )
            .subscribe();
    }

    unsubscribeFromMessages(channel: any) {
        supabase.removeChannel(channel);
    }
}

export const chatService = new ChatService();