class ProfileUser {
  final String id;
  final String username;
  final String displayName;
  final String avatar;
  final String? bio;
  final String? gender;
  final String? phoneNumber;
  final bool isVerified;
  final Map<String, dynamic>? businessDetails;

  ProfileUser({
    required this.id,
    required this.username,
    required this.displayName,
    required this.avatar,
    this.bio,
    this.gender,
    this.phoneNumber,
    this.isVerified = false,
    this.businessDetails,
  });

  factory ProfileUser.fromJson(Map<String, dynamic> json) {
    return ProfileUser(
      id: json['id'],
      username: json['username'] ?? '',
      displayName: json['display_name'] ?? 'EyeField Member',
      avatar: json['avatar_url'] ?? 'https://picsum.photos/seed/default/200/200',
      bio: json['bio'],
      gender: json['gender'],
      phoneNumber: json['phone_number'],
      isVerified: json['is_verified'] ?? false,
      businessDetails: json['business_details'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'username': username,
      'display_name': displayName,
      'avatar_url': avatar,
      'bio': bio,
      'gender': gender,
      'phone_number': phoneNumber,
      'business_details': businessDetails,
    };
  }
}
