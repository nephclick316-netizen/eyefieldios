"use client";

import React, { useState, useEffect } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { 
  User, Bell, Shield, Globe, Moon, LogOut, ChevronRight, 
  HelpCircle, Smartphone, Eye, Lock, Trash2, UserX,
  Sparkles, MessageSquare, Mail, Info, CheckCircle2, XCircle
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/context/NotificationProvider";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import BlockedListDialog from "@/components/settings/BlockedListDialog";

const Settings = () => {
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isSubscribed, requestPermission } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [logoutPassword, setLogoutPassword] = useState("");
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);

  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // Handle deep linking to specific settings
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      if (tab === 'notifications' || tab === 'privacy' || tab === 'language' || tab === 'help') {
        setActiveSheet(tab);
      } else if (tab === 'blocked') {
        setActiveSheet('privacy');
      }
    }
  }, [location.search]);

  const handleLogout = async () => {
    if (!user?.email) return;
    
    setIsVerifyingPassword(true);
    
    // Verify password before logging out
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: logoutPassword,
    });

    if (signInError) {
      toast.error("Invalid password. Please try again.");
      setIsVerifyingPassword(false);
      return;
    }

    setIsLoggingOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
      setIsLoggingOut(false);
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
    setIsVerifyingPassword(false);
    setShowLogoutDialog(false);
  };

  const updatePrivacyDefault = async (field: string, value: any) => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id);
    
    if (error) toast.error("Failed to update setting");
    else {
      setUser({ ...user, [field]: value } as any);
      toast.success("Setting updated");
    }
  };

  const languages = [
    { code: "en", name: "English" },
    { code: "fr", name: "French" },
    { code: "ar", name: "Arabic" },
    { code: "es", name: "Spanish" },
    { code: "sw", name: "Swahili" },
  ];

  const faqs = [
    {
      question: "How do I post an Echo?",
      answer: "To post an Echo, go to the Echoes page and click on the '+' button at the bottom. You can add text, images, or videos to your post."
    },
    {
      question: "How do I sell an item?",
      answer: "Navigate to the Marketplace and click on 'Upload Product'. Fill in the details, add photos, and set your price. Your item will be visible to other users once published."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and secure authentication methods (like Google Sign-In) to protect your data. Check our Privacy Policy for more details."
    },
    {
      question: "How do I change my profile visibility?",
      answer: "In Settings, under 'Privacy Defaults', you can toggle your profile visibility between 'Public' and 'Private'."
    }
  ];

  const sections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", action: () => navigate("/profile?edit=true") },
        { icon: Sparkles, label: "Subscription & Pricing", action: () => navigate("/pricing"), highlight: true },
        { 
          icon: UserX, 
          label: "Account Deletion", 
          action: () => navigate("/delete-account"),
        },
        { 
          icon: Shield, 
          label: "Confidentiality", 
          action: () => setActiveSheet("privacy") 
        },
      ]
    },
    {
      title: "App Appearance",
      items: [
        { 
          icon: Globe, 
          label: "Language", 
          action: () => setActiveSheet("language"),
          value: languages.find(l => l.code === language)?.name || "English"
        },
        { 
          icon: Moon, 
          label: "Dark Mode", 
          toggle: true, 
          checked: theme === "dark",
          onToggle: toggleTheme
        },
      ]
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", action: () => setActiveSheet("help") },
        { icon: Eye, label: "Terms of Service", action: () => navigate("/terms") },
        { icon: Lock, label: "Privacy Policy", action: () => navigate("/privacy") },
      ]
    }
  ];

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-20 px-4 md:px-0">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Settings</h1>
          <p className="text-muted-foreground font-medium">Manage your account and preferences</p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="space-y-4">
              <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">
                {section.title}
              </h2>
              <div className="bg-secondary/20 rounded-[2.5rem] border border-white/5 overflow-hidden">
                {section.items.map((item, idx) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors group ${
                      idx !== section.items.length - 1 ? "border-b border-white/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        item.highlight ? "bg-accent/10 text-accent" : "bg-secondary/50 text-muted-foreground group-hover:text-foreground"
                      }`}>
                        <item.icon size={20} />
                      </div>
                      <span className={`font-bold ${item.highlight ? "text-accent" : ""}`}>{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.value && <span className="text-sm text-muted-foreground font-medium">{item.value}</span>}
                      {item.toggle ? (
                        <Switch checked={item.checked} onCheckedChange={item.onToggle} />
                      ) : (
                        <ChevronRight size={18} className="text-muted-foreground" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">
              Privacy Defaults
            </h2>
            <div className="bg-secondary/20 rounded-[2.5rem] border border-white/5 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold">Profile Visibility</p>
                  <p className="text-xs text-muted-foreground">Who can see your profile and echoes</p>
                </div>
                <Select value={user?.visibility || 'public'} onValueChange={(v) => updatePrivacyDefault('visibility', v)}>
                  <SelectTrigger className="w-32 h-10 rounded-xl bg-background/50 border-none font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold">Show Phone Number</p>
                  <p className="text-xs text-muted-foreground">Display your contact number on profile</p>
                </div>
                <Switch 
                  checked={user?.showPhone} 
                  onCheckedChange={(v) => updatePrivacyDefault('show_phone', v)} 
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-bold">Show Address</p>
                  <p className="text-xs text-muted-foreground">Display your address on profile</p>
                </div>
                <Switch 
                  checked={user?.showAddress} 
                  onCheckedChange={(v) => updatePrivacyDefault('show_address', v)} 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            <Button 
              variant="ghost" 
              className="w-full h-14 rounded-2xl text-red-500 hover:text-red-400 hover:bg-red-500/5 font-black gap-3"
              onClick={() => setShowLogoutDialog(true)}
            >
              <LogOut size={20} />
              Log Out
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-Sheets */}
      <Sheet open={activeSheet !== null} onOpenChange={(open) => !open && setActiveSheet(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l-white/5 bg-background">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-6 border-b border-white/5">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setActiveSheet(null)} className="rounded-full">
                  <ChevronRight className="rotate-180" />
                </Button>
                <SheetTitle className="text-2xl font-black">
                  {activeSheet === "notifications" && "Notifications"}
                  {activeSheet === "privacy" && "Confidentiality"}
                  {activeSheet === "language" && "Language"}
                  {activeSheet === "help" && "Help Center"}
                </SheetTitle>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6">
              {activeSheet === "notifications" && (
                <div className="space-y-8">
                  <div className="bg-secondary/20 rounded-3xl p-6 space-y-6 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold">Push Notifications</p>
                        <p className="text-xs text-muted-foreground">Receive alerts for messages and activity</p>
                      </div>
                      <Switch 
                        checked={isSubscribed} 
                        onCheckedChange={() => {
                          if (!isSubscribed) requestPermission();
                          else toast.info("Please disable notifications in your browser settings.");
                        }} 
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">Notification Types</h3>
                    <div className="bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden">
                      {["Direct Messages", "Echo Reactions", "New Followers", "Marketplace Updates"].map((type, idx, arr) => (
                        <div key={type} className={`flex items-center justify-between p-5 ${idx !== arr.length - 1 ? "border-b border-white/5" : ""}`}>
                          <span className="font-bold">{type}</span>
                          <Switch checked={isSubscribed} disabled={!isSubscribed} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSheet === "privacy" && (
                <div className="space-y-8">
                  <div className="bg-secondary/20 rounded-3xl p-6 space-y-6 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold">Two-Factor Auth</p>
                        <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Switch checked={false} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-bold">Login Alerts</p>
                        <p className="text-xs text-muted-foreground">Get notified of new logins</p>
                      </div>
                      <Switch checked={true} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">Blocked Users</h3>
                    <BlockedListDialog 
                      currentUserId={user?.id || ""}
                      trigger={
                        <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-white/10 hover:bg-white/5">
                          Manage Blocked List
                        </Button>
                      }
                    />
                  </div>
                </div>
              )}

              {activeSheet === "language" && (
                <div className="space-y-4">
                  <div className="bg-secondary/20 rounded-3xl border border-white/5 overflow-hidden">
                    {languages.map((lang, idx) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          toast.success(`Language changed to ${lang.name}`);
                        }}
                        className={`w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors ${
                          idx !== languages.length - 1 ? "border-b border-white/5" : ""
                        }`}
                      >
                        <span className={`font-bold ${language === lang.code ? "text-accent" : ""}`}>{lang.name}</span>
                        {language === lang.code && <CheckCircle2 size={20} className="text-accent" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeSheet === "help" && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">Frequently Asked Questions</h3>
                    <Accordion type="single" collapsible className="w-full space-y-3">
                      {faqs.map((faq, idx) => (
                        <AccordionItem key={idx} value={`item-${idx}`} className="border-none bg-secondary/20 rounded-2xl px-4">
                          <AccordionTrigger className="hover:no-underline font-bold text-left py-4">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground font-medium pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">Ask Endocard AI</h3>
                    <div className="bg-secondary/20 rounded-3xl p-6 border border-white/5 space-y-4">
                      <div className="flex items-center gap-3 text-accent">
                        <Sparkles size={20} />
                        <span className="font-black uppercase tracking-widest text-xs">AI Assistant</span>
                      </div>
                      <Textarea 
                        placeholder="How can I help you today?" 
                        className="min-h-[100px] bg-background/50 border-none rounded-2xl resize-none font-medium"
                      />
                      <Button className="w-full h-12 rounded-xl font-black bg-accent text-white hover:bg-accent/90">
                        Send Message
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-4">Contact Us</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-24 rounded-3xl flex-col gap-2 border-white/10 hover:bg-white/5">
                        <Mail size={24} className="text-accent" />
                        <span className="font-bold text-xs">Email Support</span>
                      </Button>
                      <Button variant="outline" className="h-24 rounded-3xl flex-col gap-2 border-white/10 hover:bg-white/5">
                        <MessageSquare size={24} className="text-accent" />
                        <span className="font-bold text-xs">Live Chat</span>
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-[425px] rounded-[2.5rem] border-white/5 bg-background p-8">
          <DialogHeader className="space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto">
              <LogOut size={32} />
            </div>
            <DialogTitle className="text-2xl font-black text-center">Confirm Logout</DialogTitle>
            <DialogDescription className="text-center font-medium text-muted-foreground">
              For your security, please enter your password to confirm logout.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-4">Password</label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={logoutPassword}
                onChange={(e) => setLogoutPassword(e.target.value)}
                className="h-14 rounded-2xl bg-secondary/20 border-none px-6 font-bold"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-3">
            <Button 
              className="w-full h-14 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-black text-lg"
              onClick={handleLogout}
              disabled={isVerifyingPassword || isLoggingOut}
            >
              {isVerifyingPassword ? "Verifying..." : isLoggingOut ? "Logging out..." : "Confirm Logout"}
            </Button>
            <Button 
              variant="ghost" 
              className="w-full h-14 rounded-2xl font-bold text-muted-foreground"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Settings;