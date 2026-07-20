import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:eyefield/features/echoes/domain/models/echo.dart';
import 'package:eyefield/core/services/storage_service.dart';
import 'package:image_picker/image_picker.dart';

class EchoRepository {
  final SupabaseClient _client = Supabase.instance.client;
  final StorageService _storage = StorageService();

  Future<List<Echo>> getEchoes({int page = 0, int limit = 10}) async {
    final from = page * limit;
    final to = from + limit - 1;

    final response = await _client
        .from('echoes')
        .select('*, echo_likes(count), echo_comments(count)')
        .order('created_at', ascending: false)
        .range(from, to);

    final List<dynamic> data = response as List<dynamic>;
    
    // Fetch profiles for these echoes
    final userIds = data.map((e) => e['user_id']).toSet().toList();
    final profilesResponse = await _client
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_verified')
        .filter('id', 'in', userIds);
    
    final profilesMap = {
      for (var p in profilesResponse) p['id']: EchoUser.fromJson(p)
    };

    return data.map((e) {
      final user = profilesMap[e['user_id']] ?? 
          EchoUser(id: e['user_id'], username: 'unknown', displayName: 'Unknown User', avatar: '');
      
      return Echo(
        id: e['id'].toString(),
        user: user,
        type: e['type'] ?? 'text',
        content: e['content'] ?? '',
        mediaUrl: e['media_url'],
        likes: (e['echo_likes'] as List).isNotEmpty ? e['echo_likes'][0]['count'] : 0,
        comments: (e['echo_comments'] as List).isNotEmpty ? e['echo_comments'][0]['count'] : 0,
        timestamp: e['created_at'] != null ? DateTime.parse(e['created_at']).toLocal().toString().split(' ')[0] : 'Just now',
        transform: e['transform'],
      );
    }).toList();
  }

  Future<void> createEcho(String userId, String content, {XFile? mediaFile, bool isVideo = false}) async {
    String? mediaUrl;
    String type = 'text';

    if (mediaFile != null) {
      mediaUrl = await _storage.uploadMedia(
        bucket: 'echoes',
        userId: userId,
        file: mediaFile,
        isVideo: isVideo,
      );
      type = isVideo ? 'video' : 'image';
    }

    await _client.from('echoes').insert({
      'user_id': userId,
      'type': type,
      'content': content,
      if (mediaUrl != null) 'media_url': mediaUrl,
    });
  }

  Future<void> deleteEcho(String echoId, String userId) async {
    final echoData = await _client.from('echoes').select('media_url').eq('id', echoId).eq('user_id', userId).maybeSingle();
    if (echoData != null) {
      if (echoData['media_url'] != null) {
        await _storage.deleteMedia(echoData['media_url']);
      }
      await _client.from('echoes').delete().eq('id', echoId).eq('user_id', userId);
    }
  }

  Future<void> reportEcho(String echoId, String reporterId, String reason) async {
    await _client.from('reports').insert({
      'target_id': echoId,
      'target_type': 'echo',
      'reporter_id': reporterId,
      'reason': reason,
    });
  }

  Future<void> toggleLike(String echoId, String userId) async {
    final existing = await _client.from('echo_likes').select('id').eq('echo_id', echoId).eq('user_id', userId).maybeSingle();
    if (existing != null) {
      await _client.from('echo_likes').delete().eq('id', existing['id']);
    } else {
      await _client.from('echo_likes').insert({'echo_id': echoId, 'user_id': userId});
    }
  }

  Future<void> toggleBookmark(String echoId, String userId) async {
    final existing = await _client.from('echo_bookmarks').select('id').eq('echo_id', echoId).eq('user_id', userId).maybeSingle();
    if (existing != null) {
      await _client.from('echo_bookmarks').delete().eq('id', existing['id']);
    } else {
      await _client.from('echo_bookmarks').insert({'echo_id': echoId, 'user_id': userId});
    }
  }

  Future<void> addComment(String echoId, String userId, String text) async {
    await _client.from('echo_comments').insert({
      'echo_id': echoId,
      'user_id': userId,
      'text': text,
    });
  }
}
