import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:eyefield/features/echoes/domain/models/echo.dart';
import 'package:eyefield/features/chat/domain/models/chat.dart';

class ChatRepository {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<Conversation>> getConversations(String userId) async {
    // 1. Get user's conversation IDs
    final participantResponse = await _client
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);
    
    final List<dynamic> participantData = participantResponse as List<dynamic>;
    if (participantData.isEmpty) return [];

    final convoIds = participantData.map((e) => e['conversation_id']).toList();

    // 2. Fetch those conversations
    final response = await _client
        .from('conversations')
        .select('*, conversation_participants(user_id, profiles(*))')
        .inFilter('id', convoIds)
        .order('updated_at', ascending: false);

    final List<dynamic> data = response as List<dynamic>;
    
    List<Conversation> conversations = [];
    for (var item in data) {
      final participantsRaw = item['conversation_participants'] as List;
      final otherParticipantRaw = participantsRaw.firstWhere((p) => p['user_id'] != userId, orElse: () => null);
      if (otherParticipantRaw == null) continue;

      final otherUser = EchoUser.fromJson(otherParticipantRaw['profiles']);
      
      // Get unread count
      final unreadResponse = await _client
          .from('messages')
          .select('id')
          .eq('conversation_id', item['id'])
          .neq('sender_id', userId)
          .eq('is_read', false);
      
      final unreadCount = (unreadResponse as List).length;

      // Get last message
      final lastMsgResponse = await _client
          .from('messages')
          .select('*')
          .eq('conversation_id', item['id'])
          .order('created_at', ascending: false)
          .limit(1)
          .maybeSingle();
      
      Message? lastMessage;
      if (lastMsgResponse != null) {
        lastMessage = Message.fromJson(lastMsgResponse);
      }

      conversations.add(Conversation.fromJson(
        item,
        [otherUser],
        lastMessage: lastMessage,
        unreadCount: unreadCount,
      ));
    }
    return conversations;
  }

  Future<List<Message>> getMessages(String conversationId) async {
    final response = await _client
        .from('messages')
        .select('*, profiles:profiles!sender_id(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', ascending: true);

    final List<dynamic> data = response as List<dynamic>;
    return data.map((m) {
      final sender = EchoUser.fromJson(m['profiles']);
      return Message.fromJson(m, sender: sender);
    }).toList();
  }

  Future<void> sendMessage(String conversationId, String senderId, String content, {String? mediaUrl, String messageType = 'text'}) async {
    await _client.from('messages').insert({
      'conversation_id': conversationId,
      'sender_id': senderId,
      'content': content,
      'media_url': mediaUrl,
      'message_type': messageType,
      'is_read': false,
    });

    await _client
        .from('conversations')
        .update({'updated_at': DateTime.now().toIso8601String()})
        .eq('id', conversationId);
  }

  RealtimeChannel subscribeToMessages(String conversationId, Function(Message) onMessage) {
    final channel = _client.channel('chat:$conversationId');
    
    channel.onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'messages',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'conversation_id',
        value: conversationId,
      ),
      callback: (payload) async {
        final newMessageData = payload.newRecord;
        final senderData = await _client
            .from('profiles')
            .select('*')
            .eq('id', newMessageData['sender_id'])
            .single();
        
        final sender = EchoUser.fromJson(senderData);
        onMessage(Message.fromJson(newMessageData, sender: sender));
      },
    ).subscribe();

    return channel;
  }

  Future<void> clearConversations(String userId) async {
    // Delete all conversation_participants for this user to clear their list
    try {
      await _client.from('conversation_participants').delete().eq('user_id', userId);
    } catch (e) {
      print('Error clearing conversations: $e');
    }
  }

  Future<String> findOrCreateConversation(String currentUserId, String otherUserId) async {
    // Check if conversation exists
    final response = await _client
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUserId);
    
    final List<dynamic> myConvos = response as List<dynamic>;
    if (myConvos.isNotEmpty) {
      final myConvoIds = myConvos.map((e) => e['conversation_id']).toList();
      final otherResponse = await _client
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUserId)
          .inFilter('conversation_id', myConvoIds)
          .maybeSingle();

      if (otherResponse != null) {
        return otherResponse['conversation_id'] as String;
      }
    }

    // Create new conversation
    final newConvo = await _client
        .from('conversations')
        .insert({'updated_at': DateTime.now().toIso8601String()})
        .select('id')
        .single();
    final convoId = newConvo['id'] as String;

    await _client.from('conversation_participants').insert([
      {'conversation_id': convoId, 'user_id': currentUserId},
      {'conversation_id': convoId, 'user_id': otherUserId},
    ]);

    return convoId;
  }

  Future<void> markMessagesAsRead(String conversationId, String currentUserId) async {
    try {
      await _client.from('messages')
          .update({'is_read': true})
          .eq('conversation_id', conversationId)
          .neq('sender_id', currentUserId)
          .eq('is_read', false);
    } catch (e) {
      print('Error marking messages as read: $e');
    }
  }

  Future<void> clearMessages(String conversationId) async {
    try {
      await _client.from('messages').delete().eq('conversation_id', conversationId);
    } catch (e) {
      print('Error clearing messages: $e');
    }
  }

  Future<void> deleteMessage(String messageId) async {
    try {
      await _client.from('messages').delete().eq('id', messageId);
    } catch (e) {
      print('Error deleting message: $e');
    }
  }
}

