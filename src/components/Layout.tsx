import React, { useState, useContext, useEffect } from 'react';
import { AppTab, User as UserType } from '../types';
import {
  Phone,
  MessageCircle,
  User as UserIcon,
  Mic,
  AudioWaveform,
  ShieldAlert
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';

import { DesktopSidebar } from './layout/DesktopSidebar';
import { MobileHeader } from './layout/MobileHeader';
import { MobileFooter } from './layout/MobileFooter';
import { DesktopRightSidebar } from './layout/DesktopRightSidebar';
import { ClosedEyeFace } from './layout/Icons';

const ShareNumberOverlay = dynamic(() => import('./ShareNumberOverlay').then(m => m.ShareNumberOverlay), { ssr: false });
const MapOverlay = dynamic(() => import('./MapOverlay').then(m => m.MapOverlay), { ssr: false });
const EndocardOverlay = dynamic(() => import('./EndocardOverlay').then(m => m.EndocardOverlay), { ssr: false });
const NotificationsOverlay = dynamic(() => import('./NotificationsOverlay').then(m => m.NotificationsOverlay), { ssr: false });
const CreateEchoOverlay = dynamic(() => import('./CreateEchoOverlay').then(m => m.CreateEchoOverlay), { ssr: false });
const CallOverlay = dynamic(() => import('./chat/CallOverlay').then(m => m.CallOverlay), { ssr: false });

import { SettingsContext } from './ClientProviders';
import { useAuth } from '../contexts/AuthContext';
import { notificationService } from '../services/notificationService';
import { chatService } from '../services/chatService';
import { CallProvider } from '../contexts/CallContext';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-hot-toast';
import { cacheUtils } from '../utils/cacheUtils';

interface LayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: UserType;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user }) => {
  const settings = useContext(SettingsContext);
  const { isOnline } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateEcho, setShowCreateEcho] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isListening, setIsListening] = useState(false);

  // Overlay states
  const [showAI, setShowAI] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const loadCache = async () => {
        const cachedCount = await cacheUtils.get<number>(`unread_${user.id}`);
        if (cachedCount !== null) setUnreadNotifications(cachedCount);
      };
      loadCache();

      fetchUnreadCount();

      const notifChannel = supabase
        .channel(`notifications:${user.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, (payload) => {
          fetchUnreadCount();
          if (payload.new && payload.new.type) {
            const type = payload.new.type;
            if (type === 'message') toast('New message received', { icon: '💬' });
            else if (type === 'follow') toast('New follower!', { icon: '👤' });
            else if (type.includes('like')) toast('Someone liked your post', { icon: '❤️' });
            else if (type.includes('comment') || type.includes('rating')) toast('New interaction on your post', { icon: '⭐' });
            else toast('New notification', { icon: '🔔' });
          }
        })
        .subscribe();

      const chatChannel = chatService.subscribeToAllUserMessages(user.id, () => {
          fetchUnreadCount();
      });

      return () => {
        supabase.removeChannel(notifChannel);
        chatService.unsubscribeFromMessages(chatChannel);
      };
    }
  }, [user?.id]);

  const fetchUnreadCount = async () => {
    if (!user?.id) return;
    const count = await notificationService.getUnreadCount(user.id);
    setUnreadNotifications(count);
    cacheUtils.set(`unread_${user.id}`, count);
  };

  const handleVoiceCommand = () => {
    if (isListening) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice commands are not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => {
      setIsListening(true);
      toast("Listening for command...", { icon: '🎤', id: 'voice-cmd' });
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      toast.success(`Command: "${transcript}"`, { id: 'voice-cmd' });
      if (transcript.includes('profile')) setActiveTab(AppTab.PROFILE);
      else if (transcript.includes('cascadea') || transcript.includes('shop') || transcript.includes('market')) setActiveTab(AppTab.CASCADEA);
      else if (transcript.includes('echo') || transcript.includes('feed')) setActiveTab(AppTab.ECHOES);
      else if (transcript.includes('call')) setActiveTab(AppTab.CALLS);
      else if (transcript.includes('chat') || transcript.includes('message')) setActiveTab(AppTab.CHATS);
      else if (transcript.includes('ai') || transcript.includes('endocard') || transcript.includes('assistant')) setShowAI(true);
      else if (transcript.includes('map') || transcript.includes('explore') || transcript.includes('location')) setShowMap(true);
      else if (transcript.includes('admin') || transcript.includes('command center')) setActiveTab(AppTab.ADMIN);
      else toast.error("Command not recognized.", { id: 'voice-cmd' });
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const isAdmin = user.email === 'edocardadmin@eyefield.pro';

  const tabs = [
    { id: AppTab.ECHOES, label: settings?.t('echoes') || 'Echoes', icon: ClosedEyeFace as any },
    { id: AppTab.CASCADEA, label: settings?.t('cascadea') || 'Cascadea', icon: null },
    { id: AppTab.CHATS, label: settings?.t('chats') || 'Chats', icon: MessageCircle },
    { id: AppTab.CALLS, label: settings?.t('calls') || 'Calls', icon: Phone },
    { id: AppTab.PROFILE, label: settings?.t('profile') || 'Profile', icon: UserIcon },
  ];

  if (isAdmin) {
    tabs.push({ id: AppTab.ADMIN, label: settings?.t('admin') || 'Admin', icon: ShieldAlert });
  }

  const pathname = usePathname();
  const isSpecificChat = /^\/chats\/[^\/]+$/.test(pathname);
  const showMobileUI = !isSpecificChat;

  return (
    <CallProvider currentUser={user}>
      <div className="flex flex-col h-screen w-full bg-white dark:bg-black items-center overflow-hidden" data-dyad-component="Layout">
        {!isOnline && (
          <div className="w-full bg-red-600 text-white text-[10px] font-black tracking-widest uppercase py-1.5 text-center z-[100] animate-pulse">
            <div className="flex items-center justify-center gap-2">
              <ShieldAlert size={12} />
              No Internet Connection - Using Offline Cache
            </div>
          </div>
        )}
        <div className="flex flex-row w-full h-full justify-center overflow-hidden">
          <DesktopSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            user={user} 
            tabs={tabs} 
            onTransmit={() => setShowCreateEcho(true)} 
          />

          <main className="flex-1 w-full h-full relative flex flex-col border-r border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-black lg:max-w-none">
            {showMobileUI && (
              <MobileHeader 
                unreadNotifications={unreadNotifications}
                onShowNotifications={() => setShowNotifications(true)}
                onShowShare={() => setShowShare(true)}
                onShowMap={() => setShowMap(true)}
                onShowAI={() => setShowAI(true)}
                shareLabel={settings?.t('search') === 'Search' ? 'Share' : 'Shiriki'}
              />
            )}

            <div className={`flex-1 overflow-y-auto no-scrollbar relative ${showMobileUI ? 'pt-[calc(4rem+var(--sat))] pb-[calc(4rem+var(--sab))]' : 'pt-0 pb-0'} md:pt-0 md:pb-0`}>
              <div className="max-w-6xl mx-auto h-full w-full">
                {children}
              </div>
            </div>

            {showMobileUI && (
              <MobileFooter 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                tabs={tabs} 
              />
            )}
          </main>

          <DesktopRightSidebar 
            unreadNotifications={unreadNotifications}
            onShowAI={() => setShowAI(true)}
            onShowMap={() => setShowMap(true)}
            onShowNotifications={() => setShowNotifications(true)}
          />

          {showShare && <ShareNumberOverlay user={user} onClose={() => setShowShare(false)} />}
          {showMap && <MapOverlay onClose={() => setShowMap(false)} />}
          {showAI && <EndocardOverlay onClose={() => setShowAI(false)} />}
          {showNotifications && <NotificationsOverlay userId={user.id} onClose={() => { setShowNotifications(false); fetchUnreadCount(); }} />}
          {showCreateEcho && <CreateEchoOverlay onClose={() => setShowCreateEcho(false)} />}
          <CallOverlay />

          {activeTab === AppTab.CHATS && showMobileUI && (
            <div className="md:hidden fixed bottom-28 right-4 mb-safe z-40 flex flex-col items-center gap-2">
              {isListening && (
                <div className="bg-black/70 text-white text-[10px] font-bold px-3 py-1 rounded-full animate-pulse backdrop-blur-md">
                  Listening...
                </div>
              )}
              <button
                onClick={handleVoiceCommand}
                className={`p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 flex items-center justify-center ${isListening
                  ? 'bg-red-500 text-white scale-110 shadow-[0_0_20px_rgba(239,68,68,0.6)]'
                  : 'bg-brand-primary dark:bg-white text-white dark:text-brand-primary hover:scale-105'
                  }`}
                title="Voice Command"
              >
                {isListening ? <AudioWaveform size={24} className="animate-bounce" /> : <Mic size={24} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </CallProvider>
  );
};

export default Layout;