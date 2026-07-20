"use client";

import React from "react";
import { MessageCircle, Loader2, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface EchoCommentsProps {
  repliesCount: number;
  comments: any[];
  isLoading: boolean;
  isCommenting: boolean;
  commentValue: string;
  onCommentChange: (val: string) => void;
  onCommentSubmit: () => void;
  onDialogOpen: (open: boolean) => void;
  currentUser: any;
}

const EchoComments: React.FC<EchoCommentsProps> = ({
  repliesCount,
  comments,
  isLoading,
  isCommenting,
  commentValue,
  onCommentChange,
  onCommentSubmit,
  onDialogOpen,
  currentUser
}) => {
  return (
    <div className="space-y-4">
      {/* Recent Comments Preview */}
      {comments.length > 0 && (
        <div className="px-1 space-y-2">
          {comments.slice(0, 2).map((c) => (
            <div key={c.id} className="flex items-start gap-2 text-xs">
              <span className="font-black whitespace-nowrap">{c.profiles?.handle}:</span>
              <span className="text-muted-foreground line-clamp-1">{c.content}</span>
            </div>
          ))}
        </div>
      )}

      <Dialog onOpenChange={onDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-accent transition-colors group/btn">
            <div className="p-2 rounded-full group-hover/btn:bg-accent/10">
              <MessageCircle size={18} />
            </div>
            <span className="text-xs font-bold">{repliesCount}</span>
          </button>
        </DialogTrigger>
        <DialogContent className="bg-background border-white/10 rounded-[2.5rem] max-w-md flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Comments</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-6 no-scrollbar">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-accent" />
              </div>
            ) : comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="flex gap-3 group/comment">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={c.profiles?.avatar_url} />
                    <AvatarFallback>{c.profiles?.name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black">{c.profiles?.name}</span>
                      <span className="text-[10px] text-muted-foreground">@{c.profiles?.handle}</span>
                    </div>
                    <p className="text-sm text-foreground/90 bg-secondary/30 p-3 rounded-2xl rounded-tl-none">
                      {c.content}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-bold">No comments yet</p>
                <p className="text-xs">Be the first to reply!</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={currentUser?.avatar} />
                <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <Input 
                  placeholder="Write your reply..." 
                  value={commentValue}
                  onChange={(e) => onCommentChange(e.target.value)}
                  className="rounded-2xl bg-secondary/50 border-none h-12"
                />
                <Button 
                  onClick={onCommentSubmit} 
                  disabled={isCommenting || !commentValue.trim()}
                  className="w-full h-12 rounded-2xl bg-accent text-white font-black gap-2"
                >
                  {isCommenting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  Post Reply
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EchoComments;