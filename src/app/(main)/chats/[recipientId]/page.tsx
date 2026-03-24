"use client";

import React, { use } from 'react';
import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';
import { useAuth } from '@/src/contexts/AuthContext';

// Cloudflare Pages requires dynamic routes to use the Edge Runtime
export const runtime = 'edge';

const ChatsPage = dynamic(() => import('@/src/views/ChatsPage'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function ChatConversation({ params }: { params: Promise<{ recipientId: string }> }) {
    const { currentUser } = useAuth();
    const resolvedParams = use(params);
    const recipientId = resolvedParams.recipientId;

    if (!currentUser) return null;

    return <ChatsPage currentUser={currentUser} recipientId={recipientId} />;
}