import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:eyefield/features/chat/presentation/providers/chat_providers.dart';
import 'package:eyefield/features/chat/presentation/screens/chat_screen.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';
import 'package:eyefield/features/profile/presentation/providers/profile_providers.dart';
import 'package:eyefield/features/profile/domain/models/profile_user.dart';
import 'package:eyefield/features/profile/presentation/screens/profile_screen.dart';

class ConversationListScreen extends ConsumerStatefulWidget {
  const ConversationListScreen({super.key});

  @override
  ConsumerState<ConversationListScreen> createState() => _ConversationListScreenState();
}

class _ConversationListScreenState extends ConsumerState<ConversationListScreen> {
  final _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleSearchChange(String text) async {
    if (text.trim().toLowerCase() == 'delete') {
      final userId = ref.read(currentUserProvider)?.id;
      if (userId != null) {
        try {
          await ref.read(chatRepositoryProvider).clearConversations(userId);
          ref.invalidate(conversationsProvider);
        } catch (e) {}
      }
      _searchController.clear();
      ref.read(chatSearchQueryProvider.notifier).state = '';
    } else {
      ref.read(chatSearchQueryProvider.notifier).state = text;
    }
  }

  void _showNewMessageSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const _NewMessageSheet(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final conversationsAsync = ref.watch(conversationsProvider);
    final filteredConversationsAsync = ref.watch(filteredConversationsProvider);
    final isDarkMode = theme.brightness == Brightness.dark;

    int totalUnread = 0;
    conversationsAsync.whenData((conversations) {
      totalUnread = conversations.fold(0, (sum, c) => sum + c.unreadCount);
    });

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 90),
        child: FloatingActionButton(
          onPressed: () {},
          backgroundColor: Colors.white,
          elevation: 4,
          child: const Icon(LucideIcons.mic, color: Color(0xFFE2E8F0)),
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Custom Top Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                   Text(
                    'EyeField',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: isDarkMode ? Colors.white : const Color(0xFF00172D),
                    ),
                  ),
                  const Spacer(),
                  Stack(
                    children: [
                      const Icon(LucideIcons.bell, color: Color(0xFF64748B)),
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.share2, color: Color(0xFF64748B)),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.compass, color: Color(0xFF64748B)),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.layoutGrid, size: 16, color: Color(0xFF4F46E5)),
                        const SizedBox(width: 6),
                        const Text(
                          'ENDOCARD',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Messages Title & Icons
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                   Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(LucideIcons.moreHorizontal, color: Color(0xFF0F172A), size: 18),
                  ),
                  const Spacer(),
                  const Text(
                    'Messages',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF00007A),
                    ),
                  ),
                  const SizedBox(width: 8),
                  if (totalUnread > 0)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2563EB),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$totalUnread',
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w900),
                      ),
                    ),
                  const Spacer(),
                  GestureDetector(
                    onTap: _showNewMessageSheet,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(LucideIcons.userPlus, color: Color(0xFF0F172A), size: 18),
                    ),
                  ),
                ],
              ),
            ),

            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              child: Container(
                height: 54,
                decoration: BoxDecoration(
                  color: isDarkMode ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: _handleSearchChange,
                  style: TextStyle(color: isDarkMode ? Colors.white : Colors.black),
                  decoration: const InputDecoration(
                    hintText: 'Search messages or type "delete"...',
                    hintStyle: TextStyle(color: Color(0xFF94A3B8)),
                    prefixIcon: Icon(LucideIcons.search, color: Color(0xFF64748B), size: 20),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Chat List
            Expanded(
              child: filteredConversationsAsync.when(
                data: (conversations) {
                  if (conversations.isEmpty) {
                    return const Center(
                      child: Text('No conversations matched', style: TextStyle(color: Color(0xFF94A3B8))),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: conversations.length,
                    itemBuilder: (context, index) {
                    final conversation = conversations[index];
                    final otherUser = conversation.participants.first;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: ListTile(
                        onTap: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => ChatScreen(conversation: conversation),
                            ),
                          );
                        },
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        leading: CircleAvatar(
                          radius: 30,
                          backgroundColor: const Color(0xFFF1F5F9),
                          backgroundImage: CachedNetworkImageProvider(otherUser.avatar),
                        ),
                        title: Text(
                          otherUser.displayName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        subtitle: Text(
                          conversation.lastMessage?.content ?? 'No messages yet',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF00007A),
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              '12 days ago', // Placeholder date style
                              style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8), fontWeight: FontWeight.bold),
                            ),
                            if (conversation.unreadCount > 0) ...[
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: const BoxDecoration(
                                  color: Color(0xFF2563EB),
                                  shape: BoxShape.circle,
                                ),
                                child: Text(
                                  '${conversation.unreadCount}',
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, st) => Center(child: Text('Error: $e')),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NewMessageSheet extends ConsumerStatefulWidget {
  const _NewMessageSheet();

  @override
  ConsumerState<_NewMessageSheet> createState() => _NewMessageSheetState();
}

class _NewMessageSheetState extends ConsumerState<_NewMessageSheet> {
  final _searchController = TextEditingController();
  List<ProfileUser> _results = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _searchUsers(''); // Load initial users
  }

  Future<void> _searchUsers(String query) async {
    setState(() => _isLoading = true);
    try {
      final results = await ref.read(profileRepositoryProvider).searchUsers(query);
      if (mounted) {
        setState(() {
          _results = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _startChat(ProfileUser user) async {
    final currentUserId = ref.read(currentUserProvider)?.id;
    if (currentUserId == null) return;

    try {
      await ref.read(chatRepositoryProvider).findOrCreateConversation(currentUserId, user.id);
      if (mounted) {
        Navigator.pop(context); // Close sheet
        ref.invalidate(conversationsProvider); // Refresh list
        // Note: For full functionality, we should navigate directly to the chat screen
        // using the convoId, but navigating to ChatScreen requires a complete Conversation object.
        // For now, refreshing the list allows the user to click the newly created conversation.
      }
    } catch (e) {
      print('Error starting chat: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Container(
      height: MediaQuery.of(context).size.height * 0.8,
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              border: Border(bottom: BorderSide(color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    onChanged: _searchUsers,
                    decoration: InputDecoration(
                      hintText: 'Search followers...',
                      prefixIcon: const Icon(LucideIcons.search, size: 20),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(LucideIcons.x),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: _results.length,
                    itemBuilder: (context, index) {
                      final user = _results[index];
                      // Don't show myself
                      if (user.id == ref.read(currentUserProvider)?.id) return const SizedBox.shrink();
                      
                      return ListTile(
                        leading: GestureDetector(
                          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: user.id))),
                          child: CircleAvatar(
                            radius: 28,
                            backgroundImage: CachedNetworkImageProvider(user.avatar),
                          ),
                        ),
                        title: Text(user.displayName, style: const TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: Text('@${user.username}'),
                        onTap: () => _startChat(user),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
