"use client";

import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, User, Phone, Briefcase, Smile, Settings, LogOut, Tag } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import CascadeaLogo from "../CascadeaLogo";
import CascadeaLogoOrange from "../CascadeaLogoOrange";
import CascadeaRunningIcon from "../CascadeaRunningIcon";
import { supabase } from "@/integrations/supabase/client";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Sidebar = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    { path: "/", icon: CascadeaRunningIcon, label: t("nav.home") },
    { path: "/shop", icon: Tag, label: "Deals" },
    { path: "/echo", icon: Smile, label: t("nav.echo") },
    { path: "/chat", icon: MessageCircle, label: t("nav.chat") },
    { path: "/calls", icon: Phone, label: "Calls" },
    { path: "/business", icon: Briefcase, label: "Business" },
    { path: "/contacts", icon: User, label: "Contacts" },
    { path: "/profile", icon: User, label: t("nav.profile") },
    { path: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  const handleLogout = async () => {
    if (!password) {
      toast.error("Please enter your password to confirm logout.");
      return;
    }

    setIsLoggingOut(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        // If for some reason we can't get the email, just sign out
        await supabase.auth.signOut();
        toast.success("Logged out successfully.");
        setIsLogoutDialogOpen(false);
        return;
      }

      // Verify password by attempting to sign in again
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInError) {
        toast.error("Incorrect password. Logout cancelled.");
        setIsLoggingOut(false);
        return;
      }

      // If password is correct, proceed with sign out
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      toast.success("Logged out successfully.");
      setIsLogoutDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "An error occurred during logout.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 bg-background border-r border-white/5 p-6 gap-8">
        <div className="px-4 flex items-center gap-3">
          <CascadeaLogo size={32} />
          <CascadeaLogoOrange size={20} className="animate-ping" />
          <h1 className="text-2xl font-black tracking-tighter text-accent">EYEFIELD</h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isCascadea = item.path === "/";

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative ${
                  isActive 
                    ? (isCascadea ? "bg-accent text-white shadow-lg shadow-accent/20" : "bg-secondary/50 text-[#000080] dark:text-white") 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <div className="relative">
                  {isCascadea ? (
                    <item.icon size={22} isActive={isActive} />
                  ) : (
                    <item.icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2} 
                      className="text-[#000080] dark:text-white"
                    />
                  )}
                </div>
                <span className={`font-bold text-sm ${isActive && !isCascadea ? "text-[#000080] dark:text-white" : ""}`}>{item.label}</span>
                {isActive && isCascadea && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-4 pt-6 border-t border-white/5">
          <button 
            onClick={() => setIsLogoutDialogOpen(true)}
            className="flex items-center gap-4 text-red-500 hover:text-red-400 transition-colors font-bold text-sm w-full text-left"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-white/5 bg-background">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Confirm Logout</DialogTitle>
            <p className="text-sm text-muted-foreground font-medium mt-2">
              Please enter your password to confirm you want to log out of your account.
            </p>
          </DialogHeader>
          <div className="py-6">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl bg-secondary/50 border-white/5 font-bold px-6 focus-visible:ring-accent"
            />
          </div>
          <DialogFooter className="flex gap-3 sm:justify-end">
            <Button 
              variant="ghost" 
              onClick={() => {
                setIsLogoutDialogOpen(false);
                setPassword("");
              }}
              className="rounded-2xl font-bold h-12 px-6"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black px-8 h-12 shadow-lg shadow-red-500/20"
            >
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;
