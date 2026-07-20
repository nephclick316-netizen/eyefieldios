"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  price: string;
  discountPrice?: string;
  minOrder: string;
  image: string;
  rating: number;
  reviewsCount?: number;
  isVerified?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, price, discountPrice, image, rating, reviewsCount }) => {
  const navigate = useNavigate();
  
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/marketplace/${id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-sm aspect-[3/4] bg-secondary/20"
    >
      {/* Full Background Image */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
      />
      
      {/* Discount Badge */}
      {discountPrice && (
        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-tl-xl rounded-br-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
          Limited Edition
        </div>
      )}

      {/* Info Overlay Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-3 flex flex-col gap-1">
        <h3 className="font-bold text-sm line-clamp-2 text-white">
          {title}
        </h3>
        
        <span className="text-sm font-bold text-accent">
          {price}
        </span>
        
        <div className="flex items-center gap-1 text-white">
          <Star size={10} className="fill-current" />
          <span className="text-[10px] font-medium">
            {Number(rating).toFixed(1)}
            {reviewsCount !== undefined && (
              <span className="ml-1 opacity-80">({reviewsCount})</span>
            )}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;