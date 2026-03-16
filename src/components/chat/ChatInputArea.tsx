import React, { useState, useRef } from 'react';
import { Plus, Smile, Send, Mic, Square } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ChatInputAreaProps {
    onSendMessage: (text: string) => void;
    onSendAudio: (file: File) => void;
    onTyping: (isTyping: boolean) => void;
    onAttachmentClick: () => void;
    showAttachmentMenu: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
    onSendMessage,
    onSendAudio,
    onTyping,
    onAttachmentClick,
    showAttachmentMenu
}) => {
    const [inputText, setInputText] = useState('');
    const [showEmojiBar, setShowEmojiBar] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    
    const inputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isRecordingStarting = useRef(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;
        
        onSendMessage(inputText.trim());
        setInputText('');
        inputRef.current?.focus();
        
        // Stop typing indicator
        onTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

    const handleInputTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputText(e.target.value);
        
        onTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
        }, 2000);
    };

    const startRecording = async (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (isRecording || isRecordingStarting.current || mediaRecorderRef.current) return;

        isRecordingStarting.current = true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            if (!isRecordingStarting.current) {
                stream.getTracks().forEach(track => track.stop());
                return;
            }

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                stream.getTracks().forEach(track => track.stop());

                setIsRecording(false);
                if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
                mediaRecorderRef.current = null;

                if (audioBlob.size > 1000 && audioChunksRef.current.length > 0) {
                    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
                    const file = new File([audioBlob], `voice_note_${Date.now()}.${ext}`, { type: mimeType });
                    onSendAudio(file);
                }
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err) {
            toast.error("Microphone access denied");
        } finally {
            isRecordingStarting.current = false;
        }
    };

    const stopRecording = (e?: React.SyntheticEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        isRecordingStarting.current = false;

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        } else {
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            mediaRecorderRef.current = null;
        }
    };

    return (
        <div className="bg-white/90 dark:bg-black/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 p-3 shrink-0 relative bottom-0 w-full z-10 flex flex-col gap-2">
            {/* Most Used Emoji Quick Bar */}
            {showEmojiBar && (
                <div className="flex items-center justify-center gap-1 overflow-x-auto no-scrollbar py-1 animate-in slide-in-from-bottom-2 px-2 max-w-3xl mx-auto w-full">
                    {['😂', '❤️', '🔥', '👍', '🙏', '😊', '😍', '😭'].map(emoji => (
                        <button
                            key={emoji}
                            type="button"
                            onClick={() => setInputText(prev => prev + emoji)}
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-2xl hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors active:scale-90"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSend} className="flex items-center gap-2 max-w-3xl mx-auto w-full">
                <button
                    type="button"
                    onClick={onAttachmentClick}
                    className={`p-2.5 rounded-full transition-colors shrink-0 ${showAttachmentMenu ? 'bg-navy-950 text-white dark:bg-white dark:text-black' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/10'}`}
                >
                    <Plus size={22} className={`stroke-[2.5px] transition-transform ${showAttachmentMenu ? 'rotate-45' : ''}`} />
                </button>

                <div className="flex-1 relative flex items-center">
                    {isRecording ? (
                        <div className="w-full bg-red-50/50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl py-3 pl-4 pr-4 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-2 text-red-500">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                <span className="font-bold text-sm">Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Release to send</span>
                        </div>
                    ) : (
                        <>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={handleInputTextChange}
                                placeholder="Type a message..."
                                className="w-full bg-slate-100 dark:bg-white/10 border-none rounded-2xl py-3 pl-4 pr-10 text-sm focus:ring-2 focus:ring-navy-950 dark:focus:ring-white outline-none text-navy-900 dark:text-white placeholder:text-slate-500 transition-all font-medium"
                            />
                            <button
                                type="button"
                                onClick={() => setShowEmojiBar(!showEmojiBar)}
                                className={`absolute right-3 p-1 transition-colors rounded-full ${showEmojiBar ? 'text-blue-500 bg-blue-50 dark:bg-blue-500/20' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                            >
                                <Smile size={18} />
                            </button>
                        </>
                    )}
                </div>

                {inputText.trim() ? (
                    <button
                        type="submit"
                        className="w-11 h-11 bg-navy-950 text-white dark:bg-white dark:text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shrink-0"
                    >
                        <Send size={18} className="translate-x-[1px] translate-y-[-1px] stroke-[2.5px]" />
                    </button>
                ) : (
                    <button
                        type="button"
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shrink-0 ${isRecording ? 'bg-red-500 text-white scale-125' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/20'}`}
                        onPointerDown={startRecording}
                        onPointerUp={stopRecording}
                        onPointerLeave={stopRecording}
                    >
                        {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={20} className="stroke-[2px]" />}
                    </button>
                )}
            </form>
        </div>
    );
};