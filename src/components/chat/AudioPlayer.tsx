import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
    src: string;
    isMine?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isMine = false }) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.load();
        }
    }, [src]);

    const onLoadedMetadata = () => {
        if (audioRef.current && audioRef.current.duration !== Infinity && !isNaN(audioRef.current.duration)) {
            setDuration(audioRef.current.duration);
        }
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const onEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const togglePlayPause = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent message bubble click
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().then(() => {
                    setIsPlaying(true);
                }).catch(e => console.error("Audio play failed:", e));
            }
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time) || !isFinite(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3 w-full max-w-[220px]">
            <button
                onClick={togglePlayPause}
                type="button"
                className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm border hover:scale-105 active:scale-95 transition-all ${
                    isMine 
                    ? 'bg-white text-brand-primary border-white/20' 
                    : 'bg-white dark:bg-black/20 text-blue-600 border-blue-600/20'
                }`}
            >
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1 flex flex-col justify-center min-w-[140px]">
                <div className="flex justify-between items-center mb-1">
                    <span className={`text-[11px] font-black uppercase tracking-widest flex items-center gap-1 ${isMine ? 'text-white' : 'text-navy-950 dark:text-white'}`}>
                        Field Note
                    </span>
                    <span className={`text-[10px] font-bold ${isMine ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
                    </span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                    {/* Waveform visual */}
                    <div className="absolute inset-0 flex items-center gap-[2px] opacity-40 px-1 pointer-events-none">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div
                                key={i}
                                className={`flex-1 rounded-full ${isMine ? 'bg-white' : 'bg-blue-600'}`}
                                style={{
                                    height: `${Math.max(15, Math.sin(i * 0.5) * 40 + 50)}%`,
                                    opacity: (currentTime / duration) > (i / 24) ? 1 : 0.4
                                }}
                            />
                        ))}
                    </div>

                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        onClick={e => e.stopPropagation()}
                        className="w-full h-full opacity-0 cursor-pointer absolute inset-0 z-10"
                    />
                </div>
            </div>
            <audio
                ref={audioRef}
                src={src}
                preload="metadata"
                className="hidden"
                onLoadedMetadata={onLoadedMetadata}
                onDurationChange={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
            />
        </div>
    );
};