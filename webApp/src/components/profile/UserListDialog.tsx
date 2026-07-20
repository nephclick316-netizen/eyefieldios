"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, UserMinus, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface UserListDialogProps {
  type: 'followers' | 'following' | 'all';
  userId: string;
  currentUserId?: string;
  trigger: React.ReactNode;
  myFollowingIds: Set<string>;
  onFollowToggle: (targetId: string, isFollowing: boolean) => Promise<void>;
}

const UserListDialog = ({ 
  type, 
  userId, 
  currentUserId, 
  trigger, 
  myFollowingIds, 
  onFollowToggle 
}: UserListDialogProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      
      if (type === 'all') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .neq('id', currentUserId)
          .limit(100);
        data = (profiles || []).map((p: any) => ({
          id: p.id,
          name: p.full_name || p.username,
          handle: p.username,
          avatar_url: p.avatar_url,
          business_category: "User"
        }));
      } else if (type === 'followers') {
        const { data: followers } = await supabase
          .from('user_follows')
          .select('follower:profiles!user_follows_follower_id_fkey(id, username, full_name, avatar_url)')
          .eq('following_id', userId);
        data = followers?.map((f: any) => {
          const p = f.follower;
          return p ? {
            id: p.id,
            name: p.full_name || p.username,
            handle: p.username,
            avatar_url: p.avatar_url,
            business_category: "User"
          } : null;
        }).filter(Boolean) || [];
      } else if (type === 'following') {
        const { data: following } = await supabase
          .from('user_follows')
          .select('following:profiles!user_follows_following_id_fkey(id, username, full_name, avatar_url)')
          .eq('follower_id', userId);
        data = following?.map((f: any) => {
          const p = f.following;
          return p ? {
            id: p.id,
            name: p.full_name || p.username,
            handle: p.username,
            avatar_url: p.avatar_url,
            business_category: "User"
          } : null;
        }).filter(Boolean) || [];
      }
      
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, type, userId]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.business_category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const title = type === 'all' ? 'Find People' : type === 'followers' ? 'Followers' : 'Following';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="bg-background border-white/10 rounded-[2.5rem] max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-black text-accent">{title}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search name, handle, or category..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-secondary/50 border-none focus-visible:ring-accent"
            />
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 hover:bg-secondary/30 rounded-2xl transition-colors">
                  <div 
                    className="flex items-center gap-3 cursor-pointer" 
                    onClick={() => { 
                      navigate(`/profile/${u.handle}`); 
                      setIsOpen(false); 
                    }}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback>{u.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-black">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground">@{u.handle} • {u.business_category || "User"}</div>
                    </div>
                  </div>
                  {currentUserId && u.id !== currentUserId && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xl h-9 w-9 p-0 text-muted-foreground hover:text-accent hover:bg-accent/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/chat?user=${u.id}`);
                          setIsOpen(false);
                        }}
                      >
                        <MessageSquare size={18} />
                      </Button>
                      <Button 
                        size="sm" 
                        variant={myFollowingIds.has(u.id) ? "outline" : "default"}
                        className={`rounded-xl font-bold text-xs h-9 ${myFollowingIds.has(u.id) ? "border-accent text-accent" : "bg-accent text-white"}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onFollowToggle(u.id, myFollowingIds.has(u.id));
                        }}
                      >
                        {myFollowingIds.has(u.id) ? <UserMinus size={14} /> : <UserPlus size={14} />}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">No users found.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserListDialog;
