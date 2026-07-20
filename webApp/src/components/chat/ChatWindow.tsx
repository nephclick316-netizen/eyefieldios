"use client";

import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import MediaViewer from "./MediaViewer";
import { MessageCircle } from "lucide-react";

interface ChatWindowProps {
  selectedChat: any;
  messages: any[];
  userId?: string;
  message: string;
  setMessage: (val: string) => void;
  onBack: () => void;
  onSend: () => void;
  onVoiceSend?: (blob: Blob) => void;
  onDelete: (id: string) => void;
  onForward: (id: string, content: string) => void;
  onReaction: (id: string, emoji: string) => void;
  onMediaClick: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  userId,
  message,
  setMessage,
  onBack,
  onSend,
  onVoiceSend,
  onDelete,
  onForward,
  onReaction,
  onMediaClick
}) => {
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const handleJumpToMessage = (id: string) => {
    setHighlightedMessageId(id);
    setTimeout(() => setHighlightedMessageId(null), 3000);
  };

  if (!selectedChat) {
    return (
      <div className="hidden md:flex flex-col items-center justify-center flex-1 bg-white dark:bg-secondary/10 rounded-[3rem] border border-gray-100 dark:border-white/5 p-12 text-center space-y-4">
        <div className="w-24 h-24 bg-accent/10 rounded-[3rem] flex items-center justify-center mx-auto text-accent">
          <MessageCircle size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Your Messages</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">Select a conversation from the list to start chatting with your friends.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-0 flex flex-col bg-white md:bg-white dark:bg-secondary/10 rounded-[3rem] overflow-hidden border border-gray-100 dark:border-white/5">
      <ChatHeader 
        selectedChat={selectedChat} 
        messages={messages} 
        onBack={onBack} 
        onJumpToMessage={handleJumpToMessage}
      />
      
      <MessageList 
        messages={messages} 
        userId={userId}
        onDelete={onDelete}
        onForward={onForward}
        onReaction={onReaction}
        highlightedMessageId={highlightedMessageId}
        onImageClick={setViewerUrl}
      />

      <ChatInput 
        value={message}
        onChange={setMessage}
        onSend={onSend}
        onVoiceSend={onVoiceSend}
        onMediaClick={onMediaClick}
        isBot={selectedChat.isBot}
      />

      <MediaViewer 
        url={viewerUrl} 
        isOpen={!!viewerUrl} 
        onClose={() => setViewerUrl(null)} 
      />
    </div>
  );
};

export default ChatWindow;