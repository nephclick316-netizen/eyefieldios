import React from 'react';
import { X } from 'lucide-react';

export const StatisticOverlay: React.FC<{ type: 'echo' | 'product'; data: any; onClose: () => void }> = ({ type, data, onClose }) => (
  <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom duration-300 pt-safe">
    <header className="flex justify-between items-center mb-12">
      <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><X size={20} /></button>
      <h2 className="text-sm font-black uppercase">{type} Stats</h2>
      <div className="w-10" />
    </header>
    <div className="flex-1 flex flex-col items-center gap-10">
      <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-[40px] text-center w-full">
        <p className="text-3xl font-black">{data.likes || '1.2K'}</p>
        <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Interactions</p>
      </div>
    </div>
  </div>
);