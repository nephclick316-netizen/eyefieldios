"use client";

import React from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, ArrowRight, Play, Shield, Zap, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Cascadea = () => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="space-y-12 pb-20">
        {/* Hero Section */}
        <div className="relative h-[400px] rounded-[2.5rem] overflow-hidden group">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
            alt="Cascadea AI" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 backdrop-blur-md border border-accent/30 mb-4">
              <Sparkles size={14} className="text-accent" />
              <span className="text-[10px] font-black uppercase tracking-widest text-accent">Next Gen AI</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              Meet Cascadea
            </h1>
            <p className="text-gray-300 text-lg max-w-xl font-medium">
              The world's most advanced AI assistant for global commerce and creative workflows.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={() => navigate("/booking")}
            className="flex-1 h-16 rounded-2xl bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 text-[#0B1120] dark:text-white border-2 border-gray-100 dark:border-white/10 font-black text-lg gap-3 shadow-xl transition-all active:scale-95"
          >
            <Calendar size={24} className="text-accent" />
            Book
          </Button>
          <Button 
            onClick={() => navigate("/chat?bot=cascadea")}
            className="flex-[2] h-16 rounded-2xl bg-[#0B1120] hover:bg-[#1e293b] text-white font-black text-lg gap-3 shadow-xl shadow-navy-900/20 transition-all active:scale-95"
          >
            <Sparkles size={24} className="text-accent" />
            Start Creating
            <ArrowRight size={20} />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Zap className="text-yellow-400" />, title: "Instant Execution", desc: "From idea to reality in seconds with high-speed processing." },
            { icon: <Shield className="text-blue-400" />, title: "Secure & Private", desc: "Enterprise-grade security for all your sensitive data." },
            { icon: <Globe className="text-green-400" />, title: "Global Reach", desc: "Multi-language support and cross-border logistics integration." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm">
                {feature.icon}
              </div>
              <h3 className="text-xl font-black">{feature.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Video Preview */}
        <div className="rounded-[2.5rem] overflow-hidden bg-[#0B1120] p-12 text-center space-y-8 relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent rounded-full blur-[120px]" />
          </div>
          <h2 className="text-3xl font-black text-white relative z-10">See Cascadea in Action</h2>
          <div className="relative aspect-video max-w-3xl mx-auto rounded-3xl overflow-hidden group cursor-pointer z-10">
            <img 
              src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop" 
              alt="Demo" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center text-white shadow-2xl shadow-accent/40 group-hover:scale-110 transition-transform">
                <Play size={32} fill="currentColor" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Cascadea;