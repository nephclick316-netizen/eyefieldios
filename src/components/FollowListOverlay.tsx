import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import { User } from '../types';
import { followService } from '../services/followService';
import { supabase } from '../utils/supabaseClient';
import { OtherProfileOverlay } from './OtherProfileOverlay';
import { withTimeout } from '../utils/queryUtils';
import LoadingEye from './LoadingEye';

export const FollowListOverlay: React.FC<{ type: 'followers' | 'following'; onClose: () => void }> = ({ type, onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchUsers();
    return () => {
      isMounted.current = false;
    };
  }, [type]);

  const fetchUsers = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'FollowList_getSession');
      if (isMounted.current && session?.user) {
        const data = type === 'followers'
          ? await followService.getFollowers(session.user.id)
          : await followService.getFollowing(session.user.id);
        if (isMounted.current) setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch follow list:", error);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-right duration-300 pt-safe">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="text-sm font-black uppercase tracking-widest">{type} Matrix</h2>
        <div className="w-10" />
      </header>

      <div className="relative mb-6">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={searchQuery}
          onChange={e => { if (isMounted.current) setSearchQuery(e.target.value); }}
          placeholder={`Search ${type}...`}
          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950 transition-all"
        />
      </div>

      <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
        {loading ? (
          <div className="flex justify-center py-10"><LoadingEye size={32} /></div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 opacity-40 font-black uppercase tracking-widest text-xs">No signals found</div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user.id}
              onClick={() => { if (isMounted.current) setSelectedUserId(user.id); }}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[28px] cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                <div>
                  <p className="text-sm font-black">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">@{user.username}</p>
                </div>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl active:scale-95 transition-all">
                {type === 'followers' ? 'Remove' : 'Following'}
              </button>
            </div>
          ))
        )}
      </div>

      {selectedUserId && (
        <OtherProfileOverlay
          userId={selectedUserId}
          onClose={() => { if (isMounted.current) setSelectedUserId(null); }}
        />
      )}
    </div>
  );
};