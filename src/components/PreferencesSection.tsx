import React, { useState, useContext } from 'react';
import { Sun, Moon, Languages, Check } from 'lucide-react';
import { SettingsContext } from '../App';

export const PreferencesSection: React.FC<{ onBack: () => void }> = () => {
  const settings = useContext(SettingsContext);
  const languages = ['English', 'Swahili', 'French', 'Spanish', 'Portuguese'];

  return (
    <div className="p-6 space-y-10">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500">{settings?.t('theme')}</h3>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-[24px]">
          <button onClick={() => settings?.setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[20px] font-black text-xs transition-all ${settings?.theme === 'light' ? 'bg-white shadow-lg text-navy-950 scale-105' : 'text-slate-400'}`}>
            <Sun size={18} /> Light
          </button>
          <button onClick={() => settings?.setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[20px] font-black text-xs transition-all ${settings?.theme === 'dark' ? 'bg-navy-950 text-white shadow-xl scale-105' : 'text-slate-400'}`}>
            <Moon size={18} /> Dark
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500">{settings?.t('language')}</h3>
        <div className="space-y-2">
          {languages.map(l => (
            <button 
              key={l} 
              onClick={() => { settings?.setLanguage(l); alert(`Language: ${l} selected.`); }}
              className={`w-full flex items-center justify-between p-5 rounded-3xl border-2 transition-all ${settings?.language === l ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 font-black' : 'border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 font-bold opacity-60'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${settings?.language === l ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  <Languages size={18} />
                </div>
                <span className="text-sm">{l}</span>
              </div>
              {settings?.language === l && <Check size={18} className="text-blue-500" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};