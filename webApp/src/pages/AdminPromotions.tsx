"use client";

import React, { useState } from "react";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Tag, TrendingUp, Save, Image as ImageIcon } from "lucide-react";
import { showSuccess } from "@/utils/toast";

const AdminPromotions = () => {
  const [bestDeal, setBestDeal] = useState({
    title: "iPhone 15 Pro Max",
    discount: "20% OFF",
    image: "https://images.unsplash.com/photo-1696446701796-da61225697cc?w=1200&q=100"
  });

  const handleSave = () => {
    showSuccess("Promotions updated successfully!");
  };

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        <header>
          <h1 className="text-3xl font-black tracking-tight">Promotion Manager</h1>
          <p className="text-muted-foreground">Configure banners for the Cascadea home page</p>
        </header>

        <div className="grid gap-6">
          <Card className="bg-secondary/30 border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <Tag size={20} />
              </div>
              <CardTitle className="text-xl font-black">Best Deal Banner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Title</Label>
                <Input 
                  value={bestDeal.title} 
                  onChange={(e) => setBestDeal({...bestDeal, title: e.target.value})}
                  className="rounded-xl bg-background/50 border-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Discount Label</Label>
                <Input 
                  value={bestDeal.discount} 
                  onChange={(e) => setBestDeal({...bestDeal, discount: e.target.value})}
                  className="rounded-xl bg-background/50 border-none"
                />
              </div>
              <div className="space-y-2">
                <Label>Banner Image URL</Label>
                <div className="flex gap-2">
                  <Input 
                    value={bestDeal.image} 
                    onChange={(e) => setBestDeal({...bestDeal, image: e.target.value})}
                    className="rounded-xl bg-background/50 border-none"
                  />
                  <Button variant="secondary" size="icon" className="rounded-xl shrink-0">
                    <ImageIcon size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-white/5 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <TrendingUp size={20} />
              </div>
              <CardTitle className="text-xl font-black">Most Rated Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <p className="text-sm text-blue-500 font-medium">
                  The "Most Rated" banner is automatically calculated every 12 hours based on user reviews and engagement metrics.
                </p>
              </div>
              <div className="flex items-center justify-between p-4 bg-background/30 rounded-2xl">
                <span className="text-sm font-bold">Current Top Product:</span>
                <Badge className="bg-accent text-white border-none">Wireless Headphones</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={handleSave}
          className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20 gap-2"
        >
          <Save size={20} />
          Save All Changes
        </Button>
      </div>
    </MainLayout>
  );
};

export default AdminPromotions;