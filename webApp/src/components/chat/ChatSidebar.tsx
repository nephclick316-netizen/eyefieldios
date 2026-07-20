"use client";

import React from "react";
import { 
  Search, 
  Share2, 
  Settings, 
  Shield, 
  Bell, 
  Moon, 
  UserX, 
  MessageSquare,
  Sun,
  Monitor,
  ChevronRight
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ChatListItem from "./ChatListItem";
import NewChatDialog from "./NewChatDialog";
import ShareNumberDialog from "./ShareNumberDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import aiRobot from "@/assets/ai-robot.png";
import { useNavigate } from "react-router-dom";

interface ChatSidebarProps {
  chats: any[];
  onSelectChat: (chat: any) => void;
  selectedChatId?: string;
  onBotClick: () => void;
  followers: any[];
  onStartChat: (user: any) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats,
  onSelectChat,
  selectedChatId,
  onBotClick,
  followers,
  onStartChat,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery
}) => {
  const navigate = useNavigate();

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      localStorage.setItem('theme', 'system');
    } else {
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
    toast.success(`Theme set to ${theme}`);
  };

  return (
    <div className={`space-y-6 ${selectedChatId ? 'hidden md:block' : 'block'}`}>
      <header className="flex justify-between items-center bg-white dark:bg-transparent -mx-4 px-4 py-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
        <h5 className="text-3xl font-black tracking-tight">EyeField</h5>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate("/endocard")}>
            <div className="w-12 h-12 rounded-xl bg-[#3B1D5F] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
              <img src={aiRobot} alt="Endocard AI" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-[10px] font-black text-[#xFFFF9800] uppercase tracking-widest">Endocard</span>
          </div>
          
          <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => navigate("/booking")}>
            <div className="w-12 h-12 rounded-xl bg-[#1B1D29] flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity">
              <span className="text-xl">📖</span>
            </div>
            <span className="text-[10px] font-black text-[#xFFFF9800] uppercase tracking-widest">Book</span>
          </div>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={20} />
        <Input 
          placeholder="Search messages..." 
          className="pl-12 pr-12 h-14 rounded-[1rem] bg-secondary/20 border-none focus-visible:ring-accent"
        />
        <button
          className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-accent font-bold text-xl hover:bg-accent/10 rounded-full transition-colors"
          onClick={() => setIsSearchOpen(true)}
        >
          +
        </button>
      </div>

      <NewChatDialog 
        isOpen={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        followers={followers}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onStartChat={onStartChat}
      />

      <div className="space-y-1 overflow-y-auto md:max-h-full no-scrollbar">
        {chats.length > 0 ? (
          chats.map((chat) => (
            <ChatListItem 
              key={chat.id} 
              {...chat} 
              onClick={() => onSelectChat(chat)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-60">
            <div className="w-16 h-16 bg-secondary rounded-[2rem] flex items-center justify-center text-muted-foreground">
              <MessageSquare size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-black text-sm">No messages yet</p>
              <p className="text-[10px] uppercase tracking-widest font-bold">Tap the + icon to start a chat</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;