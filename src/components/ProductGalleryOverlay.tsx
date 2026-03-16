"use client";

import React from 'react';
import { X } from 'lucide-react';
import ProductImageSlider from './ProductImageSlider';

interface ProductGalleryOverlayProps {
  images: string[];
  onClose: () => void;
  initialIndex?: number;
}

export const ProductGalleryOverlay: React.FC<ProductGalleryOverlayProps> = ({ images, onClose, initialIndex = 0 }) => {
  return (
    <div className="fixed inset-0 z-[1300] bg-black flex flex-col animate-in fade-in duration-300">
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-end pt-safe">
        <button onClick={onClose} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white">
          <X size={24} />
        </button>
      </header>

      <div className="flex-1 flex items-center justify-center">
        <ProductImageSlider 
          images={images} 
          aspectRatio="aspect-auto" // Let the image determine its aspect ratio
          showControls={true}
          className="w-full h-full"
          initialActiveIndex={initialIndex}
        />
      </div>
    </div>
  );
};