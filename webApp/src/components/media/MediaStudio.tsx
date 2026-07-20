import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ImageEditor from "./ImageEditor";
import VideoTrimmer from "./VideoTrimmer";
import { X, ChevronRight, Sparkles, Video } from "lucide-react";
import { toast } from "sonner";

interface MediaFile {
  id: string;
  file: File;
  preview: string;
  type: "image" | "video";
  status: "pending" | "edited" | "processing";
  result?: Blob;
}

interface MediaStudioProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  onComplete: (results: { blob: Blob; type: "image" | "video" }[]) => void;
  maxImages?: number;
  aspectRatio?: number;
}

const MediaStudio: React.FC<MediaStudioProps> = ({ 
  isOpen, 
  onClose, 
  files: initialFiles, 
  onComplete,
  maxImages = 3,
  aspectRatio
}) => {
  const [mediaList, setMediaList] = useState<MediaFile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (initialFiles.length > 0) {
      let imageCount = 0;
      const newList = initialFiles.map(file => {
        const type = (file.type.startsWith("video") ? "video" : "image") as "image" | "video";
        if (type === "image") imageCount++;
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          preview: URL.createObjectURL(file),
          type,
          status: "pending" as const
        };
      });

      if (imageCount > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed.`);
        setMediaList(newList.filter(m => m.type === "video" || (m.type === "image" && initialFiles.indexOf(m.file) < maxImages)));
      } else {
        setMediaList(newList);
      }
    }
  }, [initialFiles, maxImages]);

  const handleSaveItem = (blob: Blob) => {
    setMediaList(prev => prev.map((item, i) => 
      i === currentIndex ? { ...item, status: "edited", result: blob } : item
    ));
  };

  const handleNext = () => {
    if (currentIndex < mediaList.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      const results = mediaList.map(m => ({
        blob: m.result || m.file,
        type: m.type
      }));
      onComplete(results);
      onClose();
    }
  };

  const currentItem = mediaList[currentIndex];

  if (!isOpen || mediaList.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 bg-[#F8FAFC] dark:bg-[#020617] border-none rounded-2xl overflow-hidden shadow-2xl h-[92vh] flex flex-col">
        <DialogHeader className="p-5 md:p-6 border-b border-gray-100 dark:border-white/5 flex flex-row items-center justify-between shrink-0 bg-white dark:bg-[#0B1120]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0B1120] flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <DialogTitle className="text-lg font-black">Media Studio</DialogTitle>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {currentIndex + 1} / {mediaList.length} • {currentItem?.type}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X size={20} />
          </Button>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Editor Area */}
          <div className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 no-scrollbar">
            <div className="flex-1 flex items-center justify-center min-h-fit">
              {currentItem?.type === "image" ? (
                <ImageEditor 
                  image={currentItem.preview} 
                  aspectRatio={aspectRatio}
                  onSave={handleSaveItem}
                  onCancel={onClose}
                />
              ) : (
                <VideoTrimmer 
                  videoUrl={currentItem?.preview} 
                  onSave={handleSaveItem}
                  onCancel={onClose}
                />
              )}
            </div>
          </div>

          {/* Sidebar / Queue */}
          <div className="w-full md:w-56 bg-white dark:bg-[#0B1120] border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 p-4 flex flex-col gap-4 shrink-0">
            <div className="flex-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar">
              {mediaList.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-16 h-16 md:w-full md:aspect-square shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    idx === currentIndex ? "border-[#0B1120] scale-105 shadow-lg" : "border-transparent opacity-60"
                  }`}
                >
                  <img src={item.preview} className="w-full h-full object-cover" />
                  {item.status === "edited" && (
                    <div className="absolute top-1 right-1 bg-green-500 text-white p-0.5 rounded-full">
                      <Sparkles size={8} />
                    </div>
                  )}
                  {item.type === "video" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <Video className="text-white" size={16} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <Button 
              onClick={handleNext}
              className="w-full h-12 rounded-xl bg-[#000080] hover:bg-[#000066] text-white font-black text-sm shadow-xl shadow-blue-900/20 group"
            >
              Next
              <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaStudio;