"use client";

import React, { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ChatSidebar from "@/components/chat/ChatSidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import MediaShareDialog from "@/components/chat/MediaShareDialog";
import MediaStudio from "@/components/media/MediaStudio";
import { useUser } from "@/context/UserContext";
import { useChat } from "@/hooks/useChat";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import aiRobot from "@/assets/ai-robot.png";

const Chat = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isMediaDialogOpen, setIsMediaDialogOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const hasSentInquiry = useRef(false);

  const {
    chats,
    messages,
    followers,
    setForwardingMessage,
    handleSendMessage,
    handleVoiceSend,
    handleDeleteMessage,
    handleReaction: sendReaction,
    startNewChat,
    handleStudioComplete,
    refreshMessages
  } = useChat(user, selectedChat, setSelectedChat, searchQuery);

  useEffect(() => {
    const startParamChat = async () => {
      const userParam = searchParams.get('user');
      const productId = searchParams.get('productId');

      if (userParam && user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', userParam)
          .single();
        
        if (profile) {
          let parsedAvatar = profile.avatar_url;
          if (typeof parsedAvatar === 'string') {
            try {
              const parsed = JSON.parse(parsedAvatar);
              if (parsed && typeof parsed === 'object' && parsed.url) parsedAvatar = parsed.url;
              else if (Array.isArray(parsed) && parsed.length > 0) parsedAvatar = parsed[0]?.url || parsed[0];
            } catch (e) {}
          } else if (parsedAvatar && typeof parsedAvatar === 'object') {
            parsedAvatar = parsedAvatar.url;
          }

          await startNewChat({
             id: profile.id,
             name: profile.full_name || profile.username || "User",
             avatar_url: parsedAvatar || ""
          });
          
          // Handle automated product inquiry
          if (productId && !hasSentInquiry.current) {
            hasSentInquiry.current = true;
            const { data: product } = await supabase
              .from('products')
              .select('title, image_url')
              .eq('id', productId)
              .single();
            
            if (product) {
              // Send image first
              if (product.image_url) {
                await handleSendMessage("", 'image', product.image_url);
              }
              // Then send text
              await handleSendMessage(`Hi! Is this "${product.title}" still available?`, 'text');
              toast.success("Inquiry sent to seller!");
            }
          }
        }
      }
    };

    startParamChat();
  }, [searchParams, user?.id]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRawFiles(Array.from(e.target.files));
      setIsStudioOpen(true);
      setIsMediaDialogOpen(false);
    }
  };

  const handleForward = (id: string, content: string) => {
    setForwardingMessage({ id, content });
    setIsSearchOpen(true);
  };

  const handleReaction = (id: string, emoji: string) => {
    sendReaction(id, emoji);
    toast.info(`Reacted with ${emoji}`);
  };

  return (
    <MainLayout>
      <div className="md:grid md:grid-cols-[350px,1fr] md:gap-8 md:h-[calc(100vh-120px)]">
        <ChatSidebar 
          chats={chats}
          onSelectChat={setSelectedChat}
          selectedChatId={selectedChat?.id}
          onBotClick={() => navigate("/endocard")}
          followers={followers}
          onStartChat={startNewChat}
          isSearchOpen={isSearchOpen}
          setIsSearchOpen={setIsSearchOpen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <ChatWindow 
          selectedChat={selectedChat}
          messages={messages}
          userId={user?.id}
          message={message}
          setMessage={setMessage}
          onBack={() => setSelectedChat(null)}
          onSend={() => {
            if (message.trim()) {
              handleSendMessage(message);
              setMessage("");
            }
          }}
          onVoiceSend={handleVoiceSend}
          onDelete={handleDeleteMessage}
          onForward={handleForward}
          onReaction={handleReaction}
          onMediaClick={() => setIsMediaDialogOpen(true)}
        />
      </div>

      <MediaShareDialog 
        isOpen={isMediaDialogOpen}
        onOpenChange={setIsMediaDialogOpen}
        onMediaSelect={handleMediaSelect}
      />

      <MediaStudio 
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        files={rawFiles}
        onComplete={handleStudioComplete}
        maxImages={3}
      />
    </MainLayout>
  );
};

export default Chat;