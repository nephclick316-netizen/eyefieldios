import React, { useState, useRef, useEffect } from 'react';
import { X, Camera as CameraIcon, Image as ImageIcon, Loader2, Maximize, Move, Video } from 'lucide-react';
import { echoService } from '../services/echoService';
import { storageService } from '../services/storageService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { toast } from 'react-hot-toast';
import { trimVideo } from '../utils/utils';

export const CreateEchoOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | Blob | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      fileInputRef.current.setAttribute('accept', 'image/*,video/*');
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isMounted.current) {
      const isVideo = file.type.startsWith('video/');
      
      if (isVideo) {
        setProcessing(true);
        try {
          const trimmedBlob = await trimVideo(file, 15);
          if (!isMounted.current) return;

          setMediaType('video');
          setMediaFile(trimmedBlob);
          const url = URL.createObjectURL(trimmedBlob);
          setMediaPreview(url);

          const video = document.createElement('video');
          video.onloadedmetadata = () => {
            if (isMounted.current) setAspectRatio(video.videoWidth / video.videoHeight);
          };
          video.src = url;

          setZoom(1);
          setPosition({ x: 0, y: 0 });
          if (file.size !== trimmedBlob.size) {
            toast.success("Video trimmed to 15s");
          }
        } catch (err) {
          toast.error("Failed to process video");
        } finally {
          if (isMounted.current) setProcessing(false);
        }
      } else {
        setMediaType('image');
        setMediaFile(file);
        const url = URL.createObjectURL(file);
        setMediaPreview(url);

        const img = new Image();
        img.onload = () => {
          if (isMounted.current) setAspectRatio(img.width / img.height);
        };
        img.src = url;

        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
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
    if ((!content.trim() && !mediaFile) || !isMounted.current) return;

    setLoading(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'CreateEcho_getSession');
      if (!session?.user || !isMounted.current) throw new Error("No session");

      let mediaUrl: string | undefined = undefined;
      if (mediaFile) {
        if (mediaType === 'video') {
          mediaUrl = await storageService.uploadEchoVideo(session.user.id, mediaFile) || undefined;
        } else {
          mediaUrl = await storageService.uploadEchoImage(session.user.id, mediaFile as File) || undefined;
        }
      }

      await echoService.createEcho(
        session.user.id,
        content,
        mediaType,
        mediaUrl,
        mediaFile ? { scale: zoom, x: position.x, y: position.y } : undefined
      );

      if (isMounted.current) onClose();
    } catch (error: any) {
      console.error("Transmission Failed:", error);
      toast.error(`Failed to post echo: \${error.message || 'Unknown error'}`);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom duration-300 pt-safe overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full" disabled={loading || processing}>
          <X size={20} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">New Echo</h2>
        <button
          onClick={handlePost}
          disabled={loading || processing || (!content.trim() && !mediaFile)}
          className="px-6 py-2 bg-navy-950 text-white rounded-xl font-black text-xs disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Post
        </button>
      </header>

      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center gap-4 pb-2">
          <button
            onClick={handlePickMedia}
            className="flex items-center gap-2 text-navy-950 dark:text-navy-300 font-bold text-sm"
            disabled={loading || processing}
          >
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              {processing ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
            </div>
            <span className="text-[10px] uppercase tracking-widest">{processing ? 'Processing...' : 'Media'}</span>
          </button>
          <button
            onClick={handleTakePhoto}
            className="flex items-center gap-2 text-navy-950 dark:text-navy-300 font-bold text-sm"
            disabled={loading || processing}
          >
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl">
              <CameraIcon size={20} />
            </div>
            <span className="text-[10px] uppercase tracking-widest">Capture</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,video/*"
            className="hidden"
          />
        </div>

        <textarea
          placeholder="What's happening in the EyeField?"
          className="w-full bg-transparent p-0 text-xl font-medium outline-none resize-none border-none min-h-[100px]"
          value={content}
          onChange={(e) => { if (isMounted.current) setContent(e.target.value); }}
          disabled={loading || processing}
          autoFocus
        />

        {mediaPreview && (
          <div className="space-y-6">
            <div
              className="relative w-full rounded-[40px] overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-2xl border-4 border-slate-50 dark:border-slate-800"
              style={{ paddingTop: aspectRatio ? `\${100 / aspectRatio}%` : '100%' }}
            >
              <div
                className="absolute inset-0 cursor-move touch-none"
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
                    transform: `scale(\${zoom}) translate(\${position.x / zoom}px, \${position.y / zoom}px)`
                  }}
                >
                  {mediaType === 'video' ? (
                    <video src={mediaPreview} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                  ) : (
                    <img src={mediaPreview} className="w-full h-full object-cover" alt="" />
                  )}
                </div>
              </div>
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2 rounded-xl text-white">
                <Move size={16} />
              </div>
              <button
                onClick={() => { if (isMounted.current) { setMediaFile(null); setMediaPreview(null); setAspectRatio(null); setMediaType('text'); } }}
                className="absolute top-4 left-4 p-2 bg-black/40 backdrop-blur-md text-white rounded-xl"
              >
                <X size={16} />
              </button>
              {mediaType === 'video' && (
                <div className="absolute bottom-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest">
                  15s Limit Active
                </div>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[32px] space-y-6">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Visual Zoom</span>
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};