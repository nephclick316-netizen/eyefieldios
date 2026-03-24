import 'dart:typed_data';
import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class StorageService {
  final SupabaseClient _client = Supabase.instance.client;

  Future<String?> uploadMedia({
    required String bucket,
    required String userId,
    required XFile file,
    required bool isVideo,
    int minWidth = 1080,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final fileName = '$userId/${timestamp}_${file.name}';
      final Uint8List bytes = await file.readAsBytes();

      if (!isVideo && !kIsWeb) {
        // Compress image to WebP (only on mobile/desktop)
        try {
          final Uint8List? compressedBytes = await FlutterImageCompress.compressWithList(
            bytes,
            minWidth: minWidth,
            quality: 80,
            format: CompressFormat.webp,
          );

          if (compressedBytes != null) {
            final webpFileName = fileName.replaceAll(RegExp(r'\.[A-Za-z0-9]+$'), '.webp');
            await _client.storage.from(bucket).uploadBinary(
              webpFileName,
              compressedBytes,
              fileOptions: const FileOptions(contentType: 'image/webp', upsert: true),
            );
            return _client.storage.from(bucket).getPublicUrl(webpFileName);
          }
        } catch (e) {
          debugPrint('Compression error: $e');
          // Fallback to raw bytes below
        }
      }

      // Upload raw bytes for web or if compression skipped/failed
      await _client.storage.from(bucket).uploadBinary(
        fileName,
        bytes,
        fileOptions: FileOptions(
          contentType: isVideo ? 'video/mp4' : (file.mimeType ?? 'image/jpeg'), 
          upsert: true
        ),
      );
      return _client.storage.from(bucket).getPublicUrl(fileName);
    } catch (e) {
      debugPrint('StorageService upload error: $e');
      return null;
    }
  }

  Future<void> deleteMedia(String publicUrl) async {
    try {
      final uri = Uri.parse(publicUrl);
      final pathSegments = uri.pathSegments;
      final publicIndex = pathSegments.indexOf('public');
      
      if (publicIndex != -1 && publicIndex + 2 < pathSegments.length) {
        final bucket = pathSegments[publicIndex + 1];
        final path = pathSegments.sublist(publicIndex + 2).join('/');
        await _client.storage.from(bucket).remove([path]);
      }
    } catch (e) {
      print('StorageService delete error: $e');
    }
  }
}
