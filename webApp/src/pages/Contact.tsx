"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Mail, MessageSquare, Send, UserPlus, Search, 
  MapPin, Phone, Globe, Loader2, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

const Contact = () => {
  const { user: currentUser } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    subject: "",
    message: ""
  });

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, bio')
        .neq('id', currentUser?.id || '')
        .limit(4);

      if (error) throw error;
      
      const mappedData = (data || []).map((u: any) => ({
        id: u.id,
        name: u.full_name || u.username || "User",
        handle: u.username || "",
        avatar_url: u.avatar_url,
        bio: u.bio
      }));
      
      setSuggestedUsers(mappedData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // In a real app, you'd have a contact_submissions table
      // For now, we'll simulate the success and show a toast
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      setSubmitted(true);
      setFormData({ ...formData, subject: "", message: "" });
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollow = async (userId: string) => {
    if (!currentUser) {
      toast.error("Please login to follow users");
      return;
    }

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: currentUser.id, following_id: userId });

      if (error) throw error;
      toast.success("Following!");
    } catch (error) {
      toast.error("Already following or action failed");
    }
  };

  return (
    <div className="space-y-12 pb-12">
      {/* Header Section */}
      <section className="text-center space-y-4">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black tracking-tight"
        >
          Get in <span className="text-accent">Touch</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground max-w-2xl mx-auto text-lg"
        >
          Have questions about Echo? Want to partner with us? Or just want to say hi? 
          We're here to listen and help you amplify your voice.
        </motion.p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <Card className="border-none shadow-xl bg-white dark:bg-secondary/20 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-8 md:p-12">
              {submitted ? (
                <div className="text-center py-12 space-y-6">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="text-green-500" size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black">Message Received!</h2>
                    <p className="text-muted-foreground">
                      Thank you for reaching out. Our team will review your message and respond within 24-48 hours.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => setSubmitted(false)}
                    className="rounded-2xl px-8"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-black px-1">Your Name</label>
                      <Input 
                        required
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black px-1">Email Address</label>
                      <Input 
                        required
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black px-1">Subject</label>
                    <Input 
                      required
                      placeholder="How can we help?"
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      className="h-14 rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black px-1">Message</label>
                    <Textarea 
                      required
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      className="rounded-2xl bg-secondary/30 border-none focus-visible:ring-accent resize-none"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full h-14 rounded-2xl bg-accent text-white font-black text-lg gap-2 hover:scale-[1.02] transition-transform"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                    Send Message
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar Info & Discovery */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-8"
        >
          {/* Contact Info */}
          <Card className="border-none shadow-lg bg-accent text-white rounded-[2.5rem]">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xl font-black">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Email Us</p>
                    <p className="font-bold">support@echo.social</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Call Us</p>
                    <p className="font-bold">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] opacity-70 font-bold uppercase tracking-wider">Location</p>
                    <p className="font-bold">San Francisco, CA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Discovery */}
          <div className="space-y-4">
            <h3 className="text-xl font-black px-2">Find People</h3>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="Search handles..." 
                className="pl-12 h-12 rounded-2xl bg-secondary/30 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              {isLoadingUsers ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="animate-spin text-accent" />
                </div>
              ) : (
                suggestedUsers
                  .filter(u => u.handle.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-secondary/10 border border-gray-100 dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.avatar_url} />
                          <AvatarFallback>{u.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-black leading-tight">{u.name}</span>
                          <span className="text-[10px] text-muted-foreground">@{u.handle}</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleFollow(u.id)}
                        className="rounded-xl hover:bg-accent hover:text-white transition-colors"
                      >
                        <UserPlus size={16} />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
