import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { Echo } from '../types';
import { echoService } from '../services/echoService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { profileService } from '../services/profileService'; // Import profileService

export const CommentSheetOverlay: React.FC<{ echo: Echo; onClose: () => void }> = ({ echo, onClose }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchComments();
    return () => {
      isMounted.current = false;
    };
  }, [echo.id]);

  const fetchComments = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const { data } = await echoService.getComments(echo.id);
      if (isMounted.current && data) setComments(data);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || posting || !isMounted.current) return;
    setPosting(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'CommentSheet_getSession');
      if (isMounted.current && session?.user) {
        await echoService.addComment(echo.id, session.user.id, inputText);
        if (isMounted.current) setInputText('');
        fetchComments();
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      if (isMounted.current) setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-black/40 flex items-end">
      <div className="w-full bg-white dark:bg-slate-900 rounded-t-[40px] p-6 h-[75vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        <header className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-black">Comments</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full"><X size={20} /></button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" /></div>
          ) : comments.length === 0 ? (
            <p className="text-center opacity-40 py-20 font-bold uppercase tracking-widest text-xs">No signals yet</p>
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

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <input
            placeholder="Add a comment..."
            className="flex-1 bg-slate-100 dark:bg-slate-800 py-3 px-5 rounded-2xl text-sm outline-none font-medium"
            value={inputText}
            onChange={(e) => { if (isMounted.current) setInputText(e.target.value); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={posting || !inputText.trim()}
            className="p-3 bg-navy-950 text-white rounded-full disabled:opacity-50"
          >
            {posting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
};