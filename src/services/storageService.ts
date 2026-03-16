import { supabase } from '../utils/supabaseClient';
import { compressImage } from '../utils/utils';

/**
 * Helper to upload a file to a Supabase bucket
 */
const uploadToSupabase = async (bucket: string, path: string, file: Blob | File) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: true,
      contentType: file.type
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return publicUrl;
};

export const storageService = {
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    const compressedBlob = await compressImage(file, 800, 0.6);
    const fileName = `${userId}/avatar_${Date.now()}.webp`;
    return uploadToSupabase('avatars', fileName, compressedBlob);
  },

  async uploadProductImage(userId: string, file: File): Promise<string | null> {
    const compressedBlob = await compressImage(file, 1024, 0.7);
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    return uploadToSupabase('products', fileName, compressedBlob);
  },

  async uploadEchoImage(userId: string, file: File): Promise<string | null> {
    const compressedBlob = await compressImage(file, 1024, 0.7);
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    return uploadToSupabase('echoes', fileName, compressedBlob);
  },

  async uploadEchoVideo(userId: string, file: File | Blob): Promise<string | null> {
    const name = file instanceof File ? file.name : `video_${Date.now()}.webm`;
    const fileName = `${userId}/${Date.now()}_${name}`;
    return uploadToSupabase('echoes', fileName, file);
  },

  async uploadPulseMedia(userId: string, file: File): Promise<string | null> {
    const isVideo = file.type.startsWith('video/');
    let finalBlob: Blob | File = file;
    if (!isVideo) {
      finalBlob = await compressImage(file, 1080, 0.8);
    }
    const fileName = `${userId}/${Date.now()}_${file.name}`;
    return uploadToSupabase('pulses', fileName, finalBlob);
  },

  async uploadChatMedia(userId: string, file: File | Blob, bucketName: string = 'chat'): Promise<string | null> {
    const isImage = file instanceof File && file.type.startsWith('image/');
    let finalBlob: Blob | File = file;
    let originalName = file instanceof File ? file.name : 'audio.webm';

    if (isImage) {
      finalBlob = await compressImage(file as File, 1200, 0.8);
    }
    
    const fileName = `${userId}/${Date.now()}_${originalName}`;
    return uploadToSupabase(bucketName, fileName, finalBlob);
  },

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/public/')[1]?.split('/');
      if (!pathParts || pathParts.length < 2) return;

      const bucket = pathParts[0];
      const path = pathParts.slice(1).join('/');

      await supabase.storage.from(bucket).remove([path]);
    } catch (e) {
      console.error("Failed to parse URL for deletion:", e);
    }
  }
};