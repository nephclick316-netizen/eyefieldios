import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:eyefield/features/echoes/domain/models/echo.dart';
import 'package:eyefield/features/echoes/domain/models/pulse.dart';
import 'package:eyefield/core/services/storage_service.dart';

class PulseRepository {
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<Pulse>> getPulses() async {
    final twentyFourHoursAgo = DateTime.now().subtract(const Duration(hours: 24)).toUtc().toIso8601String();
    
    final response = await _client
        .from('pulses')
        .select('*, pulse_likes(count), pulse_comments(count)')
        .gt('created_at', twentyFourHoursAgo)
        .order('user_id') // Group by user
        .order('created_at', ascending: false);

    final List<dynamic> data = response as List<dynamic>;
    if (data.isEmpty) return [];

    final userIds = data.map((e) => e['user_id']).toSet().toList();
    final profilesResponse = await _client
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .filter('id', 'in', userIds);
    
    final profilesMap = {
      for (var p in profilesResponse) p['id']: EchoUser.fromJson(p)
    };

    return data.map((p) {
      final user = profilesMap[p['user_id']] ?? 
          EchoUser(id: p['user_id'], username: 'unknown', displayName: 'Unknown User', avatar: '');
      
      // Calculate likes/comments
      int likes = 0;
      int comments = 0;
      if (p['pulse_likes'] != null && (p['pulse_likes'] as List).isNotEmpty) {
        likes = p['pulse_likes'][0]['count'];
      }
      if (p['pulse_comments'] != null && (p['pulse_comments'] as List).isNotEmpty) {
        comments = p['pulse_comments'][0]['count'];
      }
      
      p['likes'] = likes;
      p['comments'] = comments;
      
      return Pulse.fromJson(p, user);
    }).toList();
  }

  Future<void> createPulse(String userId, {XFile? mediaFile, bool isVideo = false, String? caption}) async {
    String? mediaUrl;
    String type = 'text';

    if (mediaFile != null) {
      mediaUrl = await StorageService().uploadMedia(
        bucket: 'pulses',
        userId: userId,
        file: mediaFile,
        isVideo: isVideo,
      );
      type = isVideo ? 'video' : 'image';
    }

    await _client.from('pulses').insert({
      'user_id': userId,
      if (mediaUrl != null) 'media_url': mediaUrl,
      'type': type,
      'caption': caption,
    });
  }

  Future<void> togglePulseLike(String pulseId, String userId) async {
     final existing = await _client.from('pulse_likes').select().eq('pulse_id', pulseId).eq('user_id', userId).maybeSingle();
     if (existing != null) {
       await _client.from('pulse_likes').delete().eq('pulse_id', pulseId).eq('user_id', userId);
     } else {
       await _client.from('pulse_likes').insert({'pulse_id': pulseId, 'user_id': userId});
     }
  }

  Future<void> addPulseComment(String pulseId, String userId, String text) async {
     await _client.from('pulse_comments').insert({
       'pulse_id': pulseId,
       'user_id': userId,
       'comment': text,
     });
  }

  Future<void> deletePulse(String pulseId) async {
     await _client.from('pulses').delete().eq('id', pulseId);
  }

  Future<bool> checkPulseLike(String pulseId, String userId) async {
     final res = await _client.from('pulse_likes').select().eq('pulse_id', pulseId).eq('user_id', userId).maybeSingle();
     return res != null;
  }
}
