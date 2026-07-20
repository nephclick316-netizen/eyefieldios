"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Share2, Loader2, AlertCircle } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

// Modular Components
import ProductMedia from "@/components/shop/product-detail/ProductMedia";
import ProductInfo from "@/components/shop/product-detail/ProductInfo";
import ProductSeller from "@/components/shop/product-detail/ProductSeller";
import ProductTrustBadges from "@/components/shop/product-detail/ProductTrustBadges";
import ProductSpecs from "@/components/shop/product-detail/ProductSpecs";
import ProductReviews from "@/components/shop/product-detail/ProductReviews";
import ProductActionBar from "@/components/shop/product-detail/ProductActionBar";
import ShareProductModal from "@/components/shop/product-detail/ShareProductModal";

const CURRENCIES = [
  { code: "USD", symbol: "$", rate: 1 },
  { code: "CAD", symbol: "C$", rate: 1.35 },
  { code: "EUR", symbol: "€", rate: 0.92 },
  { code: "GBP", symbol: "£", rate: 0.79 },
  { code: "CNY", symbol: "¥", rate: 7.2 },
  { code: "UGX", symbol: "USh", rate: 3800 },
  { code: "KES", symbol: "KSh", rate: 130 },
  { code: "RWF", symbol: "FRw", rate: 1280 },
  { code: "CDF", symbol: "FC", rate: 2750 },
  { code: "BIF", symbol: "FBu", rate: 2850 },
  { code: "NGN", symbol: "₦", rate: 1500 },
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const reviewsRef = useRef<HTMLDivElement>(null);

  const currentCurrency = useMemo(() => {
    return CURRENCIES.find(c => c.code === (user?.currency_code || "USD")) || CURRENCIES[0];
  }, [user?.currency_code]);

  const productImages = useMemo(() => {
    let urls: string[] = [];
    if (product?.media_urls) {
      let media = product.media_urls;
      if (typeof media === 'string') {
        try { media = JSON.parse(media); } catch (e) {}
      }
      if (Array.isArray(media)) {
        urls = media.map(m => {
          let item = m;
          if (typeof item === 'string') { try { item = JSON.parse(item); } catch(e){} }
          return item?.url || item;
        });
      } else if (typeof media === 'object' && media?.url) {
        urls = [media.url];
      } else if (typeof media === 'string') {
        urls = [media];
      }
    } else if (product?.image_url) {
      urls = product.image_url.split(',').map((url: string) => url.trim());
    }
    
    urls = urls.filter(Boolean).map(url => typeof url === 'string' ? url.replace(/^["']|["']$/g, '') : url);
    return urls.length ? urls : ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"];
  }, [product?.media_urls, product?.image_url]);

  useEffect(() => {
    const fetchProductAndSeller = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (productError) throw productError;
        setProduct(productData);

        if (productData.seller_id) {
          const { data: sellerData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', productData.seller_id)
            .single();
          setSeller(sellerData);
        }

        if (productData.category) {
          const { data: related } = await supabase
            .from('products')
            .select('*')
            .eq('category', productData.category)
            .neq('id', id)
            .limit(4);
          
            setRelatedProducts(related.map(p => {
              let imgUrl = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80";
              if (p.media_urls) {
                let media = p.media_urls;
                if (typeof media === 'string') {
                  try { media = JSON.parse(media); } catch (e) {}
                }
                if (Array.isArray(media) && media.length > 0) {
                  let first = media[0];
                  if (typeof first === 'string') { try { first = JSON.parse(first); } catch(e){} }
                  imgUrl = first?.url || first || imgUrl;
                } else if (typeof media === 'object' && media?.url) {
                  imgUrl = media.url;
                } else if (typeof media === 'string') {
                  imgUrl = media;
                }
              } else if (p.image_url) {
                imgUrl = p.image_url;
              }
              if (typeof imgUrl === 'string') {
                imgUrl = imgUrl.split(',')[0].trim().replace(/^["']|["']$/g, '');
              }

              return {
                id: p.id,
                title: p.name || p.title || "Unknown Product",
                price: `${currentCurrency.symbol}${((p.current_price || p.price || 0) * currentCurrency.rate).toLocaleString()}`,
                minOrder: p.min_order || "1 piece",
                image: imgUrl,
                rating: p.rating_avg || p.rating || 5.0,
                isVerified: p.is_verified,
                reviewsCount: p.likes_count || p.likes || 0,
              };
            }));
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndSeller();
  }, [id, user?.currency_code, currentCurrency]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    setIsAddingToCart(true);
    try {
      addToCart({
        id: product.id,
        title: product.name || product.title || "Unknown Product",
        price: (product.current_price || product.price || 0) * currentCurrency.rate,
        image: productImages[0] || "",
        quantity: 1,
        currencySymbol: currentCurrency.symbol
      });
      toast.success("Added to cart!");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleChatClick = () => {
    if (!user) {
      toast.error("Please login to chat with the seller");
      navigate("/login");
      return;
    }
    if (seller?.id) {
      navigate(`/chat?user=${seller.id}&productId=${product.id}`);
    }
  };

  const handleShare = () => {
    if (!user) {
      toast.error("Please login to share products");
      navigate("/login");
      return;
    }
    setIsShareModalOpen(true);
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="w-10 h-10 text-accent animate-spin" />
          <p className="font-black text-muted-foreground">Loading product details...</p>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-black">Product not found</h2>
          <Button onClick={() => navigate('/')} className="rounded-2xl bg-accent text-white font-black">
            Back to Shop
          </Button>
        </div>
      </MainLayout>
    );
  }

  const currentPriceValue = product.current_price || product.price || 0;
  const formattedPrice = `${currentCurrency.symbol}${(currentPriceValue * currentCurrency.rate).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

  return (
    <MainLayout>
      <div className="space-y-8 pb-32">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/marketplace');
              }
            }}
            className="rounded-full bg-white dark:bg-secondary shadow-sm"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleShare}
              className="rounded-full bg-white dark:bg-secondary shadow-sm"
            >
              <Share2 size={18} />
            </Button>
          </div>
        </div>

        <ProductMedia 
          images={productImages} 
          videoUrl={product.video_url} 
          title={product.name || product.title} 
        />

        <div className="space-y-4">
          <ProductInfo 
            title={product.name || product.title}
            price={formattedPrice}
            rating={product.rating_avg || product.rating || 5.0}
            category={product.main_category || product.category}
            isVerified={product.is_verified}
            onRatingClick={scrollToReviews}
          />

          {seller && <ProductSeller seller={seller} />}

          <ProductTrustBadges />

          <ProductSpecs 
            description={product.description}
            minOrder={product.min_order}
            condition={product.condition}
          />
        </div>

        <Separator className="bg-gray-100 dark:bg-white/5" />

        <div ref={reviewsRef}>
          <ProductReviews productId={id!} />
        </div>

        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black">Related Products</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p.id || i} {...p} />
              ))}
            </div>
          </div>
        )}

        <ProductActionBar 
          user={user}
          sellerId={seller?.id}
          isAddingToCart={isAddingToCart}
          onAddToCart={handleAddToCart}
          onChatClick={handleChatClick}
        />

        <ShareProductModal 
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          product={{
            id: product.id,
            title: product.name || product.title || "Unknown Product",
            image: productImages[0] || ""
          }}
        />
      </div>
    </MainLayout>
  );
};

export default ProductDetail;