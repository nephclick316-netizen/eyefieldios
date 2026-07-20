import 'echo.dart';

class Pulse {
  final String id;
  final EchoUser user;
  final String mediaUrl;
  final String type;
  final String createdAt;
  final int likes;
  final int comments;
  final Map<String, dynamic>? transform;
  final String? caption;

  Pulse({
    required this.id,
    required this.user,
    required this.mediaUrl,
    required this.type,
    required this.createdAt,
    this.likes = 0,
    this.comments = 0,
    this.transform,
    this.caption,
  });

  factory Pulse.fromJson(Map<String, dynamic> json, EchoUser user) {
    return Pulse(
      id: json['id'].toString(),
      user: user,
      mediaUrl: json['media_url'] ?? '',
      type: json['type'] ?? 'image',
      createdAt: json['created_at'] != null 
          ? DateTime.parse(json['created_at']).toLocal().toString().split(' ')[0] 
          : 'Just now',
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      transform: json['transform'],
      caption: json['caption'],
    );
  }
}
