import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreVertical, Plus, Trash2, AlertTriangle, RefreshCw, Loader2, RefreshCcw, Play } from 'lucide-react';
import { cacheUtils } from '../utils/cacheUtils';
import { Echo, Story, Pulse, User } from '../types';
import {
  StoryViewerOverlay,
  CommentSheetOverlay,
  CreateEchoOverlay,
  CreatePulseOverlay,
  PostShareSheet,
  PulseBar,
  PulseViewerOverlay,
  ReportOverlay,
  OtherProfileOverlay
} from '../components/Features';
import { supabase } from '../utils/supabaseClient';
import { echoService } from '../services/echoService';
import { pulseService } from '../services/pulseService';
import { toast } from 'react-hot-toast';
import { withTimeout } from '../utils/queryUtils';
import LoadingEye from '../components/LoadingEye';
import { useAuth } from '../contexts/AuthContext';

const ECHO_LIMIT = 10;
const ADMIN_EMAIL = 'edocardadmin@eyefield.pro';

const EchoPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [selectedPulse, setSelectedPulse] = useState<Pulse | null>(null);
  const [commentingOn, setCommentingOn] = useState<Echo | null>(null);
  const [sharingPost, setSharingPost] = useState<Echo | null>(null);
  const [reportingEcho, setReportingEcho] = useState<Echo | null>(null);
  const [showCreatePulse, setShowCreatePulse] = useState(false);
  const [showCreateEcho, setShowCreateEcho] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingEchoes, setLoadingEchoes] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingPulses, setLoadingPulses] = useState(false);
  const [echoesError, setEchoesError] = useState<string | null>(null);
  const [pulsesError, setPulsesError] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [viewingOtherProfile, setViewingOtherProfile] = useState<string | null>(null);
  const [echoesPage, setEchoesPage] = useState(0);
  const [hasMoreEchoes, setHasMoreEchoes] = useState(true);

  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  useEffect(() => {
    isMounted.current = true;
    fetchInitialData();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchInitialData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id]);

  const fetchInitialData = async (isBackground: boolean = false) => {
    if (isMounted.current && !isBackground) setLoadingInitial(true);

    try {
      const cachedEchoes = await cacheUtils.get<Echo[]>('cached_echoes');
      const cachedPulses = await cacheUtils.get<Pulse[]>('cached_pulses');
      if (isMounted.current && cachedEchoes) setEchoes(cachedEchoes);
      if (isMounted.current && cachedPulses) setPulses(cachedPulses);
      if (cachedEchoes || cachedPulses) {
        if (isMounted.current) setLoadingInitial(false);
      }
    } catch (e) {
      console.warn("Failed to load cache", e);
    }

    if (isMounted.current && !isBackground) setEchoesError(null);
    if (isMounted.current && !isBackground) setPulsesError(null);

    try {
      if (currentUser) {
        await fetchUserLikes(currentUser.id);
      }
      await Promise.all([
        fetchEchoes(0, true, isBackground),
        fetchPulses(isBackground)
      ]);
      retryCount.current = 0;
    } catch (error: any) {
      console.error("EchoPage: Failed to fetch initial data:", error);
      
      if (error.message?.includes('timed out') && retryCount.current < 3) {
        retryCount.current++;
        setTimeout(() => fetchInitialData(isBackground), 1000);
        return;
      }

      if (isMounted.current && isAdmin && !isBackground) {
        setEchoesError(`Admin Alert: ${error.message}`);
      }
    } finally {
      if (isMounted.current) setLoadingInitial(false);
    }
  };

  const fetchEchoes = async (page: number = echoesPage, reset: boolean = false, isBackground: boolean = false) => {
    if (!isMounted.current) return;
    if (reset && !isBackground) setLoadingEchoes(true);
    else if (!reset) setLoadingMore(true);

    try {
      const { data, hasMore } = await echoService.getEchoes(page, ECHO_LIMIT);
      if (isMounted.current) {
        setEchoes(prev => {
          const next = reset ? data : [...prev, ...data];
          const deduped = Array.from(new Map(next.map(e => [e.id, e])).values());
          if (page === 0) cacheUtils.set('cached_echoes', deduped);
          return deduped;
        });
        setHasMoreEchoes(hasMore);
        setEchoesPage(page + 1);
      }
    } catch (error: any) {
      console.error("Failed to fetch echoes:", error);
      if (isMounted.current && isAdmin && !isBackground) setEchoesError(`Admin Alert: ${error.message}`);
    } finally {
      if (isMounted.current) {
        setLoadingEchoes(false);
        setLoadingMore(false);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loadingMore && hasMoreEchoes) {
      fetchEchoes();
    }
  };

  const fetchPulses = async (isBackground: boolean = false) => {
    if (isMounted.current && !isBackground) setLoadingPulses(true);
    try {
      const data = await pulseService.getPulses();
      if (isMounted.current) {
        setPulses(data);
        cacheUtils.set('cached_pulses', data);
      }
    } catch (error: any) {
      console.error("Failed to fetch pulses:", error);
      if (isMounted.current && isAdmin && !isBackground) setPulsesError(`Admin Alert: ${error.message}`);
    } finally {
      if (isMounted.current) setLoadingPulses(false);
    }
  };

  const fetchUserLikes = async (userId: string) => {
    try {
      const { data } = await withTimeout(
        supabase
          .from('echo_likes')
          .select('echo_id')
          .eq('user_id', userId) as any,
        30000,
        'fetchUserLikes'
      );

      if (isMounted.current && data) {
        setUserLikes(new Set(data.map(l => l.echo_id)));
      }
    } catch (error) {
      console.error("Failed to fetch user likes:", error);
    }
  };

  const handleLike = async (echoId: string) => {
    if (!currentUser || !isMounted.current) {
      toast.error("Please sign in to like posts.");
      return;
    }

    const nextLikes = new Set(userLikes);
    const isLiked = nextLikes.has(echoId);

    if (isLiked) nextLikes.delete(echoId);
    else nextLikes.add(echoId);
    
    if (isMounted.current) setUserLikes(nextLikes);
    if (isMounted.current) {
      setEchoes(prev => prev.map(e =>
        e.id === echoId ? { ...e, likes: isLiked ? e.likes - 1 : e.likes + 1 } : e
      ));
    }

    try {
      await echoService.toggleLike(echoId, currentUser.id);
    } catch (error) {
      console.error("Like error:", error);
      if (isMounted.current) {
        setUserLikes(prev => {
          const reverted = new Set(prev);
          if (isLiked) reverted.add(echoId);
          else reverted.delete(echoId);
          return reverted;
        });
        setEchoes(prev => prev.map(e =>
          e.id === echoId ? { ...e, likes: isLiked ? e.likes + 1 : e.likes - 1 } : e
        ));
      }
    }
  };

  const handleDeleteEcho = async (echoId: string) => {
    if (!window.confirm('Are you sure you want to delete this echo?')) return;
    try {
      await echoService.deleteEcho(echoId);
      if (isMounted.current) {
        setEchoes(prev => {
          const next = prev.filter(e => e.id !== echoId);
          cacheUtils.set('cached_echoes', next);
          return next;
        });
      }
      toast.success('Echo Deleted');
    } catch (error) {
      toast.error('Deletion Failed');
    }
    if (isMounted.current) setActiveMenu(null);
  };

  const handleDeletePulse = (pulseId: string) => {
    if (isMounted.current) {
      setPulses(prev => {
        const next = prev.filter(p => p.id !== pulseId);
        cacheUtils.set('cached_pulses', next);
        return next;
      });
    }
  };

  const handleReportEcho = async (reason: string) => {
    if (!reportingEcho || !currentUser || !isMounted.current) return;
    try {
      await echoService.reportEcho(reportingEcho.id, currentUser.id, reason);
      toast.success('Report Transmitted');
    } catch (error) {
      toast.error('Transmission Failed');
    } finally {
      if (isMounted.current) setReportingEcho(null);
    }
  };

  return (
    <div className="flex flex-col bg-slate-50 dark:bg-black h-full overflow-y-auto no-scrollbar pb-20" onScroll={handleScroll} data-dyad-component="EchoPage">
      <div className="bg-white/70 dark:bg-black/70 backdrop-blur-2xl p-4 border-b border-white/20 dark:border-white/10 sticky top-0 md:top-0 z-30">
        <div className="max-w-screen-2xl mx-auto">
          {loadingPulses && pulses.length === 0 ? (
            <div className="flex justify-center py-4"><LoadingEye size={32} /></div>
          ) : (
            currentUser && (
              <PulseBar
                pulses={pulses}
                currentUser={currentUser}
                onAddPulse={() => setShowCreatePulse(true)}
                onViewPulse={(p) => setSelectedPulse(p)}
              />
            )
          )}
        </div>
      </div>

      <div className="flex-1 space-y-6 p-4 max-w-2xl mx-auto w-full">
        <div className="flex gap-4">
          <button
            onClick={() => fetchInitialData()}
            className="flex-1 bg-brand-primary text-white p-4 rounded-[24px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
          >
            <RefreshCcw size={20} className={loadingEchoes ? 'animate-spin' : ''} />
            <span className="text-sm font-bold">Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateEcho(true)}
            className="flex-1 bg-white/40 dark:bg-white/5 backdrop-blur-md text-slate-900 dark:text-white p-4 rounded-[24px] flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform border border-white/30 dark:border-white/10"
          >
            <Plus size={20} />
            <span className="text-sm font-bold">New Echo</span>
          </button>
        </div>

        {loadingEchoes && echoes.length === 0 ? (
          <div className="flex justify-center py-10"><LoadingEye /></div>
        ) : echoes.length === 0 ? (
          <div className="text-center py-20 opacity-40 font-black uppercase tracking-widest">No echoes in the field</div>
        ) : (
          <>
            {echoes.map(echo => (
              <div key={echo.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-sm border border-white/30 dark:border-white/10 relative">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setViewingOtherProfile(echo.user.id)}>
                      <img src={echo.user.avatar} className="w-10 h-10 rounded-full object-cover border border-white/20" alt="" />
                    </button>
                    <button onClick={() => setViewingOtherProfile(echo.user.id)}>
                      <h4 className="text-sm font-bold">{echo.user.displayName}</h4>
                    </button>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActiveMenu(activeMenu === echo.id ? null : echo.id)} className="p-2 text-slate-400">
                      <MoreVertical size={18} />
                    </button>
                    {activeMenu === echo.id && (
                      <div className="absolute right-0 top-10 w-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 z-30 overflow-hidden animate-in fade-in zoom-in duration-200">
                        {currentUser?.id === echo.user.id ? (
                          <button onClick={() => handleDeleteEcho(echo.id)} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 size={14} /> Delete Echo
                          </button>
                        ) : (
                          <button onClick={() => { setReportingEcho(echo); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <AlertTriangle size={14} /> Report Signal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {echo.mediaUrl && (
                  <div className="w-full overflow-hidden bg-black flex items-center justify-center">
                    {echo.type === 'video' ? (
                      <div className="relative w-full group">
                        <video 
                          src={echo.mediaUrl} 
                          className="w-full h-auto max-h-[70vh] object-contain" 
                          controls 
                          playsInline
                        />
                      </div>
                    ) : (
                      <img src={echo.mediaUrl} className="w-full h-auto object-contain" alt="" />
                    )}
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <p className="text-sm leading-relaxed font-medium">{echo.content}</p>
                  <div className="flex items-center justify-end gap-6 pt-2 border-t border-white/10">
                    <button onClick={() => handleLike(echo.id)} className={`flex items-center gap-1.5 ${userLikes.has(echo.id) ? 'text-red-500' : 'text-slate-400'}`}>
                      <Heart size={20} fill={userLikes.has(echo.id) ? "currentColor" : "none"} /><span className="text-xs font-black">{echo.likes}</span>
                    </button>
                    <button onClick={() => setCommentingOn(echo)} className="flex items-center gap-1.5 text-slate-400"><MessageCircle size={20} /><span className="text-xs font-black">{echo.comments}</span></button>
                    <button onClick={() => setSharingPost(echo)} className="text-slate-400"><Bookmark size={20} /></button>
                  </div>
                </div>
              </div>
            ))}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="animate-spin text-slate-400" size={24} />
              </div>
            )}
          </>
        )}
      </div>

      {commentingOn && <CommentSheetOverlay echo={commentingOn} onClose={() => setCommentingOn(null)} />}
      {sharingPost && (
        <PostShareSheet
          echo={sharingPost}
          onClose={() => setSharingPost(null)}
          onForward={() => { setSharingPost(null); }}
          onPulseShared={() => { setSharingPost(null); fetchPulses(); }}
        />
      )}
      {reportingEcho && (
        <ReportOverlay
          contentId={reportingEcho.id}
          onClose={() => setReportingEcho(null)}
          onReport={handleReportEcho}
        />
      )}
      {showCreatePulse && <CreatePulseOverlay onClose={() => { setShowCreatePulse(false); fetchPulses(); toast.success('Pulse Transmitted'); }} />}
      {showCreateEcho && <CreateEchoOverlay onClose={() => { setShowCreateEcho(false); fetchEchoes(0, true); toast.success('Echo Posted'); }} />}
      {selectedPulse && (
        <PulseViewerOverlay
          pulses={pulses}
          initialPulseId={selectedPulse.id}
          onClose={() => setSelectedPulse(null)}
          onDeletePulse={handleDeletePulse}
        />
      )}
      {viewingOtherProfile && (
        <OtherProfileOverlay
          userId={viewingOtherProfile}
          onClose={() => setViewingOtherProfile(null)}
        />
      )}
    </div>
  );
};

export default EchoPage;