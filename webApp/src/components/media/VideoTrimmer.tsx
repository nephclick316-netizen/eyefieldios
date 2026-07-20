import React, { useRef, useState, useEffect } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Play, Pause, Scissors, Check } from "lucide-react";
import { toast } from "sonner";

interface VideoTrimmerProps {
  videoUrl: string;
  onSave: (blob: Blob, duration: number) => void;
  onCancel: () => void;
}

const VideoTrimmer: React.FC<VideoTrimmerProps> = ({ videoUrl, onSave, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [range, setRange] = useState<[number, number]>([0, 15]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleLoaded = () => {
      setDuration(video.duration);
      setRange([0, Math.min(15, video.duration)]);
    };
    const handleUpdate = () => {
      if (video.currentTime >= range[1]) {
        video.currentTime = range[0];
        if (!isPlaying) video.pause();
      }
    };
    video.addEventListener("loadedmetadata", handleLoaded);
    video.addEventListener("timeupdate", handleUpdate);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoaded);
      video.removeEventListener("timeupdate", handleUpdate);
    };
  }, [range, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current?.paused) { videoRef.current.play(); setIsPlaying(true); }
    else { videoRef.current?.pause(); setIsPlaying(false); }
  };

  const handleExport = async () => {
    setIsProcessing(true);
    const video = videoRef.current;
    if (!video || !(video as any).captureStream) {
      toast.error("Trimming not supported in this browser.");
      setIsProcessing(false);
      return;
    }
    const stream = (video as any).captureStream();
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 1500000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => {
      onSave(new Blob(chunks, { type: 'video/webm' }), range[1] - range[0]);
      setIsProcessing(false);
    };
    video.currentTime = range[0];
    video.play();
    recorder.start();
    const check = setInterval(() => {
      if (video.currentTime >= range[1]) { recorder.stop(); video.pause(); clearInterval(check); }
    }, 100);
  };

  return (
    <div className="flex flex-col gap-5 w-full max-w-md bg-white dark:bg-[#0B1120] rounded-[2rem] p-5 shadow-xl border border-gray-100 dark:border-white/5">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner group">
        <video ref={videoRef} src={videoUrl} className="w-full h-full" playsInline />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button onClick={togglePlay} variant="ghost" className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
            {isPlaying ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" className="ml-1" />}
          </Button>
        </div>
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-50">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-[10px] font-black tracking-widest">PROCESSING...</p>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            <span>Trim Segment</span>
            <span className="text-accent">{(range[1] - range[0]).toFixed(1)}s</span>
          </div>
          <Slider value={range} max={duration || 100} step={0.1} onValueChange={v => setRange(v as [number, number])} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#0B1120] dark:text-white font-black text-xs">
            <Scissors size={14} /> <span>Trim Mode</span>
          </div>
          <Button onClick={handleExport} disabled={isProcessing} className="h-10 px-6 rounded-xl bg-[#0B1120] hover:bg-[#1e293b] text-white font-black text-xs gap-2 shadow-lg">
            <Check size={16} /> Confirm Trim
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoTrimmer;