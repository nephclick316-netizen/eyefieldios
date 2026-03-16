"use client";

import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';
import { useAuth } from '@/src/contexts/AuthContext';

const CallsPage = dynamic(() => import('@/src/views/CallsPage'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function Calls() {
    const { currentUser } = useAuth();
    if (!currentUser) return null;
    return <CallsPage currentUser={currentUser} />;
}
