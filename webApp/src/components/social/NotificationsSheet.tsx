"use client";

import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Bell, Heart, MessageCircle, Smile, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'reaction';
  source: 'pulse' | 'echo';
  user: {
    name: string;
    handle: string;
    avatar: string;
  };
  content?: string;
  emoji?: string;
  created_at: string;
}

const NotificationsSheet = ({ trigger }: { trigger: React.ReactNode }) => {
  const { user: currentUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);

    try {
      // Fetch Pulse Reactions safely
      let pulseReactions: any[] = [];
      try {
        const { data } = await supabase
          .from('pulse_likes')
          .select('*, pulses!inner(user_id), profiles:user_id(full_name, username, avatar_url)')
          .eq('pulses.user_id', currentUser.id);
        pulseReactions = data || [];
      } catch (e) {
        console.error("Error fetching pulse reactions:", e);
      }

      // Fetch Pulse Comments safely (this table might not exist)
      let pulseComments: any[] = [];
      try {
        const { data } = await supabase
          .from('pulse_comments')
          .select('*, pulses!inner(user_id), profiles:user_id(full_name, username, avatar_url)')
          .eq('pulses.user_id', currentUser.id);
        pulseComments = data || [];
      } catch (e) {
        console.warn("Pulse comments table not found or query failed:", e);
      }

      // Fetch Post Reactions safely
      let postReactions: any[] = [];
      try {
        const { data } = await supabase
          .from('post_emojis')
          .select('*, posts!inner(user_id), profiles:user_id(full_name, username, avatar_url)')
          .eq('posts.user_id', currentUser.id);
        postReactions = data || [];
      } catch (e) {
        console.error("Error fetching post reactions:", e);
      }

      // Fetch Post Comments safely
      let postComments: any[] = [];
      try {
        const { data } = await supabase
          .from('post_comments')
          .select('*, posts!inner(user_id), profiles:user_id(full_name, username, avatar_url)')
          .eq('posts.user_id', currentUser.id);
        postComments = data || [];
      } catch (e) {
        console.error("Error fetching post comments:", e);
      }

      // Fetch Likes safely
      let likes: any[] = [];
      try {
        const { data } = await supabase
          .from('post_applause')
          .select('*, posts!inner(user_id), profiles:user_id(full_name, username, avatar_url)')
          .eq('posts.user_id', currentUser.id);
        likes = data || [];
      } catch (e) {
        console.error("Error fetching likes:", e);
      }

      const allNotifications: Notification[] = [
        ...pulseReactions.map(r => ({
          id: r.id,
          type: 'reaction' as const,
          source: 'pulse' as const,
          user: { 
            name: r.profiles?.full_name || "User", 
            handle: r.profiles?.username || "user", 
            avatar: r.profiles?.avatar_url || "" 
          },
          emoji: r.emoji,
          created_at: r.created_at
        })),
        ...pulseComments.map(c => ({
          id: c.id,
          type: 'comment' as const,
          source: 'pulse' as const,
          user: { 
            name: c.profiles?.full_name || "User", 
            handle: c.profiles?.username || "user", 
            avatar: c.profiles?.avatar_url || "" 
          },
          content: c.text || c.content,
          created_at: c.created_at
        })),
        ...postReactions.map(r => ({
          id: r.id,
          type: 'reaction' as const,
          source: 'echo' as const,
          user: { 
            name: r.profiles?.full_name || "User", 
            handle: r.profiles?.username || "user", 
            avatar: r.profiles?.avatar_url || "" 
          },
          emoji: r.emoji,
          created_at: r.created_at
        })),
        ...postComments.map(c => ({
          id: c.id,
          type: 'comment' as const,
          source: 'echo' as const,
          user: { 
            name: c.profiles?.full_name || "User", 
            handle: c.profiles?.username || "user", 
            avatar: c.profiles?.avatar_url || "" 
          },
          content: c.text,
          created_at: c.created_at
        })),
        ...likes.map(l => ({
          id: l.id,
          type: 'like' as const,
          source: 'echo' as const,
          user: { 
            name: l.profiles?.full_name || "User", 
            handle: l.profiles?.username || "user", 
            avatar: l.profiles?.avatar_url || "" 
          },
          created_at: l.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={14} className="fill-red-500 text-red-500" />;
      case 'comment': return <MessageCircle size={14} className="text-blue-500" />;
      case 'reaction': return <Smile size={14} className="text-yellow-500" />;
      default: return <Zap size={14} className="text-accent" />;
    }
  };

  return (
    <Sheet onOpenChange={(open) => open && fetchNotifications()}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-white dark:bg-black border-l-0 dark:border-white/10 p-0">
        <SheetHeader className="p-6 border-b dark:border-white/10">
          <SheetTitle className="text-2xl font-black flex items-center gap-2 dark:text-white">
            Notifications
            {notifications.length > 0 && (
              <span className="bg-accent text-white text-[10px] px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="h-[calc(100vh-85px)]">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-neutral-100 dark:divide-white/5">
              {notifications.map((n) => (
                <div key={n.id} className="p-4 flex gap-4 hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                  <div className="relative">
                    <Avatar className="w-12 h-12 border-2 border-white dark:border-white/10 shadow-sm">
                      <AvatarImage src={n.user.avatar} />
                      <AvatarFallback className="bg-neutral-100 dark:bg-white/5 text-neutral-400 font-bold">
                        {n.user.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-white dark:bg-black rounded-full p-1 shadow-sm border border-neutral-100 dark:border-white/10">
                      {getIcon(n.type)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm dark:text-white">
                      <span className="font-black">@{n.user.handle}</span>
                      {" "}
                      <span className="text-neutral-600 dark:text-neutral-400">
                        {n.type === 'like' && "liked your echo"}
                        {n.type === 'comment' && `commented on your ${n.source}`}
                        {n.type === 'reaction' && `reacted ${n.emoji} to your ${n.source}`}
                      </span>
                    </p>
                    {n.content && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 p-2 rounded-lg italic">
                        "{n.content}"
                      </p>
                    )}
                    <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-neutral-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Bell size={32} className="text-neutral-200 dark:text-neutral-800" />
              </div>
              <h3 className="font-black text-lg dark:text-white">No notifications yet</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px]">
                When people interact with your echoes or pulses, you'll see them here.
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationsSheet;
