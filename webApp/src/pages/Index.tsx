"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/shop/ProductCard";
import MarketplaceHeader from "@/components/shop/MarketplaceHeader";
import MarketplaceSearch from "@/components/shop/MarketplaceSearch";
import MarketplacePromos from "@/components/shop/MarketplacePromos";
import { useUser } from "@/context/UserContext";
import { useLanguage } from "@/context/LanguageContext";
import { supabase } from "@/lib/supabase";
import { Search, Loader2, RefreshCw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { CURRENCIES } from "@/constants/marketplace";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user } = useUser();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [isVisualSearching, setIsVisualSearching] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [visualSearchImage, setVisualSearchImage] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, Number.MAX_SAFE_INTEGER]);

  useEffect(() => {
    if (user?.currency_code) {
      const userCurrency = CURRENCIES.find(c => c.code === user.currency_code);
      if (userCurrency) {
        setCurrency(userCurrency);
      }
    }
  }, [user?.currency_code]);

  const dynamicMaxPrice = useMemo(() => {
    if (products.length === 0) return 1000000;
    const max = Math.max(...products.map(p => p.price * currency.rate));
    return Math.ceil(max / 100) * 100 || 1000;
  }, [products, currency]);

  const fetchData = useCallback(async (keywords?: string[], silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const { data: promosData } = await supabase
        .from('promotional_cards')
        .select('*')
        .eq('is_active', true);
      
      if (promosData) {
        setPromos(promosData.map(p => ({
          title: p.title,
          subtitle: p.subtitle,
          color: p.color_gradient || "from-orange-600/80",
          image: p.image_url
        })));
      }

      let query = supabase.from('products').select('*');
      
      if (keywords && keywords.length > 0) {
        const filterString = keywords.slice(0, 5).map(k => `name.ilike.%${k}%,description.ilike.%${k}%`).join(',');
        query = query.or(filterString);
      } else {
        if (activeCategory !== "All") {
          query = query.eq('main_category', activeCategory);
        }
        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }
      }

      const { data: productsData, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      if (productsData) {
        setProducts(productsData.map(p => {
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
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, activeCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const observerRef = useInfiniteScroll(() => {
    if (!loading && !isRefreshing) {
      fetchData(undefined, true);
    }
  });

  const handleVisualSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVisualSearching(true);
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Full = reader.result as string;
      setVisualSearchImage(base64Full);
      const base64Data = base64Full.split(',')[1];

      try {
        const { data, error } = await supabase.functions.invoke('visual-search', {
          body: { image: base64Data }
        });

        if (error) throw error;

        if (data?.keywords) {
          toast.success(`AI found: ${data.keywords.slice(0, 3).join(', ')}`);
          fetchData(data.keywords);
        }
      } catch (err: any) {
        console.error("Visual search error:", err);
        toast.error("Visual search failed. Please try again.");
      } finally {
        setIsVisualSearching(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const convertedPrice = product.price * currency.rate;
      if (product.price === 0) return priceRange[0] === 0;
      return convertedPrice >= priceRange[0] && convertedPrice <= priceRange[1];
    });
  }, [products, priceRange, currency]);

  const handleResetFilters = () => {
    setActiveCategory("All");
    setSearchQuery("");
    setPriceRange([0, Number.MAX_SAFE_INTEGER]);
    setVisualSearchImage(null);
    fetchData();
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <MarketplaceHeader 
          user={user} 
          currency={currency} 
          setCurrency={setCurrency} 
          onRefresh={() => fetchData()} 
        />

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tight">Cascadea</h1>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate("/booking")}
                className="rounded-full font-bold px-6 border-accent/20 hover:bg-accent/5 text-accent gap-2"
              >
                <Calendar size={16} />
                Book
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate("/kope")}
                className="rounded-full font-bold px-6 border-accent/20 hover:bg-accent/5 text-accent"
              >
                Kope
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground font-medium">Discover the best deals and latest products in our vibrant marketplace.</p>
        </div>

        <MarketplaceSearch 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isVisualSearching={isVisualSearching}
          visualSearchImage={visualSearchImage}
          onVisualSearch={handleVisualSearch}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          dynamicMaxPrice={dynamicMaxPrice}
          currency={currency}
          isRefreshing={isRefreshing}
          onReset={handleResetFilters}
          placeholder={t("shop.search_placeholder")}
        />

        <MarketplacePromos promos={promos} />

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h5 className="text-base font-black tracking-tight">
              {visualSearchImage ? t("shop.visual_results") || "Visual Search Results" : t("shop.new_products") || "New Products"}
            </h5>
            <Button 
              variant="ghost" 
              className="text-accent font-bold text-xs"
              onClick={handleResetFilters}
            >
              {t("shop.view_all") || "View All"}
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                {filteredProducts.map((product, idx) => (
                  <ProductCard 
                    key={product.id || idx} 
                    {...product} 
                    price={`${currency.symbol}${(product.price * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
                  />
                ))}
              </div>
              <div ref={observerRef} className="h-10 w-full col-span-full flex items-center justify-center">
                {isRefreshing && <RefreshCw size={20} className="text-accent animate-spin" />}
              </div>
            </>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[2rem] flex items-center justify-center mx-auto text-muted-foreground">
                <Search size={32} />
              </div>
              <div className="space-y-1">
                <p className="font-black">{t("shop.no_products") || "No products found"}</p>
                <p className="text-xs text-muted-foreground">{t("shop.try_adjusting") || "Try adjusting your search or filters"}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
