"use client";

import React from "react";
import { ShoppingBag, Star, Trash2, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EditProductModal from "../shop/EditProductModal";
import { formatDistanceToNow } from "date-fns";

interface Product {
  id: string;
  name: string;
  current_price: number;
  currency?: string;
  media_urls: any[];
  rating_avg: number;
  likes_count?: number;
  main_category: string;
  deadline?: string;
  description?: string;
}

interface ShopTabProps {
  products: Product[];
  isOwner: boolean;
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

const ShopTab: React.FC<ShopTabProps> = ({ products, isOwner, onDelete, onUpdate }) => {
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this product?")) return;
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Product removed");
      onDelete?.(id);
    } catch (error) {
      toast.error("Failed to remove product");
    }
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 bg-secondary/30 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-muted-foreground">
          <ShoppingBag size={32} />
        </div>
        <p className="text-muted-foreground font-medium">No products listed</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => {
        let imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";
        if (product.media_urls) {
          let media = product.media_urls;
          if (typeof media === 'string') {
            try { media = JSON.parse(media); } catch (e) {}
          }
          if (Array.isArray(media) && media.length > 0) {
            let first = media[0];
            if (typeof first === 'string') { try { first = JSON.parse(first); } catch(e){} }
            imageUrl = first?.url || first || imageUrl;
          } else if (typeof media === 'object' && media?.url) {
            imageUrl = media.url;
          } else if (typeof media === 'string') {
            imageUrl = media;
          }
        } else if ((product as any).image_url) {
          imageUrl = (product as any).image_url;
        }
        if (typeof imageUrl === 'string') {
          imageUrl = imageUrl.split(',')[0].trim().replace(/^["']|["']$/g, '');
        }

        return (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative bg-white dark:bg-secondary/20 rounded-[2rem] border border-gray-100 dark:border-white/5 overflow-hidden hover:bg-secondary/30 transition-all shadow-sm"
        >
          <div className="aspect-square overflow-hidden relative">
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            
            {product.deadline && (
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                <Clock size={12} className="text-accent" />
                <span className="text-[9px] font-black uppercase tracking-widest">
                  {new Date(product.deadline) < new Date() ? "Expired" : formatDistanceToNow(new Date(product.deadline), { addSuffix: true })}
                </span>
              </div>
            )}

            {isOwner && (
              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <EditProductModal product={product as any} onSuccess={() => onUpdate?.()} />
                <button 
                  onClick={() => handleDelete(product.id)}
                  className="p-2 bg-black/50 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h4 className="font-black text-sm truncate flex-1">{product.name}</h4>
              <span className="text-accent font-black text-sm ml-2">
                {product.currency === 'USD' ? '$' : product.currency || '$'}{product.current_price?.toLocaleString() || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {product.main_category || "General"}
              </span>
              <div className="flex items-center gap-1 text-yellow-500">
                <Star size={10} fill="currentColor" />
                <span className="text-[10px] font-black">
                  {Number(product.rating_avg || 5.0).toFixed(1)}
                  {((product as any).likes_count || (product as any).likes) > 0 && ` (${(product as any).likes_count || (product as any).likes})`}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )})}
    </div>
  );
};

export default ShopTab;