"use client";

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Layout from '@/src/components/Layout';
import { AppTab } from '@/src/types';
import { checkConnection } from '@/src/utils/supabaseClient';

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const { session, currentUser, loadingAuth } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const initialLoadComplete = useRef(false);

    useEffect(() => {
        checkConnection(); // Diagnostic log
        if (!loadingAuth && !session) {
            router.replace('/');
        }
    }, [session, loadingAuth, router]);

    // Mark initial load as complete once we have a user and loading is false
    if (!loadingAuth && currentUser) {
        initialLoadComplete.current = true;
    }

    // Only show the full-screen loading logo if it's the VERY first boot 
    // and we don't even have a cached user yet.
    if (loadingAuth && !currentUser && !initialLoadComplete.current) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-black text-white font-black">
                <div className="text-4xl tracking-tighter animate-pulse">EyeField</div>
                <div className="mt-4 w-8 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-white animate-[loading_1.5s_infinite]" />
                </div>
            </div>
        );
    }

    // If we're not logged in, don't show the app layout
    if (!session || !currentUser) return null;

    // Determine current tab from pathname
    let activeTab = AppTab.ECHOES;
    if (pathname.includes('/cascadea')) activeTab = AppTab.CASCADEA;
    if (pathname.includes('/chats')) activeTab = AppTab.CHATS;
    if (pathname.includes('/calls')) activeTab = AppTab.CALLS;
    if (pathname.includes('/profile')) activeTab = AppTab.PROFILE;
    if (pathname.includes('/admin')) activeTab = AppTab.ADMIN;

    const setActiveTab = (tab: AppTab) => {
        router.push(`/${tab}`);
    };

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser}>
            {children}
        </Layout>
    );
}