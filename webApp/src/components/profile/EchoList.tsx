"use client";

import React from "react";
import { Heart, MessageCircle, Repeat2, Share, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Echo {
  id: string;
  content: string;
  created_at: string;
  likes_count: number;
  replies_count: number;
  echoes_count: number;
  media_url?: string;
}

interface EchoListProps {
  echoes: Echo[];
  isOwner: boolean;
  onDelete?: (id: string) => void;
}

const EchoList: React.FC<EchoListProps> = ({ echoes, isOwner, onDelete }) => {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Echo deleted");
      onDelete?.(id);
    } catch (error) {
      toast.error("Failed to delete echo");
    }
  };

  if (echoes.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground font-medium">No echoes yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {echoes.map((echo) => (
        <motion.div
          key={echo.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2.5rem] bg-secondary/20 border border-white/5 hover:bg-secondary/30 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <p className="text-sm leading-relaxed flex-1">{echo.content}</p>
            {isOwner && (
              <button 
                onClick={() => handleDelete(echo.id)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {echo.media_url && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-white/5">
              <img src={echo.media_url} alt="Echo media" className="w-full h-auto object-cover max-h-96" />
            </div>
          )}

          <div className="flex items-center gap-6">
            <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors">
              <Heart size={18} />
              <span>{echo.likes_count}</span>
            </button>
            <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors">
              <MessageCircle size={18} />
              <span>{echo.replies_count}</span>
            </button>
            <button className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-accent transition-colors">
              <Repeat2 size={18} />
              <span>{echo.echoes_count}</span>
            </button>
            <button className="ml-auto text-muted-foreground hover:text-accent transition-colors">
              <Share size={18} />
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default EchoList;