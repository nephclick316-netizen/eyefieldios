import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, Download, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfessionalVideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

const ProfessionalVideoPlayer: React.FC<ProfessionalVideoPlayerProps> = ({ 
  src, 
  poster, 
  className, 
  autoPlay = false, 
  loop = false, 
  muted: initialMuted = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setProgress((video.currentTime / video.duration) * 100);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlay = () => {
    if (videoRef.current?.paused) videoRef.current.play();
    else videoRef.current?.pause();
  };

  const skip = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  const handleProgressChange = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = (value[0] / 100) * videoRef.current.duration;
      setProgress(value[0]);
    }
  };

  const handleDownload = () => {
    if (duration > 15.5) {
      toast.error("Download restricted to 15 seconds max.");
      return;
    }
    
    const link = document.createElement("a");
    link.href = src;
    link.download = `eyefield-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
  };

  return (
    <div 
      className={cn("relative group overflow-hidden rounded-[2rem] bg-black shadow-2xl aspect-video", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        autoPlay={autoPlay}
        loop={loop}
        muted={isMuted}
        playsInline
        onClick={togglePlay}
      />

      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 flex flex-col justify-end p-6",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress Bar */}
        <div className="mb-6 px-1">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleProgressChange}
            className="cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => skip(-3)} 
                className="text-white hover:bg-white/10 rounded-full"
              >
                <SkipBack size={20} fill="white" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={togglePlay} 
                className="text-white hover:bg-white/20 w-12 h-12 rounded-full border border-white/20 backdrop-blur-md"
              >
                {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
              </Button>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => skip(3)} 
                className="text-white hover:bg-white/10 rounded-full"
              >
                <SkipForward size={20} fill="white" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMuted(!isMuted)} 
                className="text-white hover:bg-white/10 rounded-full"
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </Button>
              <span className="text-[10px] font-black text-white/60 tracking-widest uppercase">
                {Math.floor(currentTimeForDisplay(videoRef.current?.currentTime))}:{Math.floor(videoRef.current?.currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDownload}
              className="text-white border-white/10 bg-white/5 hover:bg-accent hover:border-accent hover:text-white rounded-xl transition-all shadow-lg"
            >
              <Download size={18} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => videoRef.current?.requestFullscreen()} 
              className="text-white hover:bg-white/10 rounded-full"
            >
              <Maximize2 size={18} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const currentTimeForDisplay = (time?: number) => {
  return time || 0;
};

export default ProfessionalVideoPlayer;
