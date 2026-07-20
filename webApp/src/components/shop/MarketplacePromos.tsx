"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { TrendingUp } from "lucide-react";

interface MarketplacePromosProps {
  promos: any[];
}

const MarketplacePromos: React.FC<MarketplacePromosProps> = ({ promos }) => {
  if (promos.length === 0) return null;

  return (
    <Carousel className="w-full" plugins={[Autoplay({ delay: 4000 })]}>
      <CarouselContent>
        {promos.map((promo, idx) => (
          <CarouselItem key={idx}>
            <div className="h-56 sm:h-64 md:h-80 rounded-[2.5rem] sm:rounded-[3rem] relative overflow-hidden shadow-xl shadow-accent/10 group">
              <img 
                src={promo.image} 
                className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105" 
                alt={promo.title}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${promo.color} to-transparent`} />
              
              <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/20">
                  <TrendingUp size={20} className="text-white sm:hidden" />
                  <TrendingUp size={28} className="text-white hidden sm:block" />
                </div>
              </div>
              
              <div className="relative z-10 h-full p-8 sm:p-10 md:p-16 flex flex-col justify-center text-white max-w-[90%] sm:max-w-[80%] md:max-w-[60%]">
                <h5 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight drop-shadow-lg leading-tight">{promo.title}</h5>
                <p className="text-white/90 text-sm sm:text-base md:text-lg font-bold drop-shadow-md mt-1 sm:mt-2">{promo.subtitle}</p>
                <Button className="mt-4 sm:mt-8 w-fit h-10 sm:h-12 rounded-full bg-white text-black hover:bg-accent hover:text-white transition-all font-black text-xs sm:text-sm px-6 sm:px-10 shadow-xl">
                  SHOP NOW
                </Button>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default MarketplacePromos;