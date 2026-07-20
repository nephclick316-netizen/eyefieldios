import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, Send, Loader2, Trash2 } from 'lucide-react';
import { Pulse } from '../types';
import { pulseService } from '../services/pulseService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { toast } from 'react-hot-toast';

interface PulseViewerOverlayProps {
  pulses: Pulse[];
  initialPulseId: string;
  onClose: () => void;
  onDeletePulse: (pulseId: string) => void;
}

export const PulseViewerOverlay: React.FC<PulseViewerOverlayProps> = ({ pulses, initialPulseId, onClose, onDeletePulse }) => {
  // Filter pulses to only include those from the user of the initialPulseId
  const initialUserPulses = pulses.filter(p => p.user.id === pulses.find(p => p.id === initialPulseId)?.user.id);
  // Sort them by creation date descending to get the most recent first
  const sortedUserPulses = initialUserPulses.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [currentIndex, setCurrentIndex] = useState(0); // Start with the most recent pulse
  const [progress, setProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false); // Still needed for send logic
  const [isPaused, setIsPaused] = useState(false);
  const [mediaAspectRatio, setMediaAspectRatio] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const currentPulse = sortedUserPulses[currentIndex];
  const duration = 5000; // 5 seconds per pulse
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchUserId = async () => {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'PulseViewer_getSession');
      if (isMounted.current) setCurrentUserId(session?.user?.id || null);
    };
    fetchUserId();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (isPaused || !isMounted.current) return;

    if (isMounted.current) setProgress(0);
    const interval = setInterval(() => {
      if (!isMounted.current) return;
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (duration / 100));
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, sortedUserPulses.length]);

  useEffect(() => {
    if (isMounted.current) {
      checkLikeStatus();
      setMediaAspectRatio(null); // Reset aspect ratio when pulse changes
      if (currentPulse?.mediaUrl) {
        if (currentPulse.type === 'image') {
          const img = new Image();
          img.onload = () => {
            if (isMounted.current) setMediaAspectRatio(img.width / img.height);
          };
          img.src = currentPulse.mediaUrl;
        } else if (currentPulse.type === 'video') {
          const video = document.createElement('video');
          video.onloadedmetadata = () => {
            if (isMounted.current) setMediaAspectRatio(video.videoWidth / video.videoHeight);
          };
          video.src = currentPulse.mediaUrl;
        }
      }
    }
  }, [currentIndex, currentPulse]);

  const checkLikeStatus = async () => {
    const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'PulseViewer_checkLikeStatus_getSession');
    if (!isMounted.current || !session?.user || !currentPulse) return;

    const { data } = await withTimeout(
      (supabase
        .from('pulse_likes')
        .select('*')
        .eq('pulse_id', currentPulse.id)
        .eq('user_id', session.user.id)
        .maybeSingle()) as any,
      10000,
      'PulseViewer_checkLikeStatus'
    );
    if (isMounted.current) setIsLiked(!!data);
  };

  const handleNext = () => {
    if (!isMounted.current) return;
    if (currentIndex < sortedUserPulses.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (!isMounted.current) return;
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      setProgress(0);
    }
  };

  const handleLike = async () => {
    const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'PulseViewer_handleLike_getSession');
    if (!session?.user || !currentPulse || !isMounted.current) return;

    if (isMounted.current) setIsLiked(!isLiked);
    await pulseService.togglePulseLike(currentPulse.id, session.user.id);
  };

  const handleSendComment = async () => {
    const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'PulseViewer_handleSendComment_getSession');
    if (!session?.user || !currentPulse || !commentText.trim() || !isMounted.current) return;

    const text = commentText;
    if (isMounted.current) setCommentText('');
    await pulseService.addPulseComment(currentPulse.id, session.user.id, text);
    // No need to fetch comments if we're not displaying them
  };

  const handleDelete = async () => {
    const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'PulseViewer_handleDelete_getSession');
    if (!currentPulse || !session?.user || currentPulse.user.id !== session.user.id || !isMounted.current) {
      toast.error("You can only delete your own pulses.");
      return;
    }
    if (!confirm('Are you sure you want to delete this pulse?')) return;

    try {
      await pulseService.deletePulse(currentPulse.id);
      toast.success('Pulse Deleted');
      onDeletePulse(currentPulse.id); // Notify parent to remove from list
      onClose(); // Close the viewer
    } catch (error) {
      console.error("Failed to delete pulse:", error);
      toast.error('Failed to delete pulse.');
    }
  };

  if (!currentPulse) return null;

  return (
    <div className="fixed inset-0 z-[2000] bg-white flex flex-col animate-in fade-in duration-300">
      {/* Progress Bars */}
      <div className="absolute top-safe left-4 right-4 z-30 flex gap-1.5 pt-4">
        {sortedUserPulses.map((_, idx) => (
          <div key={idx} className="h-1 flex-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-navy-950 transition-all duration-100 ease-linear"
              style={{
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="absolute top-safe left-0 right-0 z-30 p-4 pt-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={currentPulse.user.avatar} className="w-10 h-10 rounded-xl border-2 border-navy-950/10 object-cover" alt="" />
          <div>
            <p className="text-navy-950 font-black text-sm">@{currentPulse.user.username}</p>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              {new Date(currentPulse.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUserId === currentPulse.user.id && (
            <button onClick={handleDelete} className="p-2 text-red-500 bg-slate-100 rounded-full">
              <Trash2 size={20} />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-navy-950 bg-slate-100 rounded-full">
            <X size={24} />
          </button>
        </div>
      </header>

      {/* Media Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20"> {/* Added vertical padding here */}
        <div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-slate-50"
          style={{ paddingTop: mediaAspectRatio ? `${100 / mediaAspectRatio}%` : '100%' }} // Dynamic aspect ratio
          onMouseDown={() => { if (isMounted.current) setIsPaused(true); }}
          onMouseUp={() => { if (isMounted.current) setIsPaused(false); }}
          onTouchStart={() => { if (isMounted.current) setIsPaused(true); }}
          onTouchEnd={() => { if (isMounted.current) setIsPaused(false); }}
        >
          <div
            className="absolute inset-0 w-full h-full"
            style={currentPulse.transform ? {
              transform: `scale(${currentPulse.transform.scale}) translate(${currentPulse.transform.x / currentPulse.transform.scale}px, ${currentPulse.transform.y / currentPulse.transform.scale}px)`
            } : {}}
          >
            {currentPulse.type === 'video' ? (
              <video src={currentPulse.mediaUrl} className="w-full h-full object-contain" autoPlay muted loop playsInline />
            ) : (
              <img src={currentPulse.mediaUrl} className="w-full h-full object-contain" alt="" />
            )}
          </div>

          {/* Navigation Areas */}
          <div className="absolute inset-0 z-20 flex">
            <div className="flex-1 h-full" onClick={handlePrev} />
            <div className="flex-1 h-full" onClick={handleNext} />
          </div>
        </div>

        {/* Caption - Moved below the card */}
        {currentPulse.caption && (
          <div className="w-full p-4 text-navy-950 dark:text-white text-sm font-medium leading-relaxed text-center">
            {currentPulse.caption}
          </div>
        )}
      </div>

      {/* Interaction Bar */}
      <div className="p-6 space-y-4 safe-bottom">
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-100 rounded-3xl px-4 py-2 flex items-center gap-3">
            <input
              type="text"
              placeholder="Send a message..."
              className="bg-transparent flex-1 text-sm outline-none py-2 font-medium"
              value={commentText}
              onChange={(e) => { if (isMounted.current) setCommentText(e.target.value); }}
              onFocus={() => { if (isMounted.current) setIsPaused(true); }}
              onBlur={() => { if (isMounted.current) setIsPaused(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            />
            <button onClick={handleSendComment} className="text-navy-950">
              <Send size={20} />
            </button>
          </div>
          <button
            onClick={handleLike}
            className={`p-3 rounded-2xl transition-all active:scale-90 ${isLiked ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}
          >
            <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
    </div>
  );
};