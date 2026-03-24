import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:video_player/video_player.dart';
import 'package:eyefield/features/echoes/domain/models/pulse.dart';
import 'package:eyefield/features/echoes/presentation/providers/echo_providers.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';
import 'package:eyefield/features/profile/presentation/screens/profile_screen.dart';

class PulseViewer extends ConsumerStatefulWidget {
  final List<Pulse> pulses;
  final int initialIndex;
  final VoidCallback onFinish;

  const PulseViewer({
    super.key,
    required this.pulses,
    this.initialIndex = 0,
    required this.onFinish,
  });

  @override
  ConsumerState<PulseViewer> createState() => _PulseViewerState();
}

class _PulseViewerState extends ConsumerState<PulseViewer> {
  late int _currentIndex;
  double _progress = 0.0;
  Timer? _timer;
  bool _isPaused = false;
  bool _isLiked = false;
  final TextEditingController _commentController = TextEditingController();
  VideoPlayerController? _videoController;
  final int _durationPerPulse = 5000; // 5 seconds

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _startPulse();
    _checkLikeStatus();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _commentController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  void _startPulse() {
    _timer?.cancel();
    _progress = 0.0;
    
    final pulse = widget.pulses[_currentIndex];
    
    if (pulse.type == 'video') {
      _videoController?.dispose();
      _videoController = VideoPlayerController.networkUrl(Uri.parse(pulse.mediaUrl))
        ..initialize().then((_) {
          if (mounted) {
            setState(() {});
            _videoController?.play();
            _runTimer(duration: _videoController!.value.duration.inMilliseconds);
          }
        });
    } else {
      _runTimer();
    }
  }

  void _runTimer({int? duration}) {
    final effectiveDuration = duration ?? _durationPerPulse;
    const interval = 50;
    _timer = Timer.periodic(const Duration(milliseconds: interval), (timer) {
      if (!_isPaused) {
        setState(() {
          _progress += interval / effectiveDuration;
          if (_progress >= 1.0) {
            timer.cancel();
            _nextPulse();
          }
        });
      }
    });
  }

  void _nextPulse() {
    if (_currentIndex < widget.pulses.length - 1) {
      setState(() {
        _currentIndex++;
        _startPulse();
        _checkLikeStatus();
      });
    } else {
      widget.onFinish();
    }
  }

  void _prevPulse() {
    if (_currentIndex > 0) {
      setState(() {
        _currentIndex--;
        _startPulse();
        _checkLikeStatus();
      });
    } else {
      setState(() {
        _progress = 0.0;
      });
    }
  }

  Future<void> _checkLikeStatus() async {
    final userId = ref.read(authStateProvider).value?.session?.user.id;
    if (userId == null) return;
    final liked = await ref.read(pulseRepositoryProvider).checkPulseLike(widget.pulses[_currentIndex].id, userId);
    if (mounted) setState(() => _isLiked = liked);
  }

  void _handleLike() async {
    final userId = ref.read(authStateProvider).value?.session?.user.id;
    if (userId == null) return;
    setState(() => _isLiked = !_isLiked);
    await ref.read(pulseRepositoryProvider).togglePulseLike(widget.pulses[_currentIndex].id, userId);
  }

  void _handleSendComment() async {
    final userId = ref.read(authStateProvider).value?.session?.user.id;
    if (userId == null || _commentController.text.trim().isEmpty) return;
    final text = _commentController.text.trim();
    _commentController.clear();
    await ref.read(pulseRepositoryProvider).addPulseComment(widget.pulses[_currentIndex].id, userId, text);
  }

  @override
  Widget build(BuildContext context) {
    final pulse = widget.pulses[_currentIndex];
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Content
          GestureDetector(
            onLongPressStart: (_) => setState(() => _isPaused = true),
            onLongPressEnd: (_) => setState(() => _isPaused = false),
            onTapUp: (details) {
              if (details.globalPosition.dx < size.width / 3) {
                _prevPulse();
              } else {
                _nextPulse();
              }
            },
            child: Center(
              child: pulse.type == 'video' && _videoController != null && _videoController!.value.isInitialized
                  ? AspectRatio(
                      aspectRatio: _videoController!.value.aspectRatio,
                      child: VideoPlayer(_videoController!),
                    )
                  : CachedNetworkImage(
                      imageUrl: pulse.mediaUrl,
                      fit: BoxFit.contain,
                      width: double.infinity,
                      placeholder: (context, url) => const Center(child: CircularProgressIndicator(color: Colors.white)),
                    ),
            ),
          ),

          // Progress Bars
          Positioned(
            top: 60,
            left: 10,
            right: 10,
            child: Row(
              children: List.generate(widget.pulses.length, (index) {
                return Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2),
                    child: LinearProgressIndicator(
                      value: index < _currentIndex ? 1.0 : (index == _currentIndex ? _progress : 0.0),
                      backgroundColor: Colors.white.withOpacity(0.3),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                      minHeight: 2,
                    ),
                  ),
                );
              }),
            ),
          ),

          // Header
          Positioned(
            top: 70,
            left: 20,
            right: 20,
            child: Row(
              children: [
                GestureDetector(
                  onTap: () {
                    _timer?.cancel();
                    _videoController?.pause();
                    Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: pulse.user.id)));
                  },
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 20,
                        backgroundImage: CachedNetworkImageProvider(pulse.user.avatar),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            pulse.user.displayName,
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 14),
                          ),
                          Text(
                            pulse.createdAt,
                            style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                if (pulse.user.id == ref.read(authStateProvider).value?.session?.user.id)
                  IconButton(
                    icon: const Icon(LucideIcons.trash2, color: Colors.white, size: 20),
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Delete Pulse?'),
                          content: const Text('This action cannot be undone.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
                          ],
                        ),
                      );
                      if (confirm == true) {
                        await ref.read(pulseRepositoryProvider).deletePulse(pulse.id);
                        if (mounted) widget.onFinish();
                      }
                    },
                  ),
                IconButton(
                  icon: const Icon(LucideIcons.x, color: Colors.white),
                  onPressed: widget.onFinish,
                ),
              ],
            ),
          ),

          // Footer
          Positioned(
            bottom: 40,
            left: 20,
            right: 20,
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: TextField(
                      controller: _commentController,
                      style: const TextStyle(color: Colors.white),
                      onTap: () => setState(() => _isPaused = true),
                      onSubmitted: (_) {
                        _handleSendComment();
                        setState(() => _isPaused = false);
                      },
                      decoration: const InputDecoration(
                        hintText: 'Send a message...',
                        hintStyle: TextStyle(color: Colors.white54),
                        border: InputBorder.none,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                IconButton(
                  icon: Icon(_isLiked ? LucideIcons.heart : LucideIcons.heart, 
                        color: _isLiked ? Colors.red : Colors.white),
                  onPressed: _handleLike,
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(LucideIcons.send, color: Colors.white),
                  onPressed: _handleSendComment,
                ),
              ],
            ),
          ),
          
          // Caption
          if (pulse.caption != null && pulse.caption!.isNotEmpty)
            Positioned(
              bottom: 110,
              left: 20,
              right: 20,
              child: Text(
                pulse.caption!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500),
              ),
            ),
        ],
      ),
    );
  }
}
