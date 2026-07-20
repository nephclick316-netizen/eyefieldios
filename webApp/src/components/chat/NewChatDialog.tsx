"use client";

import React from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NewChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  followers: any[];
  searchQuery: string;
  onSearchChange: (val: string) => void;
  onStartChat: (user: any) => void;
}

const parseAvatar = (raw: any): string => {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.url) return parsed.url;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]?.url || parsed[0];
      return parsed;
    } catch {
      return raw.replace(/^["']|["']$/g, "");
    }
  }
  if (typeof raw === "object" && raw.url) return raw.url;
  return "";
};

const NewChatDialog: React.FC<NewChatDialogProps> = ({
  isOpen,
  onOpenChange,
  followers = [], // Default to empty array
  searchQuery,
  onSearchChange,
  onStartChat
}) => {
  const filteredUsers = (followers || []).filter(f => 
    (f.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (f.handle || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">New Message</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 rounded-xl bg-secondary border-none"
              autoFocus
            />
          </div>
          <div className="max-h-[360px] overflow-y-auto space-y-1 no-scrollbar">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((f) => (
                <button
                  key={f.id}
                  onClick={() => {
                    onStartChat(f);
                    onOpenChange(false);
                    onSearchChange("");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary transition-colors text-left"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={parseAvatar(f.avatar_url)} />
                    <AvatarFallback className="bg-accent/20 text-accent font-black">
                      {(f.name || f.handle || "U")[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{f.name || f.handle}</p>
                    <p className="text-xs text-muted-foreground">@{f.handle}</p>
                  </div>
                </button>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {searchQuery ? "No users found" : "Loading users..."}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NewChatDialog;