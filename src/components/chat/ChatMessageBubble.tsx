import React from 'react';
import { Message, User } from '../../types';
import { format } from 'date-fns';
import { Send, Eye, EyeOff, MoreVertical, Trash2, Image as ImageIcon, Video, FileText, MapPin } from 'lucide-react';
import { AudioPlayer } from './AudioPlayer';

interface ChatMessageBubbleProps {
    msg: Message;
    isMine: boolean;
    showAvatar: boolean;
    recipientUser: User;
    isOnline: boolean;
    isSelected: boolean;
    onContextMenu: (e: React.MouseEvent | React.TouchEvent, msg: Message) => void;
    onForward: (msg: Message) => void;
    onDelete: (msgId: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({
    msg,
    isMine,
    showAvatar,
    recipientUser,
    isOnline,
    isSelected,
    onContextMenu,
    onForward,
    onDelete
}) => {
    const msgDate = new Date(msg.created_at);

    const handleMediaClick = (url: string) => {
        if (url) {
            window.open(url, '_blank');
        }
    };

    const renderMessageContent = () => {
        switch (msg.message_type) {
            case 'image':
                return (
                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1">Field Visuals</span>
                        {msg.media_urls && msg.media_urls.length > 0 ? (
                            <div className={`grid ${msg.media_urls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1 mt-1 rounded-xl overflow-hidden`}>
                                {msg.media_urls.map((url, i) => (
                                    <img 
                                        key={i} 
                                        src={url} 
                                        alt="Attachment" 
                                        className="w-full h-auto object-cover rounded aspect-square cursor-pointer active:opacity-80 transition-opacity" 
                                        onClick={() => handleMediaClick(url)}
                                    />
                                ))}
                            </div>
                        ) : msg.media_url ? (
                            <img 
                                src={msg.media_url} 
                                alt="Attachment" 
                                className="w-full max-w-[240px] rounded-xl object-cover mt-1 cursor-pointer active:opacity-80 transition-opacity" 
                                onClick={() => handleMediaClick(msg.media_url!)}
                            />
                        ) : null}
                        {msg.content && <p className="text-[15px] leading-relaxed break-words font-medium">{msg.content}</p>}
                    </div>
                );
            case 'video':
                return (
                    <div className="space-y-2 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60 block mb-1">Field Visuals</span>
                        {msg.media_url && (
                            <div className="relative group cursor-pointer" onClick={() => handleMediaClick(msg.media_url!)}>
                                <video src={msg.media_url} className="w-full max-w-[240px] rounded-xl bg-black" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                                        <Video size={24} />
                                    </div>
                                </div>
                            </div>
                        )}
                        {msg.content && <p className="text-[15px] leading-relaxed break-words font-medium">{msg.content}</p>}
                    </div>
                );
            case 'audio':
                return (
                    <div className="py-1">
                        {msg.media_url && <AudioPlayer src={msg.media_url} isMine={isMine} />}
                    </div>
                );
            case 'document':
                return (
                    <a href={msg.media_url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors mt-1">
                        <div className="p-2 bg-blue-600 text-white rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{msg.content || 'Document'}</p>
                            <p className="text-[10px] opacity-70">Tap to download</p>
                        </div>
                    </a>
                );
            case 'location':
                return (
                    <div className="space-y-1 mt-1">
                        <div className="w-full h-[120px] bg-slate-200 dark:bg-white/10 rounded-xl flex items-center justify-center relative overflow-hidden group">
                            <MapPin size={32} className="text-red-500 relative z-10" />
                            <div className="absolute inset-0 bg-black/5" />
                        </div>
                        <p className="text-[15px] leading-relaxed break-words font-medium">{msg.content}</p>
                    </div>
                );
            default:
                return <p className="text-[15px] leading-relaxed break-words font-medium">{msg.content}</p>;
        }
    };

    return (
        <div className={`flex w-full mb-3 ${isMine ? 'justify-end pl-12' : 'justify-start pr-12'} items-end gap-2 group ${isSelected ? 'relative z-[100]' : ''}`}>
            {!isMine && (
                <div className="w-6 h-6 flex-shrink-0">
                    {showAvatar ? (
                        <img
                            src={recipientUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipientUser.username}`}
                            className="w-full h-full rounded-full object-cover"
                            alt={recipientUser.displayName}
                        />
                    ) : null}
                </div>
            )}

            <div className={`
                max-w-[85%] px-4 py-2.5 rounded-2xl relative shadow-sm backdrop-blur-md border
                ${isSelected ? 'z-[100]' : ''}
                ${isMine
                    ? 'bg-brand-primary text-white border-white/10 rounded-br-sm'
                    : 'bg-white/80 dark:bg-black/80 text-navy-950 dark:text-navy-400 border-navy-950/10 dark:border-white/10 rounded-bl-sm'
                }
            `}>
                {msg.is_forwarded && (
                    <div className={`flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-widest ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                        <Send size={10} className="stroke-[3px]" /> Forwarded
                    </div>
                )}
                
                {renderMessageContent()}
                
                <div className={`flex items-center gap-1 mt-1 justify-end`}>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isMine ? 'text-white/60' : 'text-blue-400'}`}>
                        {format(msgDate, 'h:mm a')}
                    </span>
                    {isMine && (
                        <div className="ml-0.5">
                            {msg.is_read ? (
                                <div className="flex -space-x-1.5">
                                    <Send size={12} className="text-blue-400 stroke-[3px]" />
                                    <Send size={12} className="text-blue-400 stroke-[3px]" />
                                </div>
                            ) : (
                                <Send size={12} className="text-white/40 stroke-[3px]" />
                            )}
                        </div>
                    )}
                </div>

                {/* Message Context Menu - Positioned ABOVE the message */}
                {isSelected && (
                    <div
                        className={`absolute bottom-full mb-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[2500] flex flex-col animate-in zoom-in-95 duration-200 ${isMine ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => onForward(msg)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Send size={16} /> Forward
                        </button>

                        <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
                        <button
                            onClick={() => onDelete(msg.id)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                        >
                            <Trash2 size={16} />
                            Delete
                        </button>
                    </div>
                )}

                {/* Message Context Menu Trigger Button */}
                <button
                    onClick={(e) => onContextMenu(e, msg)}
                    className={`absolute top-1/2 -translate-y-1/2 p-2 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 transition-colors focus:outline-none ${isMine ? '-left-10' : '-right-10'}`}
                >
                    <MoreVertical size={16} />
                </button>
            </div>
        </div>
    );
};