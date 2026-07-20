import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Search, Send, Loader2 } from 'lucide-react';
import { User, Message } from '../../types';
import { followService } from '../../services/followService';
import { chatService } from '../../services/chatService';
import { toast } from 'react-hot-toast';
import LoadingEye from '../LoadingEye';

interface ForwardMessageModalProps {
    currentUserId: string;
    messageToForward: Message;
    onClose: () => void;
    onForwardComplete: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({ currentUserId, messageToForward, onClose, onForwardComplete }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [forwardingTo, setForwardingTo] = useState<string | null>(null);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        fetchFollowers();
        return () => {
            isMounted.current = false;
        };
    }, [currentUserId]);

    const fetchFollowers = async () => {
        setLoading(true);
        try {
            const data = await followService.getFollowers(currentUserId);
            if (isMounted.current) setUsers(data);
        } catch (error) {
            console.error("Failed to fetch followers for forwarding:", error);
            toast.error("Failed to load contacts");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    };

    const handleForward = async (recipient: User) => {
        if (forwardingTo) return; // Prevent double taps
        setForwardingTo(recipient.id);

        try {
            // First ensure a conversation exists
            const conversationId = await chatService.getOrCreateConversation(currentUserId, recipient.id);
            if (!conversationId) throw new Error("Could not initialize conversation");

            // Forward the message
            const sentMsg = await chatService.sendMessage(
                currentUserId,
                conversationId,
                messageToForward.content,
                messageToForward.message_type,
                messageToForward.media_url,
                messageToForward.media_urls,
                true // isForwarded flag
            );

            if (sentMsg) {
                toast.success(`Forwarded to ${recipient.displayName}`);
                onForwardComplete();
                onClose();
            } else {
                throw new Error("Failed to send");
            }
        } catch (error) {
            toast.error('Failed to forward message');
            setForwardingTo(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.id !== currentUserId &&
        (u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.username.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[2500] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200 p-0 sm:p-6" onClick={onClose}>
            <div
                className="w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-t-[40px] sm:rounded-[40px] flex flex-col h-[80vh] sm:h-[600px] shadow-2xl animate-in slide-in-from-bottom-8 overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 pb-2 flex-shrink-0">
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            <ChevronLeft size={24} />
                        </button>
                        <h2 className="text-sm font-black uppercase tracking-widest text-navy-950 dark:text-white">Forward To</h2>
                        <div className="w-10" />
                    </div>

                    <div className="relative mb-2">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search contacts..."
                            className="w-full bg-slate-100 dark:bg-white/5 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all text-navy-950 dark:text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 no-scrollbar">
                    {loading ? (
                        <div className="flex justify-center py-10"><LoadingEye size={32} /></div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-10 opacity-50">
                            <p className="text-sm font-bold">No contacts found</p>
                        </div>
                    ) : (
                        filteredUsers.map(user => (
                            <button
                                key={user.id}
                                disabled={forwardingTo === user.id}
                                onClick={() => handleForward(user)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-colors border border-transparent dark:border-white/5 disabled:opacity-50 text-left group"
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
                                <div className="p-3 bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all">
                                    {forwardingTo === user.id ? (
                                        <Loader2 size={18} className="animate-spin" />
                                    ) : (
                                        <Send size={18} className="translate-x-[1px] translate-y-[-1px]" />
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};