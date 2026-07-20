"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save, Globe } from "lucide-react";

interface ProfileEditFormProps {
  editData: any;
  setEditData: (data: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  countries: any[];
  businessCategories: string[];
}

const ProfileEditForm: React.FC<ProfileEditFormProps> = ({
  editData,
  setEditData,
  onSave,
  onCancel,
  isSaving,
  countries,
  businessCategories
}) => {
  return (
    <div className="space-y-8 bg-secondary/20 p-6 rounded-[2.5rem] border border-white/5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">Edit Profile</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}><X /></Button>
      </div>
      <div className="grid gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Full Name</Label>
            <Input value={editData.name} onChange={(e) => setEditData({...editData, name: e.target.value})} className="rounded-xl bg-background/50 border-none h-12" />
          </div>
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Country</Label>
            <Select value={editData.country} onValueChange={(v) => setEditData({...editData, country: v})}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-none">
                <SelectValue placeholder="Select Country" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {countries.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Phone Number</Label>
            <Input value={editData.phone} onChange={(e) => setEditData({...editData, phone: e.target.value})} className="rounded-xl bg-background/50 border-none h-12" />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Business Category</Label>
            <Select value={editData.businessCategory} onValueChange={(v) => setEditData({...editData, businessCategory: v})}>
              <SelectTrigger className="h-12 rounded-xl bg-background/50 border-none">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {businessCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Website Link</Label>
            <div className="relative">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input 
                placeholder="https://yourwebsite.com" 
                value={editData.website}
                onChange={(e) => setEditData({...editData, website: e.target.value})}
                className="pl-12 h-12 rounded-xl bg-background/50 border-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Business Address</Label>
            <Input 
              value={editData.businessAddress} 
              onChange={(e) => setEditData({...editData, businessAddress: e.target.value})} 
              className="rounded-xl bg-background/50 border-none h-12" 
              placeholder="Enter business address"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Full Address</Label>
            <Input 
              value={editData.fullAddress} 
              onChange={(e) => setEditData({...editData, fullAddress: e.target.value})} 
              className="rounded-xl bg-background/50 border-none h-12" 
              placeholder="Enter full address"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest ml-2">Bio</Label>
            <Textarea value={editData.bio} onChange={(e) => setEditData({...editData, bio: e.target.value})} className="rounded-xl bg-background/50 border-none min-h-[100px]" />
          </div>
        </div>
        <Button 
          onClick={onSave} 
          disabled={isSaving} 
          className="w-full h-14 rounded-2xl bg-[#000080] hover:bg-[#000066] text-white font-black gap-2 shadow-xl shadow-blue-900/20"
        >
          <Save size={20} /> {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default ProfileEditForm;