"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Zap, ShieldCheck, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface UpgradePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradePopup: React.FC<UpgradePopupProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0B1120] rounded-[3rem] overflow-hidden shadow-2xl border border-white/10"
          >
            {/* Decorative Header with Image */}
            <div className="h-40 bg-gradient-to-br from-accent via-orange-500 to-indigo-600 relative flex items-center justify-center">
              <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="relative z-10"
              >
                <div className="w-24 h-24 bg-white rounded-[2rem] p-1 shadow-2xl border-4 border-white/20 overflow-hidden">
                  <img 
                    src="/src/assets/ai-robot.png" 
                    alt="Endocard AI" 
                    className="w-full h-full object-cover rounded-[1.8rem]"
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg border border-white/10">
                  <Sparkles className="text-accent" size={16} />
                </div>
              </motion.div>
            </div>

            <div className="p-8 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black tracking-tight">Supercharge Endocard</h2>
                <p className="text-muted-foreground text-sm font-medium">
                  Unlock advanced AI features, automation agents, and priority discovery to elevate your experience.
                </p>
              </div>

              <div className="grid gap-3">
                {[
                  { icon: Zap, text: "Faster AI Response Times", color: "text-yellow-500" },
                  { icon: ShieldCheck, text: "Verified Account Badge", color: "text-blue-500" },
                  { icon: Rocket, text: "App Automation Agents", color: "text-purple-500" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/30 border border-white/5">
                    <item.icon size={18} className={item.color} />
                    <span className="text-xs font-bold">{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  onClick={() => navigate("/pricing")}
                  className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20 gap-2 group"
                >
                  View Pricing Plans
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={onClose}
                  className="w-full h-12 rounded-2xl font-bold text-muted-foreground hover:text-foreground"
                >
                  Continue with Starter
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpgradePopup;