"use client";

import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Info, AlertCircle, User } from 'lucide-react';
import { useUser } from '@/context/UserContext';

interface BeautifulToastProps {
  title: string;
  message: string;
  icon: React.ElementType;
  color: string;
}

const BeautifulToastContent: React.FC<BeautifulToastProps> = ({ title, message, icon: Icon, color }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.8, y: 20, filter: "blur(10px)" }}
    animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
    transition={{ type: "spring", stiffness: 300, damping: 25 }}
    className="flex items-center gap-4 p-4 bg-white/80 dark:bg-[#0B1120]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/20 dark:border-white/10 min-w-[320px] pointer-events-auto"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} shadow-lg shadow-inherit/20 shrink-0`}>
      <Icon size={24} className="text-white" />
    </div>
    <div className="flex flex-col min-w-0">
      <span className="text-sm font-black text-foreground tracking-tight">{title}</span>
      <span className="text-xs text-muted-foreground font-bold line-clamp-2 leading-tight">{message}</span>
    </div>
    <div className="ml-auto pl-2">
      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
    </div>
  </motion.div>
);

/**
 * Triggers a beautiful animated toast
 */
export const showBeautifulToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
  const config = {
    success: { icon: CheckCircle2, color: 'bg-emerald-500' },
    info: { icon: Sparkles, color: 'bg-accent' },
    error: { icon: AlertCircle, color: 'bg-red-500' }
  };
  
  const { icon, color } = config[type];

  toast.custom((t) => (
    <BeautifulToastContent 
      title={title} 
      message={message} 
      icon={icon} 
      color={color} 
    />
  ), { duration: 3000 });
};

/**
 * Component that handles the 'Welcome Back' logic automatically
 */
const WelcomeToast = () => {
  const { user } = useUser();

  useEffect(() => {
    if (user?.name) {
      // Use sessionStorage to only show it once per browser session
      const hasToasted = sessionStorage.getItem('welcome-toasted');
      if (!hasToasted) {
        // Small delay to ensure the app is fully rendered
        const timer = setTimeout(() => {
          showBeautifulToast(
            "Welcome Back!", 
            `It's great to see you again, ${user.name.split(' ')[0]}!`, 
            'info'
          );
          sessionStorage.setItem('welcome-toasted', 'true');
        }, 1500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user?.name]);

  return null;
};

export default WelcomeToast;