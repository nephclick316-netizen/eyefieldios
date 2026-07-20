"use client";

import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/shop/ProductCard";
import UploadModal from "@/components/shop/UploadModal";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { 
  Search, Plus, ChevronDown, Camera, SlidersHorizontal,
  Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import aiRobot from "@/assets/ai-robot.png";
import { toast } from "sonner";

const CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸", rate: 1 },
  { code: "CAD", symbol: "C$", flag: "🇨🇦", rate: 1.35 },
  { code: "EUR", symbol: "€", flag: "🇪🇺", rate: 0.92 },
  { code: "GBP", symbol: "£", flag: "🇬🇧", rate: 0.79 },
  { code: "CNY", symbol: "¥", flag: "🇨🇳", rate: 7.2 },
  { code: "UGX", symbol: "USh", flag: "🇺🇬", rate: 3800 },
  { code: "KES", symbol: "KSh", flag: "🇰🇪", rate: 130 },
  { code: "RWF", symbol: "FRw", flag: "🇷🇼", rate: 1280 },
  { code: "CDF", symbol: "FC", flag: "🇨🇩", rate: 2750 },
  { code: "BIF", symbol: "FBu", flag: "🇧🇮", rate: 2850 },
  { code: "NGN", symbol: "₦", flag: "🇳🇬", rate: 1500 },
];

const CATEGORIES = [
  "All", 
  "👕 Fashion & Apparel", 
  "📱 Electronics & Music", 
  "🏠 Home & Living", 
  "🍽️ Groceries & Food", 
  "💄 Beauty & Personal Care",
  "🏋️ Sports & Fitness",
  "🚗 Automotive",
  "🧸 Toys, Kids & Baby",
  "🐶 Pets",
  "🏢 Office & Business Supplies",
  "🔧 Tools & Industrial",
  "💻 Digital Products",
  "🛠️ Services"
];

const Marketplace = () => {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, Number.MAX_SAFE_INTEGER]);

  const dynamicMaxPrice = useMemo(() => {
    if (products.length === 0) return 1000000;
    const max = Math.max(...products.map(p => p.price * currency.rate));
    return Math.ceil(max / 100) * 100 || 1000;
  }, [products, currency]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isVisualSearching, setIsVisualSearching] = useState(false);

  const handleVisualSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVisualSearching(true);
    setSearchQuery("");
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const base64Image = base64Data.split(',')[1];
        
        const OPENROUTER_KEY = import.meta.env.VITE_OPENROUTER_KEY || "";
        const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY || "";
        let aiResponse = "";
        
        try {
          const orRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "openrouter/free",
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: "Describe what object is mainly in this image in one or two words. Return only the object name." },
                  { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
                ]
              }]
            })
          });
          const orData = await orRes.json();
          const reply = orData.choices?.[0]?.message?.content;
          if (reply && !reply.toLowerCase().includes("error") && !reply.toLowerCase().includes("cannot")) {
            aiResponse = reply.trim();
          }
        } catch (e) {
          console.error("OpenRouter failed", e);
        }
        
        if (!aiResponse) {
          try {
            const gemRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [
                  { text: "Describe what object is mainly in this image in one or two words. Return only the object name." },
                  { inlineData: { mimeType: file.type || "image/jpeg", data: base64Image } }
                ] }]
              })
            });
            const gemData = await gemRes.json();
            const reply = gemData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (reply) aiResponse = reply.trim();
          } catch (e) {
            console.error("Gemini failed", e);
          }
        }
        
        if (aiResponse) {
          setSearchQuery(aiResponse);
        } else {
          toast.error("Visual search failed.");
        }
        setIsVisualSearching(false);
      };
    } catch (e) {
      setIsVisualSearching(false);
      toast.error("Error processing image");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('products').select('*');
      
      if (activeCategory !== "All") {
        query = query.eq('main_category', activeCategory);
      }
      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;

      if (data) {
        setProducts(data.map(p => {
          let imageUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";
          if (p.media_urls) {
            let media = p.media_urls;
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
          } else if (p.image_url) {
            imageUrl = p.image_url;
          }
          if (typeof imageUrl === 'string') {
            imageUrl = imageUrl.split(',')[0].trim().replace(/^["']|["']$/g, '');
          }

          return {
            id: p.id,
            title: p.name || p.title || "Unknown Product",
            price: p.current_price || p.price || 0,
            category: p.main_category || p.category || "General",
            minOrder: p.min_order || "1 piece",
            image: imageUrl,
            rating: p.rating_avg || p.rating || 5.0,
            reviewsCount: p.likes_count || p.likes || 0,
            isVerified: p.is_verified || false,
          };
        }));
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const convertedPrice = product.price * currency.rate;
      return convertedPrice >= priceRange[0] && convertedPrice <= priceRange[1];
    });
  }, [products, priceRange, currency]);

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-black tracking-tight">EyeField</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="h-10 rounded-2xl bg-secondary/20 hover:bg-secondary/30 px-3 gap-2 font-bold text-xs" onClick={() => window.location.href = '/endocard'}>
              <img src={aiRobot} alt="AI" className="w-4 h-4 object-contain" />
              <span className="text-accent">ENDOCARD</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="h-10 rounded-2xl bg-secondary/20 hover:bg-secondary/30 px-3 gap-2 font-bold text-xs">
                  <span className="text-sm">{currency.flag}</span>
                  <span>{currency.code}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 max-h-[300px] overflow-y-auto no-scrollbar">
                {CURRENCIES.map((curr) => (
                  <DropdownMenuItem 
                    key={curr.code} 
                    onClick={() => setCurrency(curr)} 
                    className={`rounded-xl font-bold text-xs py-2.5 flex items-center justify-between ${currency.code === curr.code ? 'bg-accent/10 text-accent' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{curr.flag}</span>
                      <span>{curr.code}</span>
                    </div>
                    <span className="text-muted-foreground opacity-50">{curr.symbol}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <UploadModal trigger={<Button className="h-10 w-10 rounded-xl bg-accent hover:bg-accent/90 text-white p-0"><Plus size={20} /></Button>} onSuccess={fetchData} />
          </div>
        </header>

        <div className="flex items-center justify-between pt-4">
          <h2 className="text-4xl font-black">Cascadea</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-8 rounded-full border-accent text-accent hover:bg-accent/10 px-4 text-xs font-bold" onClick={() => window.location.href = '/booking'}>Book</Button>
            <Button variant="outline" className="h-8 rounded-full border-accent text-accent hover:bg-accent/10 px-4 text-xs font-bold" onClick={() => window.location.href = '/kope'}>Kope</Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">Discover the best deals and latest products in our vibrant marketplace.</p>

        <div className="relative w-full group py-2">
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search echoes, users, or pro..." 
            className="pl-6 pr-24 h-14 rounded-[2rem] bg-secondary/20 border border-white/10 focus-visible:ring-accent text-foreground text-sm w-full"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleVisualSearch}
            />
            {isVisualSearching ? (
              <Loader2 className="text-accent animate-spin" size={20} />
            ) : (
              <Camera className="text-muted-foreground cursor-pointer hover:text-accent" size={20} onClick={() => fileInputRef.current?.click()} />
            )}
            <Popover>
              <PopoverTrigger asChild>
                <SlidersHorizontal className="text-muted-foreground cursor-pointer hover:text-accent" size={20} />
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-[2rem] p-6" align="end">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</h4>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeCategory === cat ? "bg-accent text-white" : "bg-gray-50 dark:bg-white/5 text-muted-foreground"
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
                    <Slider defaultValue={[0, dynamicMaxPrice]} max={dynamicMaxPrice} step={10} value={[priceRange[0], Math.min(priceRange[1], dynamicMaxPrice)]} onValueChange={setPriceRange} className="py-4" />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : (
          <div className="space-y-10 pt-4">
            {/* New Cascadea */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">New Cascadea</h3>
                <span className="text-sm font-bold text-accent cursor-pointer">All Products</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} {...product} price={`${currency.symbol}${(product.price * currency.rate).toLocaleString()}`} />
                ))}
              </div>
            </div>

            {/* Limited Offer */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-red-500">Limited Offer</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredProducts.slice(0, 4).map((product) => (
                  <ProductCard key={`limited-${product.id}`} {...product} price={`${currency.symbol}${(product.price * currency.rate).toLocaleString()}`} discountPrice="Limited Edition" />
                ))}
              </div>
            </div>

            {/* Featured Product */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Featured Product</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...filteredProducts].sort((a, b) => b.rating - a.rating).slice(0, 4).map((product) => (
                  <ProductCard key={`featured-${product.id}`} {...product} price={`${currency.symbol}${(product.price * currency.rate).toLocaleString()}`} />
                ))}
              </div>
            </div>

            {/* Best for Value */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Best for Value</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...filteredProducts].sort((a, b) => a.price - b.price).slice(0, 4).map((product) => (
                  <ProductCard key={`value-${product.id}`} {...product} price={`${currency.symbol}${(product.price * currency.rate).toLocaleString()}`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Marketplace;