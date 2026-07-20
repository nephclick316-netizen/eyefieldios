"use client";

import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Share2, Send, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    image: string;
  };
}

const ShareProductModal: React.FC<ShareProductModalProps> = ({ isOpen, onClose, product }) => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingWith, setSharingWith] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async (query = "") => {
    setLoading(true);
    try {
      let request = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .neq('id', user?.id)
        .limit(10);

      if (query) {
        request = request.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
      }

      const { data, error } = await request;
      if (error) throw error;
      
      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        name: p.full_name || p.username || "User",
        handle: p.username || "",
        avatar_url: p.avatar_url
      }));
      
      setUsers(mapped);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchUsers(val);
  };

  const shareToChat = async (recipientId: string) => {
    if (!user) return;
    setSharingWith(recipientId);
    
    try {
      // 1. Create or get chat
      const { data: chatId, error: chatError } = await supabase.rpc('create_chat_with_user', {
        other_user_id: recipientId
      });

      if (chatError) throw chatError;

      // 2. Send message with product link
      const productUrl = `${window.location.origin}/marketplace/${product.id}`;
      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert({
          chat_id: chatId,
          sender_id: user.id,
          content: `Check out this product: ${product.title}\n${productUrl}`,
          type: 'text'
        });

      if (msgError) throw msgError;

      toast.success("Shared to chat!");
    } catch (error) {
      console.error("Error sharing to chat:", error);
      toast.error("Failed to share");
    } finally {
      setSharingWith(null);
    }
  };

  const shareExternal = async () => {
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on our marketplace!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
      }
      onClose();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error("Error sharing:", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-none bg-white dark:bg-slate-900">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-black">Share Product</DialogTitle>
          <DialogDescription className="font-medium">
            Send this to your contacts or share externally
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              placeholder="Search users..." 
              className="pl-10 rounded-2xl bg-secondary/30 border-none font-bold"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin text-accent" />
                </div>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <div 
                    key={u.id} 
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="bg-accent text-white font-black">
                          {u.name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-black">{u.name}</p>
                        <p className="text-xs text-muted-foreground font-bold">@{u.handle}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="rounded-xl font-black bg-accent hover:bg-accent/90 text-white"
                      onClick={() => shareToChat(u.id)}
                      disabled={sharingWith === u.id}
                    >
                      {sharingWith === u.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center py-8 text-muted-foreground font-bold">No users found</p>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="p-6 bg-secondary/10 mt-2">
          <Button 
            className="w-full rounded-2xl h-12 font-black bg-white dark:bg-slate-800 text-foreground shadow-sm border border-secondary/20 hover:bg-secondary/20"
            onClick={shareExternal}
          >
            <Share2 size={18} className="mr-2" />
            Share to External Apps
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareProductModal;
