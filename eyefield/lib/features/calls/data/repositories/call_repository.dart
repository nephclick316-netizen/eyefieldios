import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:eyefield/features/echoes/domain/models/echo.dart';
import 'package:eyefield/features/calls/domain/models/call_record.dart';

class CallRepository {
  static const String appId = "YOUR_AGORA_APP_ID"; // Should be moved to config
  final SupabaseClient _client = Supabase.instance.client;

  Future<List<CallRecord>> getCallHistory(String userId) async {
    try {
      final response = await _client
          .from('call_logs')
          .select('*')
          .or('caller_id.eq.$userId,receiver_id.eq.$userId')
          .order('created_at', ascending: false)
          .limit(20);

      final List<dynamic> data = response as List<dynamic>;
      if (data.isEmpty) return [];

      final userIds = <String>{};
      for (var row in data) {
        userIds.add(row['caller_id']);
        userIds.add(row['receiver_id']);
      }

      final profilesResponse = await _client
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_verified')
          .filter('id', 'in', userIds.toList());

      final profilesMap = {
        for (var p in profilesResponse) p['id']: EchoUser.fromJson(p)
      };

      return data.map((e) {
        final caller = profilesMap[e['caller_id']] ?? EchoUser(id: e['caller_id'], username: 'unknown', displayName: 'Unknown', avatar: '');
        final receiver = profilesMap[e['receiver_id']] ?? EchoUser(id: e['receiver_id'], username: 'unknown', displayName: 'Unknown', avatar: '');
        return CallRecord.fromJson(e, caller, receiver);
      }).toList();
    } catch (e) {
      print('Error fetching call history: $e');
      return []; // Return empty gracefully if table doesn't exist yet
    }
  }

  Future<RtcEngine> initEngine() async {
    await [Permission.microphone, Permission.camera].request();

    final engine = createAgoraRtcEngine();
    await engine.initialize(const RtcEngineContext(
      appId: appId,
      channelProfile: ChannelProfileType.channelProfileCommunication,
    ));

    await engine.enableVideo();
    await engine.startPreview();

    return engine;
  }

  Future<void> joinChannel(RtcEngine engine, String channelId, int uid) async {
    await engine.joinChannel(
      token: '', // Use a token if security is enabled
      channelId: channelId,
      uid: uid,
      options: const ChannelMediaOptions(
        clientRoleType: ClientRoleType.clientRoleBroadcaster,
      ),
    );
  }

  Future<void> leaveChannel(RtcEngine engine) async {
    await engine.leaveChannel();
    await engine.release();
  }
}
