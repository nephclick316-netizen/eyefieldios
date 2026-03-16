"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageSliderProps {
  images: string[] | string | undefined | null;
  aspectRatio?: string;
  showControls?: boolean;
  className?: string;
  initialActiveIndex?: number; // New prop
}

const ProductImageSlider: React.FC<ProductImageSliderProps> = ({ 
  images: imagesProp, 
  aspectRatio = "aspect-square",
  showControls = true,
  className = "",
  initialActiveIndex = 0 // Default to 0
}) => {
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ensure images is always an array
  const images = Array.isArray(imagesProp) 
    ? imagesProp 
    : (imagesProp ? [imagesProp] : []);

  // Effect to update activeIndex when initialActiveIndex changes from parent
  useEffect(() => {
    setActiveIndex(initialActiveIndex);
    scrollTo(initialActiveIndex, false); // Scroll without smooth behavior initially
  }, [initialActiveIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const width = e.currentTarget.offsetWidth;
    const scrollLeft = e.currentTarget.scrollLeft;
    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  };

  const scrollTo = (index: number, smooth: boolean = true) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.offsetWidth,
        behavior: smooth ? 'smooth' : 'auto'
      });
    }
  };

  if (images.length === 0) {
    return (
      <div className={`${aspectRatio} bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`}>
        <span className="text-slate-400 text-xs">No Image</span>
      </div>
    );
  }

  return (
    <div className={`relative group overflow-hidden ${className}`}>
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto snap-x snap-mandatory no-scrollbar ${aspectRatio}`}
        style={{ scrollBehavior: 'smooth' }}
      >
        {images.map((img, idx) => (
          <div key={idx} className="w-full h-full flex-shrink-0 snap-center">
            <img src={img} className="w-full h-full object-cover" alt="" />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          {showControls && (
            <>
              <button 
                onClick={(e) => { e.stopPropagation(); scrollTo(activeIndex - 1); }}
                className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/20 backdrop-blur-md rounded-full text-white transition-opacity ${activeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); scrollTo(activeIndex + 1); }}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/20 backdrop-blur-md rounded-full text-white transition-opacity ${activeIndex === images.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}
          
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {images.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1 rounded-full transition-all duration-300 ${idx === activeIndex ? 'bg-white w-4' : 'bg-white/40 w-1'}`} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ProductImageSlider;