import React from 'react';
import { X, User, ShoppingBag, MapPin, Radio, ChevronRight, Navigation } from 'lucide-react';

export const MapOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[1200] bg-slate-100 dark:bg-slate-950 animate-in slide-in-from-bottom duration-300 flex flex-col pt-safe">
      <div className="relative flex-1 overflow-hidden bg-slate-200 dark:bg-slate-900">
        {/* Mock Map Background Grid */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-20 pointer-events-none">
          {Array.from({ length: 144 }).map((_, i) => (
            <div key={i} className="border-[0.5px] border-slate-400" />
          ))}
        </div>
        
        {/* Mock Map Pins */}
        {[
          { x: '20%', y: '30%', color: 'bg-navy-950', icon: User },
          { x: '70%', y: '20%', color: 'bg-orange-500', icon: ShoppingBag },
          { x: '45%', y: '60%', color: 'bg-emerald-500', icon: MapPin },
          { x: '80%', y: '75%', color: 'bg-navy-950', icon: User },
        ].map((pin, i) => (
          <div key={i} className="absolute transition-transform active:scale-90" style={{ left: pin.x, top: pin.y }}>
            <div className={`p-2 rounded-full shadow-2xl ${pin.color} text-white`}>
              <pin.icon size={16} />
            </div>
            <div className="mt-1 flex flex-col items-center">
              <div className={`w-1 h-1 rounded-full ${pin.color}`} />
              <span className="text-[8px] font-black uppercase tracking-widest mt-0.5 whitespace-nowrap bg-white/80 dark:bg-black/80 px-1 rounded">Nearby Signal</span>
            </div>
          </div>
        ))}

        <header className="absolute top-4 left-4 right-4 flex justify-between items-center pointer-events-none">
          <button onClick={onClose} className="p-3 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform"><X size={20} /></button>
          <div className="bg-white/90 dark:bg-black/90 backdrop-blur-md px-6 py-2.5 rounded-2xl shadow-lg pointer-events-auto border border-white/20">
            <p className="text-[10px] font-black uppercase tracking-widest">Field Mapping Active</p>
          </div>
          <button className="p-3 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full shadow-lg pointer-events-auto active:scale-90 transition-transform"><Navigation size={20} /></button>
        </header>

        <div className="absolute bottom-8 left-4 right-4 bg-white/90 dark:bg-black/90 backdrop-blur-xl p-5 rounded-[32px] shadow-2xl flex items-center gap-4 border border-white/20">
          <div className="w-12 h-12 bg-navy-500/10 rounded-2xl flex items-center justify-center text-navy-500">
            <Radio size={24} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-black">4 Peer Signals Detected</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Within 500m Field Radius</p>
          </div>
          <button className="ml-auto p-3 bg-navy-950 text-white rounded-2xl active:scale-95">
             <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};