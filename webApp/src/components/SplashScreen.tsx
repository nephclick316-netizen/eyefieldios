"use client";

import React from "react";
import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

const SplashScreen = () => {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center"
    >
      <div className="relative">
        {/* Pulsing background glow */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-accent/20 blur-3xl rounded-full"
        />
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 1,
            ease: [0, 0.71, 0.2, 1.01],
            scale: {
              type: "spring",
              damping: 12,
              stiffness: 100,
              restDelta: 0.001
            }
          }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <img 
            src={logo} 
            alt="EyeField Logo" 
            className="w-32 h-32 object-contain drop-shadow-2xl"
          />
          
          <div className="flex flex-col items-center">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-4xl font-black tracking-tighter text-foreground"
            >
              Eye<span className="text-accent">Field</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-2"
            >
              The Super App for Everything
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Loading bar */}
      <div className="absolute bottom-20 w-48 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-full h-full bg-accent"
        />
      </div>
    </motion.div>
  );
};

export default SplashScreen;