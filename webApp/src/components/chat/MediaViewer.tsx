"use client";

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, Download } from "lucide-react";
import { toast } from "sonner";

interface MediaViewerProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const MediaViewer: React.FC<MediaViewerProps> = ({ url, isOpen, onClose }) => {
  if (!url) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `media-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download image");
      
      // Fallback to simple link if fetch fails (e.g. CORS)
      const link = document.createElement('a');
      link.href = url;
      link.target = "_blank";
      link.download = 'media-file';
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-none overflow-hidden flex items-center justify-center z-[200]">
        <div className="absolute top-4 right-4 flex gap-2 z-50">
          <button 
            onClick={handleDownload}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Download Image"
          >
            <Download size={20} />
          </button>
          <button 
            onClick={onClose}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <img 
          src={url} 
          alt="Full view" 
          className="max-w-full max-h-[90vh] object-contain animate-in zoom-in-95 duration-300"
        />
      </DialogContent>
    </Dialog>
  );
};

export default MediaViewer;