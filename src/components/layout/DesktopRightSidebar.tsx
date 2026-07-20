import React from 'react';
import { Search, Sparkles, Map as MapIcon, Bell } from 'lucide-react';

interface DesktopRightSidebarProps {
  unreadNotifications: number;
  onShowAI: () => void;
  onShowMap: () => void;
  onShowNotifications: () => void;
}

export const DesktopRightSidebar: React.FC<DesktopRightSidebarProps> = ({
  unreadNotifications,
  onShowAI,
  onShowMap,
  onShowNotifications
}) => {
  return (
    <aside className="hidden lg:flex flex-col w-80 xl:w-96 h-full py-6 px-6 sticky top-0 shrink-0 gap-6 overflow-y-auto no-scrollbar bg-white/50 dark:bg-black/50 backdrop-blur-xl">
      <div className="relative group">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-950 dark:group-focus-within:text-white transition-colors" />
        <input
          type="text"
          placeholder="Search EyeField..."
          className="w-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full py-3.5 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white transition-all text-navy-950 dark:text-white placeholder:text-slate-500"
        />
      </div>

      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/20 dark:border-white/10 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-brand-primary dark:text-navy-300">
          <Sparkles size={20} />
          <h3 className="font-black text-sm">Endocard AI</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Your personal concierge for scheduling, marketplace assistance, and neural insights.
        </p>
        <button
          onClick={onShowAI}
          className="mt-2 w-full py-2.5 bg-navy-950 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity shadow-lg"
        >
          Ask Endocard
        </button>
      </div>

      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/20 dark:border-white/10 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <MapIcon size={20} />
          <h3 className="font-black text-sm">Field Map</h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Discover nearby signals, peers, and Cascadea listings in your physical vicinity.
        </p>
        <button
          onClick={onShowMap}
          className="mt-2 w-full py-2.5 bg-slate-200/50 dark:bg-white/10 text-navy-950 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Explore Map
        </button>
      </div>

      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl p-5 border border-white/20 dark:border-white/10 flex flex-col gap-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-navy-950 dark:text-white">
            <Bell size={20} />
            <h3 className="font-black text-sm">Alerts</h3>
          </div>
          {unreadNotifications > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {unreadNotifications} New
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          Stay updated with your latest interactions and signals.
        </p>
        <button
          onClick={onShowNotifications}
          className="mt-2 w-full py-2.5 bg-slate-200/50 dark:bg-white/10 text-navy-950 dark:text-white rounded-xl text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          View All Alerts
        </button>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 text-[11px] text-slate-400 font-medium mt-auto">
        <a href="#" className="hover:underline">Terms of Service</a>
        <a href="#" className="hover:underline">Privacy Policy</a>
        <a href="#" className="hover:underline">Cookie Policy</a>
        <a href="#" className="hover:underline">Accessibility</a>
        <span>© 2024 EyeField Corp.</span>
      </div>
    </aside>
  );
};