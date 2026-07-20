"use client";

import React from "react";
import { motion } from "framer-motion";

interface PulseCardProps {
  username: string;
  image: string;
  isUnread?: boolean;
  onClick?: () => void;
}

const PulseCard: React.FC<PulseCardProps> = ({ username, image, isUnread, onClick }) => {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 cursor-pointer group shrink-0"
    >
      <div className={`relative p-[2px] rounded-2xl ${isUnread ? "bg-gradient-to-tr from-accent to-orange-400" : "bg-gray-200 dark:bg-muted/30"}`}>
        <div className="w-20 h-28 rounded-[14px] border-2 border-white dark:border-primary overflow-hidden bg-white dark:bg-secondary shadow-sm">
          <img src={image} alt={username} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <span className="absolute bottom-2 left-2 right-2 text-[10px] font-black text-white truncate">
            {username === "Your Story" ? "You" : username}
          </span>
        </div>
        {isUnread && username === "Your Story" && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-accent rounded-full border-2 border-white dark:border-primary flex items-center justify-center shadow-lg">
            <span className="text-xs text-white font-black">+</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PulseCard;