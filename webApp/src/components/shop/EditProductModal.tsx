"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, Calendar, Loader2, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface EditProductModalProps {
  product: any;
  onSuccess: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: product.name || "",
    description: product.description || "",
    current_price: product.current_price || "",
    deadline: product.deadline ? new Date(product.deadline).toISOString().split('T')[0] : ""
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name,
          description: formData.description,
          current_price: parseFloat(formData.current_price),
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
        })
        .eq('id', product.id);

      if (error) throw error;

      toast.success("Product updated successfully!");
      setIsOpen(false);
      onSuccess();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-accent transition-colors">
          <Edit2 size={16} />
        </button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-[#0B1120] border-none rounded-[2.5rem] max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Edit Product</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Product Name</Label>
            <Input 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Price</Label>
            <Input 
              type="number"
              value={formData.current_price}
              onChange={(e) => setFormData({...formData, current_price: e.target.value})}
              className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Offer Deadline</Label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                className="pl-12 rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Description</Label>
            <Textarea 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none min-h-[100px] font-medium resize-none"
            />
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20"
          >
            {isSaving ? <Loader2 className="animate-spin" /> : <Save className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;