"use client";

import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';
import { useAuth } from '@/src/contexts/AuthContext';

const ChatsPage = dynamic(() => import('@/src/views/ChatsPage'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function Chats() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <ChatsPage currentUser={currentUser} />;
}
