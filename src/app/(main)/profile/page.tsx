"use client";

import dynamic from 'next/dynamic';
import LoadingEye from '@/src/components/LoadingEye';
import { useAuth } from '@/src/contexts/AuthContext';

const ProfilePage = dynamic(() => import('@/src/views/ProfilePage'), {
    loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
    ssr: false
});

export default function Profile() {
    const { currentUser, refreshProfile } = useAuth();
    if (!currentUser) return null;
    return <ProfilePage user={currentUser} setUser={refreshProfile} />;
}
