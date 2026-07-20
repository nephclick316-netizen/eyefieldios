"use client";

import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, User, Phone, Briefcase, Smile } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import CascadeaRunningIcon from "../CascadeaRunningIcon";

const BottomNav = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { path: "/echo", icon: Smile, label: t("nav.echo") },
    { path: "/chat", icon: MessageCircle, label: t("nav.chat") },
    { path: "/", icon: CascadeaRunningIcon, label: t("nav.home") },
    { path: "/calls", icon: Phone, label: "Calls" },
    { path: "/business", icon: Briefcase, label: "Business" },
    { path: "/profile", icon: User, label: t("nav.profile") },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-white/10 px-4 pb-safe pt-2 z-30 md:hidden transition-transform duration-300`}>
      <div className="max-w-lg mx-auto flex justify-between items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isCascadea = item.path === "/";
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center py-2 px-3 group"
            >
              <motion.div
                whileTap={{ scale: 0.8 }}
                className={`relative z-10 transition-colors duration-300 ${
                  isActive && isCascadea ? "text-accent" : ""
                }`}
              >
                {isCascadea ? (
                  <item.icon size={24} isActive={isActive} />
                ) : (
                  <item.icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    className="text-[#000080] dark:text-white"
                  />
                )}
              </motion.div>
              
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-0 bg-accent/10 rounded-2xl -z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              
              <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${
                isActive ? (isCascadea ? "text-accent" : "text-[#000080] dark:text-white") : "text-muted-foreground"
              }`}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
