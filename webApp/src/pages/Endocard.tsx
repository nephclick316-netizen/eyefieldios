"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageList from "@/components/chat/MessageList";
import ChatInput from "@/components/chat/ChatInput";
import EndocardQuickActions from "@/components/chat/EndocardQuickActions";
import UpgradePopup from "@/components/chat/UpgradePopup";
import { toast } from "sonner";

const ENDOCARD_BOT_ID = "ai-bot";

const Endocard = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        setMessages([
          {
            id: "welcome",
            sender_id: ENDOCARD_BOT_ID,
            content: "Hello! I am Endocard, your AI assistant. I can help you find users, products, or navigate the app. What are you looking for today?",
            created_at: new Date().toISOString(),
            type: "text"
          }
        ]);
        // Show upgrade popup after a short delay
        setTimeout(() => setShowUpgrade(true), 1000);
      } else {
        navigate("/login");
      }
    };
    getSession();
  }, [navigate]);

  const searchAppData = async (query: string) => {
    const results: any = { users: [], products: [], posts: [] };
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, bio, avatar_url')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(3);
      if (profiles) {
        results.users = profiles.map((p: any) => ({
          id: p.id,
          name: p.full_name || p.username || "User",
          handle: p.username || "",
          bio: p.bio,
          business_category: "User",
          avatar_url: p.avatar_url
        }));
      }

      const { data: products } = await supabase
        .from('products')
        .select('id, title, description, price, category, image_url')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(3);
      if (products) results.products = products;

      const { data: posts } = await supabase
        .from('posts')
        .select('id, content, created_at')
        .ilike('content', `%${query}%`)
        .limit(3);
      if (posts) results.posts = posts;

      return results;
    } catch (error) {
      console.error("Search error:", error);
      return results;
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      sender_id: user?.id,
      content: content.trim(),
      type: "text",
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      const contextData = await searchAppData(content);
      const systemPrompt = `You are Endocard, the official AI assistant for this web application. 
      Your goal is to help users navigate the app and find content.
      Context data: ${JSON.stringify(contextData)}`;

      const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY || "";
      const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
      let aiResponse = "";
      
      try {
        const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: content }
            ]
          })
        });
        const orData = await orRes.json();
        const reply = orData.choices?.[0]?.message?.content;
        if (reply && !reply.toLowerCase().includes("error")) {
          aiResponse = reply;
        }
      } catch (e) {
        console.error("OpenRouter failed", e);
      }
      
      if (!aiResponse) {
        try {
          const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt + "\n\nUser: " + content }] }]
            })
          });
          const gemData = await gemRes.json();
          const reply = gemData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) aiResponse = reply;
        } catch (e) {
          console.error("Gemini failed", e);
        }
      }
      
      if (!aiResponse) {
        aiResponse = "I am unable to respond at this time.";
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender_id: ENDOCARD_BOT_ID,
        content: aiResponse,
        created_at: new Date().toISOString(),
        type: "text"
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast.error("Failed to get response from Endocard");
      console.error(error);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#0B1120] text-white overflow-hidden">
      <ChatHeader 
        selectedChat={{ 
          name: "Endocard AI", 
          avatar: "/src/assets/ai-robot.png", 
          isBot: true 
        }} 
        messages={messages}
        onBack={() => navigate("/")}
      />
      
      <div className="flex-1 flex flex-col relative">
        <MessageList 
          messages={messages} 
          userId={user?.id}
          onDelete={() => {}}
          onForward={() => {}}
          onReaction={() => {}}
        />
        
        {isTyping && (
          <div className="px-6 py-2 flex items-center gap-2 text-xs text-accent animate-pulse">
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:0.4s]" />
            <span className="font-black uppercase tracking-widest ml-2">Endocard is thinking...</span>
          </div>
        )}

        <div className="p-4 md:p-6 space-y-4">
          <EndocardQuickActions onAction={(text) => handleSendMessage(text)} />
          <ChatInput 
            value={inputValue}
            onChange={setInputValue}
            onSend={() => handleSendMessage(inputValue)}
            isBot={true}
          />
        </div>
      </div>

      <UpgradePopup isOpen={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </div>
  );
};

export default Endocard;