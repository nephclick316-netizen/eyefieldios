"use client";

import React from "react";
import { Image as ImageIcon, Video, FileText, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MediaShareDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const MediaShareDialog: React.FC<MediaShareDialogProps> = ({
  isOpen,
  onOpenChange,
  onMediaSelect
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-6 bg-white dark:bg-secondary border-white/10 z-[100] shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-accent">Share Media</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <label className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10 bg-secondary/30 hover:bg-accent hover:text-white transition-all cursor-pointer group">
            <ImageIcon size={24} className="text-blue-500 group-hover:text-white" />
            <span className="text-xs font-bold">Images</span>
            <input type="file" className="hidden" multiple accept="image/*" onChange={onMediaSelect} />
          </label>
          <label className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 border border-white/10 bg-secondary/30 hover:bg-accent hover:text-white transition-all cursor-pointer group">
            <Video size={24} className="text-purple-500 group-hover:text-white" />
            <span className="text-xs font-bold">Videos</span>
            <input type="file" className="hidden" accept="video/*" onChange={onMediaSelect} />
          </label>
          <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 border-white/5 bg-secondary/30 hover:bg-accent hover:text-white transition-all">
            <FileText size={24} className="text-orange-500" />
            <span className="text-xs font-bold">Documents</span>
          </Button>
          <Button variant="outline" className="h-24 rounded-2xl flex flex-col gap-2 border-white/5 bg-secondary/30 hover:bg-accent hover:text-white transition-all">
            <MapPin size={24} className="text-red-500" />
            <span className="text-xs font-bold">Location</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaShareDialog;