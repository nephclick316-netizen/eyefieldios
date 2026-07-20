class EchoUser {
  final String id;
  final String username;
  final String displayName;
  final String avatar;
  final bool isVerified;

  EchoUser({
    required this.id,
    required this.username,
    required this.displayName,
    required this.avatar,
    this.isVerified = false,
  });

  factory EchoUser.fromJson(Map<String, dynamic> json) {
    return EchoUser(
      id: json['id'] ?? '',
      username: json['username'] ?? 'unknown',
      displayName: json['display_name'] ?? json['displayName'] ?? 'Unknown User',
      avatar: json['avatar_url'] ?? json['avatar'] ?? 'https://picsum.photos/seed/default/200/200',
      isVerified: json['is_verified'] ?? json['isVerified'] ?? false,
    );
  }
}

class Echo {
  final String id;
  final EchoUser user;
  final String type;
  final String content;
  final String? mediaUrl;
  final int likes;
  final int comments;
  final String timestamp;
  final Map<String, dynamic>? transform;

  Echo({
    required this.id,
    required this.user,
    required this.type,
    required this.content,
    this.mediaUrl,
    this.likes = 0,
    this.comments = 0,
    required this.timestamp,
    this.transform,
  });

  factory Echo.fromJson(Map<String, dynamic> json, EchoUser user) {
    return Echo(
      id: json['id'],
      user: user,
      type: json['type'] ?? 'text',
      content: json['content'] ?? '',
      mediaUrl: json['media_url'],
      likes: json['likes'] ?? 0,
      comments: json['comments'] ?? 0,
      timestamp: json['created_at'] != null 
          ? DateTime.parse(json['created_at']).toLocal().toString().split(' ')[0] 
          : 'Just now',
      transform: json['transform'],
    );
  }
}
