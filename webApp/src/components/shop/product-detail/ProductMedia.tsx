"use client";

import React from "react";
import { Play } from "lucide-react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ProductMediaProps {
  images: string[];
  videoUrl?: string;
  title: string;
}

const ProductMedia: React.FC<ProductMediaProps> = ({ images, videoUrl, title }) => {
  return (
    <div className="relative -mx-4 px-4">
      <Carousel className="w-full max-w-xl mx-auto">
        <CarouselContent>
          {images.map((img, index) => (
            <CarouselItem key={index}>
              <div className="aspect-square overflow-hidden bg-gray-50 dark:bg-secondary/20 rounded-3xl border border-gray-100 dark:border-white/5">
                <img 
                  src={img || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"} 
                  alt={`${title} - ${index + 1}`} 
                  className="w-full h-full object-contain" 
                />
              </div>
            </CarouselItem>
          ))}
          {videoUrl && (
            <CarouselItem>
              <div className="aspect-square overflow-hidden bg-black rounded-3xl relative group">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                  poster={images[0]}
                />
                {!videoUrl.includes('blob') && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity">
                    <div className="w-16 h-16 bg-accent/80 rounded-full flex items-center justify-center text-white shadow-xl">
                      <Play size={32} fill="currentColor" />
                    </div>
                  </div>
                )}
              </div>
            </CarouselItem>
          )}
        </CarouselContent>
        {(images.length > 1 || videoUrl) && (
          <>
            <CarouselPrevious className="left-6 bg-white/80 dark:bg-black/50 backdrop-blur-sm border-none" />
            <CarouselNext className="right-6 bg-white/80 dark:bg-black/50 backdrop-blur-sm border-none" />
          </>
        )}
      </Carousel>
    </div>
  );
};

export default ProductMedia;