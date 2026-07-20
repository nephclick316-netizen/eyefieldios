import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Bookmark, Send, Loader2 } from 'lucide-react';
import { Echo, User } from '../types';
import { echoService } from '../services/echoService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { toast } from 'react-hot-toast';
import { PostShareSheet } from './PostShareSheet';

interface EchoDetailOverlayProps {
  echo: Echo;
  onClose: () => void;
}

export const EchoDetailOverlay: React.FC<EchoDetailOverlayProps> = ({ echo: initialEcho, onClose }) => {
  const [echo, setEcho] = useState(initialEcho);
  const [comments, setComments] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  const [posting, setPosting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchInitialData();
    return () => {
      isMounted.current = false;
    };
  }, [echo.id]);

  const fetchInitialData = async () => {
    const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'EchoDetail_getSession');
    if (isMounted.current && session?.user) {
      setCurrentUserId(session.user.id);
      checkLikeStatus(session.user.id);
    }
    fetchComments();
  };

  const checkLikeStatus = async (userId: string) => {
    try {
      const { data } = await withTimeout(
        (supabase
          .from('echo_likes')
          .select('id')
          .eq('echo_id', echo.id)
          .eq('user_id', userId)
          .maybeSingle()) as any,
        10000,
        'EchoDetail_checkLikeStatus'
      );
      if (isMounted.current) setIsLiked(!!data);
    } catch (error) {
      console.error("Failed to check like status:", error);
    }
  };

  const fetchComments = async () => {
    if (!isMounted.current) return;
    setLoadingComments(true);
    try {
      const { data } = await echoService.getComments(echo.id);
      if (isMounted.current && data) setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      if (isMounted.current) setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId || !isMounted.current) {
      toast.error("Please sign in to like posts.");
      return;
    }

    const newLikedState = !isLiked;
    if (isMounted.current) {
      setIsLiked(newLikedState);
      setEcho(prev => ({ ...prev, likes: newLikedState ? prev.likes + 1 : prev.likes - 1 }));
    }

    try {
      await echoService.toggleLike(echo.id, currentUserId);
    } catch (error) {
      // Revert on error
      if (isMounted.current) {
        setIsLiked(!newLikedState);
        setEcho(prev => ({ ...prev, likes: !newLikedState ? prev.likes + 1 : prev.likes - 1 }));
      }
      toast.error("Failed to like post.");
    }
  };

  const handleSendComment = async () => {
    if (!inputText.trim() || posting || !currentUserId || !isMounted.current) return;
    setPosting(true);
    try {
      await echoService.addComment(echo.id, currentUserId, inputText);
      if (isMounted.current) {
        setInputText('');
        setEcho(prev => ({ ...prev, comments: prev.comments + 1 }));
      }
      fetchComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
      toast.error("Failed to post comment.");
    } finally {
      if (isMounted.current) setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-300 pt-safe">
      <header className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white/90 dark:bg-black/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <img src={echo.user.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
          <div>
            <h4 className="text-sm font-bold">{echo.user.displayName}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{echo.user.username}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full">
          <X size={20} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {echo.mediaUrl && (
          <div className="w-full bg-slate-100 dark:bg-slate-900">
            <img src={echo.mediaUrl} className="w-full h-auto object-contain max-h-[60vh]" alt="" />
          </div>
        )}

        <div className="p-5 space-y-4">
          <p className="text-sm leading-relaxed font-medium">{echo.content}</p>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-6">
              <button onClick={handleLike} className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-slate-400'}`}>
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                <span className="text-sm font-black">{echo.likes}</span>
              </button>
              <div className="flex items-center gap-2 text-slate-400">
                <MessageCircle size={24} />
                <span className="text-sm font-black">{echo.comments}</span>
              </div>
            </div>
            <button onClick={() => setShowShare(true)} className="text-slate-400">
              <Bookmark size={24} />
            </button>
          </div>
        </div>

        <div className="px-5 pb-5 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comments</h3>
          {loadingComments ? (
            <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : comments.length === 0 ? (
            <p className="text-center opacity-40 py-10 font-bold uppercase tracking-widest text-xs">No signals yet</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <img src={c.profiles.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                  <p className="text-[10px] font-black text-navy-950 dark:text-orange-500 mb-1">@{c.profiles.username}</p>
                  <p className="text-xs font-medium leading-relaxed">{c.text}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 safe-bottom">
        <div className="flex items-center gap-3">
          <input
            placeholder="Add a comment..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 px-5 rounded-2xl text-sm outline-none font-medium"
            value={inputText}
            onChange={(e) => { if (isMounted.current) setInputText(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
          />
          <button
            onClick={handleSendComment}
            disabled={posting || !inputText.trim()}
            className="p-3 bg-navy-950 text-white rounded-full disabled:opacity-50"
          >
            {posting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>

      {showShare && (
        <PostShareSheet
          echo={echo}
          onClose={() => setShowShare(false)}
          onForward={() => { setShowShare(false); }}
          onPulseShared={() => { setShowShare(false); }}
        />
      )}
    </div>
  );
};