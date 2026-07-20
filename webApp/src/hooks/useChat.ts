"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadMedia } from "@/utils/upload";
import { toast } from "sonner";

export const useChat = (user: any, selectedChat: any, setSelectedChat: (chat: any) => void, searchQuery: string = "") => {
  const [chats, setChats] = useState<any[]>([]);
  const [messagesCache, setMessagesCache] = useState<Record<string, any[]>>({});
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [forwardingMessage, setForwardingMessage] = useState<any>(null);
  
  const [botMessages, setBotMessages] = useState<any[]>([
    {
      id: 'welcome',
      sender_id: 'ai-bot',
      content: "Hello! I'm Endocard, your Cascadea AI assistant. How can I help you today?",
      created_at: new Date().toISOString(),
      type: 'text'
    }
  ]);

  const fetchChats = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Get all chat rooms the user is a participant in
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (error) throw error;

      if (rooms) {
        const formattedChats = await Promise.all(rooms.map(async (room: any) => {
          const otherUserId = room.user1_id === user.id ? room.user2_id : room.user1_id;
          
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherUserId)
            .single();

          let lastMessageText = room.last_message || "No messages yet";
          
          let parsedAvatar = profile?.avatar_url;
          if (typeof parsedAvatar === 'string') {
            try {
              const parsed = JSON.parse(parsedAvatar);
              if (parsed && typeof parsed === 'object' && parsed.url) parsedAvatar = parsed.url;
              else if (Array.isArray(parsed) && parsed.length > 0) parsedAvatar = parsed[0]?.url || parsed[0];
              else parsedAvatar = parsed;
            } catch (e) {}
          } else if (parsedAvatar && typeof parsedAvatar === 'object') {
            parsedAvatar = parsedAvatar.url;
          }
          if (typeof parsedAvatar === 'string') {
            parsedAvatar = parsedAvatar.replace(/^["']|["']$/g, '');
          }

          return {
            id: room.id,
            otherUserId: profile?.id,
            name: profile?.full_name || profile?.username || "User",
            avatar: parsedAvatar || "",
            lastMessage: lastMessageText,
            time: room.last_message_time ? new Date(room.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
            lastMessageDate: room.last_message_time ? new Date(room.last_message_time) : new Date(0),
            isLastMessageOutgoing: false, // Inferring from last message sender would require an extra join, skipping for performance
            isViewed: true // Simplification
          };
        }));
        
        const validChats = formattedChats.filter(Boolean);
        const sortedChats = validChats.sort((a: any, b: any) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime());
        
        setChats(sortedChats);
      }
    } catch (error) {
      console.error("Error in fetchChats:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchFollowers = useCallback(async () => {
    if (!user?.id) return;
    try {
      let query = supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url')
        .neq('id', user.id)
        .limit(50);
      
      if (searchQuery && searchQuery.trim() !== "") {
        query = query.or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`);
      }
      
      const { data } = await query;
      
      if (data) {
        setFollowers(data.map((p: any) => ({
          id: p.id,
          name: p.full_name || p.username,
          handle: p.username,
          avatar_url: p.avatar_url
        })));
      }
    } catch (err) {
      console.error("Error fetching followers:", err);
    }
  }, [user?.id, searchQuery]);

  useEffect(() => {
    fetchChats();
    fetchFollowers();
  }, [fetchChats, fetchFollowers]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('chat-realtime-v6')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'chat_messages' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = { ...payload.new, reactions: [], content: payload.new.text || payload.new.content };
          
          // Update message list if it's the active chat
          if (selectedChat?.id === payload.new.room_id) {
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }

          // Update cache
          setMessagesCache(prev => {
            const currentMsgs = prev[payload.new.room_id] || [];
            if (currentMsgs.some(m => m.id === newMsg.id)) return prev;
            return {
              ...prev,
              [payload.new.room_id]: [...currentMsgs, newMsg]
            };
          });

          // Optimistically update sidebar (chats)
          setChats(prev => {
            const chatIndex = prev.findIndex(c => c.id === payload.new.room_id);
            if (chatIndex === -1) {
              // If chat not found, it might be a new chat we should fetch
              fetchChats();
              return prev;
            }

            const updatedChats = [...prev];
            const chat = { ...updatedChats[chatIndex] };
            
            let lastMessageText = payload.new.text || payload.new.content;
            if (payload.new.type === 'voice' || payload.new.type === 'field_note') {
              lastMessageText = "🎙️ Voice Message";
            } else if (payload.new.media_url || payload.new.type === 'image') {
              lastMessageText = "📷 Image";
            }

            chat.lastMessage = lastMessageText;
            chat.time = new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            chat.lastMessageDate = new Date(payload.new.created_at);
            chat.isLastMessageOutgoing = payload.new.sender_id === user.id;
            chat.isViewed = chat.id === selectedChat?.id; // Mark as read if it's the current chat

            updatedChats[chatIndex] = chat;
            return updatedChats.sort((a, b) => 
              new Date(b.lastMessageDate).getTime() - new Date(a.lastMessageDate).getTime()
            );
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedChat?.id, fetchChats]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat?.id || selectedChat.isBot) return;

    // Check if we already have messages in state for this chat to avoid clearing
    // but if we are switching, we might want to show cache immediately
    
    setMessagesLoading(true);
    try {
      let data: any[] | null = null;
      // Try with reactions join first
      const result = await supabase
        .from('chat_messages')
        .select('*, message_reactions(*)')
        .eq('room_id', selectedChat.id)
        .order('created_at', { ascending: true });

      if (result.error) {
        // If join fails, try without reactions
        console.warn('Reactions join failed, fetching without:', result.error.message);
        const fallback = await supabase
          .from('chat_messages')
          .select('*')
          .eq('room_id', selectedChat.id)
          .order('created_at', { ascending: true });
        data = fallback.data;
      } else {
        data = result.data;
      }
      
      if (data) {
        const formattedMessages = data.map(m => ({
          ...m,
          content: m.text || m.content,
          reactions: m.message_reactions || []
        }));
        
        setMessages(formattedMessages);
        setMessagesCache(prev => ({
            ...prev,
            [selectedChat.id]: formattedMessages
        }));
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedChat?.id, selectedChat?.isBot]);

  useEffect(() => {
    if (selectedChat?.id && !selectedChat.isBot) {
        // Show cache immediately on switch
        if (messagesCache[selectedChat.id]) {
            setMessages(messagesCache[selectedChat.id]);
        } else {
            setMessages([]);
        }
        fetchMessages();
    }
  }, [selectedChat?.id, fetchMessages]);

  const handleSendMessage = async (content: string, type: string = 'text', mediaUrl?: string) => {
    if ((!content.trim() && !mediaUrl) || !selectedChat?.id || !user?.id) return;

    if (selectedChat.isBot) {
      const userMsg = {
        id: Date.now().toString(),
        sender_id: user.id,
        content: content.trim(),
        created_at: new Date().toISOString(),
        type: 'text'
      };
      setBotMessages(prev => [...prev, userMsg]);
      
      try {
        const { data } = await supabase.functions.invoke('chat-ai', {
          body: { message: content.trim(), userId: user.id }
        });
        if (data?.reply) {
          setBotMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            sender_id: 'ai-bot',
            content: data.reply,
            created_at: new Date().toISOString(),
            type: 'text'
          }]);
        }
      } catch (err) {
        console.error("AI Bot error:", err);
      }
      return;
    }

    try {
      const messageContent = content.trim() || (type === 'voice' ? '[Voice Message]' : type === 'image' ? '[Image]' : '[Media]');
      
      const { data: inserted, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: selectedChat.id,
          sender_id: user.id,
          text: messageContent,
          media_url: mediaUrl
        })
        .select()
        .single();

      if (error) throw error;

      // Update room last message manually to mirror Mobile App behavior
      await supabase.from('chat_rooms').update({
        last_message: messageContent,
        last_message_time: new Date().toISOString()
      }).eq('id', selectedChat.id);

      if (inserted) {
        const newMsg = { ...inserted, content: inserted.text || inserted.content, reactions: [] };
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        
        // Update cache
        setMessagesCache(prev => ({
          ...prev,
          [selectedChat.id]: [...(prev[selectedChat.id] || []), newMsg]
        }));
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      toast.error("Failed to send message.");
    }
  };

  const handleVoiceSend = async (blob: Blob) => {
    if (!user?.id || !selectedChat?.id) return;
    try {
      const url = await uploadMedia(blob, 'chat-media', user.id);
      await handleSendMessage("", 'voice', url);
      toast.success("Voice note sent!");
    } catch (error) {
      console.error("Error sending voice note:", error);
      toast.error("Failed to send voice note.");
    }
  };

  const handleStudioComplete = async (results: { blob: Blob; type: "image" | "video" }[]) => {
    if (!user?.id || !selectedChat?.id) return;
    try {
      for (const res of results) {
        const url = await uploadMedia(res.blob, 'chat-media', user.id);
        await handleSendMessage("", res.type, url);
      }
      toast.success("Media sent!");
    } catch (error) {
      console.error("Error sending media:", error);
      toast.error("Failed to send media.");
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user?.id || selectedChat?.isBot) return;
    try {
      await supabase.from('message_reactions').insert({ message_id: messageId, user_id: user.id, emoji });
    } catch (err) {
      console.error("Error adding reaction:", err);
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (selectedChat?.isBot) {
      setBotMessages(prev => prev.filter(m => m.id !== id));
      return;
    }
    try {
      await supabase.from('chat_messages').delete().eq('id', id);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  const startNewChat = async (otherUser: any) => {
    if (!user?.id) return;

    try {
      // Check for existing chat first
      const { data: commonChats, error: commonError } = await supabase
        .from('chat_rooms')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (commonError) throw commonError;

      let chatId = null;

      if (commonChats && commonChats.length > 0) {
        const existingRoom = commonChats.find((r: any) => r.user1_id === otherUser.id || r.user2_id === otherUser.id);
        if (existingRoom) {
          chatId = existingRoom.id;
        }
      }

      // If no existing chat, create one
      if (!chatId) {
        const { data: newRoom, error: createError } = await supabase.from('chat_rooms').insert({
          user1_id: user.id,
          user2_id: otherUser.id,
          last_message: '',
          last_message_time: new Date().toISOString()
        }).select().single();

        if (createError) throw createError;
        chatId = newRoom.id;
      }

      if (chatId) {
        setSelectedChat({ 
          id: chatId, 
          name: otherUser.name, 
          avatar: otherUser.avatar_url || otherUser.avatar,
          otherUserId: otherUser.id 
        });
        
        await fetchChats();
        toast.success(`Chat started with ${otherUser.name}`);
      }
    } catch (err: any) {
      console.error("Error starting chat:", err);
      toast.error(err.message || "Could not start new chat.");
    }
  };

  return {
    chats,
    messages: selectedChat?.isBot ? botMessages : messages,
    loading,
    followers,
    setForwardingMessage,
    handleSendMessage,
    handleVoiceSend,
    handleDeleteMessage,
    handleReaction,
    handleStudioComplete,
    startNewChat,
    refreshMessages: fetchMessages,
    refreshChats: fetchChats
  };
};
