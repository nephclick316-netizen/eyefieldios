"use client";

import React from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EchoHeaderProps {
  user: {
    name: string;
    handle: string;
    avatar: string;
  };
  timestamp: string;
  isOwner: boolean;
  onDelete?: () => void;
}

const EchoHeader: React.FC<EchoHeaderProps> = ({ user, timestamp, isOwner, onDelete }) => {
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate(`/profile/${user.handle}`);
  };

  return (
    <div className="flex items-center justify-between">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={handleProfileClick}
      >
        <Avatar className="w-10 h-10 border-2 border-accent/20 group-hover:border-accent transition-colors">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-black text-sm text-foreground leading-tight group-hover:text-accent transition-colors">{user.name}</span>
          <span className="text-[10px] text-muted-foreground">@{user.handle} · {timestamp}</span>
        </div>
      </div>
      
      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-muted-foreground hover:text-accent transition-colors p-2 rounded-full hover:bg-accent/5">
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-2xl border-white/10 bg-background/95 backdrop-blur-lg p-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem 
                  onSelect={(e) => e.preventDefault()}
                  className="flex items-center gap-2 text-red-500 focus:text-red-500 focus:bg-red-500/10 rounded-xl cursor-pointer font-bold text-xs py-2.5"
                >
                  <Trash2 size={16} />
                  Delete Post
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-white/10 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black">Delete Echo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This post will be permanently removed from your profile and the feed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onDelete}
                    className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default EchoHeader;