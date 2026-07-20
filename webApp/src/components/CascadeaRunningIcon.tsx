"use client";

import React from "react";
import { motion } from "framer-motion";
import runningIcon from "@/assets/running.png";

interface CascadeaRunningIconProps {
  size?: number;
  isActive?: boolean;
  className?: string;
}

const CascadeaRunningIcon: React.FC<CascadeaRunningIconProps> = ({ 
  size = 24, 
  isActive = false,
  className = "" 
}) => {
  return (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      animate={isActive ? {
        y: [0, -2, 0],
        x: [0, 1, 0],
      } : {}}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <img 
        src={runningIcon} 
        alt="Cascadea" 
        className="w-full h-full object-contain"
        style={{ 
          filter: isActive ? "none" : "grayscale(1) opacity(0.6)" 
        }}
      />
    </motion.div>
  );
};

export default CascadeaRunningIcon;