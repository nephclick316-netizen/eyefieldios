"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/context/UserContext";
import { Camera, User, ArrowRight, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MediaStudio from "@/components/media/MediaStudio";
import { uploadMedia } from "@/utils/upload";

const COUNTRIES = [
  { name: "United States", code: "+1", flag: "????", placeholder: "555 123 4567" },
  { name: "United Kingdom", code: "+44", flag: "????", placeholder: "7123 456789" },
  { name: "Canada", code: "+1", flag: "????", placeholder: "416 555 0123" },
  { name: "Australia", code: "+61", flag: "????", placeholder: "412 345 678" },
  { name: "DR Congo", code: "+243", flag: "????", placeholder: "81 234 5678" },
  { name: "Rwanda", code: "+250", flag: "????", placeholder: "788 123 456" },
  { name: "Kenya", code: "+254", flag: "????", placeholder: "712 345 678" },
  { name: "Uganda", code: "+256", flag: "????", placeholder: "712 345 678" },
  { name: "Tanzania", code: "+255", flag: "????", placeholder: "712 345 678" },
  { name: "South Africa", code: "+27", flag: "????", placeholder: "82 123 4567" },
  { name: "Nigeria", code: "+234", flag: "????", placeholder: "803 123 4567" },
  { name: "France", code: "+33", flag: "????", placeholder: "6 12 34 56 78" },
  { name: "Germany", code: "+49", flag: "????", placeholder: "151 12345678" },
  { name: "Japan", code: "+81", flag: "????", placeholder: "090-1234-5678" },
  { name: "China", code: "+86", flag: "????", placeholder: "138 1234 5678" },
  { name: "India", code: "+91", flag: "????", placeholder: "91234 56789" }
];

const BUSINESS_CATEGORIES = [
  "Technology", "Retail", "Health", "Finance", "Food & Beverage", "Education", "Other"
];

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const { setUser, setIsOnboarded } = useUser();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    bio: "",
    dateOfBirth: "",
    avatarUrl: "",
    country: "DR Congo",
    phoneCode: "+243",
    phoneNumber: "",
    cityAddress: "",
    businessName: "",
    businessCategory: "Technology",
    customCategory: "",
    websiteUrl: "",
    businessAddress: "",
  });

  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);

  useEffect(() => {
    if (formData.fullName && step === 1 && !formData.avatarUrl.startsWith("blob:")) {
      const handle = formData.fullName.toLowerCase().replace(/\s+/g, "");
      setFormData(prev => ({
        ...prev,
        username: prev.username || handle,
        avatarUrl: prev.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${handle}`
      }));
    }
  }, [formData.fullName, step, formData.avatarUrl]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRawFiles([e.target.files[0]]);
      setIsStudioOpen(true);
    }
  };

  const handleStudioComplete = (results: { blob: Blob; type: "image" | "video" }[]) => {
    if (results.length > 0) {
      const url = URL.createObjectURL(results[0].blob);
      setFormData(prev => ({ ...prev, avatarUrl: url }));
    }
  };

  const handleCountryChange = (countryName: string) => {
    const country = COUNTRIES.find(c => c.name === countryName);
    if (country) {
      setFormData(prev => ({
        ...prev,
        country: countryName,
        phoneCode: country.code
      }));
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      let avatarUrl = formData.avatarUrl;
      if (avatarUrl.startsWith('blob:')) {
        const response = await fetch(avatarUrl);
        const blob = await response.blob();
        avatarUrl = await uploadMedia(blob, 'avatars', authUser.id);
      }

      const fullPhoneNumber = formData.phoneNumber ? `${formData.phoneCode}${formData.phoneNumber}` : null;

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: authUser.email || "",
          full_name: formData.fullName || null,
          username: formData.username || null,
          avatar_url: avatarUrl,
          date_of_birth: formData.dateOfBirth || null,
          bio: formData.bio || null,
          country: formData.country,
          phone_number: fullPhoneNumber,
          city_address: formData.cityAddress || null,
          onboarding_completed: true,
        });

      if (profileError) throw profileError;

      if (formData.businessName) {
        const finalCategory = formData.businessCategory === "Other" ? formData.customCategory : formData.businessCategory;
        const { error: businessError } = await supabase
          .from('businesses')
          .upsert({
            user_id: authUser.id,
            business_name: formData.businessName,
            category: finalCategory,
            website_url: formData.websiteUrl || null,
            business_address: formData.businessAddress || null,
          });
        if (businessError) throw businessError;
      }

      setIsOnboarded(true);
      navigate("/");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(`Failed to save profile: ${error.message || error.details || JSON.stringify(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const selectedCountry = COUNTRIES.find(c => c.name === formData.country) || COUNTRIES[0];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10 space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tighter">Setup Profile</h1>
          <p className="text-muted-foreground font-medium">Step {step} of 3: {
            step === 1 ? "Personal Details" : 
            step === 2 ? "Location & Contact" : "Business Details"
          }</p>
        </div>

        <div className="bg-white dark:bg-secondary/30 backdrop-blur-xl p-8 rounded-[3rem] border border-gray-100 dark:border-white/5 shadow-2xl">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="relative group">
                    <Avatar className="w-24 h-24 border-4 border-accent/20 shadow-xl">
                      <AvatarImage src={formData.avatarUrl} />
                      <AvatarFallback className="bg-accent/10 text-accent text-2xl font-black">
                        {formData.fullName ? formData.fullName[0] : <User />}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
                      <Camera size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarSelect} />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Full Name</Label>
                    <Input 
                      placeholder="Enter your name" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Username</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">@</span>
                      <Input 
                        value={formData.username}
                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                        className="pl-10 h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Date of Birth</Label>
                    <Input 
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                    />
                    <p className="text-xs text-muted-foreground ml-2">You must be at least 13 years old.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Bio</Label>
                    <Textarea 
                      placeholder="Tell us about yourself..." 
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent min-h-[100px]" 
                    />
                  </div>
                </div>

                <Button onClick={nextStep} disabled={!formData.fullName} className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20 group">
                  Next
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Country</Label>
                    <Select value={formData.country} onValueChange={handleCountryChange}>
                      <SelectTrigger className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{selectedCountry.flag}</span>
                          <span className="font-bold">{selectedCountry.name}</span>
                          <span className="text-muted-foreground text-xs">({selectedCountry.code})</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl max-h-[300px]">
                        {COUNTRIES.map(c => (
                          <SelectItem key={c.name} value={c.name}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{c.flag}</span>
                              <span className="font-medium">{c.name}</span>
                              <span className="text-muted-foreground text-xs ml-auto">{c.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Phone Number</Label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                        <span className="text-muted-foreground font-bold text-sm">{selectedCountry.code}</span>
                      </div>
                      <Input 
                        type="tel"
                        placeholder={selectedCountry.placeholder} 
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                        className="pl-16 h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">City / Address (Optional)</Label>
                    <Input 
                      placeholder="Your city or address" 
                      value={formData.cityAddress}
                      onChange={(e) => setFormData({...formData, cityAddress: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={prevStep} className="h-14 rounded-2xl font-bold">Back</Button>
                  <Button onClick={nextStep} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20">Next</Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">Optional. Fill this out if you are registering as a business or creator.</p>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Business Name</Label>
                    <Input 
                      placeholder="Your company name" 
                      value={formData.businessName}
                      onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                      className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Category</Label>
                    <Select value={formData.businessCategory} onValueChange={(v) => setFormData({...formData, businessCategory: v})}>
                      <SelectTrigger className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {BUSINESS_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {formData.businessCategory === "Other" && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Custom Category</Label>
                      <Input 
                        placeholder="Enter custom category" 
                        value={formData.customCategory}
                        onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                        className="h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Website Link</Label>
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input 
                        placeholder="https://yourbusiness.com" 
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
                        className="pl-12 h-14 rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-2">Business Address</Label>
                    <Textarea 
                      placeholder="Your business address" 
                      value={formData.businessAddress}
                      onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                      className="rounded-2xl bg-gray-50 dark:bg-background/50 border-none focus-visible:ring-accent min-h-[80px]" 
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={prevStep} className="h-14 rounded-2xl font-bold">Back</Button>
                  <Button onClick={handleComplete} disabled={isLoading} className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20">
                    {isLoading ? "Saving..." : "Finish"}
                  </Button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${step === i ? "w-8 bg-accent" : "w-2 bg-gray-200 dark:bg-white/10"}`} />
          ))}
        </div>
      </motion.div>

      <MediaStudio 
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        files={rawFiles}
        onComplete={handleStudioComplete}
        maxImages={1}
        aspectRatio={1}
      />
    </div>
  );
};

export default OnboardingScreen;
