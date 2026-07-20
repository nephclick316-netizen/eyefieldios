import React, { useState } from 'react';
import { Bell, Share2, Bot, Eye } from 'lucide-react';
import { GoogleMapsPin } from './Icons';
import { LoadingBar } from './LoadingBar';

interface MobileHeaderProps {
  unreadNotifications: number;
  onShowNotifications: () => void;
  onShowShare: () => void;
  onShowMap: () => void;
  onShowAI: () => void;
  shareLabel: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  unreadNotifications,
  onShowNotifications,
  onShowShare,
  onShowMap,
  onShowAI,
  shareLabel
}) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 pt-safe bg-white/70 dark:bg-black/70 backdrop-blur-2xl border-b border-white/20 dark:border-white/10 flex items-center justify-between px-4 z-50 transition-colors">
      <LoadingBar />
      <div className="flex items-center gap-2 h-16">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">EyeField</h1>
      </div>
      <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
        <button onClick={onShowNotifications} className="relative p-2 active:scale-90 transition-transform">
          <Bell size={20} />
          {unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-black" />}
        </button>
        <button onClick={onShowShare} className="flex flex-col items-center p-1 active:scale-90 transition-transform">
          <Share2 size={20} />
          <span className="text-[8px] font-bold uppercase mt-0.5">{shareLabel}</span>
        </button>
        <button onClick={onShowMap} className="flex flex-col items-center p-1 active:scale-90 transition-transform">
          <GoogleMapsPin size={22} />
          <span className="text-[8px] font-bold uppercase mt-0.5">Explore</span>
        </button>
        <button onClick={onShowAI} className="flex flex-col items-center p-1 px-2 bg-brand-primary/5 dark:bg-white/5 rounded-lg active:scale-90 transition-transform border border-brand-primary/10 dark:border-white/10">
          <Bot size={20} className="text-brand-primary dark:text-navy-300" />
          <span className="text-[8px] font-black uppercase mt-0.5 text-brand-primary dark:text-navy-300">Endocard</span>
        </button>
      </div>
    </header>
  );
};