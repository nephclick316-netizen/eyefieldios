import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:image_picker/image_picker.dart';
import 'package:video_player/video_player.dart';
import '../providers/echo_providers.dart';
import '../../../auth/presentation/providers/auth_providers.dart';

class CreatePulseScreen extends ConsumerStatefulWidget {
  const CreatePulseScreen({super.key});

  @override
  ConsumerState<CreatePulseScreen> createState() => _CreatePulseScreenState();
}

class _CreatePulseScreenState extends ConsumerState<CreatePulseScreen> {
  final _captionController = TextEditingController();
  XFile? _mediaFile;
  bool _isVideo = false;
  bool _isLoading = false;
  VideoPlayerController? _videoController;

  @override
  void dispose() {
    _captionController.dispose();
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _pickMedia(bool isVideo) async {
    final picker = ImagePicker();
    final pickedFile = isVideo 
        ? await picker.pickVideo(source: ImageSource.gallery)
        : await picker.pickImage(source: ImageSource.gallery);
        
    if (pickedFile != null) {
      setState(() {
        _mediaFile = pickedFile;
        _isVideo = isVideo;
      });
      
      if (isVideo) {
        _videoController?.dispose();
        _videoController = kIsWeb 
            ? VideoPlayerController.network(_mediaFile!.path)
            : VideoPlayerController.file(File(_mediaFile!.path))
          ..initialize().then((_) {
            setState(() {});
            _videoController!.setLooping(true);
            _videoController!.play();
          });
      }
    }
  }

  Future<void> _postPulse() async {
    if (_mediaFile == null) return;
    
    final userId = ref.read(authStateProvider).value?.session?.user.id;
    if (userId == null) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(pulseRepositoryProvider).createPulse(
        userId,
        mediaFile: _mediaFile,
        isVideo: _isVideo,
        caption: _captionController.text.trim().isNotEmpty ? _captionController.text.trim() : null,
      );
      
      ref.invalidate(pulsesProvider);
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(LucideIcons.x, color: isDark ? Colors.white : Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text('NEW PULSE', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, letterSpacing: 1.5, color: isDark ? Colors.white : Colors.black)),
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: TextButton(
              onPressed: (_isLoading || _mediaFile == null) ? null : _postPulse,
              style: TextButton.styleFrom(
                backgroundColor: _mediaFile != null ? const Color(0xFF0F172A) : Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                padding: const EdgeInsets.symmetric(horizontal: 24),
              ),
              child: _isLoading 
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('SHARE', style: TextStyle(fontWeight: FontWeight.w900, color: _mediaFile != null ? Colors.white : Colors.grey)),
            ),
          )
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_mediaFile != null) ...[
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(40),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        if (_isVideo && _videoController != null && _videoController!.value.isInitialized)
                          AspectRatio(
                            aspectRatio: _videoController!.value.aspectRatio,
                            child: VideoPlayer(_videoController!),
                          )
                        else if (!_isVideo)
                          kIsWeb 
                              ? Image.network(_mediaFile!.path, fit: BoxFit.cover, width: double.infinity, height: double.infinity)
                              : Image.file(File(_mediaFile!.path), fit: BoxFit.cover, width: double.infinity, height: double.infinity),
                          
                        Positioned(
                          top: 16, right: 16,
                          child: GestureDetector(
                            onTap: () {
                              setState(() {
                                _mediaFile = null;
                                _videoController?.dispose();
                                _videoController = null;
                              });
                            },
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(color: Colors.black.withOpacity(0.5), shape: BoxShape.circle),
                              child: const Icon(LucideIcons.trash2, color: Colors.white, size: 20),
                            ),
                          ),
                        )
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _captionController,
                  maxLines: 3,
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                  decoration: InputDecoration(
                    hintText: 'Add a caption...',
                    filled: true,
                    fillColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.all(20),
                  ),
                ),
              ] else ...[
                 Expanded(
                   child: Column(
                     mainAxisAlignment: MainAxisAlignment.center,
                     children: [
                       GestureDetector(
                         onTap: () => _pickMedia(false),
                         child: Container(
                           padding: const EdgeInsets.all(32),
                           decoration: BoxDecoration(
                             color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                             shape: BoxShape.circle,
                           ),
                           child: const Icon(LucideIcons.camera, size: 48, color: Color(0xFF94A3B8)),
                         ),
                       ),
                       const SizedBox(height: 24),
                       const Text('Capture Pulse', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                       const SizedBox(height: 8),
                       const Text('PHOTO OR VIDEO', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF94A3B8), letterSpacing: 2)),
                       const SizedBox(height: 48),
                       Row(
                         mainAxisAlignment: MainAxisAlignment.center,
                         children: [
                           _buildOptionBtn(LucideIcons.image, 'Gallery', () => _pickMedia(false), isDark),
                           const SizedBox(width: 16),
                           _buildOptionBtn(Icons.play_circle_outline, 'Video', () => _pickMedia(true), isDark),
                         ],
                       )
                     ],
                   ),
                 )
              ]
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionBtn(IconData icon, String label, VoidCallback onTap, bool isDark) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(32),
        ),
        child: Column(
          children: [
            Icon(icon, size: 24, color: isDark ? Colors.white : const Color(0xFF0F172A)),
            const SizedBox(height: 8),
            Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
          ],
        ),
      ),
    );
  }
}
