import 'package:flutter/material.dart';
import 'package:agora_rtc_engine/agora_rtc_engine.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:eyefield/features/calls/data/repositories/call_repository.dart';

class CallScreen extends StatefulWidget {
  final String channelId;
  const CallScreen({super.key, required this.channelId});

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  late RtcEngine _engine;
  bool _localUserJoined = false;
  int? _remoteUid;
  final _repository = CallRepository();

  @override
  void initState() {
    super.initState();
    _initAgora();
  }

  Future<void> _initAgora() async {
    _engine = await _repository.initEngine();

    _engine.registerEventHandler(
      RtcEngineEventHandler(
        onJoinChannelSuccess: (RtcConnection connection, int elapsed) {
          setState(() => _localUserJoined = true);
        },
        onUserJoined: (RtcConnection connection, int remoteUid, int elapsed) {
          setState(() => _remoteUid = remoteUid);
        },
        onUserOffline: (RtcConnection connection, int remoteUid, UserOfflineReasonType reason) {
          setState(() => _remoteUid = null);
          Navigator.of(context).pop();
        },
      ),
    );

    await _repository.joinChannel(_engine, widget.channelId, 0);
  }

  @override
  void dispose() {
    _repository.leaveChannel(_engine);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Center(child: _remoteVideo()),
          Align(
            alignment: Alignment.topLeft,
            child: Container(
              width: 120,
              height: 160,
              margin: const EdgeInsets.only(top: 40, left: 20),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white24),
                borderRadius: BorderRadius.circular(12),
              ),
              child: _localUserJoined
                  ? AgoraVideoView(
                      controller: VideoViewController(
                        rtcEngine: _engine,
                        canvas: const VideoCanvas(uid: 0),
                      ),
                    )
                  : const Center(child: CircularProgressIndicator()),
            ),
          ),
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.only(bottom: 60),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _callActionBtn(LucideIcons.micOff, Colors.white24, () {}),
                  const SizedBox(width: 20),
                  _callActionBtn(LucideIcons.phoneOff, Colors.red, () => Navigator.pop(context)),
                  const SizedBox(width: 20),
                  _callActionBtn(LucideIcons.videoOff, Colors.white24, () {}),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _remoteVideo() {
    if (_remoteUid != null) {
      return AgoraVideoView(
        controller: VideoViewController.remote(
          rtcEngine: _engine,
          canvas: VideoCanvas(uid: _remoteUid),
          connection: RtcConnection(channelId: widget.channelId),
        ),
      );
    } else {
      return const Text(
        'Waiting for other user to join...',
        style: TextStyle(color: Colors.white70),
      );
    }
  }

  Widget _callActionBtn(IconData icon, Color color, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 28),
      ),
    );
  }
}
