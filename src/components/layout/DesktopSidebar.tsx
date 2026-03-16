import React, { useState } from 'react';
import { AppTab, User as UserType } from '../../types';
import { Plus, MoreHorizontal, Eye } from 'lucide-react';
import { CascadeaIcon } from './Icons';
import { LoadingBar } from './LoadingBar';

interface DesktopSidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  user: UserType;
  tabs: any[];
  onTransmit: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ activeTab, setActiveTab, user, tabs, onTransmit }) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <aside className="hidden md:flex flex-col w-20 xl:w-72 h-full py-6 px-2 xl:px-6 sticky top-0 shrink-0 justify-between glass-morphism border-r transition-premium relative z-50">
      <LoadingBar />
      <div className="space-y-8">
        <div className="flex items-center justify-center xl:justify-start px-2 mb-6">
          <div className="w-12 h-12 bg-navy-950 dark:bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl hover-scale-premium cursor-pointer group">
            {!logoError ? (
              <img 
                src="/Logo-icon2.png" 
                alt="EyeField" 
                className="w-full h-full object-contain p-1.5 transition-transform duration-700 group-hover:rotate-[360deg]" 
                onError={() => setLogoError(true)}
              />
            ) : (
              <Eye size={28} className="text-white dark:text-black" />
            )}
          </div>
          <div className="hidden xl:flex items-center gap-3 ml-4">
            <h1 className="text-3xl font-black tracking-tighter premium-gradient-text">EyeField</h1>
          </div>
        </div>

        <nav className="flex flex-col gap-3 items-center xl:items-start px-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-5 p-3.5 xl:px-6 xl:py-4 rounded-[2rem] transition-premium w-fit xl:w-full group relative ${isActive
                  ? 'font-bold text-navy-950 dark:text-white glass-card border-none scale-[1.05] z-10'
                  : 'font-medium text-slate-500 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 active:scale-95'
                  }`}
              >
                <div className="relative shrink-0">
                  {tab.id === AppTab.CASCADEA ? (
                    <CascadeaIcon size={26} active={isActive} />
                  ) : (
                    Icon && <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className="group-hover:scale-110 transition-premium" />
                  )}
                  {isActive && tab.id !== AppTab.CASCADEA && (
                    <div className="absolute -inset-2 bg-navy-950/5 dark:bg-white/10 rounded-full blur-lg -z-10" />
                  )}
                </div>
                <span className="hidden xl:block text-lg tracking-tight uppercase font-black opacity-90">{tab.label}</span>
                {isActive && (
                  <div className="hidden xl:block absolute left-0 w-1 h-6 bg-navy-950 dark:bg-white rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="pt-6 flex justify-center xl:justify-start w-full px-1">
          <button
            onClick={onTransmit}
            className="w-14 h-14 xl:w-full xl:h-auto xl:py-5 bg-navy-950 dark:bg-white text-white dark:text-black rounded-3xl font-black text-lg shadow-2xl hover:shadow-navy-950/20 dark:hover:shadow-white/20 hover-scale-premium transition-all flex items-center justify-center gap-3 border border-white/10 dark:border-black/10 uppercase tracking-widest"
          >
            <Plus size={24} className="xl:h-6 xl:w-6" />
            <span className="hidden xl:block text-sm">Transmit</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => setActiveTab(AppTab.PROFILE)}
        className="flex items-center justify-between p-4 rounded-3xl hover:bg-white/10 dark:hover:bg-white/5 transition-premium w-fit xl:w-full mt-auto glass-morphism-heavy border-none group overflow-hidden"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={user.avatar} className="w-11 h-11 rounded-2xl object-cover border border-white/20 shadow-md group-hover:scale-110 transition-premium" alt="" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-black rounded-full shadow-sm" />
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-sm font-black text-navy-950 dark:text-white leading-tight">{user.displayName}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">@{user.username}</p>
          </div>
        </div>
        <MoreHorizontal size={20} className="hidden xl:block text-slate-400 group-hover:rotate-90 transition-premium" />
      </button>
    </aside>
  );
};