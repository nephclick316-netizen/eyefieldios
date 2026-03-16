import React from 'react';
import { AppTab } from '../../types';
import { CascadeaIcon } from './Icons';

interface MobileFooterProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  tabs: any[];
}

export const MobileFooter: React.FC<MobileFooterProps> = ({ activeTab, setActiveTab, tabs }) => {
  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/10 dark:bg-black/40 backdrop-blur-2xl border border-white/20 rounded-[28px] z-50 shadow-2xl overflow-hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center w-full h-12 rounded-2xl transition-all duration-300 ${isActive 
                ? 'text-brand-primary dark:text-white bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 shadow-lg scale-105' 
                : 'text-slate-400 dark:text-slate-500'}`}
            >
              {tab.id === AppTab.CASCADEA ? (
                <CascadeaIcon size={22} active={isActive} />
              ) : (
                Icon && <div className="relative"><Icon size={22} strokeWidth={isActive ? 2.5 : 2} /></div>
              )}
              <span className="text-[9px] mt-0.5 font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};