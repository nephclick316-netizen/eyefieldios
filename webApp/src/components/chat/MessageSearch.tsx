"use client";

import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Book, Search, Image as ImageIcon, FileText, Video, Mic, Type, CalendarIcon, Clock, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isSameDay } from "date-fns";

interface MessageSearchProps {
  messages: any[];
  onJumpToMessage?: (id: string) => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({ messages = [], onJumpToMessage }) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [isOpen, setIsOpen] = useState(false);

  const categories = [
    { id: "text", label: "Text", icon: Type },
    { id: "image", label: "Images", icon: ImageIcon },
    { id: "video", label: "Video", icon: Video },
    { id: "docs", label: "Docs", icon: FileText },
    { id: "field_note", label: "Field Notes", icon: Mic },
  ];

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const content = msg.content || "";
      const matchesQuery = content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDate = date ? isSameDay(new Date(msg.created_at), date) : true;
      const matchesType = activeTab === "text" ? (msg.type === "text" || !msg.type) : msg.type === activeTab;
      
      return matchesQuery && matchesDate && matchesType;
    });
  }, [messages, searchQuery, date, activeTab]);

  const handleJump = (id: string) => {
    onJumpToMessage?.(id);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="p-3 text-muted-foreground hover:text-accent transition-colors">
          <Book size={22} />
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-[#0B1120] border-l border-white/10 p-0 shadow-2xl z-[100] flex flex-col">
        <SheetHeader className="p-6 border-b border-white/5 shrink-0">
          <SheetTitle className="text-2xl font-black text-accent flex items-center gap-2">
            <Book size={24} />
            Archive
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-4 md:p-6 space-y-6 md:space-y-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={18} />
              <Input 
                placeholder="Search messages..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-2xl bg-secondary/50 border-none focus-visible:ring-accent"
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <CalendarIcon size={12} />
                  Filter by Date
                </div>
                {date && (
                  <button 
                    onClick={() => setDate(undefined)}
                    className="text-[10px] font-bold text-accent hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="bg-secondary/20 rounded-[2rem] p-2 border border-white/5 flex justify-center overflow-hidden">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md scale-90 md:scale-100 origin-center"
                  captionLayout="dropdown"
                  fromYear={2020}
                  toYear={2025}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-2">Media & Files</h3>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full bg-secondary/30 rounded-2xl p-1 h-11 overflow-x-auto no-scrollbar flex-nowrap justify-start">
                  {categories.map((cat) => (
                    <TabsTrigger 
                      key={cat.id} 
                      value={cat.id}
                      className="flex-1 min-w-[60px] rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white font-bold text-[10px]"
                    >
                      <cat.icon size={14} className="mr-1 hidden sm:inline" />
                      {cat.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <div className="mt-6 space-y-3">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((msg) => (
                      <div 
                        key={msg.id} 
                        onClick={() => handleJump(msg.id)}
                        className="p-4 bg-secondary/20 hover:bg-secondary/40 rounded-2xl border border-white/5 space-y-2 cursor-pointer transition-all group active:scale-[0.98]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black text-accent uppercase tracking-wider">
                            {msg.sender_id === 'ai-bot' ? 'Endocard AI' : 'Message'}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock size={10} />
                              <span className="text-[10px]">{format(new Date(msg.created_at), 'HH:mm')}</span>
                            </div>
                            <ExternalLink size={12} className="text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-sm text-foreground line-clamp-2">{msg.content}</p>
                        <span className="text-[10px] text-muted-foreground block">
                          {format(new Date(msg.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mx-auto text-muted-foreground">
                        {categories.find(c => c.id === activeTab)?.icon && React.createElement(categories.find(c => c.id === activeTab)!.icon, { size: 32 })}
                      </div>
                      <p className="text-sm font-bold text-muted-foreground">No results found</p>
                    </div>
                  )}
                </div>
              </Tabs>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default MessageSearch;