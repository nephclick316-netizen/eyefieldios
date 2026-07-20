import { supabase } from "@/integrations/supabase/client";

/**
 * Converts an image Blob to WebP format
 */
const convertToWebP = async (blob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((webpBlob) => {
        if (webpBlob) resolve(webpBlob);
        else reject(new Error("WebP conversion failed"));
      }, 'image/webp', 0.8);
    };
    img.onerror = () => reject(new Error("Failed to load image for conversion"));
    img.src = URL.createObjectURL(blob);
  });
};

export const uploadMedia = async (file: Blob | File, bucket: string, userId: string) => {
  try {
    let finalFile = file;
    let fileExt = 'webp';
    let mimeType = file.type;

    // Only convert if it's an image and not already a video
    if (file.type.startsWith('image/')) {
      finalFile = await convertToWebP(file);
      mimeType = 'image/webp';
      fileExt = 'webp';
    } else {
      fileExt = file.type.split('/')[1] || 'bin';
    }

    const fileName = `${bucket}/${userId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.functions.invoke('r2-presigned-url', {
      body: {
        fileName: fileName,
        fileType: mimeType
      }
    });

    if (error) throw error;
    if (!data || !data.url || !data.publicUrl) {
      throw new Error("Invalid response from edge function");
    }

    // Upload to Cloudflare R2
    const uploadResponse = await fetch(data.url, {
      method: 'PUT',
      body: finalFile,
      headers: {
        'Content-Type': mimeType
      }
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading media:", error);
    throw error;
  }
};