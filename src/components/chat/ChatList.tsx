import React, { useState, useEffect, useRef } from 'react';
import { Conversation, User } from '../../types';
import { chatService } from '../../services/chatService';
import { Search, UserPlus, MoreVertical, Trash2, X, AlertCircle, Eye, EyeOff, Image as ImageIcon, Video, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-hot-toast';
import { cacheUtils } from '../../utils/cacheUtils';

interface ChatListProps {
    currentUser: User;
    onSelectConversation: (conversationId: string, otherUser: User) => void;
    onAddContact: () => void;
    selectedConversationId?: string | null;
}

const ChatList: React.FC<ChatListProps> = ({ currentUser, onSelectConversation, onAddContact, selectedConversationId }) => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [singleDeleteConfirmId, setSingleDeleteConfirmId] = useState<string | null>(null);

    const isMounted = useRef(true);
    const menuRef = useRef<HTMLDivElement>(null);
    const touchTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        isMounted.current = true;

        // Load from cache first
        const loadCache = async () => {
            const cached = await cacheUtils.get<Conversation[]>('cached_conversations');
            if (isMounted.current && cached) {
                setConversations(cached);
                setLoading(false);
            }
        };
        loadCache();

        loadConversations(0, true);

        const channel = chatService.subscribeToAllUserMessages(currentUser.id, () => {
            if (isMounted.current) loadConversations(0, true);
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadConversations(0, true);
            }
        };

        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
            isMounted.current = false;
            chatService.unsubscribeFromMessages(channel);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [currentUser.id]);

    const loadConversations = async (pageNum: number = page, reset: boolean = false) => {
        if (!isMounted.current) return;
        if (reset && conversations.length === 0) setLoading(true);
        else if (!reset) setLoadingMore(true);

        try {
            const { data, hasMore: more } = await chatService.getConversations(currentUser.id, pageNum, 15);
            if (isMounted.current) {
                setConversations(prev => {
                    const next = reset ? data : [...prev, ...data];
                    const deduped = Array.from(new Map(next.map(c => [c.id, c])).values());
                    if (pageNum === 0) cacheUtils.set('cached_conversations', deduped);
                    return deduped;
                });
                setHasMore(more);
                setPage(pageNum + 1);
            }
        } catch (error) {
            console.error("Failed to load conversations", error);
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
            loadConversations();
        }
    };

    const handleClearAll = async () => {
        if (deleteConfirmText.toLowerCase() !== 'delete') return;

        setLoading(true);
        try {
            await chatService.deleteAllConversations(currentUser.id);
            toast.success('All conversations cleared');
            setShowDeleteConfirm(false);
            setDeleteConfirmText('');
            loadConversations(0, true);
        } catch (error) {
            toast.error('Failed to clear conversations');
        } finally {
            setLoading(false);
        }
    };

    const handleSingleDelete = async () => {
        if (!singleDeleteConfirmId) return;
        setLoading(true);
        try {
            await chatService.deleteConversation(singleDeleteConfirmId, currentUser.id);
            toast.success('Chat removed');
            setSingleDeleteConfirmId(null);
            loadConversations(0, true);
        } catch (error) {
            toast.error('Failed to remove chat');
        } finally {
            setLoading(false);
        }
    };

    const filteredConversations = conversations.filter(conv => {
        if (!conv.participants || conv.participants.length === 0) return false;
        const otherUser = conv.participants[0].profiles;
        if (!otherUser) return false;

        const displayName = otherUser.displayName || '';
        const username = otherUser.username || '';
        const query = searchQuery.toLowerCase();

        return displayName.toLowerCase().includes(query) || username.toLowerCase().includes(query);
    });

    const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-black" data-dyad-component="ChatList">
            {/* Header */}
            <div className="px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-brand-primary dark:text-white"
                        >
                            <MoreVertical size={20} />
                        </button>

                        {showMenu && (
                            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                <button
                                    onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                >
                                    <Trash2 size={18} />
                                    Clear All Chats
                                </button>
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-brand-primary dark:text-white tracking-tighter text-center flex-1 flex items-center justify-center gap-2">
                        Messages
                        {totalUnread > 0 && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">{totalUnread}</span>
                        )}
                    </h2>

                    <button
                        onClick={onAddContact}
                        className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-brand-primary dark:text-white"
                    >
                        <UserPlus size={20} />
                    </button>
                </div>

                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-white/5 border-none rounded-2xl text-sm focus:ring-2 focus:ring-brand-primary dark:focus:ring-white outline-none text-navy-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium"
                        />
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-6" onScroll={handleScroll}>
                {loading && conversations.length === 0 ? (
                    Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-row items-center gap-4 px-4 py-3 border-b border-slate-100 dark:border-white/5 opacity-50">
                            <div className="w-14 h-14 rounded-full bg-slate-200 dark:bg-white/10 animate-pulse flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-slate-200 dark:bg-white/10 rounded-md animate-pulse" />
                                <div className="h-3 w-2/3 bg-slate-100 dark:bg-white/5 rounded-md animate-pulse" />
                            </div>
                        </div>
                    ))
                ) : filteredConversations.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-navy-50/50 dark:bg-white/5 flex items-center justify-center mb-4 border border-slate-100 dark:border-white/10">
                            <Search size={32} strokeWidth={1.5} className="text-slate-400 dark:text-slate-500" />
                        </div>
                        <h3 className="text-lg font-bold text-brand-primary dark:text-white mb-2">No conversations found</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[240px]">
                            {searchQuery ? "Try a different search term." : "Your active conversations will appear here."}
                        </p>
                    </div>
                ) : (
                    <>
                        {filteredConversations.map(conv => {
                            const otherUser = conv.participants![0].profiles;
                            const lastMsg = conv.last_message;
                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        // Locally clear unread count for instant feedback
                                        setConversations(prev => prev.map(c => 
                                            c.id === conv.id ? { ...c, unread_count: 0 } : c
                                        ));
                                        onSelectConversation(conv.id, otherUser);
                                    }}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        setSingleDeleteConfirmId(conv.id);
                                    }}
                                    onTouchStart={() => {
                                        touchTimerRef.current = setTimeout(() => {
                                            setSingleDeleteConfirmId(conv.id);
                                        }, 500);
                                    }}
                                    onTouchEnd={() => touchTimerRef.current && clearTimeout(touchTimerRef.current)}
                                    className="w-full relative overflow-hidden flex items-center gap-3 px-4 py-4 mb-3 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-lg hover:shadow-xl dark:shadow-black/60 transition-all group select-none text-left active:scale-[0.98]"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-50 dark:via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    <div className="relative">
                                        <img
                                            src={otherUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.username}`}
                                            alt={otherUser.displayName}
                                            className="w-14 h-14 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                                        />
                                        {otherUser.isVerified && (
                                            <div className="absolute -bottom-1 -right-1 bg-brand-primary dark:bg-white text-white dark:text-brand-primary rounded-full p-0.5 border-2 border-slate-50 dark:border-black">
                                                <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex justify-between items-center">
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className="text-base font-bold text-brand-primary dark:text-white truncate mb-0.5">
                                                {otherUser.displayName || 'Unknown User'}
                                            </h3>
                                            <p className={`text-sm truncate font-medium transition-colors flex items-center gap-1 ${conv.unread_count && conv.unread_count > 0 ? 'text-brand-primary dark:text-white font-black' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {lastMsg ? (
                                                    <>
                                                        {lastMsg.sender_id === currentUser.id && (
                                                            <span className="shrink-0">
                                                                 {lastMsg.is_read ? (
                                                                    <div className="flex -space-x-1 mt-0.5">
                                                                        <Send size={10} className="text-blue-500 stroke-[3px]" />
                                                                        <Send size={10} className="text-blue-500 stroke-[3px]" />
                                                                    </div>
                                                                ) : (
                                                                    <Send size={10} className="text-slate-400 stroke-[3px] mt-0.5" />
                                                                )}
                                                            </span>
                                                        )}
                                                        <span className="truncate flex items-center gap-1">
                                                            {lastMsg.message_type === 'image' && <ImageIcon size={14} />}
                                                            {lastMsg.message_type === 'video' && <Video size={14} />}
                                                            {lastMsg.message_type === 'audio' ? 'Field Note' :
                                                                lastMsg.message_type === 'image' ? 'Photo' :
                                                                    lastMsg.message_type === 'video' ? 'Video' :
                                                                        lastMsg.content}
                                                        </span>
                                                    </>
                                                ) : 'Tap to view conversation'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                                            <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                                            </span>
                                            {conv.unread_count && conv.unread_count > 0 ? (
                                                <div className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                                    {conv.unread_count}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                        {loadingMore && (
                            <div className="flex justify-center py-4">
                                <Loader2 className="animate-spin text-slate-400" size={24} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Single Delete Confirmation Modal */}
            {
                singleDeleteConfirmId && (
                    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setSingleDeleteConfirmId(null)}>
                        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 space-y-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full text-red-500">
                                    <Trash2 size={32} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">Delete Chat?</h2>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                    Remove this conversation from your list? This won't affect the messages for the other person.
                                </p>
                            </div>
                            <div className="flex gap-3 mt-4">
                                <button
                                    onClick={() => setSingleDeleteConfirmId(null)}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSingleDelete}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Delete All Confirmation Modal */}
            {
                showDeleteConfirm && (
                    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 space-y-6 shadow-2xl">
                            <div className="flex flex-col items-center text-center gap-4">
                                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-full text-red-500">
                                    <AlertCircle size={32} />
                                </div>
                                <h2 className="text-xl font-black tracking-tight">Clear All Signals?</h2>
                                <p className="text-xs font-medium text-slate-500 leading-relaxed">
                                    This action will permanently remove all conversations from your feed. Type <span className="font-black text-red-500">delete</span> to confirm.
                                </p>
                            </div>

                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type 'delete' here"
                                className="w-full bg-slate-50 dark:bg-white/5 border-2 border-slate-100 dark:border-white/10 rounded-2xl py-4 px-6 text-center text-sm font-black outline-none focus:border-red-500 transition-colors"
                            />

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                    className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClearAll}
                                    disabled={deleteConfirmText.toLowerCase() !== 'delete'}
                                    className="flex-1 py-4 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 disabled:opacity-50 active:scale-95 transition-all"
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ChatList;