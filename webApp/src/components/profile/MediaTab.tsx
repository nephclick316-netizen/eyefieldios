"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Play, Trash2, X, Maximize2, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Media {
  id: string;
  media_url: string;
  media_type: string;
  caption?: string;
}

interface MediaTabProps {
  media: Media[];
  isOwner: boolean;
  onDelete?: (id: string) => void;
}

const MediaTab: React.FC<MediaTabProps> = ({ media, isOwner, onDelete }) => {
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Delete this media?")) return;
    try {
      const { error } = await supabase
        .from('pulses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Media deleted");
      onDelete?.(id);
    } catch (error) {
      toast.error("Failed to delete media");
    }
  };

  const handleShare = async (e: React.MouseEvent, item: Media) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this media on EyeField',
          text: item.caption || 'Shared from EyeField',
          url: item.media_url
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') toast.error("Sharing failed");
      }
    } else {
      navigator.clipboard.writeText(item.media_url);
      toast.success("Link copied to clipboard!");
    }
  };

  if (media.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-secondary/30 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <ImageIcon size={32} />
        </div>
        <p className="text-muted-foreground font-medium">No media shared</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {media.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setSelectedMedia(item)}
            className="group relative aspect-square rounded-2xl overflow-hidden bg-secondary/20 border border-white/5 cursor-pointer"
          >
            <img 
              src={item.media_url} 
              alt="Media" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button 
                onClick={(e) => handleShare(e, item)}
                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-accent transition-colors"
              >
                <Share2 size={18} />
              </button>
              <Maximize2 className="text-white" size={24} />
            </div>

            {item.media_type === 'video' && (
              <div className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-md rounded-lg">
                <Play size={12} className="text-white fill-white" />
              </div>
            )}

            {isOwner && (
              <button 
                onClick={(e) => handleDelete(e, item.id)}
                className="absolute bottom-2 right-2 p-2 bg-black/50 backdrop-blur-md text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
              >
                <Trash2 size={14} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <div className="absolute top-6 right-6 flex gap-3">
              <button 
                className="p-3 bg-white/10 hover:bg-accent rounded-full text-white transition-colors"
                onClick={(e) => handleShare(e, selectedMedia)}
              >
                <Share2 size={24} />
              </button>
              <button 
                className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                onClick={() => setSelectedMedia(null)}
              >
                <X size={24} />
              </button>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedMedia.media_type === 'video' ? (
                <video 
                  src={selectedMedia.media_url} 
                  controls 
                  autoPlay 
                  className="max-w-full max-h-full rounded-3xl shadow-2xl"
                />
              ) : (
                <img 
                  src={selectedMedia.media_url} 
                  alt="Fullscreen" 
                  className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl"
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MediaTab;