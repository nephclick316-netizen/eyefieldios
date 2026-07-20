"use client";

import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw } from "lucide-react";
import EchoPost from "@/components/social/EchoPost";
import ShopTab from "@/components/profile/ShopTab";
import MediaTab from "@/components/profile/MediaTab";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileInfo from "@/components/profile/ProfileInfo";
import ProfileEditForm from "@/components/profile/ProfileEditForm";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import MediaStudio from "@/components/media/MediaStudio";
import { uploadMedia } from "@/utils/upload";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";

const ADMIN_EMAILS = ["nephclick@gmail.com", "eyefieldholybusiness@gmail.com"];

const COUNTRIES = [
  { name: "United States", code: "+1" },
  { name: "United Kingdom", code: "+44" },
  { name: "France", code: "+33" },
  { name: "Uganda", code: "+256" },
  { name: "Kenya", code: "+254" },
  { name: "Nigeria", code: "+234" },
  { name: "Rwanda", code: "+250" },
  { name: "Tanzania", code: "+255" },
  { name: "DR Congo", code: "+243" },
  { name: "Burundi", code: "+257" },
];

const BUSINESS_CATEGORIES = [
  "Retail & E-commerce",
  "Technology & Software",
  "Food & Beverage",
  "Fashion & Apparel",
  "Health & Beauty",
  "Professional Services",
  "Creative & Design",
  "Other"
];

const Profile = () => {
  const { handle } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useUser();
  
  const [viewedUser, setViewedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("echoes");
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [studioTarget, setStudioTarget] = useState<"avatar" | "banner">("avatar");
  
  const [posts, setPosts] = useState<any[]>([]);
  const [shopProducts, setShopProducts] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [myFollowingIds, setMyFollowingIds] = useState<Set<string>>(new Set());

  const isOwnProfile = !handle || handle === currentUser?.handle;

  const fetchFollowStats = useCallback(async (userId: string) => {
    const { count: followers } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);
    
    const { count: following } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userId);

    setFollowerCount(followers || 0);
    setFollowingCount(following || 0);

    if (!isOwnProfile && currentUser?.id) {
      const { data } = await supabase
        .from('user_follows')
        .select('*')
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)
        .single();
      setIsFollowing(!!data);
    }
  }, [isOwnProfile, currentUser?.id]);

  const fetchMyFollowing = useCallback(async () => {
    if (currentUser?.id) {
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', currentUser.id);
      
      if (following) {
        setMyFollowingIds(new Set(following.map(f => f.following_id)));
      }
    }
  }, [currentUser?.id]);

  const [editData, setEditData] = useState<any>({
    name: "",
    bio: "",
    avatar: "",
    banner: "",
    gender: "",
    country: "",
    phone: "",
    businessCategory: "",
    website: "",
    businessAddress: "",
    fullAddress: "",
    socials: { instagram: "", twitter: "", linkedin: "" }
  });

  const fetchProfileData = useCallback(async (silent = false) => {
    setLoading(!silent);
    if (silent) setIsRefreshing(true);
    try {
      let targetUser = currentUser;

      if (!isOwnProfile) {
        const searchUsername = handle?.startsWith('@') ? handle.substring(1) : handle;
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, bio, date_of_birth, country, phone_number, city_address, avatar_url, banner_url, status, onboarding_completed')
          .eq('username', searchUsername)
          .single();

        if (error) throw error;

        const { data: businessData } = await supabase
          .from('businesses')
          .select('business_name, category, website_url, business_address')
          .eq('user_id', profile.id)
          .maybeSingle();

        const parseUrl = (raw: any): string => {
          if (!raw) return "";
          if (typeof raw === "string") {
            try {
              const p = JSON.parse(raw);
              if (p?.url) return p.url;
              if (Array.isArray(p) && p.length > 0) return p[0]?.url || String(p[0]);
              return typeof p === "string" ? p : raw;
            } catch { return raw.replace(/^["']|["']$/g, ""); }
          }
          if (typeof raw === "object" && raw?.url) return raw.url;
          return "";
        };

        targetUser = {
          id: profile.id,
          name: profile.full_name || "User",
          profileName: profile.full_name || "",
          handle: profile.username || "",
          avatar: parseUrl(profile.avatar_url),
          banner: parseUrl(profile.banner_url),
          bio: profile.bio || "",
          country: profile.country || "",
          phone: profile.phone_number || "",
          dateOfBirth: profile.date_of_birth || "",
          fullAddress: profile.city_address || "",
          status: profile.status || "active",
          businessName: businessData?.business_name || "",
          businessCategory: businessData?.category || "",
          website: businessData?.website_url || "",
          businessAddress: businessData?.business_address || "",
          address: { street: profile.city_address || "", city: "", state: "" },
          currency: { code: "USD", symbol: "$" },
          is_verified: false,
          socials: {},
        };
      }

      setViewedUser(targetUser);
      if (targetUser?.id) fetchFollowStats(targetUser.id);
      fetchMyFollowing();
      
      if (isOwnProfile) {
        setEditData({
          ...targetUser,
          banner: targetUser?.banner || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1200&q=80"
        });
      }

      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', targetUser?.id)
        .order('created_at', { ascending: false });

      if (postsData) {
        setPosts(postsData.map(p => {
          let imageUrls: string[] = [];
          if (p.media_urls) {
            let media = p.media_urls;
            if (typeof media === 'string') {
              try { media = JSON.parse(media); } catch (e) {}
            }
            if (Array.isArray(media)) {
              imageUrls = media.map((m: any) => {
                if (typeof m === 'string') {
                  try { const parsed = JSON.parse(m); if (parsed.url) return parsed.url; } catch(e){}
                  return m.replace(/^["']|["']$/g, '');
                }
                return m?.url || '';
              }).filter(Boolean);
            } else if (typeof media === 'string') {
              imageUrls = [media.replace(/^["']|["']$/g, '')];
            }
          } else if (p.media_url) {
            imageUrls = [p.media_url];
          }

          const userHandle = targetUser?.handle?.startsWith('@') ? targetUser.handle : targetUser?.handle ? `@${targetUser.handle}` : 'user';

          return {
            id: p.id,
            ownerId: p.user_id,
            user: { name: targetUser?.name || "User", handle: userHandle, avatar: targetUser?.avatar },
            content: p.content,
            timestamp: new Date(p.created_at).toLocaleDateString(),
            likes: p.applause_count || 0,
            echoes: p.emojis_count || 0,
            replies: p.comments_count || 0,
            images: imageUrls
          };
        }));
      }

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', targetUser?.id)
        .order('created_at', { ascending: false });

      if (productsData) {
        setShopProducts(productsData);
      }

      const { data: pulsesData } = await supabase
        .from('pulses')
        .select('*')
        .eq('user_id', targetUser?.id)
        .order('created_at', { ascending: false });

      if (pulsesData) {
        setMediaItems(pulsesData);
      }

    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("User not found");
      navigate("/");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [handle, currentUser, isOwnProfile, navigate, fetchFollowStats, fetchMyFollowing]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const observerRef = useInfiniteScroll(() => {
    if (!loading && !isRefreshing) {
      fetchProfileData(true);
    }
  });

  const handleFollowToggle = async (targetId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUser?.id) return;

    try {
      if (isCurrentlyFollowing) {
        await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', targetId);
        
        if (targetId === viewedUser?.id) setIsFollowing(false);
        setMyFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetId);
          return next;
        });
      } else {
        await supabase
          .from('user_follows')
          .insert({ follower_id: currentUser.id, following_id: targetId });
        
        if (targetId === viewedUser?.id) setIsFollowing(true);
        setMyFollowingIds(prev => new Set(prev).add(targetId));
      }
      
      if (viewedUser?.id) fetchFollowStats(viewedUser.id);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleSave = async () => {
    if (!currentUser?.id) return;
    setIsSaving(true);
    try {
      let avatarUrl = editData.avatar;
      let bannerUrl = editData.banner;

      if (editData.avatar?.startsWith('blob:')) {
        const response = await fetch(editData.avatar);
        const blob = await response.blob();
        avatarUrl = await uploadMedia(blob, 'avatars', currentUser.id);
      }

      if (editData.banner?.startsWith('blob:')) {
        const response = await fetch(editData.banner);
        const blob = await response.blob();
        bannerUrl = await uploadMedia(blob, 'banners', currentUser.id);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.name,
          bio: editData.bio,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          date_of_birth: editData.gender,
          country: editData.country,
          phone_number: editData.phone,
          city_address: editData.fullAddress,
        })
        .eq('id', currentUser.id);

      if (error) throw error;

      if (editData.businessCategory || editData.businessAddress) {
        await supabase.from('businesses').upsert({
          user_id: currentUser.id,
          business_name: editData.businessAddress,
          category: editData.businessCategory,
          website_url: editData.website,
        });
      }
      
      const newUserData = { ...editData, avatar: avatarUrl, banner: bannerUrl };
      setUser(newUserData as any);
      setViewedUser((prev: any) => ({ ...prev, ...newUserData }));
      setIsEditing(false);
      showSuccess("Profile updated!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => {
    if (e.target.files?.[0]) {
      setRawFiles([e.target.files[0]]);
      setStudioTarget(target);
      setIsStudioOpen(true);
    }
  };

  const handleStudioComplete = (results: { blob: Blob; type: "image" | "video" }[]) => {
    if (results.length > 0) {
      const url = URL.createObjectURL(results[0].blob);
      if (studioTarget === "avatar") setEditData(prev => ({ ...prev, avatar: url }));
      else setEditData(prev => ({ ...prev, banner: url }));
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="font-black text-muted-foreground">Loading profile...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <ProfileHeader 
        viewedUser={viewedUser}
        isOwnProfile={isOwnProfile}
        isEditing={isEditing}
        isFollowing={isFollowing}
        isAdmin={currentUser?.email ? ADMIN_EMAILS.includes(currentUser.email) : false}
        onEditClick={() => setIsEditing(true)}
        onFollowToggle={() => handleFollowToggle(viewedUser.id, isFollowing)}
        onMediaSelect={handleMediaSelect}
        editAvatar={editData.avatar}
      />

      <div className="mt-20 px-4 space-y-6">
        {isEditing ? (
          <ProfileEditForm 
            editData={editData}
            setEditData={setEditData}
            onSave={handleSave}
            onCancel={() => setIsEditing(false)}
            isSaving={isSaving}
            countries={COUNTRIES}
            businessCategories={BUSINESS_CATEGORIES}
          />
        ) : (
          <>
            <ProfileInfo 
              viewedUser={viewedUser}
              currentUser={currentUser}
              isOwnProfile={isOwnProfile}
              followerCount={followerCount}
              followingCount={followingCount}
              myFollowingIds={myFollowingIds}
              onFollowToggle={handleFollowToggle}
            />

            <Tabs defaultValue="echoes" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="w-full bg-transparent border-b border-white/5 rounded-none h-12 p-0 gap-8 overflow-x-auto">
                <TabsTrigger value="echoes" className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-full px-2 font-bold text-sm">Posts</TabsTrigger>
                <TabsTrigger value="pulses" className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-full px-2 font-bold text-sm">Pulses</TabsTrigger>
                <TabsTrigger value="shop" className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-full px-2 font-bold text-sm">Shop</TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger value="saved" className="data-[state=active]:text-accent data-[state=active]:border-b-2 data-[state=active]:border-accent rounded-none h-full px-2 font-bold text-sm">Saved</TabsTrigger>
                )}
              </TabsList>
              <div className="py-6">
                <TabsContent value="echoes" className="space-y-6 m-0">
                  {posts.length > 0 ? posts.map(post => (
                    <EchoPost 
                      key={post.id} 
                      {...post} 
                      onDelete={() => fetchProfileData(true)} 
                    />
                  )) : <p className="text-center text-muted-foreground py-12">No posts yet.</p>}
                </TabsContent>
                <TabsContent value="pulses" className="m-0">
                  <MediaTab 
                    media={mediaItems} 
                    isOwner={isOwnProfile} 
                    onDelete={() => fetchProfileData(true)}
                  />
                </TabsContent>
                <TabsContent value="shop" className="m-0">
                  <ShopTab 
                    products={shopProducts} 
                    isOwner={isOwnProfile} 
                    onDelete={() => fetchProfileData(true)}
                    onUpdate={() => fetchProfileData(true)}
                  />
                </TabsContent>
                {isOwnProfile && (
                  <TabsContent value="saved" className="m-0">
                    <p className="text-center text-muted-foreground py-12">Saved posts coming soon...</p>
                  </TabsContent>
                )}
              </div>
            </Tabs>
            <div ref={observerRef} className="h-10 w-full flex items-center justify-center">
              {isRefreshing && <RefreshCw size={20} className="text-accent animate-spin" />}
            </div>
          </>
        )}
      </div>

      <MediaStudio isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} files={rawFiles} onComplete={handleStudioComplete} maxImages={1} aspectRatio={studioTarget === "avatar" ? 1 : 16/9} />
    </MainLayout>
  );
};

export default Profile;
