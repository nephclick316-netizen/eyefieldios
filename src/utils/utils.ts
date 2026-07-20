/**
 * Compresses an image file and converts it to WebP format.
 */
export async function compressImage(file: File, maxWidth = 1024, quality = 0.6): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Trims a video to a maximum duration and compresses it.
 * Uses MediaRecorder to re-record the first X seconds.
 */
export async function trimVideo(file: File, maxDurationSeconds = 15): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const videoUrl = URL.createObjectURL(file);
    
    video.src = videoUrl;
    video.muted = true;
    video.preload = 'auto';
    video.playsInline = true;

    video.onloadedmetadata = () => {
      if (video.duration <= maxDurationSeconds) {
        URL.revokeObjectURL(videoUrl);
        resolve(file); // No need to trim
        return;
      }

      // Setup recording
      const stream = (video as any).captureStream ? (video as any).captureStream() : (video as any).mozCaptureStream ? (video as any).mozCaptureStream() : null;
      
      if (!stream) {
        URL.revokeObjectURL(videoUrl);
        resolve(file); // Fallback to original if captureStream is not supported
        return;
      }

      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp8',
        videoBitsPerSecond: 1500000 // 1.5 Mbps for good balance of quality/size
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        URL.revokeObjectURL(videoUrl);
        resolve(blob);
      };

      video.play();
      recorder.start();

      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
          video.pause();
        }
      }, maxDurationSeconds * 1000);
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(videoUrl);
      reject(err);
    };
  });
}