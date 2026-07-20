import React, { useState, useEffect } from 'react';
import ChatList from '../components/chat/ChatList';
import ChatWindow from '../components/chat/ChatWindow';
import { FollowersChatOverlay } from '../components/chat/FollowersChatOverlay';
import { User } from '../types';
import { MessageCircle } from 'lucide-react';

import { useRouter } from 'next/navigation';
import { profileService } from '../services/profileService';

interface ChatsPageProps {
    currentUser: User;
    recipientId?: string;
}

const ChatsPage: React.FC<ChatsPageProps> = ({ currentUser, recipientId }) => {
    const router = useRouter();
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [selectedRecipient, setSelectedRecipient] = useState<User | null>(null);
    const [isFollowersOverlayOpen, setIsFollowersOverlayOpen] = useState(false);

    useEffect(() => {
        if (recipientId) {
            const fetchRecipient = async () => {
                try {
                    const profile = await profileService.getProfile(recipientId);
                    if (profile) {
                        setSelectedRecipient(profile as User);
                    }
                } catch (error) {
                    console.error("Failed to fetch recipient profile", error);
                }
            };
            fetchRecipient();
        } else {
            setSelectedRecipient(null);
            setSelectedConversationId(null);
        }
    }, [recipientId]);

    if (!currentUser) return null;

    const handleSelectConversation = (conversationId: string, otherUser: User) => {
        router.push(`/chats/${otherUser.id}`);
    };

    const handleBackToList = () => {
        router.push('/chats');
    };

    const handleStartNewConversation = (user: User) => {
        setSelectedConversationId(null); // Force it to create/find a new one
        setSelectedRecipient(user);
        setIsFollowersOverlayOpen(false);
    };

    return (
        <div className="h-full w-full bg-slate-50 dark:bg-black overflow-hidden flex flex-col md:flex-row" data-dyad-component="ChatsPage">
            {/* Desktop Side-by-Side View */}
            <div className={`h-full border-r border-slate-200 dark:border-slate-800 transition-all duration-500 ease-in-out ${selectedRecipient ? 'hidden md:block md:w-80 lg:w-96' : 'w-full'}`}>
                <ChatList
                    currentUser={currentUser}
                    onSelectConversation={handleSelectConversation}
                    onAddContact={() => setIsFollowersOverlayOpen(true)}
                />
            </div>

            <div className={`flex-1 h-full relative transition-all duration-500 ${!selectedRecipient ? 'hidden md:flex items-center justify-center bg-slate-100/50 dark:bg-black/50' : 'flex'}`}>
                {selectedRecipient ? (
                    <ChatWindow
                        key={selectedRecipient.id}
                        currentUser={currentUser}
                        recipientUser={selectedRecipient}
                        initialConversationId={selectedConversationId}
                        onBack={handleBackToList}
                    />
                ) : (
                    <div className="hidden md:flex flex-col items-center gap-4 animate-slide-up">
                        <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-xl">
                            <MessageCircle size={40} className="text-slate-300 dark:text-zinc-700" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-navy-950 dark:text-white uppercase tracking-widest opacity-20">Select a Signal</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter mt-1">Direct Neural Link Encryption Active</p>
                        </div>
                    </div>
                )}
            </div>

            {isFollowersOverlayOpen && (
                <FollowersChatOverlay
                    currentUserId={currentUser.id}
                    onClose={() => setIsFollowersOverlayOpen(false)}
                    onSelectUser={handleStartNewConversation}
                />
            )}
        </div>
    );
};

export default ChatsPage;