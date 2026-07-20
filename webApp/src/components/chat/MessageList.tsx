"use client";

import React, { useRef, useEffect } from "react";
import MessageBubble from "./MessageBubble";

interface MessageListProps {
  messages: any[];
  userId?: string;
  onDelete: (id: string) => void;
  onForward: (id: string, content: string) => void;
  onReaction: (id: string, emoji: string) => void;
  highlightedMessageId?: string | null;
  onImageClick?: (url: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  userId, 
  onDelete, 
  onForward, 
  onReaction,
  highlightedMessageId,
  onImageClick
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedMessageId) {
      const element = document.getElementById(`msg-${highlightedMessageId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-accent", "ring-offset-4", "dark:ring-offset-[#0B1120]", "rounded-[2.5rem]");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-accent", "ring-offset-4");
        }, 2000);
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, highlightedMessageId]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar relative z-0">
      <div className="flex justify-center">
        <span className="text-[10px] bg-secondary px-4 py-1.5 rounded-full text-muted-foreground uppercase tracking-[0.2em] font-black">Today</span>
      </div>
      
      <div className="flex flex-col gap-8">
        {messages.map((msg) => (
          <div key={msg.id} id={`msg-${msg.id}`} className="transition-all duration-500">
            <MessageBubble 
              id={msg.id}
              content={msg.content} 
              time={new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              isOutgoing={msg.sender_id === userId}
              isBot={msg.sender_id === 'ai-bot'}
              type={msg.type}
              mediaUrl={msg.media_url}
              reactions={msg.reactions}
              onDelete={onDelete}
              onForward={onForward}
              onReaction={onReaction}
              onImageClick={onImageClick}
            />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;