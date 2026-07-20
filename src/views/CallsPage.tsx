import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Video,
  X,
  Search,
  UserPlus,
  Loader2
} from 'lucide-react';
import { User, CallRecord } from '../types';
import { callService } from '../services/callService';
import { followService } from '../services/followService';
import { formatDistanceToNow } from 'date-fns';
import LoadingEye from '../components/LoadingEye';
import { toast } from 'react-hot-toast';
import { useCall } from '../contexts/CallContext';

// --- New Call Picker ---
const NewCallPicker: React.FC<{ contacts: User[]; onClose: () => void; onStartCall: (user: User, type: 'voice' | 'video') => void }> = ({ contacts, onClose, onStartCall }) => {
  const [search, setSearch] = useState('');
  const filteredUsers = contacts.filter(u => u.displayName.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[500] bg-white dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="p-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 safe-top">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><X size={24} /></button>
        <h2 className="font-bold">New Call</h2>
        <div className="w-10" />
      </header>

      <div className="p-4 flex-1 overflow-y-auto no-scrollbar">
        <div className="relative mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm focus:ring-1 focus:ring-brand-primary outline-none"
          />
        </div>

        <div className="space-y-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 opacity-50 text-sm font-bold">No contacts found</div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-transparent hover:border-brand-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} className="w-12 h-12 rounded-full border border-slate-200 object-cover" alt="" />
                  <div>
                    <p className="font-bold text-sm">{user.displayName}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-medium">@{user.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartCall(user, 'voice')}
                    className="p-3 bg-brand-primary text-white rounded-xl active:scale-90 transition-transform"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={() => onStartCall(user, 'video')}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-brand-primary dark:text-navy-200 rounded-xl active:scale-90 transition-transform"
                  >
                    <Video size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface CallsPageProps {
  currentUser: User;
}

const CallsPage: React.FC<CallsPageProps> = ({ currentUser }) => {
  // REMOVED: const { startCall } = useCall();
  const [showNewCallPicker, setShowNewCallPicker] = useState(false);
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isMounted = useRef(true);

  useEffect(() => {
    if (!currentUser) return;
    isMounted.current = true;
    loadData(0, true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(0, true, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id]);

  const loadData = async (pageNum: number = page, reset: boolean = false, isBackground: boolean = false) => {
    if (!isMounted.current || !currentUser) return;
    if (reset && !isBackground) setLoading(true);
    else if (!reset) setLoadingMore(true);

    try {
      const [historyRes, following] = await Promise.all([
        callService.getCallHistory(currentUser.id, pageNum, 15),
        reset ? followService.getFollowing(currentUser.id) : Promise.resolve(contacts)
      ]);

      if (isMounted.current) {
        setCallHistory(prev => reset ? historyRes.data : [...prev, ...historyRes.data]);
        setHasMore(historyRes.hasMore);
        setPage(pageNum + 1);
        if (reset) setContacts(following);
      }
    } catch (error) {
      console.error("Failed to load calls data", error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loadingMore && hasMore) {
      loadData();
    }
  };

  const { startCall } = useCall();
  
  const initiateCall = (user: User, type: 'voice' | 'video') => {
    startCall(user, type);
    setShowNewCallPicker(false);
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === 'missed' || call.status === 'rejected') {
      return <PhoneMissed size={12} className="text-red-500" />;
    }
    if (call.is_caller) {
      return <PhoneOutgoing size={12} className="text-blue-600" />;
    }
    return <PhoneIncoming size={12} className="text-green-500" />;
  };

  if (!currentUser) return null;

  if (loading) {
    return <div className="flex justify-center py-20"><LoadingEye size={40} /></div>;
  }

  return (
    <div className="p-4 space-y-6 pb-24 h-full overflow-y-auto no-scrollbar" onScroll={handleScroll}>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Calls</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowNewCallPicker(true)}
            className="p-2.5 bg-brand-primary text-white rounded-xl shadow-lg active:scale-90 transition-transform flex items-center gap-2 px-4"
          >
            <UserPlus size={18} />
            <span className="text-xs font-bold uppercase">New Call</span>
          </button>
        </div>
      </header>

      {/* Call History */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px] ml-2">Recent</h3>
        {callHistory.length === 0 ? (
          <div className="text-center py-10 opacity-50 text-sm font-bold">No recent calls</div>
        ) : (
          <>
            {callHistory.map((call) => (
              <div key={call.id} className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-50 dark:border-slate-800 transition-all active:scale-[0.98]">
                <div className="relative">
                  <img src={call.other_user.avatar} className="w-14 h-14 rounded-full border-2 border-white dark:border-black shadow-sm object-cover" alt="" />
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-black flex items-center justify-center ${call.status === 'missed' || call.status === 'rejected' ? 'bg-red-500' : 'bg-green-500'}`}>
                    <div className="w-1 h-1 bg-white rounded-full" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{call.other_user.displayName}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    {getCallIcon(call)}
                    <span className={`text-[11px] font-medium ${call.status === 'missed' || call.status === 'rejected' ? 'text-red-500' : 'text-slate-500'}`}>
                      {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => initiateCall(call.other_user, 'video')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-brand-primary dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
                  >
                    <Video size={18} />
                  </button>
                  <button
                    onClick={() => initiateCall(call.other_user, 'voice')}
                    className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-brand-primary dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
                  >
                    <Phone size={18} />
                  </button>
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

      <div className="mt-8">
        <div className="flex items-center justify-between px-2 mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Quick Contacts</h3>
          <button onClick={() => setShowNewCallPicker(true)} className="text-[10px] font-bold text-brand-primary dark:text-white">View All</button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {contacts.length === 0 ? (
            <div className="text-center py-6 opacity-50 text-sm font-bold">Follow people to see them here</div>
          ) : (
            contacts.slice(0, 5).map(user => (
              <div key={user.id} className="flex items-center justify-between bg-white dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} className="w-10 h-10 rounded-full border border-slate-100 dark:border-slate-800 object-cover" alt="" />
                  <div>
                    <span className="text-xs font-bold block">{user.displayName}</span>
                    <span className="text-[9px] text-slate-500">@{user.username}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => initiateCall(user, 'video')}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-brand-primary dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-90"
                  >
                    <Video size={16} />
                  </button>
                  <button
                    onClick={() => initiateCall(user, 'voice')}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-brand-primary dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-90"
                  >
                    <Phone size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Overlays */}
      {showNewCallPicker && (
        <NewCallPicker
          contacts={contacts}
          onClose={() => setShowNewCallPicker(false)}
          onStartCall={(u, t) => initiateCall(u, t)}
        />
      )}
    </div>
  );
};

export default CallsPage;