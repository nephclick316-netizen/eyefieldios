"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wallet, ArrowLeft, Rocket, Target, BarChart3, 
  ShieldCheck, Building2, User, Send, CheckCircle2,
  Sparkles, Zap, Globe, MessageSquare, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Kope = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [adType, setAdType] = useState("individual");

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Application sent! Our sales team will contact you shortly.");
    }, 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-12 md:space-y-16 pb-24">
        {/* Hero Section */}
        <header className="relative space-y-8">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="rounded-full bg-white dark:bg-secondary shadow-sm"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent border border-accent/20">
                <Sparkles size={16} />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">EyeField Kope</span>
              </div>
              <h1 className="text-4xl md:text-7xl font-black tracking-tighter leading-tight md:leading-none">
                Amplify Your <br />
                <span className="text-accent">Business Reach</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed max-w-lg">
                Kope is EyeField's premium advertising engine. Boost your products, verify your brand, and connect with millions of active shoppers.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="h-14 px-8 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white font-black text-lg shadow-xl shadow-blue-900/20 w-full sm:w-auto">
                  Start Advertising
                </Button>
                <Button variant="outline" className="h-14 px-8 rounded-2xl font-black text-lg border-white/10 hover:bg-white/5 w-full sm:w-auto">
                  View Case Studies
                </Button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative"
            >
              <div className="absolute inset-0 bg-accent/20 blur-[100px] rounded-full" />
              <Card className="relative bg-white/10 backdrop-blur-2xl border-white/10 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                      <TrendingUp size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Live Reach</p>
                      <p className="text-2xl font-black text-accent">1.2M+</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "75%" }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        className="h-full bg-accent"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground">75% higher conversion rate for Kope boosted items</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <BarChart3 size={20} className="text-blue-400 mb-2" />
                      <p className="text-xs font-black">Real-time Data</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                      <Target size={20} className="text-emerald-400 mb-2" />
                      <p className="text-xs font-black">Smart Targeting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </header>

        {/* Application Form & Verification */}
        <section className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Apply for Ads</h2>
              <p className="text-sm md:text-base text-muted-foreground font-medium">Tell us about your business and we'll help you set up your first campaign.</p>
            </div>

            <Card className="bg-white dark:bg-secondary/20 border-white/5 rounded-[2.5rem] md:rounded-[3rem] shadow-xl">
              <CardContent className="p-6 md:p-8">
                {submitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8 md:py-12 space-y-6"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xl md:text-2xl font-black">Application Received!</h3>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium">Our sales team will review your request and reach out within 24 hours.</p>
                    </div>
                    <Button variant="outline" onClick={() => setSubmitted(false)} className="rounded-xl font-bold">
                      Send Another Request
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleApply} className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">I am advertising as:</Label>
                      <RadioGroup 
                        defaultValue="individual" 
                        onValueChange={setAdType}
                        className="grid grid-cols-2 gap-3 md:gap-4"
                      >
                        <div>
                          <RadioGroupItem value="individual" id="individual" className="peer sr-only" />
                          <Label
                            htmlFor="individual"
                            className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-3 md:p-4 hover:bg-accent/5 hover:text-accent peer-data-[state=checked]:border-accent peer-data-[state=checked]:text-accent cursor-pointer transition-all"
                          >
                            <User className="mb-2 md:mb-3 h-5 w-5 md:h-6 md:w-6" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Individual</span>
                          </Label>
                        </div>
                        <div>
                          <RadioGroupItem value="company" id="company" className="peer sr-only" />
                          <Label
                            htmlFor="company"
                            className="flex flex-col items-center justify-between rounded-2xl border-2 border-muted bg-popover p-3 md:p-4 hover:bg-accent/5 hover:text-accent peer-data-[state=checked]:border-accent peer-data-[state=checked]:text-accent cursor-pointer transition-all"
                          >
                            <Building2 className="mb-2 md:mb-3 h-5 w-5 md:h-6 md:w-6" />
                            <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Company</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Full Name / Contact</Label>
                        <Input required placeholder="John Doe" className="h-12 rounded-xl bg-secondary/30 border-none font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Email Address</Label>
                        <Input required type="email" placeholder="john@business.com" className="h-12 rounded-xl bg-secondary/30 border-none font-bold text-sm" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Business / Product Link</Label>
                      <Input placeholder="https://eyefield.pro/your-shop" className="h-12 rounded-xl bg-secondary/30 border-none font-bold text-sm" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Campaign Goals</Label>
                      <Textarea 
                        placeholder="Tell us what you want to achieve..." 
                        className="rounded-xl bg-secondary/30 border-none min-h-[100px] font-medium resize-none text-sm"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20 gap-2"
                    >
                      {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={20} />}
                      Submit Application
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 md:space-y-8">
            <div className="space-y-2 md:space-y-4">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Get Verified</h2>
              <p className="text-sm md:text-base text-muted-foreground font-medium">Build trust with your customers by getting the EyeField Verification Badge.</p>
            </div>

            <Card className="bg-accent text-white rounded-[2.5rem] md:rounded-[3rem] shadow-2xl shadow-accent/20 overflow-hidden relative group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
              <CardContent className="p-6 md:p-10 space-y-6 md:space-y-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <ShieldCheck size={28} className="md:size-32" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black">The Blue Badge</h3>
                    <p className="text-xs md:text-sm text-white/80 font-bold">Official Business Verification</p>
                  </div>
                </div>

                <div className="space-y-3 md:space-y-4">
                  {[
                    "Increased trust and credibility",
                    "Priority in search results",
                    "Exclusive business tools",
                    "Direct support line"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 font-bold text-sm md:text-base">
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} />
                      </div>
                      <span>{text}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 md:pt-4">
                  <Button className="w-full h-14 rounded-2xl bg-white text-accent hover:bg-white/90 font-black text-base md:text-lg shadow-xl group">
                    Contact Sales for Verification
                    <MessageSquare className="ml-2 group-hover:scale-110 transition-transform" size={20} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="p-6 md:p-8 rounded-[2.5rem] bg-secondary/20 border border-white/5 space-y-4">
              <h4 className="font-black text-lg">Why Advertise on EyeField?</h4>
              <div className="grid gap-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                    <Target size={20} />
                  </div>
                  <div>
                    <p className="font-black text-sm">Hyper-Local Targeting</p>
                    <p className="text-xs text-muted-foreground font-medium">Reach customers in your specific city or neighborhood.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <p className="font-black text-sm">Performance Tracking</p>
                    <p className="text-xs text-muted-foreground font-medium">See exactly how many people viewed and clicked your ads.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
};

export default Kope;