import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:http/http.dart' as http;
import 'package:eyefield/features/chat/presentation/providers/chat_providers.dart';
import 'package:eyefield/features/chat/domain/models/chat.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';
import 'package:eyefield/features/profile/presentation/screens/profile_screen.dart';
import 'package:eyefield/features/calls/presentation/screens/call_screen.dart';
import 'package:eyefield/features/chat/presentation/screens/chat_binder_screen.dart';

class ChatScreen extends ConsumerStatefulWidget {
  final Conversation conversation;
  const ChatScreen({super.key, required this.conversation});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _messageController = TextEditingController();
  bool _isComposing = false;
  RealtimeChannel? _presenceChannel;
  bool _isOtherUserOnline = false;

  final _audioRecorder = AudioRecorder();
  bool _isRecording = false;

  @override
  void initState() {
    super.initState();
    _messageController.addListener(() {
      setState(() {
        _isComposing = _messageController.text.trim().isNotEmpty;
      });
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final currentUserId = ref.read(currentUserProvider)?.id;
      if (currentUserId != null) {
        ref.read(chatRepositoryProvider).markMessagesAsRead(widget.conversation.id, currentUserId);
      }
    });

    _initPresence();
  }

  void _initPresence() {
    final currentUserId = ref.read(currentUserProvider)?.id;
    if (currentUserId == null || widget.conversation.participants.isEmpty) return;
    
    final otherUserId = widget.conversation.participants.first.id;
    _presenceChannel = Supabase.instance.client.channel('online-users');
    
    _presenceChannel!.onPresenceSync((payload) {
      final state = _presenceChannel!.presenceState();
      bool isOnline = false;
      for (final presence in state) {
        final Map<String, dynamic> data = (presence as dynamic).payload ?? (presence as dynamic).state ?? {};
        if (data['user_id'] == otherUserId) {
          isOnline = true;
          break;
        }
      }
      if (mounted) {
        setState(() {
          _isOtherUserOnline = isOnline;
        });
      }
    });

    _presenceChannel!.subscribe((status, [error]) async {
      if (status == 'SUBSCRIBED') {
        await _presenceChannel!.track({'user_id': currentUserId});
      }
    });
  }

  @override
  void dispose() {
    _presenceChannel?.unsubscribe();
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;

    final userId = ref.read(currentUserProvider)?.id;
    if (userId == null) return;

    _messageController.clear();
    await ref.read(chatRepositoryProvider).sendMessage(
      widget.conversation.id,
      userId,
      text,
    );
  }

  Future<void> _toggleRecording() async {
    if (_isRecording) {
      final path = await _audioRecorder.stop();
      if (mounted) setState(() => _isRecording = false);
      
      if (path != null) {
        final userId = ref.read(currentUserProvider)?.id;
        if (userId == null) return;
        try {
          late Uint8List audioBytes;
          if (kIsWeb) {
             final res = await http.get(Uri.parse(path));
             audioBytes = res.bodyBytes;
          } else {
             final res = await http.get(Uri.parse(path));
             audioBytes = res.bodyBytes;
          }
          final fileName = 'voice_${DateTime.now().millisecondsSinceEpoch}.m4a';
          final storagePath = 'chat_audio/$fileName';

          await Supabase.instance.client.storage.from('pulse_media').uploadBinary(storagePath, audioBytes);
          final mediaUrl = Supabase.instance.client.storage.from('pulse_media').getPublicUrl(storagePath);

          await ref.read(chatRepositoryProvider).sendMessage(
            widget.conversation.id,
            userId,
            'Voice note',
            mediaUrl: mediaUrl,
            messageType: 'audio'
          );
        } catch (e) {
          debugPrint('Recording upload failed: $e');
        }
      }
    } else {
      if (await _audioRecorder.hasPermission()) {
        await _audioRecorder.start(const RecordConfig(), path: '');
        if (mounted) setState(() => _isRecording = true);
      }
    }
  }

  Future<void> _confirmClearChat() async {
    final controller = TextEditingController();
    bool canDelete = false;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              backgroundColor: Theme.of(context).scaffoldBackgroundColor,
              title: const Text('Clear Chat', style: TextStyle(fontWeight: FontWeight.bold)),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Are you sure you want to clear this conversation?'),
                  const SizedBox(height: 16),
                  const Text('Type "delete" to confirm:'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: controller,
                    decoration: InputDecoration(
                      border: const OutlineInputBorder(),
                      hintText: 'delete',
                      filled: true,
                      fillColor: Theme.of(context).brightness == Brightness.dark ? Colors.grey[900] : Colors.grey[100],
                    ),
                    onChanged: (val) {
                      setState(() {
                        canDelete = val.toLowerCase().trim() == 'delete';
                      });
                    },
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
                ),
                ElevatedButton(
                  onPressed: canDelete ? () => Navigator.pop(context, true) : null,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  child: const Text('Clear', style: TextStyle(color: Colors.white)),
                ),
              ],
            );
          }
        );
      }
    );

    if (confirmed == true) {
      await ref.read(chatRepositoryProvider).clearMessages(widget.conversation.id);
      ref.invalidate(messagesProvider(widget.conversation.id));
    }
  }

  void _showMessageOptions(Message msg, bool isMe) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(LucideIcons.forward),
              title: const Text('Forward message'),
              onTap: () {
                Navigator.pop(context);
                _showForwardSheet(msg);
              },
            ),
            ListTile(
              leading: Icon(LucideIcons.trash2, color: Colors.red[400]),
              title: Text(isMe ? 'Delete message' : 'Delete for me', style: TextStyle(color: Colors.red[400])),
              onTap: () async {
                Navigator.pop(context);
                await ref.read(chatRepositoryProvider).deleteMessage(msg.id);
                ref.invalidate(messagesProvider(widget.conversation.id));
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showForwardSheet(Message msg) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.7,
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text('Forward to...', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              Expanded(
                child: Consumer(
                  builder: (context, ref, child) {
                    final convosAsync = ref.watch(filteredConversationsProvider);
                    return convosAsync.when(
                      data: (convos) => ListView.builder(
                        itemCount: convos.length,
                        itemBuilder: (context, index) {
                          final convo = convos[index];
                          final otherUser = convo.participants.first;
                          return ListTile(
                            leading: CircleAvatar(backgroundImage: CachedNetworkImageProvider(otherUser.avatar)),
                            title: Text(otherUser.displayName),
                            onTap: () async {
                              final userId = ref.read(currentUserProvider)?.id;
                              if (userId != null) {
                                await ref.read(chatRepositoryProvider).sendMessage(convo.id, userId, msg.content, mediaUrl: msg.mediaUrl, messageType: msg.type == MessageType.image ? 'image' : 'text');
                                if (context.mounted) Navigator.pop(context);
                                if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Message forwarded')));
                              }
                            },
                          );
                        },
                      ),
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, st) => Center(child: Text('Error: $e')),
                    );
                  }
                ),
              ),
            ],
          ),
        );
      }
    );
  }

  String _formatDate(String dateStr) {
    if (dateStr.isEmpty) return '';
    final dt = DateTime.parse(dateStr).toLocal();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
  }

  String _formatTime(String dateStr) {
    if (dateStr.isEmpty) return '';
    final dt = DateTime.parse(dateStr).toLocal();
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    final messages = ref.watch(messagesProvider(widget.conversation.id));
    final currentUserId = ref.watch(currentUserProvider)?.id;
    final otherUser = widget.conversation.participants.first;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final bgColor = isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9);

    return Scaffold(
      backgroundColor: bgColor,
      appBar: AppBar(
        titleSpacing: 0,
        backgroundColor: theme.scaffoldBackgroundColor,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.arrowLeft, color: isDark ? Colors.white : Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            GestureDetector(
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: otherUser.id))),
              child: CircleAvatar(
                radius: 18,
                backgroundImage: CachedNetworkImageProvider(otherUser.avatar),
              ),
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(otherUser.displayName, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isDark ? Colors.white : Colors.black)),
                Text(_isOtherUserOnline ? 'Online' : 'Offline', style: TextStyle(fontSize: 12, color: _isOtherUserOnline ? Colors.green[400] : Colors.grey)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(LucideIcons.video, color: isDark ? Colors.white : Colors.black54),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CallScreen(channelId: widget.conversation.id))),
          ),
          IconButton(
            icon: Icon(LucideIcons.phone, color: isDark ? Colors.white : Colors.black54),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => CallScreen(channelId: widget.conversation.id))),
          ),
          IconButton(
            icon: Icon(LucideIcons.bookOpen, color: isDark ? Colors.white : Colors.black54),
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => ChatBinderScreen(conversationId: widget.conversation.id))),
          ),
          PopupMenuButton<String>(
            icon: Icon(LucideIcons.moreVertical, color: isDark ? Colors.white : Colors.black54),
            onSelected: (value) {
              if (value == 'clear') _confirmClearChat();
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'clear', child: Text('Clear chat')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final msg = messages[index];
                final isMe = msg.senderId == currentUserId;
                
                bool showDate = false;
                if (index == 0) {
                  showDate = true;
                } else {
                   final prevMsg = messages[index - 1];
                   if (msg.createdAt.isNotEmpty && prevMsg.createdAt.isNotEmpty) {
                     final dtCurrent = DateTime.parse(msg.createdAt).toLocal();
                     final dtPrev = DateTime.parse(prevMsg.createdAt).toLocal();
                     if (dtCurrent.year != dtPrev.year || dtCurrent.month != dtPrev.month || dtCurrent.day != dtPrev.day) {
                       showDate = true;
                     }
                   }
                }
                
                bool showAvatar = !isMe && (index == messages.length - 1 || messages[index + 1].senderId != msg.senderId || showDate);

                Widget avatarWidget = const SizedBox(width: 36);
                if (!isMe && showAvatar) {
                  avatarWidget = Padding(
                    padding: const EdgeInsets.only(right: 8.0, bottom: 8.0),
                    child: GestureDetector(
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: otherUser.id))),
                      child: CircleAvatar(
                        radius: 14,
                        backgroundImage: CachedNetworkImageProvider(otherUser.avatar),
                      ),
                    ),
                  );
                } else if (!isMe) {
                  avatarWidget = const SizedBox(width: 36);
                }

                return Column(
                  crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                  children: [
                    if (showDate)
                      Center(
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 16),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Text(_formatDate(msg.createdAt), style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.black54, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    Row(
                      mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (!isMe) avatarWidget,
                        Flexible(
                          child: GestureDetector(
                            onLongPress: () => _showMessageOptions(msg, isMe),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe ? (isDark ? const Color(0xFF005C4B) : const Color(0xFFE6E6E6)) : (isDark ? const Color(0xFF1E293B) : Colors.white),
                                borderRadius: BorderRadius.circular(16),
                                border: !isDark && !isMe ? Border.all(color: Colors.grey[300]!) : null,
                                boxShadow: [
                                  if (!isDark) BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 4, offset: const Offset(0, 2)),
                                ],
                              ),
                              child: msg.type == MessageType.audio && msg.mediaUrl != null && msg.mediaUrl!.isNotEmpty
                                ? AudioPlayerWidget(url: msg.mediaUrl!, isMe: isMe)
                                : msg.mediaUrl != null && msg.mediaUrl!.isNotEmpty
                                  ? Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        ClipRRect(borderRadius: BorderRadius.circular(8), child: CachedNetworkImage(imageUrl: msg.mediaUrl!)),
                                        const SizedBox(height: 8),
                                        Text(msg.content, style: TextStyle(color: isDark ? Colors.white : Colors.black87)),
                                        const SizedBox(height: 4),
                                        Align(
                                          alignment: Alignment.centerRight,
                                          child: Text(_formatTime(msg.createdAt), style: TextStyle(fontSize: 10, color: Colors.blue[400], fontWeight: FontWeight.bold)),
                                        ),
                                      ],
                                    )
                                  : Row(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Flexible(child: Text(msg.content, style: TextStyle(color: isDark ? Colors.white : Colors.black87))),
                                        const SizedBox(width: 12),
                                        Text(_formatTime(msg.createdAt), style: TextStyle(fontSize: 10, color: Colors.blue[400], fontWeight: FontWeight.bold)),
                                        if (isMe) ...[
                                          const SizedBox(width: 4),
                                          Icon(msg.isRead ? LucideIcons.checkCheck : LucideIcons.check, size: 14, color: msg.isRead ? Colors.blue[400] : (isDark ? Colors.grey : Colors.grey[400])),
                                        ]
                                      ],
                                    ),
                            ),
                          ),
                        ),
                        if (isMe) const SizedBox(width: 36), // Align to keep it balanced if wanted, or leave it out so it snaps to edge. The user image shows text popping up against edge! So let's leave it out.
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            color: theme.scaffoldBackgroundColor,
            child: Row(
              children: [
                IconButton(
                  icon: Icon(LucideIcons.plus, color: isDark ? Colors.white54 : Colors.grey[600]),
                  onPressed: () {},
                ),
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            decoration: const InputDecoration(
                              hintText: 'Type a message...',
                              hintStyle: TextStyle(color: Colors.grey),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                            ),
                            onSubmitted: (_) => _sendMessage(),
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.smile, color: Colors.grey),
                          onPressed: () {},
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    if (_isComposing) {
                       _sendMessage();
                    } else {
                       _toggleRecording();
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: _isRecording ? Colors.red[400] : (isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9)),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(_isComposing ? LucideIcons.send : LucideIcons.mic, color: _isRecording ? Colors.white : (isDark ? Colors.white54 : Colors.grey[600]), size: 20),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class AudioPlayerWidget extends StatefulWidget {
  final String url;
  final bool isMe;
  const AudioPlayerWidget({super.key, required this.url, required this.isMe});

  @override
  State<AudioPlayerWidget> createState() => _AudioPlayerWidgetState();
}

class _AudioPlayerWidgetState extends State<AudioPlayerWidget> {
  final _player = AudioPlayer();
  bool _isPlaying = false;

  @override
  void initState() {
    super.initState();
    _player.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() => _isPlaying = state == PlayerState.playing);
      }
    });
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  void _togglePlay() async {
    if (_isPlaying) {
      await _player.pause();
    } else {
      await _player.play(UrlSource(widget.url));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          icon: Icon(_isPlaying ? Icons.pause_circle_filled : Icons.play_circle_fill, color: Colors.blue),
          onPressed: _togglePlay,
        ),
        SizedBox(
          width: 100,
          child: LinearProgressIndicator(
            value: null, 
            backgroundColor: widget.isMe ? Colors.white24 : Colors.grey[300], 
            color: Colors.blue
          ),
        ),
      ],
    );
  }
}
