import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search as SearchIcon, UserPlus, UserMinus, Loader2, MapPin } from 'lucide-react';
import { profileService } from '../services/profileService';
import { followService } from '../services/followService';
import { User } from '../types';
import { supabase } from '../utils/supabaseClient';
import { OtherProfileOverlay } from './OtherProfileOverlay';
import { withTimeout } from '../utils/queryUtils';
import LoadingEye from './LoadingEye';

export const ContactSearchOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isRegional, setIsRegional] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const init = async () => {
      if (!isMounted.current) return;
      setLoading(true);
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'ContactSearch_getSession');
      if (isMounted.current && session?.user) {
        setCurrentUserId(session.user.id);

        const profile = await profileService.getProfile(session.user.id);
        const following = await followService.getFollowing(session.user.id);
        if (isMounted.current) setFollowingIds(new Set(following.map(f => f.id)));

        if (profile?.phoneNumber) {
          const countryCode = profile.phoneNumber.split(' ')[0];
          const regionalUsers = await profileService.getUsersByRegion(countryCode);
          if (isMounted.current && regionalUsers.length > 0) {
            setUsers(regionalUsers.filter(u => u.id !== session.user.id));
            setIsRegional(true);
          } else if (isMounted.current) {
            const allUsers = await profileService.getAllUsers();
            setUsers(allUsers.filter(u => u.id !== session.user.id));
          }
        } else if (isMounted.current) {
          const allUsers = await profileService.getAllUsers();
          setUsers(allUsers.filter(u => u.id !== session.user.id));
        }
      }
      if (isMounted.current) setLoading(false);
    };
    init();

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (query.trim()) {
      if (isMounted.current) setSearching(true);
      const timer = setTimeout(() => {
        handleSearch(query);
      }, 500);
      return () => clearTimeout(timer);
    } else if (currentUserId && !loading) {
      if (isMounted.current) setSearching(false);
      fetchDefaultUsers();
    }
  }, [query, currentUserId, loading]); // Added currentUserId and loading to dependencies

  const fetchDefaultUsers = async () => {
    if (!currentUserId || !isMounted.current) return;
    const profile = await profileService.getProfile(currentUserId);
    if (profile?.phoneNumber) {
      const countryCode = profile.phoneNumber.split(' ')[0];
      const regionalUsers = await profileService.getUsersByRegion(countryCode);
      if (isMounted.current && regionalUsers.length > 0) {
        setUsers(regionalUsers.filter(u => u.id !== currentUserId));
        setIsRegional(true);
      } else if (isMounted.current) {
        const allUsers = await profileService.getAllUsers();
        setUsers(allUsers.filter(u => u.id !== currentUserId));
        setIsRegional(false);
      }
    } else if (isMounted.current) {
      const allUsers = await profileService.getAllUsers();
      setUsers(allUsers.filter(u => u.id !== currentUserId));
      setIsRegional(false);
    }
  };

  const handleSearch = async (q: string) => {
    if (!isMounted.current) return;
    setIsRegional(false);
    const results = await profileService.searchUsers(q);
    if (isMounted.current) setUsers(results.filter(u => u.id !== currentUserId));
    if (isMounted.current) setSearching(false);
  };

  const handleFollowToggle = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    if (!currentUserId || !isMounted.current) return;

    const isFollowing = followingIds.has(targetId);
    const nextFollowing = new Set(followingIds);

    if (isFollowing) {
      await followService.unfollowUser(currentUserId, targetId);
      nextFollowing.delete(targetId);
    } else {
      await followService.followUser(currentUserId, targetId);
      nextFollowing.add(targetId);
    }
    if (isMounted.current) setFollowingIds(nextFollowing);
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-right duration-300 pt-safe">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="text-sm font-black uppercase tracking-widest">Global Pulse</h2>
        <div className="w-10" />
      </header>

      <div className="relative mb-8">
        <SearchIcon size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={e => { if (isMounted.current) setQuery(e.target.value); }}
          placeholder="Search by profile name..."
          className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950 transition-all"
        />
        {searching && <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-navy-950" />}
      </div>

      <div className="flex-1 flex flex-col">
        {isRegional && users.length > 0 && !searching && (
          <div className="flex items-center gap-2 mb-4 px-2">
            <MapPin size={14} className="text-orange-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nearby Signals</span>
          </div>
        )}

        <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
          {loading ? (
            <div className="flex justify-center py-10"><LoadingEye size={32} /></div>
          ) : users.length === 0 ? (
            <div className="text-center py-20 opacity-40 flex flex-col items-center gap-4">
              <SearchIcon size={40} />
              <p className="font-black uppercase tracking-widest text-xs">No signals found</p>
              <p className="text-[10px] font-medium normal-case max-w-[200px]">Try searching for a different name or ensure other users have joined the field.</p>
            </div>
          ) : (
            users.map(user => (
              <div
                key={user.id}
                onClick={() => { if (isMounted.current) setSelectedUserId(user.id); }}
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-[28px] border border-transparent hover:border-navy-100 dark:hover:border-navy-900 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <img src={user.avatar} className="w-12 h-12 rounded-full object-cover shadow-sm" alt="" />
                  <div>
                    <p className="text-sm font-black">{user.displayName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">@{user.username}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleFollowToggle(e, user.id)}
                  className={`p-3 rounded-xl active:scale-95 transition-all ${followingIds.has(user.id) ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-navy-950 text-white'
                    }`}
                >
                  {followingIds.has(user.id) ? <UserMinus size={18} /> : <UserPlus size={18} />}
                </button>
              </div>
            ))
          )}
        </div>
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