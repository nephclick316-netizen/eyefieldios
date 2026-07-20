import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:eyefield/features/chat/data/repositories/chat_repository.dart';
import 'package:eyefield/features/chat/domain/models/chat.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository();
});

final conversationsProvider = FutureProvider<List<Conversation>>((ref) async {
  final userId = ref.watch(currentUserProvider)?.id;
  if (userId == null) return [];
  return ref.watch(chatRepositoryProvider).getConversations(userId);
});

final chatSearchQueryProvider = StateProvider<String>((ref) => '');

final filteredConversationsProvider = FutureProvider<List<Conversation>>((ref) async {
  final conversations = await ref.watch(conversationsProvider.future);
  final query = ref.watch(chatSearchQueryProvider).toLowerCase();

  if (query.isEmpty) return conversations;

  return conversations.where((c) {
    if (c.participants.isEmpty) return false;
    final otherUser = c.participants.first;
    return otherUser.displayName.toLowerCase().contains(query) ||
           otherUser.username.toLowerCase().contains(query) ||
           (c.lastMessage?.content.toLowerCase().contains(query) ?? false);
  }).toList();
});

final messagesProvider = StateNotifierProvider.family<MessageListNotifier, List<Message>, String>((ref, conversationId) {
  return MessageListNotifier(ref.watch(chatRepositoryProvider), conversationId);
});

class MessageListNotifier extends StateNotifier<List<Message>> {
  final ChatRepository _repository;
  final String _conversationId;
  RealtimeChannel? _subscription;

  MessageListNotifier(this._repository, this._conversationId) : super([]) {
    _fetchMessages();
    _subscribe();
  }

  Future<void> _fetchMessages() async {
    state = await _repository.getMessages(_conversationId);
  }

  void _subscribe() {
    _subscription = _repository.subscribeToMessages(_conversationId, (msg) {
      if (!state.any((m) => m.id == msg.id)) {
        state = [...state, msg];
      }
    });
  }

  @override
  void dispose() {
    _subscription?.unsubscribe();
    super.dispose();
  }
}
