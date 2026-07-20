"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoFieldsProps {
  productName: string;
  setProductName: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
}

const BasicInfoFields: React.FC<BasicInfoFieldsProps> = ({
  productName,
  setProductName,
  description,
  setDescription
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Product Name</Label>
        <Input 
          placeholder="What are you selling?" 
          className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none h-12 font-bold"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Description</Label>
        <Textarea 
          placeholder="Tell buyers more about your item..." 
          className="rounded-2xl bg-gray-50 dark:bg-white/5 border-none min-h-[100px] font-medium resize-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
    </div>
  );
};

export default BasicInfoFields;