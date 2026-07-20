"use client";

import React, { useState, useEffect, useCallback } from "react";
import MainLayout from "@/components/layout/MainLayout";
import ProductCard from "@/components/shop/ProductCard";
import MarketplaceHeader from "@/components/shop/MarketplaceHeader";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";
import { Tag, Loader2, ShoppingBag } from "lucide-react";
import { CURRENCIES } from "@/constants/marketplace";

const Shop = () => {
  const { user } = useUser();
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.currency_code) {
      const userCurrency = CURRENCIES.find(c => c.code === user.currency_code);
      if (userCurrency) {
        setCurrency(userCurrency);
      }
    }
  }, [user?.currency_code]);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .not('discount_price', 'is', null)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          title: p.title,
          price: p.price || 0,
          discountPrice: p.discount_price,
          category: p.category,
          minOrder: p.min_order || "1 piece",
          image: p.image_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
          rating: p.rating || 5.0,
          isVerified: p.is_verified,
        })));
      }
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals();
  }, [fetchDeals]);

  return (
    <MainLayout>
      <div className="space-y-8">
        <MarketplaceHeader 
          user={user} 
          currency={currency} 
          setCurrency={setCurrency} 
          onRefresh={fetchDeals} 
        />

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
              <Tag size={24} />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Hot Deals</h1>
          </div>
          <p className="text-muted-foreground font-medium">Exclusive discounts and limited-time offers from our top sellers.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                {...product} 
                price={`${currency.symbol}${(product.price * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} 
                discountPrice={`${currency.symbol}${(product.discountPrice * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 space-y-4 bg-secondary/10 rounded-[3rem] border border-dashed border-white/10">
            <div className="w-20 h-20 bg-secondary/30 rounded-[2rem] flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag size={32} />
            </div>
            <div className="space-y-1">
              <p className="font-black">No active deals</p>
              <p className="text-xs text-muted-foreground">Check back later for new discounts!</p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Shop;