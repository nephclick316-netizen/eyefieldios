"use client";

import React, { useState, useEffect, useMemo } from "react";
import MainLayout from "@/components/layout/MainLayout";
import PulseCard from "@/components/social/PulseCard";
import EchoPost from "@/components/social/EchoPost";
import UploadEchoModal from "@/components/social/UploadEchoModal";
import UploadPulseModal from "@/components/social/UploadPulseModal";
import PulseViewer from "@/components/social/PulseViewer";
import NotificationsSheet from "@/components/social/NotificationsSheet";

import { Plus, Bell, RefreshCw, LogIn, Search, Camera, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import aiRobot from "@/assets/ai-robot.png";
import { toast } from "sonner";

const Echo = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedPulseIndex, setSelectedPulseIndex] = useState<number | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [pulses, setPulses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      // Fetch Echoes (Regular Posts)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles(full_name, username, avatar_url)')
        .order('created_at', { ascending: false });
      
      if (postsError) console.error("Error fetching posts:", postsError);
      
      if (postsData) {
        setPosts(postsData.map(p => ({
          id: p.id,
          ownerId: p.user_id,
          user: { 
            name: p.profiles?.full_name || "User", 
            handle: p.profiles?.username ? `@${p.profiles.username}` : "user", 
            avatar: p.profiles?.avatar_url || "" 
          },
          content: p.content,
          images: p.media_urls && Array.isArray(p.media_urls) ? p.media_urls.map((m: any) => m.url || m) : [],
          linkUrl: p.link_url,
          timestamp: new Date(p.created_at).toLocaleDateString(),
          likes: p.applause_count || 0,
          echoes: p.emojis_count || 0,
          replies: p.comments_count || 0,
          city: p.location,
          country: ""
        })));
      }

      // Fetch Pulses
      const { data: pulsesData, error: pulsesError } = await supabase
        .from('pulses')
        .select(`
          *,
          profiles:user_id (
            full_name,
            username,
            avatar_url
          )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true });

      if (pulsesError) {
        console.error("Error fetching pulses:", pulsesError);
      }

      if (pulsesData) {
        setPulses(pulsesData.map(p => ({
          id: p.id,
          user_id: p.user_id,
          username: p.profiles?.username ? `@${p.profiles.username}` : "user",
          avatar: p.profiles?.avatar_url || "",
          image: p.media_url || "",
          type: p.media_type || 'image',
          caption: p.caption,
          link_url: p.link_url,
          isUnread: true
        })));
      }
    } catch (error) {
      console.error("Unexpected error fetching data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const observerRef = useInfiniteScroll(() => {
    if (!loading && !isRefreshing) {
      fetchData(true);
    }
  });

  const filteredPosts = useMemo(() => {
    if (!userSearch) return posts;
    const query = userSearch.toLowerCase();
    return posts.filter(post => 
      post.content.toLowerCase().includes(query) ||
      post.user.name.toLowerCase().includes(query) ||
      post.user.handle.toLowerCase().includes(query) ||
      (post.city && post.city.toLowerCase().includes(query)) ||
      (post.country && post.country.toLowerCase().includes(query))
    );
  }, [posts, userSearch]);

  const handleImageSearch = () => {
    toast.success("Image search activated! Select an image to find related echoes.");
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const handlePulseDeleted = (pulseId: string) => {
    setPulses(prev => prev.filter(p => p.id !== pulseId));
    setSelectedPulseIndex(null);
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="flex justify-between items-center bg-white dark:bg-transparent -mx-4 px-4 py-4 sticky top-0 z-20 backdrop-blur-md bg-opacity-80">
          <h5 className="text-xl font-black tracking-tighter text-foreground leading-none">EyeField</h5>
          <div className="flex items-center gap-2">
            {isRefreshing && (
              <div className="flex items-center gap-2 text-accent animate-pulse mr-2">
                <RefreshCw size={16} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">Refreshing</span>
              </div>
            )}
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => navigate("/endocard")}
                  className="h-10 rounded-xl bg-white dark:bg-secondary border-gray-200 dark:border-none shadow-sm hover:bg-gray-50 transition-colors px-3 gap-2"
                >
                  <img src={aiRobot} alt="Endocard" className="w-6 h-6 object-contain" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Endocard</span>
                </Button>
                <NotificationsSheet 
                  trigger={
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-neutral-100 relative">
                      <Bell size={20} />
                    </Button>
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl hover:bg-neutral-100">
                      <MoreVertical size={20} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2">
                    <DropdownMenuItem 
                      className="text-red-500 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 rounded-xl cursor-pointer font-bold"
                      onClick={() => navigate("/delete-account")}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Delete Account</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={() => navigate("/login")}
                className="h-10 rounded-xl bg-[#000080] hover:bg-[#000066] text-white font-black px-6 gap-2 shadow-lg shadow-blue-900/20"
              >
                <LogIn size={18} />
                Login
              </Button>
            )}
          </div>
        </header>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">Echoes</h1>
            <p className="text-muted-foreground font-medium">Share your thoughts, moments, and connect with the community.</p>
          </div>
        </div>

        {user && (
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            <UploadPulseModal />
            {pulses.map((pulse, idx) => (
              <PulseCard 
                key={pulse.id} 
                {...pulse} 
                onClick={() => setSelectedPulseIndex(idx)}
              />
            ))}
          </div>
        )}

        {user && (
          <div className="flex gap-3 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search echoes, places, events..." 
                className="pl-11 pr-24 h-14 rounded-2xl bg-white dark:bg-secondary border-gray-200 dark:border-none shadow-sm focus-visible:ring-accent"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-neutral-100"
                  onClick={handleImageSearch}
                >
                  <Camera size={20} className="text-muted-foreground" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-xl hover:bg-neutral-100"
                  onClick={() => navigate("/endocard")}
                >
                  <img src={aiRobot} alt="AI Help" className="w-6 h-6 object-contain" />
                </Button>
              </div>
            </div>
            <UploadEchoModal 
              trigger={
                <Button className="h-14 w-14 sm:w-auto sm:px-6 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2">
                  <Plus size={24} />
                  <span className="hidden sm:inline font-black">New Echo</span>
                </Button>
              }
            />
          </div>
        )}

        <div className="space-y-8 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6">
          {loading ? (
            <div className="flex justify-center py-20 col-span-full">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredPosts.length > 0 ? (
            <>
              {filteredPosts.map((post) => (
                <EchoPost key={post.id} {...post} onDelete={() => handleDeletePost(post.id)} />
              ))}
              <div ref={observerRef} className="h-10 w-full col-span-full flex items-center justify-center">
                {isRefreshing && <RefreshCw size={20} className="text-accent animate-spin" />}
              </div>
            </>
          ) : (
            <div className="text-center py-20 text-muted-foreground col-span-full">
              <p className="font-black">No results found</p>
              <p className="text-xs">Try searching for something else!</p>
            </div>
          )}
        </div>
      </div>

      {selectedPulseIndex !== null && (
        <PulseViewer 
          isOpen={true} 
          onClose={() => setSelectedPulseIndex(null)} 
          pulses={pulses}
          initialIndex={selectedPulseIndex}
          onDelete={handlePulseDeleted}
        />
      )}
    </MainLayout>
  );
};

export default Echo;