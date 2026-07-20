"use client";

import React from "react";

interface ReactionCluster {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface EchoReactionsProps {
  reactionClusters: ReactionCluster[];
  onReaction: (emoji: string) => void;
}

const EchoReactions: React.FC<EchoReactionsProps> = ({ reactionClusters, onReaction }) => {
  if (reactionClusters.length === 0) return null;

  return (
    <div className="flex items-center gap-1 px-1 overflow-x-auto no-scrollbar">
      {reactionClusters.map((cluster) => (
        <button
          key={cluster.emoji}
          onClick={() => onReaction(cluster.emoji)}
          className={`flex items-center justify-center w-8 h-8 rounded-full text-sm transition-all shrink-0 ${
            cluster.userReacted 
              ? "bg-accent/20 border border-accent/30" 
              : "bg-gray-100 dark:bg-white/5 border border-transparent hover:border-gray-300 dark:hover:border-white/10"
          }`}
        >
          {cluster.emoji}
        </button>
      ))}
    </div>
  );
};

export default EchoReactions;