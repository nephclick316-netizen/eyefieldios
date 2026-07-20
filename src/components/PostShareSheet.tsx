import React, { useState, useEffect, useRef } from 'react';
import { Send, Link as LinkIcon, Activity, Loader2, X, Users, Check } from 'lucide-react';
import { Echo, User } from '../types';
import { pulseService } from '../services/pulseService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { toast } from 'react-hot-toast';

interface PostShareSheetProps {
  echo: Echo;
  onClose: () => void;
  onForward: () => void;
  onPulseShared: () => void;
}

export const PostShareSheet: React.FC<PostShareSheetProps> = ({ echo, onClose, onForward, onPulseShared }) => {
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const fetchUserId = async () => {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'PostShareSheet_getSession');
      if (isMounted.current) setCurrentUserId(session?.user?.id || null);
    };
    fetchUserId();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleShareLink = async () => {
    const shareData = {
      title: 'EyeField Echo',
      text: `Check out this echo from @${echo.user.username}: "${echo.content}"`,
      url: `${window.location.origin}/echo/${echo.id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success("Signal link copied to clipboard.");
      }
      if (isMounted.current) onClose();
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share link.");
    }
  };

  const handleShareToPulse = async () => {
    if (!echo.mediaUrl || !currentUserId || !isMounted.current) {
      toast.error("Only visual echoes can be shared to Pulse.");
      return;
    }

    setLoading(true);
    try {
      await pulseService.createPulse(
        currentUserId,
        echo.mediaUrl,
        'image',
        echo.content, // Use echo content as caption
        echo.transform
      );

      toast.success("Echo transmitted to your Pulse feed.");
      if (isMounted.current) onPulseShared();
    } catch (error) {
      console.error("Failed to transmit pulse:", error);
      toast.error("Failed to transmit pulse.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/40 flex items-end">
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-[40px] p-6 pb-12 animate-in slide-in-from-bottom duration-300 max-h-[80vh] flex flex-col">
        <header className="flex justify-between items-center mb-8 px-2">
          <h2 className="text-xl font-black tracking-tight">Transmit Signal</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
            <X size={20} />
          </button>
        </header>

        <div className="grid grid-cols-2 gap-6">
          <button onClick={handleShareLink} className="flex flex-col items-center gap-3 group">
            <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-[28px] group-active:scale-90 transition-transform">
              <LinkIcon size={28} className="text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Share Link</span>
          </button>

          <button
            onClick={handleShareToPulse}
            disabled={loading || !echo.mediaUrl}
            className="flex flex-col items-center gap-3 group disabled:opacity-30"
          >
            <div className="p-5 bg-slate-100 dark:bg-slate-800 rounded-[28px] group-active:scale-90 transition-transform relative">
              {loading ? (
                <Loader2 size={28} className="animate-spin" />
              ) : (
                <Activity size={28} className="text-orange-500" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Pulse</span>
          </button>
        </div>
      </div>
    </div>
  );
};