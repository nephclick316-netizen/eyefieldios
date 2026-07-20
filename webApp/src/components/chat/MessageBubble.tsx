"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Download, UserPlus, Phone, Trash2, Share2, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadVCard } from "@/utils/contact";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MessageBubbleProps {
  id: string;
  content: string;
  time: string;
  isOutgoing: boolean;
  isBot?: boolean;
  type?: string;
  mediaUrl?: string;
  reactions?: any[];
  onDelete: (id: string) => void;
  onForward: (id: string, content: string) => void;
  onReaction: (id: string, emoji: string) => void;
  onImageClick?: (url: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  id,
  content, 
  time, 
  isOutgoing, 
  isBot, 
  type, 
  mediaUrl, 
  reactions = [],
  onDelete,
  onForward,
  onReaction,
  onImageClick
}) => {
  let isContact = type === 'contact';
  let contactData = null;

  if (content && content.startsWith('{') && content.includes('"phone"') && content.includes('"name"')) {
    isContact = true;
  }

  if (isContact) {
    try {
      contactData = JSON.parse(content);
    } catch (e) {
      isContact = false;
      console.error("Failed to parse contact data", e);
    }
  }

  const handleSaveContact = () => {
    if (contactData) {
      downloadVCard(contactData.name, contactData.phone);
      toast.success(`Contact ${contactData.name} saved to device!`);
    }
  };

  const emojis = ["❤️", "👍", "😂", "😮", "😢", "🔥"];

  return (
    <div className={cn(
      "flex w-full gap-3 group",
      isOutgoing ? "flex-row-reverse" : "flex-row"
    )}>
      <div className={cn(
        "max-w-[80%] sm:max-w-[70%] space-y-1 flex flex-col",
        isOutgoing ? "items-end" : "items-start"
      )}>
        <div className="flex items-center gap-2 max-w-full">
          {isOutgoing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button onClick={() => onDelete(id)} className="p-2 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-full transition-colors">
                <Trash2 size={14} />
              </button>
              <button onClick={() => onForward(id, content)} className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-full transition-colors">
                <Share2 size={14} />
              </button>
            </div>
          )}

          <div className={cn(
            "p-4 rounded-[2rem] shadow-sm relative",
            isOutgoing 
              ? "bg-[#000080] text-white rounded-tr-none" 
              : "bg-secondary/30 text-foreground rounded-tl-none border border-white/5",
            isContact && "p-0 overflow-hidden bg-transparent border-none shadow-none"
          )}>
            {isContact && contactData ? (
              <div className={cn(
                "bg-white dark:bg-secondary/40 rounded-[2rem] border border-white/10 overflow-hidden shadow-xl w-64",
                isOutgoing ? "rounded-tr-none" : "rounded-tl-none"
              )}>
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 rounded-2xl border-2 border-accent/20">
                      <AvatarImage src={contactData.avatar} />
                      <AvatarFallback className="font-black">{contactData.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate text-foreground">{contactData.name}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">@{contactData.handle}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-secondary/20 p-3 rounded-xl">
                    <Phone size={14} className="text-accent" />
                    <span className="font-black text-xs text-foreground">{contactData.phone}</span>
                  </div>

                  {!isOutgoing && (
                    <Button 
                      onClick={handleSaveContact}
                      className="w-full h-10 rounded-xl bg-accent text-white font-black text-[10px] uppercase tracking-widest gap-2"
                    >
                      <Download size={14} />
                      Save to Device
                    </Button>
                  )}
                </div>
                <div className="bg-accent/10 py-2 px-4 flex items-center justify-center gap-2">
                  <UserPlus size={12} className="text-accent" />
                  <span className="text-[8px] font-black text-accent uppercase tracking-[0.2em]">Contact Shared</span>
                </div>
              </div>
            ) : mediaUrl ? (
              <div className="space-y-2">
                <img 
                  src={mediaUrl} 
                  alt="Shared media" 
                  className="rounded-2xl max-h-60 w-full object-cover cursor-pointer"
                  onClick={() => onImageClick?.(mediaUrl)}
                />
                {content && content !== '[Image]' && <p className="text-sm font-medium">{content}</p>}
              </div>
            ) : (
              <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">
                {content}
              </p>
            )}

            {reactions.length > 0 && (
              <div className={cn(
                "absolute -bottom-3 flex gap-1 bg-white dark:bg-slate-800 rounded-full px-2 py-0.5 shadow-md border border-white/10",
                isOutgoing ? "right-2" : "left-2"
              )}>
                {Array.from(new Set(reactions.map(r => r.emoji))).map(emoji => (
                  <span key={emoji} className="text-xs">{emoji}</span>
                ))}
              </div>
            )}
          </div>

          {!isOutgoing && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-full transition-colors">
                    <Smile size={14} />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-auto p-2 rounded-full flex gap-1 bg-background/95 backdrop-blur-md border-white/10">
                  {emojis.map(emoji => (
                    <button 
                      key={emoji} 
                      onClick={() => onReaction(id, emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-full transition-colors text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
              <button onClick={() => onForward(id, content)} className="p-2 hover:bg-accent/10 text-muted-foreground hover:text-accent rounded-full transition-colors">
                <Share2 size={14} />
              </button>
            </div>
          )}
        </div>

        <div className={cn(
          "flex items-center gap-1.5 px-2",
          isOutgoing ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[9px] font-bold text-muted-foreground/60 uppercase">
            {time}
          </span>
          {isOutgoing && (
            <div className="text-accent">
              <Eye size={12} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;