import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import 'package:eyefield/features/echoes/presentation/providers/echo_providers.dart';
import 'package:eyefield/features/echoes/domain/models/echo.dart';
import 'package:eyefield/features/echoes/domain/models/pulse.dart';
import 'package:eyefield/features/auth/presentation/providers/auth_providers.dart';
import 'package:eyefield/features/echoes/presentation/screens/create_pulse_screen.dart';
import 'package:eyefield/features/echoes/presentation/widgets/pulse_viewer.dart';
import 'package:eyefield/features/profile/presentation/screens/profile_screen.dart';

class EchoListScreen extends ConsumerWidget {
  const EchoListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final echoesAsync = ref.watch(echoesProvider(0));
    final pulsesAsync = ref.watch(pulsesProvider);
    final isDarkMode = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Custom Top Header (Same as Cascadea)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                   Text(
                    'EyeField',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: isDarkMode ? Colors.white : const Color(0xFF00172D),
                    ),
                  ),
                  const Spacer(),
                  Stack(
                    children: [
                      const Icon(LucideIcons.bell, color: Color(0xFF64748B)),
                      Positioned(
                        right: 0,
                        top: 0,
                        child: Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.share2, color: Color(0xFF64748B)),
                  const SizedBox(width: 20),
                  const Icon(LucideIcons.compass, color: Color(0xFF64748B)),
                  const SizedBox(width: 16),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEBE9FE),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(LucideIcons.layoutGrid, size: 16, color: Color(0xFF4F46E5)),
                        const SizedBox(width: 6),
                        const Text(
                          'ENDOCARD',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF4F46E5),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(echoesProvider);
                  ref.invalidate(pulsesProvider);
                  await Future.wait([
                    ref.read(echoesProvider(0).future),
                    ref.read(pulsesProvider.future),
                  ]);
                },
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // pulses section
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              GestureDetector(
                                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePulseScreen())),
                                child: _buildPulseItem(isUser: true)
                              ),
                              const SizedBox(width: 16),
                              pulsesAsync.when(
                                data: (pulses) {
                                  if (pulses.isEmpty) {
                                    return const Text('No pulses in the last 24h', style: TextStyle(color: Colors.grey, fontSize: 12));
                                  }
                                  
                                  // Group pulses by user
                                  final userMap = <String, List<Pulse>>{};
                                  for (var p in pulses) {
                                    userMap.putIfAbsent(p.user.id, () => []).add(p);
                                  }
                                  
                                  return Row(
                                    children: userMap.values.map((userPulses) => Padding(
                                      padding: const EdgeInsets.only(right: 16),
                                      child: GestureDetector(
                                        onTap: () {
                                          Navigator.push(
                                            context,
                                            MaterialPageRoute(
                                              builder: (_) => PulseViewer(
                                                pulses: userPulses,
                                                onFinish: () => Navigator.pop(context),
                                              ),
                                            ),
                                          );
                                        },
                                        child: _buildPulseItem(pulse: userPulses.first),
                                      ),
                                    )).toList(),
                                  );
                                },
                                loading: () => const CircularProgressIndicator(),
                                error: (e, st) => Text('Error: $e', style: const TextStyle(color: Colors.red, fontSize: 10)),
                              ),
                            ],
                          ),
                        ),
                      ),
                      
                      // New Echo Button spanning entire width
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: () => _showNewEchoDialog(context, ref),
                            icon: const Icon(LucideIcons.plus, size: 20, color: Colors.white),
                            label: const Text('Post an Echo', style: TextStyle(fontWeight: FontWeight.w900, color: Colors.white, letterSpacing: 0.5)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF00007A),
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                            ),
                          ),
                        ),
                      ),

                    const SizedBox(height: 24),

                    // Feed
                    echoesAsync.when(
                      data: (echoes) => ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: echoes.length,
                        itemBuilder: (context, index) => EchoCard(echo: echoes[index]),
                      ),
                      loading: () => const Center(child: CircularProgressIndicator()),
                      error: (e, st) => Center(child: Text('Error: $e')),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

  Widget _buildPulseItem({bool isUser = false, Pulse? pulse}) {
    final imageUrl = isUser 
        ? 'https://picsum.photos/seed/me/200' 
        : (pulse != null && pulse.mediaUrl.isNotEmpty ? pulse.mediaUrl : 'https://picsum.photos/seed/pulse${pulse?.id}/200');
    final name = isUser ? 'YOUR PULSE' : (pulse != null ? pulse.user.displayName : 'User');

    return Column(
      children: [
        Stack(
          children: [
            Container(
              width: 80,
              height: 100,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isUser ? const Color(0xFFCBD5E1) : const Color(0xFF4F46E5),
                  width: 1.5,
                  style: BorderStyle.solid,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: CachedNetworkImage(
                   imageUrl: imageUrl,
                   fit: BoxFit.cover,
                   placeholder: (context, url) => const Icon(LucideIcons.image, color: Colors.grey),
                   errorWidget: (context, url, error) => const Icon(LucideIcons.alertCircle, color: Colors.red),
                ),
              ),
            ),
            if (isUser)
              Positioned(
                bottom: 35,
                left: 25,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Color(0xFF0F172A),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(LucideIcons.plus, size: 16, color: Colors.white),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: 80,
          child: Text(
            name,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w900,
              color: Color(0xFF94A3B8),
              letterSpacing: 0.5,
            ),
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ),
      ],
    );
  }

  void _showNewEchoDialog(BuildContext context, WidgetRef ref) {
    final authState = ref.read(authStateProvider);
    final userId = authState.value?.session?.user.id;
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Must be logged in to post')));
      return;
    }

    final textController = TextEditingController();
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    XFile? selectedMedia;
    bool isVideo = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return Container(
              decoration: BoxDecoration(
                color: theme.scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                left: 20,
                right: 20,
                top: 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('New Echo', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: isDark ? Colors.white : const Color(0xFF0F172A))),
                  const SizedBox(height: 16),
                  if (selectedMedia != null)
                    Stack(
                      children: [
                        Container(
                          height: 150,
                          width: double.infinity,
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(16),
                            image: isVideo ? null : DecorationImage(
                              image: (kIsWeb 
                                ? NetworkImage(selectedMedia!.path) 
                                : FileImage(File(selectedMedia!.path))) as ImageProvider, 
                              fit: BoxFit.cover
                            ),
                            color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                          ),
                          child: isVideo ? const Center(child: Icon(LucideIcons.video, size: 48, color: Colors.grey)) : null,
                        ),
                        Positioned(
                          top: 8, right: 8,
                          child: IconButton(
                            icon: const Icon(LucideIcons.xCircle, color: Colors.black),
                            style: IconButton.styleFrom(backgroundColor: Colors.white, padding: const EdgeInsets.all(4)),
                            onPressed: () => setState(() { selectedMedia = null; isVideo = false; }),
                          ),
                        ),
                      ],
                    ),
                  TextField(
                    controller: textController,
                    maxLines: 4,
                    style: TextStyle(color: isDark ? Colors.white : Colors.black),
                    decoration: InputDecoration(
                      hintText: "What's resonating with you?",
                      hintStyle: const TextStyle(color: Color(0xFF94A3B8)),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      IconButton(
                        icon: const Icon(LucideIcons.image),
                        onPressed: () async {
                          final picker = ImagePicker();
                          final picked = await picker.pickImage(source: ImageSource.gallery);
                          if (picked != null) {
                             setState(() { selectedMedia = picked; isVideo = false; });
                          }
                        },
                      ),
                      IconButton(
                        icon: const Icon(LucideIcons.video),
                        onPressed: () async {
                          final picker = ImagePicker();
                          final picked = await picker.pickVideo(source: ImageSource.gallery);
                          if (picked != null) {
                             setState(() { selectedMedia = picked; isVideo = true; });
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (textController.text.trim().isEmpty && selectedMedia == null) return;
                        Navigator.pop(context); // Close dialog immediately
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Posting echo...')));
                        await ref.read(echoRepositoryProvider).createEcho(
                          userId, 
                          textController.text.trim(),
                          mediaFile: selectedMedia,
                          isVideo: isVideo
                        );
                        ref.invalidate(echoesProvider); // Refresh list
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF00007A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('POST ECHO', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                    ),
                  ),
                  const SizedBox(height: 32),
                ],
              ),
            );
          }
        );
      },
    );
  }
}

class EchoCard extends ConsumerStatefulWidget {
  final Echo echo;
  const EchoCard({super.key, required this.echo});

  @override
  ConsumerState<EchoCard> createState() => _EchoCardState();
}

class _EchoCardState extends ConsumerState<EchoCard> {
  bool _isLiked = false;
  bool _isBookmarked = false;
  late int _likesCount;
  late int _commentsCount;

  @override
  void initState() {
    super.initState();
    _likesCount = widget.echo.likes;
    _commentsCount = widget.echo.comments;
  }

  @override
  Widget build(BuildContext context) {
    final echo = widget.echo;
    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: echo.user.id))),
                child: CircleAvatar(
                  radius: 20,
                  backgroundImage: CachedNetworkImageProvider(echo.user.avatar),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => ProfileScreen(userId: echo.user.id))),
                  child: Text(
                    echo.user.username,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                ),
              ),
              PopupMenuButton<String>(
                icon: const Icon(LucideIcons.moreVertical, color: Color(0xFF64748B), size: 20),
                onSelected: (value) async {
                  final currentUser = ref.read(currentUserProvider);
                  if (currentUser == null) return;
                  if (value == 'delete') {
                     await ref.read(echoRepositoryProvider).deleteEcho(echo.id, currentUser.id);
                     ref.invalidate(echoesProvider);
                     if (!context.mounted) return;
                     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Echo deleted.')));
                  } else if (value == 'report') {
                     await ref.read(echoRepositoryProvider).reportEcho(echo.id, currentUser.id, 'Inappropriate content');
                     if (!context.mounted) return;
                     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Echo reported.')));
                  }
                },
                itemBuilder: (context) {
                  final currentUser = ref.read(currentUserProvider);
                  final isOwner = currentUser?.id == echo.user.id;
                  return [
                    if (isOwner)
                      const PopupMenuItem(value: 'delete', child: Text('Delete Echo', style: TextStyle(color: Colors.red))),
                    if (!isOwner)
                      const PopupMenuItem(value: 'report', child: Text('Report Echo')),
                  ];
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (echo.mediaUrl != null && echo.mediaUrl!.isNotEmpty)
            Container(
               margin: const EdgeInsets.only(bottom: 16),
               clipBehavior: Clip.hardEdge,
               decoration: BoxDecoration(borderRadius: BorderRadius.circular(16)),
               child: echo.type == 'video'
                   ? SimpleVideoPlayer(url: echo.mediaUrl!)
                   : CachedNetworkImage(imageUrl: echo.mediaUrl!, fit: BoxFit.cover, width: double.infinity),
             ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Text(
              echo.content,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F172A),
              ),
            ),
          ),
          const SizedBox(height: 12),
          // "Report Signal" badge (Placeholder)
          if (echo.id.hashCode % 3 == 0) // Just to show it on some cards
          Align(
            alignment: Alignment.centerRight,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFF1F5F9)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(LucideIcons.alertTriangle, size: 14, color: Color(0xFF64748B)),
                  SizedBox(width: 8),
                  Text(
                    'Report Signal',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              const Spacer(),
              GestureDetector(
                onTap: () async {
                  setState(() {
                    _isLiked = !_isLiked;
                    _isLiked ? _likesCount++ : _likesCount--;
                  });
                  final userId = ref.read(authStateProvider).value?.session?.user.id;
                  if (userId != null) {
                    await ref.read(echoRepositoryProvider).toggleLike(echo.id, userId);
                  }
                },
                child: Row(
                  children: [
                    Icon(LucideIcons.heart, size: 22, color: _isLiked ? Colors.red : const Color(0xFF94A3B8)),
                    const SizedBox(width: 8),
                    Text('$_likesCount', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                  ]
                ),
              ),
              const SizedBox(width: 24),
              GestureDetector(
                onTap: () {
                   // Placeholder for Comment dialog
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Comment overlay pending')));
                },
                child: Row(
                  children: [
                    const Icon(LucideIcons.messageSquare, size: 22, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 8),
                    Text('$_commentsCount', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF475569))),
                  ]
                ),
              ),
              const SizedBox(width: 24),
              GestureDetector(
                onTap: () async {
                  setState(() => _isBookmarked = !_isBookmarked);
                  final userId = ref.read(authStateProvider).value?.session?.user.id;
                  if (userId != null) {
                    await ref.read(echoRepositoryProvider).toggleBookmark(echo.id, userId);
                  }
                },
                child: Icon(LucideIcons.bookmark, size: 22, color: _isBookmarked ? Colors.blue : const Color(0xFF94A3B8)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class SimpleVideoPlayer extends StatefulWidget {
  final String url;
  const SimpleVideoPlayer({super.key, required this.url});
  @override
  State<SimpleVideoPlayer> createState() => _SimpleVideoPlayerState();
}

class _SimpleVideoPlayerState extends State<SimpleVideoPlayer> {
  late VideoPlayerController _controller;
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _controller = VideoPlayerController.networkUrl(Uri.parse(widget.url))
      ..initialize().then((_) {
        if (mounted) setState(() { _initialized = true; });
      });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_initialized) return const AspectRatio(aspectRatio: 16/9, child: Center(child: CircularProgressIndicator()));
    return AspectRatio(
      aspectRatio: _controller.value.aspectRatio,
      child: Stack(
        alignment: Alignment.center,
        children: [
          VideoPlayer(_controller),
          IconButton(
            icon: Icon(
              _controller.value.isPlaying ? LucideIcons.pauseCircle : LucideIcons.playCircle, 
              size: 48, 
              color: Colors.white,
              shadows: const [Shadow(color: Colors.black45, blurRadius: 10)],
            ),
            onPressed: () => setState(() { _controller.value.isPlaying ? _controller.pause() : _controller.play(); }),
          ),
        ],
      ),
    );
  }
}
