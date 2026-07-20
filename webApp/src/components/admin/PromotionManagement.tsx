"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Upload, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import MediaStudio from "@/components/media/MediaStudio";
import { uploadMedia } from "@/utils/upload";

interface PromotionManagementProps {
  promotions: any[];
  onRefresh: () => void;
  adminId: string;
}

const PromotionManagement: React.FC<PromotionManagementProps> = ({ promotions, onRefresh, adminId }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [newPromo, setNewPromo] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    color_gradient: "from-orange-600/80",
    is_active: true
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRawFiles([e.target.files[0]]);
      setIsStudioOpen(true);
    }
  };

  const handleStudioComplete = async (results: { blob: Blob; type: "image" | "video" }[]) => {
    if (results.length > 0) {
      setIsUploading(true);
      try {
        const url = await uploadMedia(results[0].blob, 'promotional_cards', adminId);
        setNewPromo(prev => ({ ...prev, image_url: url }));
        toast.success("Image uploaded!");
      } catch (error) {
        toast.error("Upload failed");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const addPromotion = async () => {
    if (!newPromo.title || !newPromo.image_url) return toast.error("Title and Image are required");
    try {
      const { error } = await supabase.from('promotional_cards').insert([newPromo]);
      if (error) throw error;
      toast.success("Promotion added");
      setNewPromo({ title: "", subtitle: "", image_url: "", color_gradient: "from-orange-600/80", is_active: true });
      onRefresh();
    } catch (error) {
      toast.error("Failed to add promotion");
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase.from('promotional_cards').delete().eq('id', id);
      if (error) throw error;
      toast.success("Promotion deleted");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete promotion");
    }
  };

  return (
    <div className="space-y-8">
      <Card className="bg-secondary/20 border-white/5 rounded-[2.5rem]">
        <CardHeader>
          <CardTitle className="text-xl font-black">Add New Promotion</CardTitle>
          <CardDescription>Create a banner for the home page</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input 
                placeholder="e.g. Summer Tech Sale" 
                value={newPromo.title}
                onChange={(e) => setNewPromo({...newPromo, title: e.target.value})}
                className="rounded-xl bg-background/50 border-none h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input 
                placeholder="e.g. Up to 40% Off" 
                value={newPromo.subtitle}
                onChange={(e) => setNewPromo({...newPromo, subtitle: e.target.value})}
                className="rounded-xl bg-background/50 border-none h-12"
              />
            </div>
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Image URL or upload..." 
                  value={newPromo.image_url}
                  onChange={(e) => setNewPromo({...newPromo, image_url: e.target.value})}
                  className="rounded-xl bg-background/50 border-none h-12"
                />
                <input type="file" className="hidden" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} />
                <Button variant="secondary" size="icon" className="h-12 w-12 rounded-xl shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color Gradient</Label>
              <Input 
                placeholder="from-orange-600/80" 
                value={newPromo.color_gradient}
                onChange={(e) => setNewPromo({...newPromo, color_gradient: e.target.value})}
                className="rounded-xl bg-background/50 border-none h-12"
              />
            </div>
          </div>
          <Button onClick={addPromotion} disabled={isUploading} className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20">
            <Plus size={20} className="mr-2" /> Add Promotion
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {promotions.map((p) => (
          <Card key={p.id} className="bg-secondary/20 border-white/5 rounded-[2rem] overflow-hidden group">
            <div className="relative h-40">
              <img src={p.image_url} className="w-full h-full object-cover opacity-60" alt={p.title} />
              <div className={`absolute inset-0 bg-gradient-to-r ${p.color_gradient} to-transparent opacity-60`} />
              <div className="absolute inset-0 p-6 flex flex-col justify-center">
                <h4 className="text-xl font-black text-white">{p.title}</h4>
                <p className="text-white/80 font-bold">{p.subtitle}</p>
              </div>
              <Button variant="destructive" size="icon" onClick={() => deletePromotion(p.id)} className="absolute top-4 right-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 size={18} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <MediaStudio isOpen={isStudioOpen} onClose={() => setIsStudioOpen(false)} files={rawFiles} onComplete={handleStudioComplete} maxImages={1} aspectRatio={16/9} />
    </div>
  );
};

export default PromotionManagement;
