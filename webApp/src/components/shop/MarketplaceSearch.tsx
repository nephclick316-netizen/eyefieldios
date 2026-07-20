"use client";

import React, { useRef } from "react";
import { Search, Camera, SlidersHorizontal, Loader2, X, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { CATEGORIES } from "@/constants/marketplace";

interface MarketplaceSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isVisualSearching: boolean;
  visualSearchImage: string | null;
  onVisualSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  priceRange: number[];
  setPriceRange: (range: number[]) => void;
  dynamicMaxPrice: number;
  currency: any;
  isRefreshing: boolean;
  onReset: () => void;
  placeholder?: string;
}

const MarketplaceSearch: React.FC<MarketplaceSearchProps> = ({
  searchQuery,
  setSearchQuery,
  isVisualSearching,
  visualSearchImage,
  onVisualSearch,
  activeCategory,
  setActiveCategory,
  priceRange,
  setPriceRange,
  dynamicMaxPrice,
  currency,
  isRefreshing,
  onReset,
  placeholder
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="relative w-full group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-accent transition-colors" size={20} />
        <Input 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder || "Search products..."} 
          className="pl-12 pr-24 h-14 rounded-2xl bg-white dark:bg-secondary border border-gray-200 dark:border-none focus-visible:ring-accent text-foreground shadow-sm text-base w-full"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isRefreshing && <RefreshCw size={16} className="text-accent animate-spin mr-2" />}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            className="hidden" 
            ref={fileInputRef}
            onChange={onVisualSearch}
          />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => fileInputRef.current?.click()}
            className={`h-10 w-10 rounded-xl transition-colors ${visualSearchImage ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/5"}`}
          >
            {isVisualSearching ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-xl transition-colors ${activeCategory !== "All" || priceRange[1] < dynamicMaxPrice ? "text-accent bg-accent/10" : "text-muted-foreground hover:text-accent hover:bg-accent/5"}`}>
                <SlidersHorizontal size={20} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-[2rem] p-6 bg-white dark:bg-secondary border-gray-100 dark:border-white/10 shadow-2xl" align="end">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeCategory === cat 
                            ? "bg-accent text-white shadow-lg shadow-accent/20" 
                            : "bg-gray-50 dark:bg-white/5 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price Range</h4>
                    <span className="text-xs font-black text-accent">{currency.symbol}{priceRange[0].toLocaleString()} - {currency.symbol}{Math.min(priceRange[1], dynamicMaxPrice).toLocaleString()}</span>
                  </div>
                  <Slider
                    defaultValue={[0, dynamicMaxPrice]}
                    max={dynamicMaxPrice}
                    step={Math.max(1, Math.floor(dynamicMaxPrice / 100))}
                    value={[priceRange[0], Math.min(priceRange[1], dynamicMaxPrice)]}
                    onValueChange={setPriceRange}
                    className="py-4"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-10 text-xs font-bold border-gray-100 dark:border-white/10"
                    onClick={onReset}
                  >
                    Reset
                  </Button>
                  <Button 
                    className="flex-1 rounded-xl h-10 text-xs font-bold bg-accent hover:bg-accent/90 text-white"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {visualSearchImage && (
        <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-3xl border border-accent/10 animate-in fade-in slide-in-from-top-2">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-accent shadow-lg">
            <img src={visualSearchImage} className="w-full h-full object-cover" alt="Visual search" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black">Visual Search Active</h4>
            <p className="text-xs text-muted-foreground">Showing items similar to your photo</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onReset} className="rounded-full hover:bg-accent/10 text-accent">
            <X size={20} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default MarketplaceSearch;