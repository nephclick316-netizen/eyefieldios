import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { User } from '../types';
import { supabase } from '../utils/supabaseClient';
import { profileService } from '../services/profileService';
import { cacheUtils } from '../utils/cacheUtils';
import { withTimeout } from '../utils/queryUtils';

interface AuthContextType {
    session: Session | null;
    currentUser: User | null;
    loadingAuth: boolean;
    isOnline: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? window.navigator.onLine : true);
    const isMounted = useRef(true);
    const initializationStarted = useRef(false);

    const clearAuthData = useCallback(async () => {
        try {
            await cacheUtils.remove('eyefield_session');
            await cacheUtils.remove('eyefield_profile');
        } catch (e) {
            console.warn("Failed to clear cache:", e);
        }
        if (isMounted.current) {
            setSession(null);
            setCurrentUser(null);
            setLoadingAuth(false);
        }
    }, []);

    const fetchProfile = useCallback(async (userId: string) => {
        if (!isMounted.current) return;
        try {
            const profile = await profileService.getProfile(userId);
            if (isMounted.current) {
                if (profile) {
                    setCurrentUser(profile);
                    cacheUtils.set('eyefield_profile', profile);
                }
            }
        } catch (error) {
            console.warn("[AuthContext] Profile background refresh failed:", error);
        } finally {
            if (isMounted.current) setLoadingAuth(false);
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        if (session?.user) {
            await fetchProfile(session.user.id);
        }
    }, [session, fetchProfile]);

    useEffect(() => {
        isMounted.current = true;
        if (initializationStarted.current) return;
        initializationStarted.current = true;

        const forceStartTimer = setTimeout(() => {
            if (isMounted.current && loadingAuth) {
                console.warn("Auth taking too long, forcing UI start.");
                setLoadingAuth(false);
            }
        }, 5000);

        const initAuth = async () => {
            try {
                const [cachedSession, cachedProfile] = await Promise.all([
                    cacheUtils.get<Session>('eyefield_session'),
                    cacheUtils.get<User>('eyefield_profile')
                ]);

                if (isMounted.current) {
                    if (cachedSession) setSession(cachedSession);
                    if (cachedProfile) {
                        setCurrentUser(cachedProfile);
                        setLoadingAuth(false);
                    }
                }

                const { data: { session: freshSession }, error } = await withTimeout(supabase.auth.getSession(), 15000, 'getSession');

                if (error) {
                    if (error.message?.includes('Refresh Token') || error.message?.includes('invalid_refresh_token')) {
                        console.warn("Invalid session detected, clearing...");
                        try { await supabase.auth.signOut(); } catch (e) {}
                        await clearAuthData();
                        return;
                    }
                    throw error;
                }

                if (isMounted.current) {
                    if (freshSession) {
                        setSession(freshSession);
                        cacheUtils.set('eyefield_session', freshSession);
                        await fetchProfile(freshSession.user.id);
                    } else {
                        await clearAuthData();
                    }
                }
            } catch (error) {
                console.error("Auth initialization error:", error);
                if (isMounted.current) setLoadingAuth(false);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (!isMounted.current) return;

            // Fixed: Removed 'USER_DELETED' as it's not in the standard AuthChangeEvent union for this version
            if (event === 'SIGNED_OUT') {
                await clearAuthData();
            } else if (currentSession) {
                setSession(currentSession);
                cacheUtils.set('eyefield_session', currentSession);
                await fetchProfile(currentSession.user.id);
            }
        });

        return () => {
            isMounted.current = false;
            clearTimeout(forceStartTimer);
            subscription.unsubscribe();
        };
    }, [fetchProfile, clearAuthData]);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn("Sign out error:", e);
        }
        await clearAuthData();
    };

    return (
        <AuthContext.Provider value={{ session, currentUser, loadingAuth, isOnline, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
};