"use client";

import React from "react";
import { MapPin, Globe, Phone, Briefcase, UserPlus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserListDialog from "./UserListDialog";

interface ProfileInfoProps {
  viewedUser: any;
  currentUser: any;
  isOwnProfile: boolean;
  followerCount: number;
  followingCount: number;
  myFollowingIds: Set<string>;
  onFollowToggle: (id: string, isFollowing: boolean) => void;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({
  viewedUser,
  currentUser,
  isOwnProfile,
  followerCount,
  followingCount,
  myFollowingIds,
  onFollowToggle
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          {viewedUser?.name}
          {viewedUser?.is_verified && <ShieldCheck size={20} className="text-accent" />}
        </h1>
        <p className="text-muted-foreground">@{viewedUser?.handle}</p>
      </div>

      <div className="flex items-center gap-6">
        <UserListDialog 
          type="followers" 
          userId={viewedUser?.id} 
          currentUserId={currentUser?.id}
          myFollowingIds={myFollowingIds}
          onFollowToggle={onFollowToggle}
          trigger={
            <button className="flex items-center gap-1.5 group">
              <span className="font-black text-lg group-hover:text-accent transition-colors">{followerCount}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Followers</span>
            </button>
          }
        />
        <UserListDialog 
          type="following" 
          userId={viewedUser?.id} 
          currentUserId={currentUser?.id}
          myFollowingIds={myFollowingIds}
          onFollowToggle={onFollowToggle}
          trigger={
            <button className="flex items-center gap-1.5 group">
              <span className="font-black text-lg group-hover:text-accent transition-colors">{followingCount}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Following</span>
            </button>
          }
        />
        {isOwnProfile && (
          <UserListDialog 
            type="all" 
            userId={currentUser?.id} 
            currentUserId={currentUser?.id}
            myFollowingIds={myFollowingIds}
            onFollowToggle={onFollowToggle}
            trigger={
              <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5 ml-auto">
                <UserPlus size={18} />
              </Button>
            }
          />
        )}
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">{viewedUser?.bio || "No bio yet."}</p>
      
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {viewedUser?.country && <div className="flex items-center gap-1"><Globe size={14} /><span>{viewedUser.country}</span></div>}
        {viewedUser?.businessCategory && <div className="flex items-center gap-1 text-accent font-bold"><Briefcase size={14} /><span>{viewedUser.businessCategory}</span></div>}
        {viewedUser?.phone && (isOwnProfile || viewedUser?.showPhone) && (
          <a href={`tel:${viewedUser.phone}`} className="flex items-center gap-1 hover:text-accent transition-colors">
            <Phone size={14} />
            <span>{viewedUser.phone}</span>
          </a>
        )}
        {viewedUser?.website && (
          <a href={viewedUser.website.startsWith('http') ? viewedUser.website : `https://${viewedUser.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-accent transition-colors">
            <Globe size={14} />
            <span>{viewedUser.website.replace(/^https?:\/\//, '')}</span>
          </a>
        )}
        {viewedUser?.businessAddress && (isOwnProfile || viewedUser?.showAddress) && (
          <div className="flex items-center gap-1"><Briefcase size={14} /><span>{viewedUser.businessAddress}</span></div>
        )}
        {viewedUser?.fullAddress && (isOwnProfile || viewedUser?.showAddress) && (
          <div className="flex items-center gap-1"><MapPin size={14} /><span>{viewedUser.fullAddress}</span></div>
        )}
      </div>
    </div>
  );
};

export default ProfileInfo;