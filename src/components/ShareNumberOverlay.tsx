import React from 'react';
import { X, QrCode, Link as LinkIcon, Share2 } from 'lucide-react';
import { User as UserType } from '../types';
import { toast } from 'react-hot-toast';

export const ShareNumberOverlay: React.FC<{ user: UserType; onClose: () => void }> = ({ user, onClose }) => {
  const profileUrl = `https://eyefield.app/u/${user.username}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Link Transmitted to Clipboard');
    } catch (e) {
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Connect with ${user.displayName} on EyeField`,
          text: `Transmitting frequency. Join my field on EyeField.`,
          url: profileUrl,
        });
      } catch (e) {
        console.warn("Share failed or cancelled", e);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-8 flex flex-col items-center justify-center animate-in zoom-in duration-300 text-center">
      <button onClick={onClose} className="absolute top-8 left-8 p-3 bg-slate-100 dark:bg-slate-900 rounded-full active:scale-90 transition-transform pt-safe"><X size={24} /></button>

      <div className="space-y-10 w-full max-w-xs">
        <div className="space-y-2">
          <h2 className="text-3xl font-black tracking-tighter">EyeField Signal</h2>
          <p className="text-sm text-slate-500 font-medium">Transmit your frequency to nearby peers.</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[48px] border-4 border-slate-100 dark:border-slate-800 shadow-inner flex flex-col items-center gap-6">
          <div className="bg-white p-4 rounded-3xl shadow-xl">
            <QrCode size={180} className="text-navy-950" />
          </div>
          <div className="flex items-center gap-3">
            <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-black shadow-lg" alt="" />
            <div className="text-left">
              <p className="text-xs font-black">{user.displayName}</p>
              <p className="text-[10px] text-slate-400 font-bold">@{user.username}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCopyLink}
            className="p-5 bg-slate-100 dark:bg-slate-900 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <LinkIcon size={24} className="text-blue-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">Copy Link</span>
          </button>
          <button
            onClick={handleNativeShare}
            className="p-5 bg-slate-100 dark:bg-slate-900 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all"
          >
            <Share2 size={24} className="text-orange-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};