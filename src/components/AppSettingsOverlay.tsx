import React, { useState, useContext } from 'react';
import { X, ChevronLeft, ChevronRight, User, Layers, Shield, Lock, HelpCircle, LogOut } from 'lucide-react';
import { User as UserType } from '../types';
import { SettingsContext } from '../App';
import { EditExperienceSection } from './EditExperienceSection';
import { PreferencesSection } from './PreferencesSection';
import { PermissionsSection } from './PermissionsSection';
import { PrivacySection } from './PrivacySection';
import { HelpSection } from './HelpSection';
import { profileService } from '../services/profileService'; // Import profileService
import { withTimeout } from '../utils/queryUtils';

export const AppSettingsOverlay: React.FC<{ 
  user: UserType; 
  setUser: (u: UserType) => void; 
  onClose: () => void;
  initialSection?: 'main' | 'profile' | 'preferences' | 'permissions' | 'privacy' | 'help'
}> = ({ user, setUser, onClose, initialSection = 'main' }) => {
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'preferences' | 'permissions' | 'privacy' | 'help'>(initialSection);
  const settings = useContext(SettingsContext);

  const sections = [
    { id: 'profile', label: settings?.t('edit_profile') || 'Identity & Business', icon: User, desc: 'Manage your public signature', color: 'text-orange-500' },
    { id: 'preferences', label: settings?.t('language') + ' & ' + settings?.t('theme'), icon: Layers, desc: 'Appearance and Universal Tongue', color: 'text-blue-500' },
    { id: 'permissions', label: settings?.t('permissions') || 'Access Matrix', icon: Shield, desc: 'Camera, Mic, and Location', color: 'text-purple-500' },
    { id: 'privacy', label: settings?.t('privacy') || 'Security & Privacy', icon: Lock, desc: 'Passwords and Blocked lists', color: 'text-red-500' },
    { id: 'help', label: settings?.t('help') || 'Help & Support', icon: HelpCircle, desc: 'FAQ and Endocard Support', color: 'text-emerald-500' },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile': return <EditExperienceSection user={user} setUser={setUser} onBack={() => setActiveSection('main')} />;
      case 'preferences': return <PreferencesSection onBack={() => setActiveSection('main')} />;
      case 'permissions': return <PermissionsSection onBack={() => setActiveSection('main')} />;
      case 'privacy': return <PrivacySection onBack={() => setActiveSection('main')} />;
      case 'help': return <HelpSection onBack={() => setActiveSection('main')} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
      <header className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 pt-safe">
        <button onClick={activeSection === 'main' ? onClose : () => setActiveSection('main')} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full">
          {activeSection === 'main' ? <X size={20} /> : <ChevronLeft size={20} />}
        </button>
        <h2 className="text-xs font-black uppercase tracking-[3px]">
          {activeSection === 'main' ? settings?.t('settings') : (sections.find(s => s.id === activeSection)?.label || 'Section')}
        </h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {activeSection === 'main' ? (
          <div className="p-6 space-y-2 flex-1">
            <div className="bg-navy-50/30 dark:bg-navy-950/20 p-6 rounded-[32px] mb-6 flex items-center gap-4 border border-navy-100 dark:border-navy-900">
              <img src={user.avatar} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-navy-800" alt="" />
              <div>
                <h3 className="font-black text-lg">{user.displayName}</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{user.username}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {sections.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setActiveSection(s.id as any)}
                  className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl hover:bg-slate-100 dark:hover:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-white dark:bg-black rounded-2xl shadow-sm ${s.color}`}>
                      <s.icon size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">{s.label}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{s.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800">
               <button 
                 onClick={() => { if(confirm('Are you sure you want to sign out?')) settings?.logout(); }}
                 className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-3xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-sm"
               >
                 <LogOut size={20} />
                 {settings?.t('logout')}
               </button>
            </div>

            <div className="py-10 flex flex-col items-center gap-2 opacity-20 mt-auto">
              <h1 className="text-xl font-black italic tracking-tighter">EyeField</h1>
              <p className="text-[8px] font-bold uppercase tracking-[4px]">Version 2.5.0 Alpha</p>
            </div>
          </div>
        ) : renderSectionContent()}
      </div>
    </div>
  );
};