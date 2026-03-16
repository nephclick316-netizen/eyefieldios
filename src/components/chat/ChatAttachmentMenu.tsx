import React, { useRef } from 'react';
import { Image as ImageIcon, Video, FileText, MapPin, X } from 'lucide-react';

interface ChatAttachmentMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onFileSelect: (files: FileList | null, type: 'image' | 'video' | 'document') => void;
    onLocationSelect: () => void;
}

export const ChatAttachmentMenu: React.FC<ChatAttachmentMenuProps> = ({ isOpen, onClose, onFileSelect, onLocationSelect }) => {
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const docInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-[2100] bg-black/20 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
            <div className="absolute bottom-20 left-4 z-[2200] bg-white dark:bg-slate-900 rounded-[32px] p-4 shadow-2xl border border-slate-100 dark:border-white/10 animate-in slide-in-from-bottom-2 zoom-in-95 origin-bottom-left flex flex-col gap-2 min-w-[200px]">

                <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={imageInputRef}
                    onChange={e => { onFileSelect(e.target.files, 'image'); onClose(); }}
                />
                <button
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <ImageIcon size={20} />
                    </div>
                    <span className="font-bold text-sm text-navy-950 dark:text-white">Photos</span>
                </button>

                <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    ref={videoInputRef}
                    onChange={e => { onFileSelect(e.target.files, 'video'); onClose(); }}
                />
                <button
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-500 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <Video size={20} />
                    </div>
                    <span className="font-bold text-sm text-navy-950 dark:text-white">Video</span>
                </button>

                <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    ref={docInputRef}
                    onChange={e => { onFileSelect(e.target.files, 'document'); onClose(); }}
                />
                <button
                    onClick={() => docInputRef.current?.click()}
                    className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <FileText size={20} />
                    </div>
                    <span className="font-bold text-sm text-navy-950 dark:text-white">Document</span>
                </button>

                <button
                    onClick={() => { onLocationSelect(); onClose(); }}
                    className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-2xl transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-500 dark:bg-green-500/20 dark:text-green-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <MapPin size={20} />
                    </div>
                    <span className="font-bold text-sm text-navy-950 dark:text-white">Location</span>
                </button>

            </div>
        </>
    );
}