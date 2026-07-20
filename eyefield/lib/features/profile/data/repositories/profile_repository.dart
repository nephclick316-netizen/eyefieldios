import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:eyefield/features/profile/domain/models/profile_user.dart';

class ProfileRepository {
  final SupabaseClient _client = Supabase.instance.client;

  Future<ProfileUser?> getProfile(String userId) async {
    final response = await _client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

    if (response == null) return null;
    return ProfileUser.fromJson(response);
  }

  Future<void> updateProfile(String userId, ProfileUser profile) async {
    await _client
        .from('profiles')
        .update(profile.toJson())
        .eq('id', userId);
  }

  Future<List<ProfileUser>> searchUsers(String query) async {
    if (query.isEmpty) return [];
    
    final response = await _client
        .from('profiles')
        .select('*')
        .or('display_name.ilike.%$query%,username.ilike.%$query%')
        .limit(20);

    final List<dynamic> data = response as List<dynamic>;
    return data.map((d) => ProfileUser.fromJson(d)).toList();
  }

  Future<int> getFollowersCount(String userId) async {
    try {
      final response = await _client.from('followers').select('id').eq('following_id', userId);
      return (response as List).length;
    } catch (e) {
      return 0; // Table might be different or error occurred
    }
  }

  Future<int> getFollowingCount(String userId) async {
    try {
      final response = await _client.from('followers').select('id').eq('follower_id', userId);
      return (response as List).length;
    } catch (e) {
      return 0;
    }
  }
}
