import React from 'react';
import { Plus } from 'lucide-react';
import { Pulse, User } from '../types';

interface PulseBarProps {
  pulses: Pulse[];
  currentUser: User;
  onAddPulse: () => void;
  onViewPulse: (pulse: Pulse) => void;
}

export const PulseBar: React.FC<PulseBarProps> = ({ pulses, currentUser, onAddPulse, onViewPulse }) => {
  // Group pulses by user (showing only the latest for each user in the bar)
  const uniquePulses = Array.from(new Map(pulses.map(p => [p.user.id, p])).values());

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-1">
      {/* Add Pulse Button */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <button 
          onClick={onAddPulse}
          className="relative w-20 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 active:scale-95 transition-transform"
        >
          <img src={currentUser.avatar} className="w-full h-full object-cover rounded-2xl opacity-40" alt="" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-navy-950 text-white p-1.5 rounded-lg shadow-lg">
              <Plus size={16} strokeWidth={3} />
            </div>
          </div>
        </button>
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Your Pulse</span>
      </div>

      {/* Pulse List */}
      {uniquePulses.map((pulse: Pulse) => (
        <div key={pulse.id} className="flex flex-col items-center gap-2 shrink-0">
          <button 
            onClick={() => onViewPulse(pulse)}
            className="w-20 h-24 rounded-2xl p-0.5 border-2 border-blue-600 active:scale-95 transition-transform overflow-hidden"
          >
            <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-100 dark:bg-slate-900">
              {pulse.type === 'video' ? (
                <video src={pulse.mediaUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={pulse.mediaUrl} className="w-full h-full object-cover" alt="" />
              )}
            </div>
          </button>
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900 dark:text-white truncate w-20 text-center">
            {pulse.user.displayName.split(' ')[0]}
          </span>
        </div>
      ))}
    </div>
  );
};