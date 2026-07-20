"use client";

import React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface EchoMediaProps {
  images: string[];
}

const EchoMedia: React.FC<EchoMediaProps> = ({ images }) => {
  if (images.length === 0) return null;

  return (
    <div className="w-full relative group/carousel">
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((img, idx) => {
            const isVideo = img.match(/\.(mp4|webm|ogg|mov)$/i) || img.includes('video');
            return (
              <CarouselItem key={idx}>
                <div className="aspect-square sm:aspect-video overflow-hidden bg-gray-50 dark:bg-black/20">
                  {isVideo ? (
                    <video 
                      src={img} 
                      className="w-full h-full object-cover" 
                      controls 
                      playsInline
                    />
                  ) : (
                    <img 
                      src={img} 
                      alt={`Post content ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40" />
            <CarouselNext className="right-4 opacity-0 group-hover/carousel:opacity-100 transition-opacity bg-black/20 border-none text-white hover:bg-black/40" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {images.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50" />
              ))}
            </div>
          </>
        )}
      </Carousel>
    </div>
  );
};

export default EchoMedia;