"use client";

import React from "react";
import { motion } from "framer-motion";

interface CascadeaLogoOrangeProps {
  size?: number;
  className?: string;
}

// An orange variant of Cascadea logo with continuous subtle animation
const CascadeaLogoOrange: React.FC<CascadeaLogoOrangeProps> = ({ size = 40, className = "" }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* Orange animated speed lines */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.line
              key={i}
              x1="5" y1={35 + i * 15} x2="25" y2={35 + i * 15}
              stroke="#F59E0B" strokeWidth={4} strokeLinecap="round"
              animate={{ x: [-20, 40] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2, ease: "linear" }}
            />
          ))}
        </motion.g>

        {/* Runner body - orange palette */}
        <motion.g
          animate={{ y: [0, -3, 0], rotate: [0, 1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="70" cy="25" r="8" stroke="#F59E0B" strokeWidth="4" fill="#F59E0B" />
          <motion.path
            d="M70 33 C70 33, 55 35, 45 45 C35 55, 30 65, 30 75 M45 45 L65 60 L65 85 M45 45 L35 35 L55 25 M65 60 L85 65"
            stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none"
          />
          <path d="M70 35 Q55 35 45 45 Q35 55 30 75 L40 75 Q40 60 50 50 Q60 40 70 40 Z" fill="#F59E0B" />
        </motion.g>
      </svg>
    </div>
  );
};

export default CascadeaLogoOrange;
