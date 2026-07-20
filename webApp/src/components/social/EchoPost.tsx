"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

import EchoHeader from "./echo/EchoHeader";
import EchoContent from "./echo/EchoContent";
import EchoMedia from "./echo/EchoMedia";
import EchoReactions from "./echo/EchoReactions";
import EchoComments from "./echo/EchoComments";
import EchoActions from "./echo/EchoActions";

interface ReactionCluster {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface EchoPostProps {
  id: string;
  ownerId?: string;
  user: {
    name: string;
    handle: string;
    avatar: string;
  };
  content: string;
  images?: string[];
  linkUrl?: string;
  timestamp: string;
  likes: number;
  echoes: number;
  replies: number;
  links?: { type: 'product' | 'external', url: string, label: string }[];
  onDelete?: () => void;
}

const EchoPost: React.FC<EchoPostProps> = ({ id, ownerId, user, content, images = [], linkUrl, timestamp, likes: initialLikes, echoes: initialEchoes, replies: initialReplies, links, onDelete }) => {
  const { user: currentUser } = useUser();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [replies, setReplies] = useState(initialReplies);
  const [echoes, setEchoes] = useState(initialEchoes);
  const [reactionClusters, setReactionClusters] = useState<ReactionCluster[]>([]);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  const totalReactions = reactionClusters.reduce((acc, cluster) => acc + cluster.count, 0);

  const fetchReactions = async () => {
    if (!id) return;
    const { data: reactions } = await supabase.from('post_emojis').select('emoji, user_id').eq('post_id', id);
    const clusters: Record<string, { count: number, userReacted: boolean }> = {};
    reactions?.forEach(r => {
      if (!clusters[r.emoji]) clusters[r.emoji] = { count: 0, userReacted: false };
      clusters[r.emoji].count += 1;
      if (currentUser && r.user_id === currentUser.id) clusters[r.emoji].userReacted = true;
    });
    setReactionClusters(Object.entries(clusters).map(([emoji, data]) => ({ emoji, ...data })));
  };

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const { data, count } = await supabase
        .from('post_comments')
        .select('id, text, created_at, user_id, profiles(full_name, username, avatar_url)', { count: 'exact' })
        .eq('post_id', id)
        .order('created_at', { ascending: false });

      const formattedComments = (data || []).map((c: any) => ({
        id: c.id,
        content: c.text,
        created_at: c.created_at,
        user_id: c.user_id,
        profiles: {
          name: c.profiles?.full_name || "User",
          handle: c.profiles?.username || "user",
          avatar_url: c.profiles?.avatar_url || ""
        }
      }));

      setComments(formattedComments);
      if (count !== null) setReplies(count);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      if (currentUser) {
        const { data: likeData } = await supabase.from('post_applause').select('id').eq('post_id', id).eq('user_id', currentUser.id).single();
        setIsLiked(!!likeData);
      }
      const { count: likesCount } = await supabase.from('post_applause').select('*', { count: 'exact', head: true }).eq('post_id', id);
      if (likesCount !== null) setLikes(likesCount);
      await fetchReactions();
      await fetchComments();
    };
    fetchData();
  }, [id, currentUser]);

  const handleLike = async () => {
    if (!currentUser) return toast.error("Please login to applaud");
    try {
      if (isLiked) {
        await supabase.from('post_applause').delete().eq('post_id', id).eq('user_id', currentUser.id);
        setLikes(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        await supabase.from('post_applause').insert({ post_id: id, user_id: currentUser.id });
        setLikes(prev => prev + 1);
        setIsLiked(true);
      }
    } catch { toast.error("Action failed"); }
  };

  const handleReaction = async (emoji: string) => {
    if (!currentUser) return toast.error("Please login to react");
    try {
      const { data: existing } = await supabase.from('post_emojis').select('id').match({ post_id: id, user_id: currentUser.id, emoji }).single();
      if (existing) await supabase.from('post_emojis').delete().eq('id', existing.id);
      else await supabase.from('post_emojis').insert({ post_id: id, user_id: currentUser.id, emoji });
      await fetchReactions();
    } catch { toast.error("Failed to react"); }
  };

  const handleComment = async () => {
    if (!currentUser || !comment.trim()) return;
    setIsCommenting(true);
    try {
      const { error } = await supabase.from('post_comments').insert({ post_id: id, user_id: currentUser.id, text: comment });
      if (!error) { setComment(""); await fetchComments(); toast.success("Comment posted!"); }
    } finally { setIsCommenting(false); }
  };

  const handleEcho = async () => {
    if (!currentUser) return toast.error("Please login to echo");
    try {
      const { data: post } = await supabase.from('posts').select('echoes_count').eq('id', id).single();
      await supabase.from('posts').update({ echoes_count: (post?.echoes_count || 0) + 1 }).eq('id', id);
      setEchoes(prev => prev + 1);
      toast.success("Echoed to your followers!");
    } catch { toast.error("Failed to echo"); }
  };

  const handleShareExternal = async () => {
    const url = window.location.origin + `/post/${id}`;
    if (navigator.share) {
      try { await navigator.share({ title: `Post by ${user.name}`, text: content, url }); }
      catch (err) { if ((err as Error).name !== 'AbortError') toast.error("Sharing failed"); }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (!currentUser || !id) return;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)
        .eq('user_id', currentUser.id);

      if (error) throw error;
      
      toast.success("Echo deleted");
      if (onDelete) onDelete();
    } catch (error) {
      toast.error("Failed to delete Echo");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-secondary/20 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all group overflow-hidden"
    >
      <div className="p-5 space-y-4">
        <EchoHeader 
          user={user} 
          timestamp={timestamp} 
          isOwner={currentUser?.id === ownerId} 
          onDelete={handleDelete} 
        />
        <EchoContent content={content} linkUrl={linkUrl} links={links} />
      </div>

      <EchoMedia images={images} />

      <div className="p-5 pt-2 space-y-4">
        <EchoReactions reactionClusters={reactionClusters} onReaction={handleReaction} />
        
        <EchoActions 
          isLiked={isLiked} 
          likesCount={likes} 
          totalReactions={totalReactions}
          onLike={handleLike}
          onReaction={handleReaction}
          onEcho={handleEcho}
          onShareExternal={handleShareExternal}
        >
          <EchoComments 
            repliesCount={replies}
            comments={comments}
            isLoading={isLoadingComments}
            isCommenting={isCommenting}
            commentValue={comment}
            onCommentChange={setComment}
            onCommentSubmit={handleComment}
            onDialogOpen={(open) => open && fetchComments()}
            currentUser={currentUser}
          />
        </EchoActions>
      </div>
    </motion.div>
  );
};

export default EchoPost;
