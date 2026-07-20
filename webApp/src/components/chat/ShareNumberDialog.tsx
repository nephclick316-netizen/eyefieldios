"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Share2, Search, Phone, CheckCircle2, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

interface ShareNumberDialogProps {
  trigger: React.ReactNode;
}

const ShareNumberDialog: React.FC<ShareNumberDialogProps> = ({ trigger }) => {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const fetchNearbyUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name:full_name, handle:username, avatar_url, phone, address_city, country')
        .neq('id', user?.id)
        .limit(20);

      if (error) throw error;

      const sorted = (data || []).sort((a, b) => {
        const aInCity = a.address_city === user?.address.city ? 1 : 0;
        const bInCity = b.address_city === user?.address.city ? 1 : 0;
        if (aInCity !== bInCity) return bInCity - aInCity;
        
        const aInCountry = a.country === user?.country ? 1 : 0;
        const bInCountry = b.country === user?.country ? 1 : 0;
        return bInCountry - aInCountry;
      });

      setNearbyUsers(sorted);
    } catch (error) {
      console.error("Error fetching nearby users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNearbyUsers();
    }
  }, [isOpen]);

  const handleShare = async (targetUser: any) => {
    if (!user?.phone) {
      toast.error("Please add your phone number in settings first!");
      return;
    }

    setSharingId(targetUser.id);
    
    try {
      // 1. Get or create chat with the target user
      const { data: chatId, error: chatError } = await supabase.rpc('create_chat_with_user', {
        other_user_id: targetUser.id
      });

      if (chatError) throw chatError;

      // 2. Send a specialized contact message
      const contactData = {
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        handle: user.handle
      };

      const { error: msgError } = await supabase.from('chat_messages').insert({
        room_id: chatId,
        sender_id: user.id,
        text: JSON.stringify(contactData)
      });

      if (msgError) throw msgError;

      toast.success(`Phone number shared with ${targetUser.name}!`);
      setIsOpen(false);
    } catch (error) {
      console.error("Error sharing contact:", error);
      toast.error("Failed to share contact. Please try again.");
    } finally {
      setSharingId(null);
    }
  };

  const filteredUsers = nearbyUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] border-white/5 bg-background p-0 overflow-hidden">
        <div className="p-8 space-y-6">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mx-auto">
              <Share2 size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center">Share Number</DialogTitle>
            <p className="text-center font-medium text-muted-foreground text-sm">
              Connect with EyeField users nearby and share your contact details.
            </p>
          </DialogHeader>

          {/* My Number Card */}
          <div className="bg-secondary/20 rounded-3xl p-5 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-accent">
                <Phone size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">My Number</p>
                <p className="font-black text-lg">{user?.phone || "Not set"}</p>
              </div>
            </div>
            {!user?.phone && (
              <Button variant="link" className="text-accent font-black text-xs" onClick={() => setIsOpen(false)}>
                Add
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Nearby Users</h3>
              <div className="flex items-center gap-1 text-accent">
                <Navigation size={10} className="fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest">Sorting by proximity</span>
              </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input 
                placeholder="Search users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 h-12 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 no-scrollbar">
              {loading ? (
                <div className="py-10 text-center">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-secondary/10 hover:bg-secondary/20 transition-colors border border-white/5">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 rounded-xl">
                        <AvatarImage src={u.avatar_url} />
                        <AvatarFallback className="font-black text-xs">{u.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{u.name}</p>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                          <MapPin size={10} />
                          <span>{u.address_city || u.country || "Nearby"}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleShare(u)}
                      disabled={sharingId === u.id}
                      className="h-9 rounded-xl bg-accent text-white font-black text-[10px] uppercase tracking-widest px-4"
                    >
                      {sharingId === u.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        "Share"
                      )}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-muted-foreground">
                  <p className="text-xs font-bold">No users found nearby</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-secondary/10 border-t border-white/5">
          <Button 
            variant="ghost" 
            className="w-full h-12 rounded-2xl font-black text-muted-foreground"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareNumberDialog;
