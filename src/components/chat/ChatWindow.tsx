import React, { useState, useEffect, useRef } from 'react';
import { Message, User } from '../../types';
import { chatService } from '../../services/chatService';
import { ChatSearchOverlay } from './ChatSearchOverlay';
import { ForwardMessageModal } from './ForwardMessageModal';
import { ChatAttachmentMenu } from './ChatAttachmentMenu';
import { presenceService } from '../../services/presenceService';
import { toast } from 'react-hot-toast';
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInputArea } from './ChatInputArea';
import { OtherProfileOverlay } from '../OtherProfileOverlay';

interface ChatWindowProps {
    currentUser: User;
    recipientUser: User;
    initialConversationId: string | null;
    onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ currentUser, recipientUser, initialConversationId, onBack }) => {
    const [conversationId, setConversationId] = useState<string | null>(initialConversationId);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // Message Action States
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [messageToForward, setMessageToForward] = useState<Message | null>(null);

    // Media & Attachments State
    const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

    // Presence & Typing State
    const [isOnline, setIsOnline] = useState(false);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const typingChannelRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        const handleClickOutside = () => setSelectedMessageId(null);
        document.addEventListener('click', handleClickOutside);

        isMounted.current = true;
        const initChat = async () => {
            let activeConvId = conversationId;

            if (!activeConvId) {
                activeConvId = await chatService.getOrCreateConversation(currentUser.id, recipientUser.id);
                if (isMounted.current) setConversationId(activeConvId);
            }

            if (activeConvId) {
                // 1. Load from cache first for instant UI
                const cached = await chatService.getCachedMessages(activeConvId);
                if (isMounted.current && cached.length > 0) {
                    setMessages(cached);
                    scrollToBottom();
                }

                // 2. Fetch fresh messages in background
                if (isMounted.current && cached.length === 0) setLoading(true);
                const history = await chatService.getMessages(activeConvId);
                if (isMounted.current) {
                    setMessages(history);
                    await chatService.markAsRead(activeConvId, currentUser.id);
                }
            }
            if (isMounted.current) setLoading(false);
            scrollToBottom();
        };

        initChat();

        const presenceChannel = presenceService.subscribeToGlobalPresence(currentUser.id, (onlineUsers) => {
            if (isMounted.current) {
                setIsOnline(onlineUsers.includes(recipientUser.id));
            }
        });

        return () => {
            isMounted.current = false;
            document.removeEventListener('click', handleClickOutside);
            presenceService.unsubscribeFromPresence(presenceChannel);
            if (typingChannelRef.current) presenceService.unsubscribeFromPresence(typingChannelRef.current);
        };
    }, [currentUser.id, recipientUser.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        let channel: any;
        let readChannel: any;

        if (conversationId) {
            channel = chatService.subscribeToMessages(conversationId, async (newMsg) => {
                if (isMounted.current) {
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });

                    if (newMsg.sender_id !== currentUser.id) {
                        await chatService.markAsRead(conversationId, currentUser.id);
                    }
                }
            });

            readChannel = chatService.subscribeToReadReceipts(conversationId, (msgId) => {
                if (isMounted.current) {
                    setMessages(prev => prev.map(m => 
                        m.id === msgId ? { ...m, is_read: true } : m
                    ));
                }
            });
        }

        if (conversationId) {
            typingChannelRef.current = presenceService.subscribeToTypingEvents(conversationId, (userId, isTyping) => {
                if (isMounted.current && userId === recipientUser.id) {
                    setIsOtherTyping(isTyping);
                    scrollToBottom();
                }
            });
        }

        return () => {
            if (channel) chatService.unsubscribeFromMessages(channel);
            if (readChannel) chatService.unsubscribeFromMessages(readChannel);
            if (typingChannelRef.current) presenceService.unsubscribeFromPresence(typingChannelRef.current);
        };
    }, [conversationId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async (text: string) => {
        if (!conversationId) return;

        const tempId = `temp-${Date.now()}`;
        const tempMessage: Message = {
            id: tempId,
            conversation_id: conversationId,
            sender_id: currentUser.id,
            content: text,
            message_type: 'text',
            created_at: new Date().toISOString(),
            profiles: currentUser
        };

        setMessages(prev => [...prev, tempMessage]);

        const sentMsg = await chatService.sendMessage(currentUser.id, conversationId, text);

        if (sentMsg && isMounted.current) {
            setMessages(prev => prev.map(m => m.id === tempId ? sentMsg : m));
        }
    };

    const handleSendAudio = async (file: File) => {
        if (!conversationId) return;
        setLoading(true);
        try {
            const url = await chatService.uploadChatMedia(file, currentUser.id, 'chat_audio');
            if (url) {
                await chatService.sendMessage(currentUser.id, conversationId, "Voice Message", 'audio', url);
            }
        } catch (error) {
            toast.error("Failed to send audio");
        } finally {
            setLoading(false);
        }
    };

    const handleTyping = (isTyping: boolean) => {
        if (typingChannelRef.current && conversationId) {
            presenceService.sendTypingEvent(typingChannelRef.current, currentUser.id, isTyping);
        }
    };

    const handleMessageContextMenu = (e: React.MouseEvent | React.TouchEvent, msg: Message) => {
        e.preventDefault();
        e.stopPropagation();
        if (msg.id.toString().startsWith('temp-')) return;
        setSelectedMessageId(msg.id);
    };

    const handleDeleteMessage = async (msgId: string) => {
        try {
            await chatService.deleteMessage(msgId, currentUser.id);
            if (isMounted.current) {
                setMessages(prev => prev.filter(m => m.id !== msgId));
                setSelectedMessageId(null);
            }
        } catch (error) {
            toast.error("Failed to delete message");
        }
    };

    const handleFileSelect = async (files: FileList | null, type: 'image' | 'video' | 'document') => {
        if (!files || files.length === 0 || !conversationId) return;

        setLoading(true);
        try {
            const uploadedUrls: string[] = [];
            for (let i = 0; i < files.length; i++) {
                const url = await chatService.uploadChatMedia(files[i], currentUser.id, 'chat_media');
                if (url) uploadedUrls.push(url);
            }

            if (uploadedUrls.length > 0) {
                const mainUrl = uploadedUrls[0];
                const urls = uploadedUrls.length > 1 ? uploadedUrls : undefined;

                await chatService.sendMessage(
                    currentUser.id,
                    conversationId,
                    type === 'document' ? files[0].name : '',
                    type,
                    mainUrl,
                    urls
                );
            } else {
                toast.error("Failed to upload media");
            }
        } catch (error) {
            toast.error("Error uploading file");
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSelect = async () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                if (!conversationId) return;
                setLoading(true);
                try {
                    const { latitude, longitude } = position.coords;
                    await chatService.sendMessage(currentUser.id, conversationId, "Shared a location", 'location');
                } catch (error) {
                    toast.error("Failed to send location");
                } finally {
                    setLoading(false);
                }
            },
            () => toast.error("Unable to retrieve your location")
        );
    };

    return (
        <div className="relative flex-1 flex flex-col bg-slate-50 dark:bg-black pt-safe md:pt-0 overflow-hidden">
            <ChatHeader 
                recipientUser={recipientUser}
                isOnline={isOnline}
                isOtherTyping={isOtherTyping}
                onBack={onBack}
                onSearchClick={() => setIsSearchOpen(true)}
                onProfileClick={() => setShowProfile(true)}
            />

            <ChatMessageList 
                messages={messages}
                currentUser={currentUser}
                recipientUser={recipientUser}
                isOnline={isOnline}
                isOtherTyping={isOtherTyping}
                loading={loading}
                messagesEndRef={messagesEndRef}
                selectedMessageId={selectedMessageId}
                onContextMenu={handleMessageContextMenu}
                onForward={(msg) => { setMessageToForward(msg); setSelectedMessageId(null); }}
                onDelete={handleDeleteMessage}
            />

            <ChatInputArea 
                onSendMessage={handleSendMessage}
                onSendAudio={handleSendAudio}
                onTyping={handleTyping}
                onAttachmentClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                showAttachmentMenu={showAttachmentMenu}
            />

            <ChatAttachmentMenu
                isOpen={showAttachmentMenu}
                onClose={() => setShowAttachmentMenu(false)}
                onFileSelect={handleFileSelect}
                onLocationSelect={handleLocationSelect}
            />

            {isSearchOpen && (
                <ChatSearchOverlay
                    messages={messages}
                    onClose={() => setIsSearchOpen(false)}
                    onMessageSelect={(messageId) => {
                        setIsSearchOpen(false);
                    }}
                />
            )}

            {messageToForward && (
                <ForwardMessageModal
                    currentUserId={currentUser.id}
                    messageToForward={messageToForward}
                    onClose={() => setMessageToForward(null)}
                    onForwardComplete={() => setMessageToForward(null)}
                />
            )}

            {showProfile && (
                <OtherProfileOverlay 
                    userId={recipientUser.id} 
                    onClose={() => setShowProfile(false)} 
                />
            )}
        </div>
    );
};

export default ChatWindow;