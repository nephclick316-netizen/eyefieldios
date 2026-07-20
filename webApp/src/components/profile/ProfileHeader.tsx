"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Camera, Settings as SettingsIcon, Phone, Video, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileHeaderProps {
  viewedUser: any;
  isOwnProfile: boolean;
  isEditing: boolean;
  isFollowing: boolean;
  isAdmin: boolean;
  onEditClick: () => void;
  onFollowToggle: () => void;
  onMediaSelect: (e: React.ChangeEvent<HTMLInputElement>, target: "avatar" | "banner") => void;
  editAvatar?: string;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  viewedUser,
  isOwnProfile,
  isEditing,
  isFollowing,
  isAdmin,
  onEditClick,
  onFollowToggle,
  onMediaSelect,
  editAvatar
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative -mx-4 -mt-6">
      <div className="h-48 w-full overflow-hidden bg-accent/10 relative group">
        <img 
          src={viewedUser?.banner || "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1200&q=80"} 
          alt="Banner" 
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=1200&q=80"; }}
        />
        {isEditing && (
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Camera size={32} />
            <input type="file" className="hidden" accept="image/*" onChange={(e) => onMediaSelect(e, "banner")} />
          </label>
        )}
      </div>
      
      <div className="absolute -bottom-16 left-4">
        <div className="w-32 h-32 rounded-full border-4 border-primary overflow-hidden bg-secondary shadow-2xl relative group">
          <img 
            src={(isEditing ? editAvatar : viewedUser?.avatar) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewedUser?.name || 'user'}`} 
            alt={viewedUser?.name} 
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${viewedUser?.name || 'user'}`; }}
          />
          {isEditing && (
            <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera size={24} />
              <input type="file" className="hidden" accept="image/*" onChange={(e) => onMediaSelect(e, "avatar")} />
            </label>
          )}
        </div>
      </div>

      <div className="absolute -bottom-12 right-4 flex gap-2">
        {isOwnProfile ? (
          <>
            {isAdmin && (
              <Button 
                className="rounded-full bg-accent hover:bg-accent/90 text-white font-bold px-6 border-none"
                onClick={() => navigate("/admin")}
              >
                <LayoutDashboard size={18} className="mr-2" /> Admin Dashboard
              </Button>
            )}
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/5" onClick={() => navigate("/settings")}>
              <SettingsIcon size={18} />
            </Button>
            {!isEditing && (
              <Button className="rounded-full bg-accent hover:bg-accent/90 text-white font-bold px-6" onClick={onEditClick}>
                Edit Profile
              </Button>
            )}
          </>
        ) : (
          <>
            <Button 
              onClick={onFollowToggle}
              className={`rounded-full font-bold px-8 transition-all ${isFollowing ? "bg-secondary text-foreground" : "bg-accent text-white hover:bg-accent/90"}`}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(`/chat?user=${viewedUser.id}`)}
              className="rounded-full font-bold px-8 border-accent text-accent hover:bg-accent/10 bg-white dark:bg-transparent"
            >
              Message
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileHeader;