"use client";

import React from "react";
import { Heart, Smile, Share2, Repeat, ExternalLink } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EchoActionsProps {
  isLiked: boolean;
  likesCount: number;
  totalReactions: number;
  onLike: () => void;
  onReaction: (emoji: string) => void;
  onEcho: () => void;
  onShareExternal: () => void;
  children: React.ReactNode; // This will be the EchoComments component
}

const EchoActions: React.FC<EchoActionsProps> = ({
  isLiked,
  likesCount,
  totalReactions,
  onLike,
  onReaction,
  onEcho,
  onShareExternal,
  children
}) => {
  const moreReactions = ["🔥", "❤️", "😂", "😮", "😢", "👏", "🙌", "✨", "💯", "🚀", "💡", "🎉", "👀", "✅", "🤝", "💪"];

  return (
    <div className="flex items-center justify-between max-w-sm">
      {children}

      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-green-500 transition-colors group/btn">
            <div className="p-2 rounded-full group-hover/btn:bg-green-500/10">
              <Smile size={18} />
            </div>
            {totalReactions > 0 && <span className="text-xs font-bold">{totalReactions}</span>}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-background/95 backdrop-blur-lg border-white/10 rounded-2xl p-2">
          <div className="grid grid-cols-5 gap-1">
            {moreReactions.map((emoji, i) => (
              <button 
                key={i} 
                onClick={() => onReaction(emoji)}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-secondary rounded-xl transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <button 
        onClick={onLike}
        className={`flex items-center gap-2 transition-colors group/btn ${isLiked ? "text-red-500" : "text-muted-foreground hover:text-red-500"}`}
      >
        <div className={`p-2 rounded-full ${isLiked ? "bg-red-500/10" : "group-hover/btn:bg-red-500/10"}`}>
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
        </div>
        <span className="text-xs font-bold">Applause ({likesCount})</span>
      </button>

      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors group/btn">
            <div className="p-2 rounded-full group-hover/btn:bg-accent/10">
              <Share2 size={18} />
            </div>
          </button>
        </DialogTrigger>
        <DialogContent className="bg-background border-white/10 rounded-[2.5rem] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Share Post</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Button 
              variant="secondary" 
              className="h-24 rounded-3xl flex flex-col gap-2 font-black"
              onClick={onEcho}
            >
              <Repeat size={24} className="text-accent" />
              Followers
            </Button>
            <Button 
              variant="secondary" 
              className="h-24 rounded-3xl flex flex-col gap-2 font-black"
              onClick={onShareExternal}
            >
              <ExternalLink size={24} className="text-accent" />
              External App
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EchoActions;