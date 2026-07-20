"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Image as ImageIcon, Video, X, Link as LinkIcon, MapPin } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import MediaStudio from "../media/MediaStudio";
import { uploadMedia } from "@/utils/upload";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Korea, North", "Korea, South", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

interface UploadEchoModalProps {
  trigger?: React.ReactNode;
}

const UploadEchoModal: React.FC<UploadEchoModalProps> = ({ trigger }) => {
  const [files, setFiles] = useState<{ url: string, type: 'image' | 'video', blob?: Blob }[]>([]);
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setRawFiles(selectedFiles);
      setIsStudioOpen(true);
    }
  };

  const handleStudioComplete = (results: { blob: Blob; type: "image" | "video" }[]) => {
    const processedFiles = results.map(res => ({
      url: URL.createObjectURL(res.blob),
      type: res.type,
      blob: res.blob
    }));
    
    setFiles(prev => {
      const combined = [...prev, ...processedFiles];
      const result: { url: string, type: 'image' | 'video', blob?: Blob }[] = [];
      let imageCount = 0;
      
      for (const f of combined) {
        if (f.type === 'image') {
          if (imageCount < 3) {
            result.push(f);
            imageCount++;
          }
        } else {
          result.push(f);
        }
      }
      return result;
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const { user } = useUser();
  const [isPosting, setIsPosting] = useState(false);

  const handlePost = async () => {
    if (!user) {
      toast.error("You must be logged in to post.");
      return;
    }
    if (!caption && files.length === 0 && !linkUrl) {
      toast.error("Please add a caption, media, or a link.");
      return;
    }

    setIsPosting(true);
    try {
      const uploadPromises = files.map(async (file) => {
        let finalUrl = file.url;
        if (file.blob) {
          finalUrl = await uploadMedia(file.blob, 'posts', user.id);
        }
        return { url: finalUrl, type: file.type };
      });

      const uploadedMedia = await Promise.all(uploadPromises);
      const location = [city, country].filter(Boolean).join(', ') || null;
      
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: caption,
          media_urls: uploadedMedia.length > 0 ? uploadedMedia : null,
          link_url: linkUrl || null,
          location: location,
        });

      if (error) throw error;

      showSuccess("Echo posted successfully!");
      setFiles([]);
      setCaption("");
      setLinkUrl("");
      setCountry("");
      setCity("");
      window.location.reload();
    } catch (error) {
      console.error("Error posting echo:", error);
      toast.error("Failed to post Echo. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-accent hover:bg-accent/90 shadow-xl z-40">
              <Plus size={28} className="text-white" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="bg-white dark:bg-[#0B1120] border-gray-200 dark:border-white/10 rounded-[2.5rem] max-w-md p-0 overflow-hidden text-[#0B1120] dark:text-white">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-black text-accent dark:text-white">Create Echo</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <label className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <ImageIcon size={32} className="text-gray-400 dark:text-white/40 group-hover:text-accent transition-colors mb-2" />
                  <span className="text-xs font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Add Photos</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" multiple />
                </label>
                <label className="aspect-square rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                  <Video size={32} className="text-gray-400 dark:text-white/40 group-hover:text-accent transition-colors mb-2" />
                  <span className="text-xs font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest">Add Video</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="video/*" />
                </label>
              </div>

              {files.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative w-28 h-28 shrink-0 rounded-3xl overflow-hidden border-2 border-white/10 shadow-lg group">
                      {file.type === 'image' ? (
                        <img src={file.url} className="w-full h-full object-cover" />
                      ) : (
                        <video src={file.url} className="w-full h-full object-cover" />
                      )}
                      <button 
                        onClick={() => removeFile(idx)}
                        className="absolute top-2 right-2 bg-black/50 rounded-xl p-1.5 hover:bg-red-500 transition-colors backdrop-blur-sm"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Caption</Label>
                <Textarea 
                  placeholder="What's happening?" 
                  className="rounded-2xl bg-gray-50 dark:bg-[#111827] border-gray-100 dark:border-white/5 text-[#0B1120] dark:text-white min-h-[100px] focus-visible:ring-accent font-medium"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="rounded-2xl bg-gray-50 dark:bg-[#111827] border-gray-100 dark:border-white/5 text-[#0B1120] dark:text-white h-12 focus:ring-accent">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] rounded-2xl">
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">City</Label>
                  <div className="relative">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input 
                      placeholder="Enter City" 
                      className="pl-11 rounded-2xl bg-gray-50 dark:bg-[#111827] border-gray-100 dark:border-white/5 text-[#0B1120] dark:text-white h-12 focus-visible:ring-accent font-medium"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Web Link</Label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="https://..." 
                    className="pl-11 rounded-2xl bg-gray-50 dark:bg-[#111827] border-gray-100 dark:border-white/5 text-[#0B1120] dark:text-white h-12 focus-visible:ring-accent font-medium"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button 
              onClick={handlePost}
              disabled={isPosting || (!caption && files.length === 0 && !linkUrl)}
              className="w-full h-14 rounded-2xl bg-accent hover:bg-accent/90 text-white font-black text-lg shadow-xl shadow-accent/20"
            >
              {isPosting ? "Posting..." : "Post Echo"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <MediaStudio 
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        files={rawFiles}
        onComplete={handleStudioComplete}
        maxImages={3}
        aspectRatio={4/5}
      />
    </>
  );
};

export default UploadEchoModal;