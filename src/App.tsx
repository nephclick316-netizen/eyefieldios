"use client";

import React, { useState, useEffect, createContext, useRef } from 'react';
import Layout from './components/Layout';
import { AppTab, User } from './types';

import LoadingEye from './components/LoadingEye';
import dynamic from 'next/dynamic';

const EchoPage = dynamic(() => import('./views/EchoPage'), {
  loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
  ssr: false
});
const CascadeaPage = dynamic(() => import('./views/CascadeaPage'), {
  loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
  ssr: false
});
const ChatsPage = dynamic(() => import('./views/ChatsPage'), {
  loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
  ssr: false
});
const CallsPage = dynamic(() => import('./views/CallsPage'), {
  loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
  ssr: false
});
const ProfilePage = dynamic(() => import('./views/ProfilePage'), {
  loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
  ssr: false
});
const AdminDashboard = dynamic(() => import('./views/AdminDashboard'), {
  loading: () => <div className="flex justify-center py-20"><LoadingEye /></div>,
  ssr: false
});
const SignInPage = dynamic(() => import('./views/SignInPage'), { ssr: false });
const SignUpPage = dynamic(() => import('./views/SignUpPage'), { ssr: false });
const OnboardingPage = dynamic(() => import('./views/OnboardingPage'), { ssr: false });
import { supabase } from './utils/supabaseClient';
import { profileService } from './services/profileService';
import { notificationService } from './services/notificationService';
import { withTimeout } from './utils/queryUtils';
import { toast } from 'react-hot-toast';
import { CallProvider } from './contexts/CallContext';
import { cacheUtils } from './utils/cacheUtils';

export const TRANSLATIONS: Record<string, Record<string, string>> = {
  English: {
    chats: 'Chats',
    calls: 'Calls',
    echoes: 'Echoes',
    cascadea: 'Cascadea',
    profile: 'Profile',
    admin: 'Command Center',
    settings: 'Settings',
    logout: 'Logout',
    search: 'Search',
    save: 'Save',
    edit_profile: 'Edit Profile',
    personal_info: 'Personal Information',
    business_info: 'Business Information',
    language: 'Language',
    theme: 'Theme',
    permissions: 'Permissions',
    privacy: 'Privacy & Security',
    help: 'Help & Support',
    back: 'Back'
  }
};

export const SettingsContext = createContext<any>(undefined);

const ADMIN_EMAIL = 'edocardadmin@eyefield.pro';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CASCADEA);
  const [session, setSession] = useState<any>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [language, setLanguage] = useState('English');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const isMounted = useRef(true);

  const t = (key: string) => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS['English'][key] || key;
  };

  useEffect(() => {
    isMounted.current = true;

    // Load from cache first for instant speed
    const loadCache = async () => {
      const cachedSession = await cacheUtils.get<any>('eyefield_session');
      const cachedProfile = await cacheUtils.get<User>('eyefield_profile');

      if (isMounted.current) {
        if (cachedSession) setSession(cachedSession);
        if (cachedProfile) {
          setCurrentUser(cachedProfile);
          setLoadingAuth(false); // Stop pulse animation immediately if we have a profile
        }
      }
    };
    loadCache();

    const handleOnline = () => {
      if (isMounted.current) {
        setIsOnline(true);
        toast.success("Signal Restored", { id: 'offline' });
      }
    };

    const handleOffline = () => {
      if (isMounted.current) {
        setIsOnline(false);
        toast("Signal Lost", { icon: '📡', id: 'offline' });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      isMounted.current = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async (userId: string, email: string) => {
      try {
        const profile = await profileService.getProfile(userId);
        if (isMounted.current) {
          if (profile) {
            const fullProfile = { ...profile, email };
            setCurrentUser(fullProfile);
            cacheUtils.set('eyefield_profile', fullProfile);
            notificationService.registerPush(userId);
          } else {
            setCurrentUser(null);
            cacheUtils.remove('eyefield_profile');
          }
        }
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        if (isMounted.current) setLoadingAuth(false);
      }
    };

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await withTimeout(supabase.auth.getSession() as any, 15000, 'AppAuth_initSession');

        if (error) {
          if (error.message.includes('Refresh Token Not Found') || error.message.includes('invalid_refresh_token')) {
            await supabase.auth.signOut();
            if (isMounted.current) {
              setSession(null);
              setCurrentUser(null);
              cacheUtils.remove('eyefield_session');
              cacheUtils.remove('eyefield_profile');
              setLoadingAuth(false);
            }
            return;
          }
          throw error;
        }

        if (isMounted.current) {
          setSession(initialSession);
          if (initialSession) {
            cacheUtils.set('eyefield_session', initialSession);
            await fetchProfile(initialSession.user.id, initialSession.user.email!);
          } else {
            cacheUtils.remove('eyefield_session');
            cacheUtils.remove('eyefield_profile');
            setLoadingAuth(false);
          }
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (isMounted.current) setLoadingAuth(false);
      }
    };

    initAuth();

    // Re-verify session when returning to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        initAuth();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (isMounted.current) {
        if (event === 'SIGNED_OUT') {
          setSession(null);
          setCurrentUser(null);
          cacheUtils.remove('eyefield_session');
          cacheUtils.remove('eyefield_profile');
          setLoadingAuth(false);
          return;
        }

        if (currentSession) {
          setSession(currentSession);
          cacheUtils.set('eyefield_session', currentSession);
          await fetchProfile(currentSession.user.id, currentSession.user.email!);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (loadingAuth) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white font-black">
        <div className="text-4xl tracking-tighter animate-pulse">EyeField</div>
        <div className="mt-4 w-8 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="w-full h-full bg-white animate-[loading_1.5s_infinite]" />
        </div>
      </div>
    );
  }

  if (!session) {
    return showSignUp ? (
      <SignUpPage onSignUp={() => setShowSignUp(false)} onGoToSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignInPage onSignIn={() => { }} onGoToSignUp={() => setShowSignUp(true)} />
    );
  }

  // If logged in but no profile exists, show onboarding
  if (!currentUser) {
    return (
      <OnboardingPage
        onComplete={(data) => {
          setCurrentUser({ ...data, id: session.user.id, email: session.user.email } as User);
        }}
      />
    );
  }

  const isAdmin = currentUser.email === ADMIN_EMAIL;

  return (
    <SettingsContext.Provider value={{ theme, setTheme, language, setLanguage, t, logout: () => supabase.auth.signOut(), currentUser }}>
      <CallProvider currentUser={currentUser}>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser}>
          {activeTab === AppTab.CASCADEA && <CascadeaPage navigateToTab={setActiveTab} />}
          {activeTab === AppTab.ECHOES && <EchoPage />}
          {activeTab === AppTab.CHATS && <ChatsPage currentUser={currentUser} />}
          {activeTab === AppTab.CALLS && <CallsPage currentUser={currentUser} />}
          {activeTab === AppTab.PROFILE && <ProfilePage user={currentUser} setUser={setCurrentUser} />}
          {activeTab === AppTab.ADMIN && isAdmin && <AdminDashboard />}
        </Layout>
      </CallProvider>
    </SettingsContext.Provider>
  );
};

export default App;