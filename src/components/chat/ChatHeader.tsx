import React from 'react';
import { ArrowLeft, Video, Phone, BookOpen, MoreVertical } from 'lucide-react';
import { User } from '../../types';
import { useCall } from '../../contexts/CallContext';

interface ChatHeaderProps {
    recipientUser: User;
    isOnline: boolean;
    isOtherTyping: boolean;
    onBack: () => void;
    onSearchClick: () => void;
    onProfileClick: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
    recipientUser,
    isOnline,
    isOtherTyping,
    onBack,
    onSearchClick,
    onProfileClick
}) => {
    const { startCall } = useCall();

    return (
        <div className="h-16 bg-white/90 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-2 shrink-0 z-10 sticky top-0">
            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors"
                >
                    <ArrowLeft size={22} />
                </button>

                <button onClick={onProfileClick} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                    <div className="relative">
                        <img
                            src={recipientUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipientUser.username}`}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                            alt={recipientUser.displayName}
                        />
                        {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white dark:border-black" />}
                    </div>
                    <div>
                        <h2 className="font-bold text-navy-950 dark:text-white leading-tight">
                            {recipientUser.displayName}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            {isOnline && !isOtherTyping && (
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                            )}
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isOtherTyping ? 'text-blue-500 animate-pulse' : isOnline ? 'text-green-500' : 'text-slate-400'}`}>
                                {isOtherTyping ? 'typing...' : isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="flex items-center gap-1 pr-2 text-slate-500 dark:text-slate-400">
                <button 
                  onClick={() => startCall(recipientUser, 'video')}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                    <Video size={18} />
                </button>
                <button 
                  onClick={() => startCall(recipientUser, 'voice')}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                    <Phone size={18} />
                </button>
                <button
                    onClick={onSearchClick}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                >
                    <BookOpen size={18} />
                </button>
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>
    );
};