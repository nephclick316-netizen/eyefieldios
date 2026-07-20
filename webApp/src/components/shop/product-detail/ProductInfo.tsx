"use client";

import React from "react";
import { Star, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductInfoProps {
  title: string;
  price: string;
  rating: number;
  category: string;
  isVerified?: boolean;
  onRatingClick?: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ title, price, rating, category, isVerified, onRatingClick }) => {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1">
        <h5 className="text-lg font-black leading-tight">{title}</h5>
        <div className="flex items-center gap-2">
          <div 
            className="flex items-center gap-1 text-accent cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onRatingClick}
          >
            <Star size={16} className="fill-accent" />
            <span className="font-bold text-sm">{rating || "5.0"}</span>
          </div>
          <span className="text-xs text-muted-foreground">({category})</span>
          {isVerified && (
            <Badge className="bg-accent/10 text-accent border-none text-[10px] font-black">
              <ShieldCheck size={12} className="mr-1" /> Verified
            </Badge>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="text-xl font-black text-accent">{price}</div>
        <div className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Per Piece</div>
      </div>
    </div>
  );
};

export default ProductInfo;