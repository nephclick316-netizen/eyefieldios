"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Image as ImageIcon, Video, X } from "lucide-react";

interface MediaUploadFieldsProps {
  images: { url: string; blob?: Blob }[];
  setImages: (val: { url: string; blob?: Blob }[] | ((prev: { url: string; blob?: Blob }[]) => { url: string; blob?: Blob }[])) => void;
  video: { url: string; blob?: Blob } | null;
  setVideo: (val: { url: string; blob?: Blob } | null) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MediaUploadFields: React.FC<MediaUploadFieldsProps> = ({
  images,
  setImages,
  video,
  setVideo,
  onFileUpload
}) => {
  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Media (Images & 15s Video)</Label>
      <div className="grid grid-cols-4 gap-3">
        <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-100 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
          <ImageIcon size={20} className="text-muted-foreground group-hover:text-accent transition-colors" />
          <input type="file" className="hidden" multiple onChange={onFileUpload} accept="image/*,video/*" />
        </label>
        
        {video && (
          <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-lg group">
            <video src={video.url} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <Video size={16} className="text-white" />
            </div>
            <button 
              onClick={() => setVideo(null)} 
              className="absolute top-1 right-1 bg-black/50 rounded-lg p-1 text-white hover:bg-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        )}

        {images.map((img, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 shadow-lg group">
            <img src={img.url} className="w-full h-full object-cover" />
            <button 
              onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} 
              className="absolute top-1 right-1 bg-black/50 rounded-lg p-1 text-white hover:bg-red-500 transition-colors"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MediaUploadFields;