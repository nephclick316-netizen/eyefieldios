import 'package:eyefield/features/echoes/domain/models/echo.dart';

enum MessageType { text, image, video, file, audio }

class Message {
  final String id;
  final String conversationId;
  final String senderId;
  final String content;
  final MessageType type;
  final String? mediaUrl;
  final List<String> mediaUrls;
  final bool isRead;
  final String createdAt;
  final EchoUser? sender;

  Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.content,
    required this.type,
    this.mediaUrl,
    this.mediaUrls = const [],
    this.isRead = false,
    required this.createdAt,
    this.sender,
  });

  factory Message.fromJson(Map<String, dynamic> json, {EchoUser? sender}) {
    return Message(
      id: json['id'].toString(),
      conversationId: json['conversation_id'].toString(),
      senderId: json['sender_id'],
      content: json['content'] ?? '',
      type: _parseType(json['message_type']),
      mediaUrl: json['media_url'],
      mediaUrls: json['media_urls'] != null ? List<String>.from(json['media_urls']) : [],
      isRead: json['is_read'] ?? false,
      createdAt: json['created_at'] ?? '',
      sender: sender,
    );
  }

  static MessageType _parseType(String? type) {
    switch (type) {
      case 'image': return MessageType.image;
      case 'video': return MessageType.video;
      case 'file': return MessageType.file;
      case 'audio': return MessageType.audio;
      default: return MessageType.text;
    }
  }
}

class Conversation {
  final String id;
  final String createdAt;
  final String updatedAt;
  final List<EchoUser> participants;
  final Message? lastMessage;
  final int unreadCount;

  Conversation({
    required this.id,
    required this.createdAt,
    required this.updatedAt,
    required this.participants,
    this.lastMessage,
    this.unreadCount = 0,
  });

  factory Conversation.fromJson(Map<String, dynamic> json, List<EchoUser> participants, {Message? lastMessage, int unreadCount = 0}) {
    return Conversation(
      id: json['id'].toString(),
      createdAt: json['created_at'],
      updatedAt: json['updated_at'],
      participants: participants,
      lastMessage: lastMessage,
      unreadCount: unreadCount,
    );
  }
}
