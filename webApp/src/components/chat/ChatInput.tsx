"use client";

import React, { useState } from "react";
import { Send, Mic, Plus, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import VoiceRecorder from "./VoiceRecorder";

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  onVoiceSend?: (blob: Blob) => void;
  onMediaClick?: () => void;
  isBot?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  value, 
  onChange, 
  onSend, 
  onVoiceSend,
  onMediaClick,
  isBot 
}) => {
  const [isRecordingMode, setIsRecordingMode] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  if (isRecordingMode && onVoiceSend) {
    return (
      <div className="p-6 bg-background/95 md:bg-transparent backdrop-blur-lg border-t border-white/5">
        <VoiceRecorder 
          onSend={(blob) => {
            onVoiceSend(blob);
            setIsRecordingMode(false);
          }}
          onCancel={() => setIsRecordingMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-background/95 md:bg-transparent backdrop-blur-lg border-t border-white/5">
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 flex items-center bg-secondary/50 rounded-[24px] px-2 h-14">
          {!isBot && onMediaClick && (
            <button onClick={onMediaClick} className="p-3 text-muted-foreground hover:text-accent transition-colors flex-shrink-0">
              <Plus size={24} />
            </button>
          )}

          <Input 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isBot ? "Ask Endocard anything..." : "Message..."}
            className="bg-transparent border-none focus-visible:ring-0 h-full text-base px-2 shadow-none flex-1"
          />
          
          {!isBot && onMediaClick && (
            <button onClick={onMediaClick} className="p-3 text-muted-foreground hover:text-accent transition-colors flex-shrink-0">
              <Camera size={24} />
            </button>
          )}
        </div>
        
        <button
          onClick={value.trim() ? onSend : () => setIsRecordingMode(true)}
          className="w-12 h-12 flex-shrink-0 rounded-full bg-[#000080] text-white flex items-center justify-center shadow-lg shadow-black/20 transition-all active:scale-90"
        >
          {value.trim() ? <Send size={20} className="ml-1" /> : <Mic size={20} />}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;