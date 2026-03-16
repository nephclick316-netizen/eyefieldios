import React, { useState, useEffect, useRef } from 'react';
import { X, Camera as CameraIcon, Image as ImageIcon, Loader2, Check, Maximize, Move } from 'lucide-react';
import { pulseService } from '../services/pulseService';
import { storageService } from '../services/storageService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

export const CreatePulseOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mediaAspectRatio, setMediaAspectRatio] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (mediaPreview && mediaPreview.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview]);

  const handleTakePhoto = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.setAttribute('accept', 'image/*');
      fileInputRef.current.click();
    }
  };

  const handlePickMedia = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.setAttribute('accept', 'image/*,video/*');
      fileInputRef.current.click();
    }
  };

  const handleVideoPick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.setAttribute('accept', 'video/*');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isMounted.current) {
      if (mediaPreview && mediaPreview.startsWith('blob:')) {
        URL.revokeObjectURL(mediaPreview);
      }
      setMediaFile(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setMediaType(type);

      const previewUrl = URL.createObjectURL(file);
      setMediaPreview(previewUrl);

      if (type === 'image') {
        const img = new Image();
        img.onload = () => {
          if (isMounted.current) setMediaAspectRatio(img.width / img.height);
        };
        img.src = previewUrl;
      } else {
        const video = document.createElement('video');
        video.onloadedmetadata = () => {
          if (isMounted.current) setMediaAspectRatio(video.videoWidth / video.videoHeight);
        };
        video.src = previewUrl;
      }

      setZoom(1);
      setPosition({ x: 0, y: 0 });
    }
    e.target.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!mediaPreview || !isMounted.current) return;
    setIsDragging(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !isMounted.current) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    if (isMounted.current) {
      setPosition({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    if (isMounted.current) setIsDragging(false);
  };

  const handlePost = async () => {
    if (!mediaFile || !isMounted.current) return;

    setLoading(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'CreatePulse_getSession');
      if (!session?.user || !isMounted.current) throw new Error("No session");

      const mediaUrl = await storageService.uploadPulseMedia(session.user.id, mediaFile) || undefined;
      if (!mediaUrl) throw new Error("Upload failed");

      await pulseService.createPulse(
        session.user.id,
        mediaUrl,
        mediaType,
        caption,
        { scale: zoom, x: position.x, y: position.y }
      );

      if (isMounted.current) onClose();
    } catch (error: any) {
      console.error("Pulse Signal Failed:", error);
      alert(`Failed to post pulse: ${error.message}`);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1300] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom duration-300 pt-safe">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full" disabled={loading}>
          <X size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">New Pulse</h2>
        <button
          onClick={handlePost}
          disabled={loading || !mediaFile}
          className="px-6 py-2 bg-navy-950 text-white rounded-xl font-black text-xs disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Share
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-8 items-center justify-center">
        {mediaPreview ? (
          <div className="w-full space-y-8">
            <div
              className="relative w-full rounded-[40px] overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl border-4 border-slate-50 dark:border-slate-800"
              style={{ paddingTop: mediaAspectRatio ? `${100 / mediaAspectRatio}%` : '100%' }}
            >
              <div
                ref={containerRef}
                className="absolute inset-0 w-full h-full cursor-move touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleMouseDown}
                onTouchMove={handleMouseMove}
                onTouchEnd={handleMouseUp}
              >
                <div
                  className="w-full h-full transition-transform duration-75 ease-out pointer-events-none"
                  style={{
                    transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`
                  }}
                >
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} className="w-full h-full object-contain" autoPlay muted loop />
                  ) : (
                    <img src={mediaPreview} className="w-full h-full object-contain" alt="" />
                  )}
                </div>
              </div>

              <div className="absolute inset-0 pointer-events-none border-[20px] border-white/10 backdrop-blur-[1px]" />
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-xl text-white">
                <Move size={16} />
              </div>
            </div>

            <textarea
              placeholder="Add a caption..."
              className="w-full bg-slate-50 dark:bg-slate-900 py-3 px-5 rounded-2xl text-sm outline-none font-medium resize-none"
              rows={2}
              value={caption}
              onChange={(e) => { if (isMounted.current) setCaption(e.target.value); }}
              disabled={loading}
            />

            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[32px] space-y-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frame Zoom</span>
                <span className="text-xs font-black text-navy-950 dark:text-orange-500">{zoom.toFixed(1)}x</span>
              </div>
              <div className="flex items-center gap-4">
                <Maximize size={16} className="text-slate-400" />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => { if (isMounted.current) setZoom(parseFloat(e.target.value)); }}
                  className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-navy-950 dark:accent-orange-500"
                />
              </div>
              <button
                onClick={() => { if (isMounted.current) { setMediaFile(null); setMediaPreview(null); setMediaAspectRatio(null); setCaption(''); } }}
                className="w-full py-3 text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl"
              >
                Change Media
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm space-y-4">
            <div
              onClick={handleTakePhoto}
              className="w-full aspect-square rounded-[40px] bg-slate-50 dark:bg-slate-900 border-4 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-100 transition-colors group"
            >
              <div className="p-6 bg-white dark:bg-black rounded-3xl shadow-xl group-active:scale-90 transition-transform">
                <CameraIcon size={48} className="text-navy-950 dark:text-navy-300" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black">Capture Pulse</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Photo with Native Camera</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handlePickMedia}
                className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] flex flex-col items-center gap-2 active:scale-95 transition-all text-navy-950 dark:text-white"
              >
                <ImageIcon size={24} />
                <span className="text-[9px] font-black uppercase tracking-widest">Gallery</span>
              </button>
              <button
                onClick={handleVideoPick}
                className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[32px] flex flex-col items-center gap-2 active:scale-95 transition-all text-navy-950 dark:text-white"
              >
                <Loader2 size={24} className="rotate-45" />
                <span className="text-[9px] font-black uppercase tracking-widest">Video</span>
              </button>
            </div>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};