"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Share2, 
  MoreHorizontal,
  ExternalLink,
  MapPin
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface EchoCardProps {
  post: any;
  onLike?: () => void;
  onReply?: () => void;
  onEcho?: () => void;
  onShare?: () => void;
}

const EchoCard: React.FC<EchoCardProps> = ({ post, onLike, onReply, onEcho, onShare }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#0B1120] border border-gray-100 dark:border-white/5 p-4 md:p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-100/50 dark:shadow-none mb-6"
    >
      <div className="flex gap-4">
        <Avatar className="w-12 h-12 rounded-2xl border-2 border-white dark:border-white/10 shadow-lg shrink-0">
          <AvatarImage src={post.profiles?.avatar_url} />
          <AvatarFallback className="bg-accent text-white font-black">
            {post.profiles?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-black text-[#0B1120] dark:text-white truncate">{post.profiles?.name}</h4>
                <span className="text-xs font-bold text-gray-400 dark:text-white/40 truncate">@{post.profiles?.handle}</span>
                <span className="text-[10px] text-gray-300 dark:text-white/20">•</span>
                <span className="text-xs font-medium text-gray-400 dark:text-white/40 whitespace-nowrap">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
              
              {(post.city || post.country) && (
                <div className="flex items-center gap-1 mt-0.5 text-accent/80">
                  <MapPin size={10} />
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    {[post.city, post.country].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-gray-400">
              <MoreHorizontal size={18} />
            </Button>
          </div>

          {post.content && (
            <p className="text-[15px] leading-relaxed text-gray-600 dark:text-white/80 font-medium whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {post.media_url && (
            <div className="relative rounded-[2rem] overflow-hidden border border-gray-100 dark:border-white/10 shadow-sm bg-gray-50 dark:bg-white/5">
              <img 
                src={post.media_url} 
                alt="Post media" 
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {post.link_url && (
            <a 
              href={post.link_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent shrink-0">
                <ExternalLink size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-accent uppercase tracking-widest mb-0.5">External Link</p>
                <p className="text-sm font-bold text-gray-500 dark:text-white/40 truncate">{post.link_url}</p>
              </div>
            </a>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-6">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 transition-colors group",
                  isLiked ? "text-red-500" : "text-gray-400 hover:text-red-500"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-colors",
                  isLiked ? "bg-red-500/10" : "group-hover:bg-red-500/10"
                )}>
                  <Heart size={18} className={cn(isLiked && "fill-current")} />
                </div>
                <span className="text-xs font-black">{likesCount}</span>
              </button>

              <button 
                onClick={onReply}
                className="flex items-center gap-2 text-gray-400 hover:text-accent transition-colors group"
              >
                <div className="p-2 rounded-xl group-hover:bg-accent/10 transition-colors">
                  <MessageCircle size={18} />
                </div>
                <span className="text-xs font-black">{post.replies_count || 0}</span>
              </button>

              <button 
                onClick={onEcho}
                className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors group"
              >
                <div className="p-2 rounded-xl group-hover:bg-green-500/10 transition-colors">
                  <Repeat2 size={18} />
                </div>
                <span className="text-xs font-black">{post.echoes_count || 0}</span>
              </button>
            </div>

            <button 
              onClick={onShare}
              className="p-2 rounded-xl text-gray-400 hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <Share2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EchoCard;