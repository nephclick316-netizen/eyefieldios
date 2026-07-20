import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Story } from '../types';

export const StoryViewerOverlay: React.FC<{ story: Story; onClose: () => void }> = ({ story, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col animate-in fade-in duration-300">
      <header className="p-4 flex items-center justify-between absolute top-4 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center gap-3">
          <img src={story.user.avatar} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="" />
          <span className="text-white font-bold text-sm">{story.user.username}</span>
        </div>
        <button onClick={onClose} className="p-2 text-white"><X size={24} /></button>
      </header>
      <img src={story.mediaUrl} className="w-full h-full object-cover" alt="" />
    </div>
  );
};