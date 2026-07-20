"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MessageSearch from "./MessageSearch";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ChatHeaderProps {
  selectedChat: any;
  messages: any[];
  onBack: () => void;
  onJumpToMessage?: (id: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ selectedChat, messages, onBack, onJumpToMessage }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(selectedChat.name);

  useEffect(() => {
    const fetchActualName = async () => {
      if (selectedChat.isBot) {
        setDisplayName(selectedChat.name);
        return;
      }

      if (selectedChat.otherUserId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, full_name')
          .eq('id', selectedChat.otherUserId)
          .maybeSingle();
        
        if (data?.name || data?.full_name) {
          setDisplayName(data.name || data.full_name);
        } else {
          setDisplayName(selectedChat.name);
        }
      }
    };

    fetchActualName();
  }, [selectedChat.id, selectedChat.otherUserId, selectedChat.name, selectedChat.isBot]);

  return (
    <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/95 dark:bg-background/95 md:bg-transparent backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full md:hidden">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar className="w-10 h-10 border-2 border-accent/20">
          <AvatarImage src={selectedChat.avatar} />
          <AvatarFallback className="bg-transparent">
            {selectedChat.isBot ? (
              <img src="/src/assets/ai-robot.png" alt="AI" className="w-full h-full object-cover" />
            ) : (
              displayName?.[0] || selectedChat.name?.[0]
            )}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-black text-xs">{displayName}</h3>
          <span className="text-[10px] text-green-500 font-black uppercase tracking-widest">
            {selectedChat.isBot ? 'AI Assistant' : 'Online'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {selectedChat.isBot && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate("/pricing")}
            className="text-accent hover:text-accent hover:bg-accent/10 font-black text-[10px] uppercase tracking-widest gap-2 rounded-xl"
          >
            <Sparkles size={14} />
            Pricing
          </Button>
        )}
        {!selectedChat.isBot && <MessageSearch messages={messages} onJumpToMessage={onJumpToMessage} />}
      </div>
    </header>
  );
};

export default ChatHeader;