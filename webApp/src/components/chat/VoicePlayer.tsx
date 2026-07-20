"use client";

import React, { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoicePlayerProps {
  url: string;
  isOutgoing?: boolean;
  className?: string;
}

const VoicePlayer: React.FC<VoicePlayerProps> = ({ url, isOutgoing, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: isOutgoing ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 140, 0, 0.3)",
      progressColor: isOutgoing ? "#FFFFFF" : "#FF8C00",
      cursorColor: "transparent",
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 32,
      normalize: true,
      url: url,
    });

    wavesurfer.current.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.current?.getDuration() || 0);
    });

    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
    wavesurfer.current.on("finish", () => setIsPlaying(false));
    
    wavesurfer.current.on("timeupdate", (time) => {
      setCurrentTime(time);
    });

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url, isOutgoing]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    wavesurfer.current?.playPause();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-3 min-w-[200px] py-1", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlay}
        disabled={!isReady}
        className={cn(
          "w-10 h-10 rounded-full shrink-0 transition-all",
          isOutgoing 
            ? "bg-white/10 hover:bg-white/20 text-white" 
            : "bg-accent/10 hover:bg-accent/20 text-accent"
        )}
      >
        {!isReady ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isPlaying ? (
          <Pause size={18} fill="currentColor" />
        ) : (
          <Play size={18} fill="currentColor" className="ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1">
        <div ref={containerRef} className="w-full" />
        <div className={cn(
          "flex justify-between text-[10px] font-black uppercase tracking-widest opacity-60",
          isOutgoing ? "text-white" : "text-foreground"
        )}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default VoicePlayer;