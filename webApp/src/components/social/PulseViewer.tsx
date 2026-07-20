"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, ExternalLink, Smile, Send, Loader2, Trash2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

interface Pulse {
  id: string;
  user_id: string;
  username: string;
  avatar: string;
  image: string;
  type: 'image' | 'video';
  caption?: string;
  link_url?: string;
}

interface PulseViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pulses: Pulse[];
  initialIndex: number;
  onDelete?: (id: string) => void;
}

const PulseViewer = ({ isOpen, onClose, pulses, initialIndex, onDelete }: PulseViewerProps) => {
  const { user: currentUser } = useUser();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const duration = 15000; // 15 seconds
  const intervalTime = 100; // Update every 100ms

  const currentPulse = pulses[currentIndex];
  const emojis = ["🔥", "❤️", "😂", "😮", "😢", "👏", "🙌", "✨"];

  const handleNext = () => {
    if (currentIndex < pulses.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
      setComment("");
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
      setComment("");
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !currentPulse) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('pulses')
        .delete()
        .eq('id', currentPulse.id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      
      toast.success("Status deleted");
      if (onDelete) onDelete(currentPulse.id);
    } catch (error) {
      toast.error("Failed to delete status");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUser) {
      toast.error("Please login to react");
      return;
    }

    try {
      const { error } = await supabase
        .from('pulse_likes')
        .insert({
          pulse_id: currentPulse.id,
          user_id: currentUser.id,
          emoji
        });

      if (error) throw error;
      toast.success(`Reacted with ${emoji}`);
      setIsPaused(false);
    } catch (error) {
      toast.error("Failed to react");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !comment.trim()) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('pulse_comments')
        .insert({
          pulse_id: currentPulse.id,
          user_id: currentUser.id,
          content: comment.trim()
        });

      if (error) throw error;
      toast.success("Comment sent!");
      setComment("");
      setIsPaused(false);
    } catch (error) {
      toast.error("Failed to send comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isOpen || isPaused) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (intervalTime / duration) * 100;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [currentIndex, isOpen, isPaused]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      if (!isPaused) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  }, [currentIndex, isPaused]);

  if (!currentPulse) return null;

  const isOwner = currentUser?.id === currentPulse.user_id;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg h-[85vh] p-0 overflow-hidden bg-black border-none rounded-3xl">
        <div className="relative w-full h-full flex flex-col">
          {/* Progress Bars */}
          <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
            {pulses.map((_, idx) => (
              <Progress 
                key={idx} 
                value={idx === currentIndex ? progress : idx < currentIndex ? 100 : 0} 
                className="h-1 bg-white/20"
              />
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-8 left-4 right-4 z-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent">
                <img src={currentPulse.avatar || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-bold text-sm drop-shadow-md">@{currentPulse.username}</span>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <AlertDialog onOpenChange={setIsPaused}>
                  <AlertDialogTrigger asChild>
                    <button className="text-white hover:bg-red-500/20 p-2 rounded-full transition-colors">
                      <Trash2 size={20} />
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-background border-white/10 rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black">Delete Status?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This status will be permanently removed.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                      >
                        {isDeleting ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex-1 flex items-center justify-center bg-neutral-900 relative">
            {currentPulse.type === 'video' ? (
              <video 
                ref={videoRef}
                src={currentPulse.image} 
                className="max-h-full w-full object-contain"
                autoPlay
                muted
                playsInline
                onEnded={handleNext}
              />
            ) : (
              <img 
                src={currentPulse.image} 
                alt="" 
                className="max-h-full w-full object-contain"
              />
            )}

            {/* Navigation Controls */}
            <div className="absolute inset-y-0 left-0 w-1/4 flex items-center justify-start pl-4 group cursor-pointer z-10" onClick={handlePrev}>
              <ChevronLeft className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
            </div>
            <div className="absolute inset-y-0 right-0 w-1/4 flex items-center justify-end pr-4 group cursor-pointer z-10" onClick={handleNext}>
              <ChevronRight className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
            </div>
          </div>

          {/* Interaction Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-50 space-y-4">
            {currentPulse.caption && (
              <p className="text-white text-sm line-clamp-3 drop-shadow-md">
                {currentPulse.caption}
              </p>
            )}
            
            {currentPulse.link_url && (
              <Button 
                asChild
                className="w-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/10 rounded-xl h-10"
              >
                <a href={currentPulse.link_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                  <ExternalLink size={14} />
                  <span className="font-bold text-xs">Visit Link</span>
                </a>
              </Button>
            )}

            <div className="flex items-center gap-2">
              <form onSubmit={handleComment} className="flex-1 flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-1 border border-white/10">
                <Input 
                  placeholder="Send a message..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onFocus={() => setIsPaused(true)}
                  onBlur={() => !comment && setIsPaused(false)}
                  className="bg-transparent border-none text-white placeholder:text-white/50 focus-visible:ring-0 h-9 text-sm"
                />
                <button 
                  type="submit" 
                  disabled={isSubmitting || !comment.trim()}
                  className="text-white hover:text-accent transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </form>

              <Popover onOpenChange={setIsPaused}>
                <PopoverTrigger asChild>
                  <button className="w-11 h-11 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-white hover:bg-white/20 transition-colors">
                    <Smile size={20} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-auto p-2 bg-black/90 backdrop-blur-xl border-white/10 rounded-2xl">
                  <div className="flex gap-1">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/10 rounded-xl transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PulseViewer;
