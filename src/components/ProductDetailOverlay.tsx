import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChevronLeft, ShoppingBag, User as UserIcon, Star, Loader2, Image as ImageIcon } from 'lucide-react';
import { Product, User as UserType } from '../types';
import ProductImageSlider from './ProductImageSlider';
import { productService } from '../services/productService';
import { ProductRatingSection } from './ProductRatingSection';
import { SettingsContext } from './ClientProviders';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';
import { ProductGalleryOverlay } from './Features';
import { useAuth } from '../contexts/AuthContext';

export const ProductDetailOverlay: React.FC<{
  product: Product;
  onClose: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onViewProfile: (userId: string) => void;
}> = ({ product: initialProduct, onClose, onAddToCart, onBuyNow, onViewProfile }) => {
  const [product, setProduct] = useState(initialProduct);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [alternativeProducts, setAlternativeProducts] = useState<Product[]>([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(true);
  const [showGallery, setShowGallery] = useState(false);
  
  const { currentUser } = useAuth();

  const settings = useContext(SettingsContext);
  const isMounted = useRef(true);

  const images = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls
    : (product.imageUrl ? [product.imageUrl] : []);

  const isServiceOrRental = product.category === 'Services' || product.category === 'Rental/Hiring';

  useEffect(() => {
    isMounted.current = true;
    fetchAlternativeProducts();
    return () => {
      isMounted.current = false;
    };
  }, [product.id, product.category]);

  const fetchAlternativeProducts = async () => {
    if (!isMounted.current) return;
    setLoadingAlternatives(true);
    try {
      const data = await productService.getAlternativeProducts(product.id, product.category);
      if (isMounted.current) setAlternativeProducts(data);
    } catch (error) {
      console.error("Failed to fetch alternative products:", error);
    } finally {
      if (isMounted.current) setLoadingAlternatives(false);
    }
  };

  const refreshProductData = async () => {
    if (!isMounted.current) return;
    try {
      const updatedProduct = await productService.getProductById(product.id);
      if (isMounted.current && updatedProduct) {
        setProduct(updatedProduct);
      }
    } catch (error) {
      console.error("Failed to refresh product data:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black md:bg-black/60 md:backdrop-blur-sm flex flex-col md:items-center md:justify-center animate-in slide-in-from-bottom duration-300 md:p-6">
      <div className="w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md lg:max-w-lg bg-white dark:bg-black md:rounded-[40px] flex flex-col overflow-y-auto no-scrollbar relative shadow-2xl">

        <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-900 shrink-0">
          <ProductImageSlider
            images={images}
            className="w-full h-full"
            showControls={true}
            initialActiveIndex={activeImageIndex}
          />
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white pt-safe md:pt-2 z-20">
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Thumbnail Gallery */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 min-h-[80px] overflow-x-auto no-scrollbar bg-white dark:bg-black border-b border-slate-100 dark:border-slate-800 shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-16 rounded-xl overflow-hidden border-2 ${idx === activeImageIndex ? 'border-orange-500' : 'border-transparent'} flex-shrink-0`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="p-8 space-y-8 flex-1">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[3px] text-orange-500">{product.category}</span>
                {product.condition && !isServiceOrRental && (
                  <span className="text-[8px] font-black uppercase px-2 py-0.5 bg-navy-950 text-white rounded-full">
                    {product.condition}
                  </span>
                )}
              </div>
              {!isServiceOrRental && (
                <span className="text-2xl font-black text-navy-950 dark:text-white">{settings?.formatPrice(product.price)}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-black tracking-tighter">{product.name}</h2>
              {images.length > 1 && (
                <button
                  onClick={() => setShowGallery(true)}
                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 active:scale-95 transition-transform"
                >
                  <ImageIcon size={14} /> Gallery ({images.length})
                </button>
              )}
            </div>
          </div>

          <div
            onClick={() => onViewProfile(product.seller.id)}
            className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 cursor-pointer active:scale-[0.98] transition-transform"
          >
            <img src={product.seller.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-orange-500" alt="" />
            <div className="flex-1">
              <p className="text-xs font-black">@{product.seller.username}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase">View Profile & Listings</p>
            </div>
            <div className="p-3 bg-white dark:bg-black rounded-2xl shadow-sm text-orange-500">
              <UserIcon size={18} />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">{product.description}</p>
          </div>

          <div className="flex gap-4 pt-4">
            {!isServiceOrRental && (
              <button onClick={onAddToCart} className="flex-1 bg-slate-100 dark:bg-slate-800 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <ShoppingBag size={18} /> Add to Bag
              </button>
            )}
            <button onClick={onBuyNow} className="flex-1 bg-navy-950 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-transform">
              {isServiceOrRental ? 'Inquire Now' : 'Buy Now'}
            </button>
          </div>

          {currentUser && (
            <ProductRatingSection
              product={product}
              currentUser={currentUser}
              onRatingSubmitted={refreshProductData}
            />
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Alternative Signals</h3>
            {loadingAlternatives ? (
              <div className="flex justify-center py-4"><Loader2 className="animate-spin text-navy-950" size={24} /></div>
            ) : alternativeProducts.length === 0 ? (
              <p className="text-xs text-slate-500">No alternative products found in this category.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {alternativeProducts.map((altProduct) => (
                  <div
                    key={altProduct.id}
                    onClick={() => {
                      setProduct(altProduct);
                      setActiveImageIndex(0);
                      const overlay = document.querySelector('.ProductDetailOverlay');
                      if (overlay) overlay.scrollTop = 0;
                    }}
                    className="group relative cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img src={altProduct.imageUrl} className="w-full h-full object-cover" alt={altProduct.name} />
                    </div>
                    <div className="mt-2 px-1">
                      <h4 className="text-xs font-bold truncate">{altProduct.name}</h4>
                      {!(altProduct.category === 'Services' || altProduct.category === 'Rental/Hiring') && (
                        <p className="text-[10px] text-slate-500 font-medium">{settings?.formatPrice(altProduct.price)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showGallery && (
        <ProductGalleryOverlay
          images={images}
          initialIndex={activeImageIndex}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
};