"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, MessageSquare, User as UserIcon, Loader2, Phone, Video } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useCalls } from "@/context/CallContext";

interface Profile {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
}

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();
  const { startCall } = useCalls();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: follows, error: followsError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (followsError) throw followsError;

      if (follows && follows.length > 0) {
        const followingIds = follows.map(f => f.following_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', followingIds);

        if (profilesError) throw profilesError;
        
        const mappedProfiles = (profiles || []).map((u: any) => ({
          id: u.id,
          name: u.full_name || u.username || "User",
          handle: u.username || "",
          avatar_url: u.avatar_url
        }));
        setContacts(mappedProfiles);
      } else {
        setContacts([]);
      }
    } catch (error: any) {
      toast.error("Failed to load contacts");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const startChat = async (targetUserId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check for existing chat first
      const { data: commonChats, error: commonError } = await supabase
        .from('chat_rooms')
        .select('chat_id')
        .eq('user_id', user.id);

      if (commonError) throw commonError;

      let chatId = null;

      if (commonChats) {
        const chatIds = commonChats.map(c => c.chat_id);
        const { data: targetParticipant, error: targetError } = await supabase
          .from('chat_rooms')
          .select('chat_id')
          .in('chat_id', chatIds)
          .eq('user_id', targetUserId)
          .maybeSingle();

        if (targetParticipant) {
          chatId = targetParticipant.chat_id;
        }
      }

      // If no existing chat, use RPC to create one
      if (!chatId) {
        const { data: newChatId, error: rpcError } = await supabase.rpc('create_chat_with_user', {
          other_user_id: targetUserId
        });

        if (rpcError) throw rpcError;
        chatId = newChatId;
      }

      navigate(`/chat/${chatId}`);
    } catch (error: any) {
      toast.error("Could not start chat");
      console.error(error);
    }
  };

  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const searchDb = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(20);
        
        if (!error && data) {
          setSearchResults(data.map((u: any) => ({
            id: u.id,
            name: u.full_name || u.username || "User",
            handle: u.username || "",
            avatar_url: u.avatar_url
          })));
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchDb, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tight">Contacts</h2>
            <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full uppercase tracking-widest">
              {contacts.length} Total
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 h-12 rounded-2xl bg-secondary/30 border-white/5 focus:ring-accent"
            />
          </div>
        </header>

        <div className="space-y-4">
          {loading || isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="animate-spin text-accent" size={40} />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                {isSearching ? "Searching..." : "Loading Contacts..."}
              </p>
            </div>
          ) : (searchQuery.length >= 2 ? searchResults : contacts).length > 0 ? (
            <div className="grid gap-3">
              {(searchQuery.length >= 2 ? searchResults : contacts).map((contact) => (
                <div 
                  key={contact.id} 
                  className="group flex items-center justify-between p-4 rounded-[2rem] bg-secondary/20 border border-white/5 hover:bg-secondary/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12 border-2 border-accent/10">
                      <AvatarImage src={contact.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent/5 text-accent font-bold">
                        {contact.name?.[0] || contact.handle?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-black text-sm">{contact.name}</h4>
                      <p className="text-xs text-muted-foreground font-medium">@{contact.handle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => startCall(contact.id, "voice")}
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-xl bg-accent/5 text-accent hover:bg-accent hover:text-white transition-all"
                    >
                      <Phone size={18} />
                    </Button>
                    <Button 
                      onClick={() => startCall(contact.id, "video")}
                      variant="ghost"
                      size="icon"
                      className="w-10 h-10 rounded-xl bg-accent/5 text-accent hover:bg-accent hover:text-white transition-all"
                    >
                      <Video size={18} />
                    </Button>
                    <Button 
                      onClick={() => startChat(contact.id)}
                      size="sm"
                      className="rounded-xl bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all gap-2 font-bold"
                    >
                      <MessageSquare size={16} />
                      <span>Chat</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-6 bg-secondary/10 rounded-[3rem] border border-dashed border-white/10">
              <div className="w-20 h-20 bg-secondary/30 rounded-[2rem] flex items-center justify-center mx-auto text-muted-foreground">
                <UserIcon size={32} />
              </div>
              <div className="space-y-2">
                <p className="text-foreground font-black">
                  {searchQuery.length >= 2 ? "No users found" : "No contacts yet"}
                </p>
                <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                  Search for users to start a conversation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Contacts;
