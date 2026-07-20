"use client";

import React from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye } from "lucide-react";

interface ChatListItemProps {
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unreadCount?: number;
  isOnline?: boolean;
  isViewed?: boolean;
  isLastMessageOutgoing?: boolean;
  onClick?: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ 
  name, 
  avatar, 
  lastMessage, 
  time, 
  unreadCount, 
  isOnline, 
  isViewed = true,
  isLastMessageOutgoing,
  onClick 
}) => {
  const getDisplayMessage = (msg: string) => {
    if (!msg) return "No messages yet";
    // Check if the message is a JSON contact string
    if (msg.startsWith('{') && msg.includes('"phone"') && msg.includes('"name"')) {
      return "My Number";
    }
    return msg;
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center gap-4 p-4 bg-white dark:bg-transparent hover:bg-secondary/50 rounded-[2rem] transition-all cursor-pointer group border border-gray-100 dark:border-white/5 mb-3 shadow-xl shadow-indigo-100/30 dark:shadow-none"
    >
      <div className="relative">
        <Avatar className="w-14 h-14 border-2 border-accent/10">
          <AvatarImage src={avatar} />
          <AvatarFallback>{name[0]}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-primary" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h3 className="font-black text-foreground truncate group-hover:text-accent transition-colors">{name}</h3>
          <span className="text-[10px] text-muted-foreground font-medium">{time}</span>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground truncate pr-4 flex items-center gap-1">
            {isLastMessageOutgoing && (
              <span className="text-accent font-bold text-[10px] uppercase tracking-tighter mr-1">You:</span>
            )}
            {getDisplayMessage(lastMessage)}
          </p>
          {unreadCount ? (
            <div className="bg-accent text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg shadow-accent/20">
              {unreadCount}
            </div>
          ) : (
            <div className="flex items-center">
              <Eye 
                size={14} 
                className={isViewed ? "text-accent" : "text-muted-foreground"} 
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatListItem;