import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:eyefield/features/chat/presentation/providers/chat_providers.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../domain/models/chat.dart';

class ChatBinderScreen extends ConsumerStatefulWidget {
  final String conversationId;
  const ChatBinderScreen({super.key, required this.conversationId});

  @override
  ConsumerState<ChatBinderScreen> createState() => _ChatBinderScreenState();
}

class _ChatBinderScreenState extends ConsumerState<ChatBinderScreen> {
  DateTime? _selectedDate;

  void _pickDate() async {
    final dt = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    if (dt != null) {
      if (mounted) {
        setState(() => _selectedDate = dt);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final messages = ref.watch(messagesProvider(widget.conversationId));

    List<Message> filteredMessages = messages;
    if (_selectedDate != null) {
      filteredMessages = messages.where((m) {
        final mDate = DateTime.parse(m.createdAt).toLocal();
        return mDate.year == _selectedDate!.year && mDate.month == _selectedDate!.month && mDate.day == _selectedDate!.day;
      }).toList();
    }

    final textMessages = filteredMessages.where((m) => m.type == MessageType.text && (m.mediaUrl == null || m.mediaUrl!.isEmpty)).toList();
    final imageMessages = filteredMessages.where((m) => m.type == MessageType.image || (m.mediaUrl != null && m.mediaUrl!.isNotEmpty)).toList();
    final videoMessages = filteredMessages.where((m) => m.type == MessageType.video).toList();

    return DefaultTabController(
      length: 4,
      child: Scaffold(
        appBar: AppBar(
          backgroundColor: theme.scaffoldBackgroundColor,
          elevation: 0,
          leading: IconButton(
            icon: Icon(LucideIcons.arrowLeft, color: isDark ? Colors.white : Colors.black),
            onPressed: () => Navigator.pop(context),
          ),
          title: Text('Chat Binder', style: TextStyle(color: isDark ? Colors.white : Colors.black, fontWeight: FontWeight.bold)),
          actions: [
            IconButton(
              icon: Icon(LucideIcons.calendar, color: _selectedDate != null ? Colors.blue : (isDark ? Colors.white : Colors.black54)),
              onPressed: _pickDate,
            ),
            if (_selectedDate != null)
              IconButton(
                icon: Icon(LucideIcons.x, color: Colors.red[400]),
                onPressed: () => setState(() => _selectedDate = null),
              )
          ],
          bottom: TabBar(
            labelColor: Colors.blue,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.blue,
            tabs: const [
              Tab(text: 'All'),
              Tab(text: 'Text'),
              Tab(text: 'Images'),
              Tab(text: 'Videos'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildMessageList(filteredMessages, isDark),
            _buildMessageList(textMessages, isDark),
            _buildMediaGrid(imageMessages),
            _buildMediaGrid(videoMessages),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageList(List<Message> msgs, bool isDark) {
    if (msgs.isEmpty) return const Center(child: Text('No messages found.', style: TextStyle(color: Colors.grey)));
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: msgs.length,
      itemBuilder: (context, index) {
        final msg = msgs[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: !isDark ? Border.all(color: Colors.grey[200]!) : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(radius: 10, backgroundImage: CachedNetworkImageProvider(msg.sender?.avatar ?? '')),
                  const SizedBox(width: 8),
                  Text(msg.sender?.displayName ?? 'User', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                  const Spacer(),
                  Text(_formatDateTime(msg.createdAt), style: const TextStyle(fontSize: 10, color: Colors.grey)),
                ],
              ),
              const SizedBox(height: 8),
              if (msg.mediaUrl != null && msg.mediaUrl!.isNotEmpty)
                 Padding(
                   padding: const EdgeInsets.only(bottom: 8.0),
                   child: ClipRRect(
                     borderRadius: BorderRadius.circular(8),
                     child: CachedNetworkImage(imageUrl: msg.mediaUrl!, height: 120, width: double.infinity, fit: BoxFit.cover),
                   ),
                 ),
              Text(msg.content, style: TextStyle(color: isDark ? Colors.white : Colors.black87)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMediaGrid(List<Message> msgs) {
    if (msgs.isEmpty) return const Center(child: Text('No media found.', style: TextStyle(color: Colors.grey)));
    return GridView.builder(
      padding: const EdgeInsets.all(8),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemCount: msgs.length,
      itemBuilder: (context, index) {
        final msg = msgs[index];
        if (msg.mediaUrl == null || msg.mediaUrl!.isEmpty) return const SizedBox();
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: CachedNetworkImage(imageUrl: msg.mediaUrl!, fit: BoxFit.cover),
        );
      },
    );
  }

  String _formatDateTime(String dateStr) {
    if (dateStr.isEmpty) return '';
    final dt = DateTime.parse(dateStr).toLocal();
    return '${dt.month}/${dt.day}/${dt.year} ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
