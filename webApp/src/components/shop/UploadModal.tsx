"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import MediaStudio from "../media/MediaStudio";
import { uploadMedia } from "@/utils/upload";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/context/UserContext";
import { toast } from "sonner";
import { CATEGORY_METADATA } from "@/constants/marketplace";

// Modular Components
import BasicInfoFields from "./upload/BasicInfoFields";
import CategoryFields from "./upload/CategoryFields";
import PricingFields from "./upload/PricingFields";
import MediaUploadFields from "./upload/MediaUploadFields";

const UploadModal: React.FC<{ trigger?: React.ReactNode; onSuccess?: () => void }> = ({ trigger, onSuccess }) => {
  const { user } = useUser();
  
  const [images, setImages] = useState<{ url: string; blob?: Blob }[]>([]);
  const [video, setVideo] = useState<{ url: string; blob?: Blob } | null>(null);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [condition, setCondition] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [regularPrice, setRegularPrice] = useState("");
  const [currencyCode, setCurrencyCode] = useState("USD");
  const [isLimitedEdition, setIsLimitedEdition] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [rawFiles, setRawFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user?.currency_code) setCurrencyCode(user.currency_code);
  }, [user]);

  const selectedCat = CATEGORY_METADATA.find(c => c.id === category);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRawFiles(Array.from(e.target.files));
      setIsStudioOpen(true);
    }
  };

  const handleStudioComplete = (results: { blob: Blob; type: "image" | "video" }[]) => {
    const newImages = results
      .filter(r => r.type === 'image')
      .map(r => ({ url: URL.createObjectURL(r.blob), blob: r.blob }));
    
    const videoResult = results.find(r => r.type === 'video');
    if (videoResult) {
      setVideo({ url: URL.createObjectURL(videoResult.blob), blob: videoResult.blob });
    }
      
    setImages(prev => [...prev, ...newImages].slice(0, 3));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to list products.");
      return;
    }
    if (!productName || !category || images.length === 0 || countries.length === 0) {
      toast.error("Please fill in all required fields, add an image, and select countries.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = images.map(async (img) => {
        if (img.blob) return await uploadMedia(img.blob, 'products', user.id);
        return img.url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      if (video?.blob) {
        const videoUrl = await uploadMedia(video.blob, 'products', user.id);
        uploadedUrls.push(videoUrl);
      }

      const { error } = await supabase
        .from('products')
        .insert({
          seller_id: user.id,
          name: productName,
          description: description || `${selectedCat?.label} - ${subcategory}`,
          current_price: selectedCat?.hasPrice !== false ? parseFloat(price) : 0,
          regular_price: regularPrice ? parseFloat(regularPrice) : null,
          currency: currencyCode,
          main_category: selectedCat?.label,
          sub_category: subcategory,
          available_colors: selectedColors,
          is_limited_edition: isLimitedEdition,
          deadline: isLimitedEdition && deadline ? deadline : null,
          media_urls: uploadedUrls,
        });

      if (error) throw error;

      showSuccess("Product listed successfully!");
      setImages([]);
      setVideo(null);
      setProductName("");
      setDescription("");
      setPrice("");
      setRegularPrice("");
      setCategory("");
      setSubcategory("");
      setCondition("");
      setSelectedColors([]);
      setCountries([]);
      setIsLimitedEdition(false);
      setDeadline("");
      onSuccess?.();
    } catch (error) {
      console.error("Error listing product:", error);
      toast.error("Failed to list product.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button className="fixed bottom-24 right-6 w-14 h-14 rounded-full bg-[#0B1120] hover:bg-[#1e293b] shadow-xl z-40">
              <Plus size={28} className="text-white" />
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="bg-white dark:bg-[#0B1120] border-none rounded-[2.5rem] max-w-md max-h-[90vh] overflow-y-auto no-scrollbar p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-2xl font-black text-[#0B1120] dark:text-white">List Item</DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <BasicInfoFields 
              productName={productName} setProductName={setProductName}
              description={description} setDescription={setDescription}
            />

            <CategoryFields 
              category={category} setCategory={setCategory}
              subcategory={subcategory} setSubcategory={setSubcategory}
              condition={condition} setCondition={setCondition}
              selectedColors={selectedColors} setSelectedColors={setSelectedColors}
              countries={countries} setCountries={setCountries}
            />

            <PricingFields 
              hasPrice={selectedCat?.hasPrice !== false}
              currencyCode={currencyCode} setCurrencyCode={setCurrencyCode}
              price={price} setPrice={setPrice}
              discountPrice={regularPrice} setDiscountPrice={setRegularPrice}
              isLimitedEdition={isLimitedEdition} setIsLimitedEdition={setIsLimitedEdition}
              deadline={deadline} setDeadline={setDeadline}
            />

            <MediaUploadFields 
              images={images} setImages={setImages}
              video={video} setVideo={setVideo}
              onFileUpload={handleFileUpload}
            />

            <Button 
              onClick={handleSubmit} 
              disabled={isUploading}
              className="w-full h-14 rounded-2xl bg-[#0B1120] hover:bg-[#1e293b] text-white font-black text-lg shadow-xl shadow-navy-900/20 transition-all active:scale-[0.98]"
            >
              {isUploading ? "Publishing..." : "Publish Product"}
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
        aspectRatio={1}
      />
    </>
  );
};

export default UploadModal;