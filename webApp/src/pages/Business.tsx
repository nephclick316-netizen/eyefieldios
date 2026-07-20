"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COUNTRIES = [
  "Uganda (+256)", "Kenya (+254)", "Tanzania (+255)", 
  "Rwanda (+250)", "USA (+1)", "UK (+44)", 
  "Germany (+49)", "France (+33)"
];

const GOALS = [
  "Getting more clients", 
  "Get more visible on social media", 
  "Company Branding", 
  "Custom Goal"
];

const Business = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("company");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    businessName: "",
    email: "",
    phoneNumber: "",
    country: "",
    goal: "",
    customGoal: ""
  });

  const handleCountryChange = (value: string) => {
    const code = value.substring(value.indexOf("(") + 1, value.indexOf(")"));
    setFormData(prev => ({ ...prev, country: value, phoneNumber: `${code} ` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please log in to submit this form.");

      const isCompany = selectedTab === "company";
      
      if (isCompany) {
        const description = formData.goal === "Custom Goal" ? formData.customGoal : formData.goal;
        const { error } = await supabase.from('kope_companies').insert({
          user_id: user.id,
          company_name: formData.businessName,
          country: formData.country,
          description: description
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('kope_individuals').insert({
          user_id: user.id,
          full_name: formData.businessName,
          country: formData.country,
          description: formData.customGoal
        });
        if (error) throw error;
      }

      toast.success("Request submitted successfully!");
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="pb-20 max-w-2xl mx-auto space-y-6">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-black">KOPE</h1>
        </header>

        {/* Hero Section */}
        <div className="relative h-48 md:h-64 rounded-[2rem] overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&q=80" 
            alt="Marketing Hero" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white">
            <h2 className="text-4xl font-black mb-2">KOPE</h2>
            <p className="text-sm md:text-base max-w-md">
              Driving growth through data-driven strategies and creative storytelling
            </p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-secondary/20 p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-xl mb-6">
              <TabsTrigger value="company" className="rounded-lg font-bold">Company</TabsTrigger>
              <TabsTrigger value="individual" className="rounded-lg font-bold">Individual</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{selectedTab === "company" ? "Company Name" : "Your Name"}</Label>
                <Input 
                  required
                  value={formData.businessName}
                  onChange={e => setFormData({...formData, businessName: e.target.value})}
                  className="rounded-xl bg-secondary/30"
                />
              </div>

              {selectedTab === "company" && (
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Select value={formData.country} onValueChange={handleCountryChange}>
                    <SelectTrigger className="rounded-xl bg-secondary/30">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input 
                  required
                  value={formData.phoneNumber}
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})}
                  className="rounded-xl bg-secondary/30"
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  required
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="rounded-xl bg-secondary/30"
                />
              </div>

              {selectedTab === "company" ? (
                <>
                  <div className="space-y-2">
                    <Label>Campaign Goal</Label>
                    <Select value={formData.goal} onValueChange={v => setFormData({...formData, goal: v})}>
                      <SelectTrigger className="rounded-xl bg-secondary/30">
                        <SelectValue placeholder="Select Goal" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {GOALS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.goal === "Custom Goal" && (
                    <div className="space-y-2">
                      <Label>Describe your custom goal (Max 150 chars)</Label>
                      <Textarea 
                        required
                        maxLength={150}
                        value={formData.customGoal}
                        onChange={e => setFormData({...formData, customGoal: e.target.value})}
                        className="rounded-xl bg-secondary/30 min-h-[100px]"
                      />
                      <p className="text-xs text-right text-muted-foreground">{formData.customGoal.length}/150</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <Label>What is the goal of your campaign?</Label>
                  <Textarea 
                    required
                    value={formData.customGoal}
                    onChange={e => setFormData({...formData, customGoal: e.target.value})}
                    className="rounded-xl bg-secondary/30 min-h-[120px]"
                  />
                </div>
              )}

              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full rounded-2xl h-12 bg-[#FF9800] hover:bg-[#F57C00] text-white font-black"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
};

export default Business;
