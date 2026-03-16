import React, { useState, useEffect, useContext, useRef } from 'react';
import { Search, ShoppingCart, ArrowUpRight, Plus, SlidersHorizontal, Check, Loader2, RefreshCw, Star, Banknote } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Product, AppTab, ProductCondition } from '../types';
import { ProductDetailOverlay, SellProductOverlay, CartOverlay, OtherProfileOverlay } from '../components/Features';
import { productService } from '../services/productService';
import { chatService } from '../services/chatService';
import { SettingsContext } from '../components/ClientProviders';
import { toast } from 'react-hot-toast';
import LoadingEye from '../components/LoadingEye';
import { cacheUtils } from '../utils/cacheUtils';

interface CascadeaPageProps {
  navigateToTab?: (tab: AppTab) => void;
}

const PRODUCT_LIMIT = 10;
const ADMIN_EMAIL = 'edocardadmin@eyefield.pro';

const CascadeaPage: React.FC<CascadeaPageProps> = ({ navigateToTab }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [showSell, setShowSell] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'price-low' | 'price-high'>('latest');
  const [priceLimit, setPriceLimit] = useState<number>(5000);
  const [cartItems, cartItemsSet] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsPage, setProductsPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  const { currentUser } = useAuth();
  const settings = useContext(SettingsContext);
  const isMounted = useRef(true);
  const retryCount = useRef(0);
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const categories = [
    'All', 'Accommodations', 'Rental/Hiring', 'Auto Mobile',
    'Fashion', 'Tech', 'Home', 'Art', 'Lifestyle', 'Food', 'Services', 'Real Estate'
  ];

  const [activeCondition, setActiveCondition] = useState<'All' | ProductCondition>('All');

  useEffect(() => {
    isMounted.current = true;
    
    const loadCache = async () => {
      const cached = await cacheUtils.get<Product[]>('cached_products');
      if (isMounted.current && cached) {
        setProducts(cached);
        setLoadingProducts(false);
      }
    };
    loadCache();

    fetchProducts(0, true);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchProducts(0, true, true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser?.id]);

  const fetchProducts = async (page: number = productsPage, reset: boolean = false, isBackground: boolean = false) => {
    if (!isMounted.current) return;
    if (reset && !isBackground && products.length === 0) setLoadingProducts(true);
    else if (!reset) setLoadingMore(true);
    if (isMounted.current && !isBackground) setProductsError(null);

    try {
      const { data, hasMore } = await productService.getProducts(page, PRODUCT_LIMIT);
      if (isMounted.current) {
        setProducts(prev => {
          const next = reset ? data : [...prev, ...data];
          const deduped = Array.from(new Map(next.map(p => [p.id, p])).values());
          if (page === 0) cacheUtils.set('cached_products', deduped);
          return deduped;
        });
        setHasMoreProducts(hasMore);
        setProductsPage(page + 1);
        if (data.length > 0 && reset) {
          const max = Math.max(...data.map(p => p.price));
          setPriceLimit(max);
        }
        retryCount.current = 0;
      }
    } catch (error: any) {
      console.error("CascadeaPage: Failed to fetch products:", error);
      
      if (error.message?.includes('timed out') && retryCount.current < 3) {
        retryCount.current++;
        setTimeout(() => fetchProducts(page, reset, isBackground), 1000);
        return;
      }

      if (isMounted.current && isAdmin && !isBackground) {
        setProductsError(`Admin Alert: ${error.message}`);
      }
    } finally {
      if (isMounted.current) {
        setLoadingProducts(false);
        setLoadingMore(false);
      }
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loadingMore && hasMoreProducts) {
      fetchProducts();
    }
  };

  const handleBuyNow = async (product: Product) => {
    try {
      if (!currentUser) {
        toast.error("Please sign in to make an inquiry.");
        return;
      }

      const currentUserId = currentUser.id;

      if (currentUserId === product.seller.id) {
        toast.error("You cannot buy your own listing.");
        return;
      }

      const conversationId = await chatService.getOrCreateConversation(currentUserId, product.seller.id);

      if (conversationId) {
        const priceText = product.price > 0 ? ` - ${settings?.formatPrice(product.price)}` : '';
        await chatService.sendMessage(
          currentUserId,
          conversationId,
          `Is this product still available?\n\n${product.name}${priceText}`,
          'image',
          product.imageUrl
        );

        toast.success("Inquiry Transmitted");
        if (isMounted.current) setSelectedProduct(null);
        if (navigateToTab) navigateToTab(AppTab.CHATS);
      }
    } catch (error) {
      console.error("Failed to send inquiry:", error);
      toast.error("Failed to send inquiry.");
    }
  };

  const absoluteMax = products.length > 0 ? Math.max(...products.map(p => p.price)) : 5000;

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice = p.price <= priceLimit;
    const matchesCondition = activeCondition === 'All' || p.condition === activeCondition;
    return matchesCategory && matchesSearch && matchesPrice && matchesCondition;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return 0;
  });

  const addToCart = (product: Product) => {
    if (isMounted.current) cartItemsSet(prev => [...prev, product]);
    toast.success('Added to Bag');
    if (isMounted.current) setSelectedProduct(null);
  };

  const removeFromCart = (id: string) => {
    if (isMounted.current) cartItemsSet(prev => prev.filter(item => item.id !== id));
    toast.success('Removed from Bag');
  };

  return (
    <div className="p-4 flex flex-col gap-6 pb-24 h-full overflow-y-auto no-scrollbar" onScroll={handleScroll} data-dyad-component="CascadeaPage">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Cascadea</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setShowCurrencyMenu(!showCurrencyMenu)}
              className={`p-2 rounded-full transition-colors flex items-center gap-1.5 ${showCurrencyMenu ? 'bg-navy-950 text-white' : 'bg-white/40 dark:bg-white/5 backdrop-blur-md text-slate-600 dark:text-slate-300 border border-white/20'}`}
            >
              <Banknote size={20} />
              <span className="text-[10px] font-black">{settings?.selectedCurrency?.code || 'USD'}</span>
            </button>
            {showCurrencyMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {settings?.currencies.map((curr) => (
                  <button
                    key={curr.code}
                    onClick={() => { settings.setCurrency(curr.code); setShowCurrencyMenu(false); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-colors ${settings.selectedCurrency?.code === curr.code ? 'bg-navy-950 text-white' : 'hover:bg-white/20 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300'}`}
                  >
                    <span>{curr.label}</span>
                    <span className="opacity-50">{curr.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-full transition-colors ${showFilters ? 'bg-navy-950 text-white' : 'bg-white/40 dark:bg-white/5 backdrop-blur-md text-slate-600 dark:text-slate-300 border border-white/20'}`}
          >
            <SlidersHorizontal size={20} />
          </button>
          <button onClick={() => setShowCart(true)} className="relative p-2 bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-full border border-white/20">
            <ShoppingCart size={22} className="text-navy-950 dark:text-navy-300" />
            {cartItems.length > 0 && (
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black">
                {cartItems.length}
              </div>
            )}
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-2xl p-6 rounded-[32px] border border-white/30 dark:border-white/10 shadow-2xl animate-in slide-in-from-top-4 duration-300 space-y-6 max-w-2xl mx-auto w-full">
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Price Range</h3>
              <span className="text-xs font-black text-navy-950 dark:text-orange-500">Up to {settings?.selectedCurrency?.symbol || '$'}{priceLimit}</span>
            </div>
            <input
              type="range"
              min="0"
              max={absoluteMax}
              step="10"
              value={priceLimit}
              onChange={(e) => setPriceLimit(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-navy-950 dark:accent-orange-500"
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Sort Signals</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'latest', label: 'Latest' },
                { id: 'price-low', label: 'Price: Low' },
                { id: 'price-high', label: 'Price: High' }
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as any)}
                  className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${sortBy === opt.id ? 'bg-navy-950 text-white' : 'bg-white/50 dark:bg-white/5 text-slate-500 border border-white/20'}`}
                >
                  {sortBy === opt.id && <Check size={12} />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowFilters(false)}
            className="w-full py-4 bg-navy-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          >
            Apply Filters
          </button>
        </div>
      )}

      <div className="sticky top-0 z-20 bg-white/40 dark:bg-black/40 backdrop-blur-2xl pt-4 pb-6 -mx-4 px-6 space-y-5 border-b border-white/20 dark:border-white/10 shadow-sm">
        <div className="flex gap-3 max-w-screen-2xl mx-auto w-full">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-950 dark:group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder="Search boutique..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white transition-all text-navy-950 dark:text-white placeholder:text-slate-400"
            />
          </div>
          <button onClick={() => setShowSell(true)} className="bg-navy-950 dark:bg-white text-white dark:text-navy-950 flex items-center gap-2 px-6 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform">
            <Plus size={20} /> Sell
          </button>
        </div>

        <div className="flex overflow-x-auto gap-2.5 no-scrollbar max-w-screen-2xl mx-auto w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${activeCategory === cat 
                ? 'bg-white/80 dark:bg-white/20 text-navy-950 dark:text-white shadow-lg backdrop-blur-md border border-white/50 dark:border-white/20 scale-105' 
                : 'text-navy-950/60 dark:text-white/60 hover:text-navy-950 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/5'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loadingProducts && products.length === 0 ? (
        <div className="flex justify-center py-10"><LoadingEye /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
            {sortedProducts.map((product) => {
              const isServiceOrRental = product.category === 'Services' || product.category === 'Rental/Hiring';
              return (
                <div key={product.id} className="group relative cursor-pointer" onClick={() => setSelectedProduct(product)}>
                  <div className="aspect-square rounded-[28px] overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-md relative shadow-sm border border-white/30 dark:border-white/10 group-hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                    <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
                    {!isServiceOrRental && (
                      <div className="absolute bottom-3 right-3 bg-white/80 dark:bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-xl z-10 border border-white/20">
                        <span className="text-[10px] font-black text-navy-950 dark:text-white">{settings?.formatPrice(product.price)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 px-2">
                    <h3 className="text-sm font-bold truncate group-hover:text-orange-500 transition-colors text-navy-950 dark:text-white">{product.name}</h3>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-500 font-medium">@{product.seller.username}</span>
                      {product.averageRating !== undefined && product.ratingCount !== undefined && product.ratingCount > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star size={10} className="text-orange-500 fill-orange-500" />
                          <span className="text-[10px] font-bold text-slate-500">{product.averageRating.toFixed(1)}</span>
                        </div>
                      ) : (
                        <ArrowUpRight size={12} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedProducts.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-40 font-black uppercase tracking-widest text-xs">
                No products in this range
              </div>
            )}
          </div>
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          )}
        </>
      )}

      {selectedProduct && (
        <ProductDetailOverlay
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => addToCart(selectedProduct)}
          onBuyNow={() => handleBuyNow(selectedProduct)}
          onViewProfile={(id) => { setSelectedProduct(null); setSelectedSellerId(id); }}
        />
      )}
      {showSell && <SellProductOverlay onClose={() => { setShowSell(false); fetchProducts(0, true); toast.success('Product Listed'); }} />}
      {showCart && <CartOverlay items={cartItems} onClose={() => setShowCart(false)} onRemove={removeFromCart} />}
      {selectedSellerId && <OtherProfileOverlay userId={selectedSellerId} onClose={() => setSelectedSellerId(null)} />}
    </div>
  );
};

export default CascadeaPage;