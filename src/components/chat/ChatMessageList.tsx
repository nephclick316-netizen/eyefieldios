import React from 'react';
import { Message, User } from '../../types';
import { format } from 'date-fns';
import { ChatMessageBubble } from './ChatMessageBubble';

interface ChatMessageListProps {
    messages: Message[];
    currentUser: User;
    recipientUser: User;
    isOnline: boolean;
    isOtherTyping: boolean;
    loading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    selectedMessageId: string | null;
    onContextMenu: (e: React.MouseEvent | React.TouchEvent, msg: Message) => void;
    onForward: (msg: Message) => void;
    onDelete: (msgId: string) => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    currentUser,
    recipientUser,
    isOnline,
    isOtherTyping,
    loading,
    messagesEndRef,
    selectedMessageId,
    onContextMenu,
    onForward,
    onDelete
}) => {
    const renderMessageGroups = () => {
        let lastDate = '';

        return messages.map((msg, index) => {
            const msgDate = new Date(msg.created_at);
            const dateStr = format(msgDate, 'MMMM d, yyyy');
            const showDateHeader = dateStr !== lastDate;
            lastDate = dateStr;

            const isMine = msg.sender_id === currentUser.id;
            const showAvatar = !isMine && (index === messages.length - 1 || messages[index + 1]?.sender_id === currentUser.id);

            return (
                <React.Fragment key={msg.id}>
                    {showDateHeader && (
                        <div className="flex justify-center my-4">
                            <span className="bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-slate-400 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                                {dateStr}
                            </span>
                        </div>
                    )}
                    <ChatMessageBubble
                        msg={msg}
                        isMine={isMine}
                        showAvatar={showAvatar}
                        recipientUser={recipientUser}
                        isOnline={isOnline}
                        isSelected={selectedMessageId === msg.id}
                        onContextMenu={onContextMenu}
                        onForward={onForward}
                        onDelete={onDelete}
                    />
                </React.Fragment>
            );
        });
    };

    return (
        <div className="flex-1 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat opacity-5 dark:opacity-10 pointer-events-none" />

            <div className="absolute inset-0 overflow-y-auto px-4 pt-4 pb-24 flex flex-col no-scrollbar">
                {loading ? (
                    <div className="flex justify-center my-4">
                        <div className="w-6 h-6 border-2 border-navy-950 dark:border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center space-y-3">
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center">
                            <span className="text-2xl">👋</span>
                        </div>
                        <p className="font-bold text-navy-950 dark:text-white">Say hello to {recipientUser.displayName}</p>
                    </div>
                ) : (
                    <>
                        {renderMessageGroups()}
                        {isOtherTyping && (
                            <div className="flex justify-start items-end gap-2 mb-3">
                                <div className="w-6 h-6 flex-shrink-0">
                                    <img
                                        src={recipientUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${recipientUser.username}`}
                                        className="w-full h-full rounded-full object-cover"
                                        alt={recipientUser.displayName}
                                    />
                                </div>
                                <div className="bg-white/80 dark:bg-black/80 border border-navy-950/10 dark:border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm backdrop-blur-md flex gap-1">
                                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};