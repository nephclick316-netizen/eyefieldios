import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, MessageCircle, UserPlus } from 'lucide-react';
import { User } from '../../types';
import { followService } from '../../services/followService';
import LoadingEye from '../LoadingEye';

interface FollowersChatOverlayProps {
    currentUserId: string;
    onClose: () => void;
    onSelectUser: (user: User) => void;
}

export const FollowersChatOverlay: React.FC<FollowersChatOverlayProps> = ({ currentUserId, onClose, onSelectUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        fetchFollowers();
        return () => {
            isMounted.current = false;
        };
    }, [currentUserId]);

    const fetchFollowers = async () => {
        if (!isMounted.current) return;
        setLoading(true);
        try {
            const data = await followService.getFollowers(currentUserId);
            if (isMounted.current) setUsers(data);
        } catch (error) {
            console.error("Failed to fetch followers for chat:", error);
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.id !== currentUserId &&
        (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom-4 duration-300 pt-safe" data-dyad-component="FollowersChatOverlay">
            <header className="flex justify-between items-center mb-6">
                <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h2 className="text-sm font-black uppercase tracking-widest text-navy-950 dark:text-white">Start Conversation</h2>
                <div className="w-10" />
            </header>

            <div className="relative mb-6">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    value={searchQuery}
                    onChange={e => { if (isMounted.current) setSearchQuery(e.target.value); }}
                    placeholder="Search followers..."
                    className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white transition-all text-navy-950 dark:text-white placeholder:text-slate-500"
                />
            </div>

            <div className="space-y-4 overflow-y-auto no-scrollbar flex-1 pb-10">
                {loading ? (
                    <div className="flex justify-center py-10"><LoadingEye size={32} /></div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-20 opacity-40 flex flex-col items-center">
                        <UserPlus size={32} className="mb-4 text-navy-950 dark:text-white" />
                        <h3 className="font-black uppercase tracking-widest text-xs mb-2">No Followers Found</h3>
                        <p className="text-[10px] font-medium normal-case max-w-[200px]">
                            {searchQuery ? "Try a different search term" : "You don't have any followers yet to start a chat with."}
                        </p>
                    </div>
                ) : (
                    filteredUsers.map(user => (
                        <div
                            key={user.id}
                            onClick={() => { if (isMounted.current) onSelectUser(user); }}
                            className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-[28px] cursor-pointer transition-colors border border-transparent dark:border-white/5"
                        >
                            <div className="flex items-center gap-4">
                                <img
                                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                                    className="w-12 h-12 rounded-full object-cover shadow-sm bg-white dark:bg-black"
                                    alt={user.displayName}
                                />
                                <div>
                                    <p className="text-sm font-black text-navy-950 dark:text-white">{user.displayName}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">@{user.username}</p>
                                </div>
                            </div>
                            <div className="p-3 bg-navy-950 dark:bg-white text-white dark:text-navy-950 rounded-xl active:scale-95 transition-transform">
                                <MessageCircle size={18} className="stroke-[2.5px]" />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};