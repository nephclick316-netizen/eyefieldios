"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserX, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlockedListDialogProps {
  trigger: React.ReactNode;
  currentUserId: string;
}

const BlockedListDialog: React.FC<BlockedListDialogProps> = ({ trigger, currentUserId }) => {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select(`
          blocked_id,
          profiles:blocked_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('blocker_id', currentUserId);

      if (error) throw error;
      
      const mappedBlocked = (data || []).map((b: any) => {
        const p = b.profiles;
        return p ? {
          id: p.id,
          name: p.full_name || p.username || "User",
          handle: p.username || "",
          avatar_url: p.avatar_url
        } : null;
      }).filter(Boolean);
      
      setBlockedUsers(mappedBlocked);
    } catch (error) {
      console.error("Error fetching blocked users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(5);

      if (error) throw error;
      
      const mappedResults = (data || []).map((p: any) => ({
        id: p.id,
        name: p.full_name || p.username || "User",
        handle: p.username || "",
        avatar_url: p.avatar_url
      }));
      
      setSearchResults(mappedResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const blockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .insert({ blocker_id: currentUserId, blocked_id: userId });

      if (error) throw error;
      toast.success("User blocked");
      fetchBlockedUsers();
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      toast.error("Failed to block user");
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', currentUserId)
        .eq('blocked_id', userId);

      if (error) throw error;
      toast.success("User unblocked");
      fetchBlockedUsers();
    } catch (error) {
      toast.error("Failed to unblock user");
    }
  };

  useEffect(() => {
    if (currentUserId) fetchBlockedUsers();
  }, [currentUserId]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-white/5 bg-background p-0 overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Blocked Users</DialogTitle>
          </DialogHeader>
          <div className="mt-4 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search users to block..." 
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-secondary/20 border-none font-bold"
            />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
          {searchQuery.length >= 2 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 mb-2">Search Results</p>
              {searching ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-accent" /></div>
              ) : searchResults.length > 0 ? (
                searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.handle}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 font-black hover:bg-red-500/10 rounded-xl"
                      onClick={() => blockUser(user.id)}
                    >
                      Block
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2 mb-2">Currently Blocked</p>
              {loading ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-accent" /></div>
              ) : blockedUsers.length > 0 ? (
                blockedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback>{user.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">@{user.handle}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-accent font-black hover:bg-accent/10 rounded-xl"
                      onClick={() => unblockUser(user.id)}
                    >
                      Unblock
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/20 flex items-center justify-center mx-auto text-muted-foreground">
                    <UserX size={24} />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No blocked users</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlockedListDialog;
