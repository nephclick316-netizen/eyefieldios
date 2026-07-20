import React, { useState, useEffect, useRef } from 'react';
import { Settings, Grid, Layers, ShoppingBag, MapPin, Link as LinkIcon, Plus, Eye, Heart, MessageCircle, UserPlus, TrendingUp, Briefcase, Info, Phone, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { User as UserType, Echo, Product } from '../types';
import { AppSettingsOverlay, EchoDetailOverlay, ContactSearchOverlay, FollowListOverlay, SellProductOverlay, ProductDetailOverlay } from '../components/Features';
import { profileService } from '../services/profileService';
import { statsService } from '../services/statsService';
import { echoService } from '../services/echoService';
import { productService } from '../services/productService';
import { toast } from 'react-hot-toast';
import { withTimeout } from '../utils/queryUtils';
import LoadingEye from '../components/LoadingEye';
import { cacheUtils } from '../utils/cacheUtils';

interface ProfilePageProps {
  user: UserType;
  setUser: (u: UserType) => void;
}

const USER_ECHO_LIMIT = 12;
const USER_PRODUCT_LIMIT = 12;

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'echoes' | 'products'>('echoes');
  const [settingsSection, setSettingsSection] = useState<'main' | 'profile' | 'preferences' | 'permissions' | 'privacy' | 'help' | null>(null);
  const [showContactSearch, setShowContactSearch] = useState(false);
  const [showSell, setShowSell] = useState(false);
  const [followListType, setFollowListType] = useState<'followers' | 'following' | null>(null);
  const [selectedEcho, setSelectedEcho] = useState<Echo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState({ echoes: 0, followers: 0, following: 0 });
  
  const [userEchoes, setUserEchoes] = useState<Echo[]>([]);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const [echoesPage, setEchoesPage] = useState(0);
  const [hasMoreEchoes, setHasMoreEchoes] = useState(true);
  const [productsPage, setProductsPage] = useState(0);
  const [hasMoreProducts, setHasMoreProducts] = useState(true);

  const isMounted = useRef(true);

  useEffect(() => {
    if (!user) return;
    isMounted.current = true;

    // Load from cache first
    const loadCache = async () => {
      const cachedStats = await cacheUtils.get<any>(`stats_${user.id}`);
      const cachedEchoes = await cacheUtils.get<Echo[]>(`user_echoes_${user.id}`);
      const cachedProducts = await cacheUtils.get<Product[]>(`user_products_${user.id}`);

      if (isMounted.current) {
        if (cachedStats) {
          setStats(cachedStats);
          setLoadingStats(false);
        }
        if (cachedEchoes) setUserEchoes(cachedEchoes);
        if (cachedProducts) setUserProducts(cachedProducts);
        if (cachedEchoes || cachedProducts) setLoadingContent(false);
      }
    };
    loadCache();

    fetchStats();
    fetchUserContent(0, 0, true);
    
    return () => {
      isMounted.current = false;
    };
  }, [user?.id]);

  const fetchStats = async () => {
    if (!user) return;
    if (isMounted.current && stats.echoes === 0) setLoadingStats(true);
    try {
      const data = await statsService.getProfileStats(user.id);
      if (isMounted.current) {
        setStats(data);
        cacheUtils.set(`stats_${user.id}`, data);
      }
    } catch (error: any) {
      console.error("Failed to fetch stats:", error);
      if (isMounted.current && stats.echoes === 0) setStatsError("Failed to load stats.");
    } finally {
      if (isMounted.current) setLoadingStats(false);
    }
  };

  const fetchUserContent = async (echoPage: number = echoesPage, productPage: number = productsPage, reset: boolean = false) => {
    if (!user) return;
    if (isMounted.current && reset && userEchoes.length === 0) setLoadingContent(true);
    
    try {
      const [echoesRes, productsRes] = await Promise.all([
        echoService.getUserEchoes(user.id, echoPage, USER_ECHO_LIMIT),
        productService.getUserProducts(user.id, productPage, USER_PRODUCT_LIMIT)
      ]);
      
      if (isMounted.current) {
        setUserEchoes(prev => {
          const next = reset ? echoesRes.data : [...prev, ...echoesRes.data];
          const deduped = Array.from(new Map(next.map(e => [e.id, e])).values());
          if (reset) cacheUtils.set(`user_echoes_${user.id}`, echoesRes.data);
          return deduped;
        });
        setHasMoreEchoes(echoesRes.hasMore);
        setEchoesPage(echoPage + 1);

        setUserProducts(prev => {
          const next = reset ? productsRes.data : [...prev, ...productsRes.data];
          const deduped = Array.from(new Map(next.map(p => [p.id, p])).values());
          if (reset) cacheUtils.set(`user_products_${user.id}`, productsRes.data);
          return deduped;
        });
        setHasMoreProducts(productsRes.hasMore);
        setProductsPage(productPage + 1);
      }
    } catch (error: any) {
      console.error("Failed to fetch user content:", error);
      if (isMounted.current && userEchoes.length === 0) setContentError("Failed to load content.");
    } finally {
      if (isMounted.current) setLoadingContent(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !loadingContent) {
      if (activeTab === 'echoes' && hasMoreEchoes) {
        fetchUserContent(echoesPage, productsPage, false);
      } else if (activeTab === 'products' && hasMoreProducts) {
        fetchUserContent(echoesPage, productsPage, false);
      }
    }
  };

  const handleDeleteEcho = async (e: React.MouseEvent, echoId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this echo?')) return;
    
    try {
      await echoService.deleteEcho(echoId);
      if (isMounted.current) {
        const nextEchoes = userEchoes.filter(echo => echo.id !== echoId);
        setUserEchoes(nextEchoes);
        cacheUtils.set(`user_echoes_${user.id}`, nextEchoes);
        setStats(prev => ({ ...prev, echoes: prev.echoes - 1 }));
      }
      toast.success('Echo Removed');
    } catch (error) {
      toast.error('Failed to remove echo');
    }
  };

  const handleDeleteProduct = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!confirm('Remove this listing?')) return;
    try {
      await productService.deleteProduct(productId);
      if (isMounted.current) {
        const nextProducts = userProducts.filter(p => p.id !== productId);
        setUserProducts(nextProducts);
        cacheUtils.set(`user_products_${user.id}`, nextProducts);
      }
      toast.success('Listing Removed');
    } catch (error) {
      toast.error('Failed to remove listing');
    }
  };

  if (!user) return null;

  const statItems = [
    { label: 'Echoes', value: stats.echoes, type: null },
    { label: 'Followers', value: stats.followers, type: 'followers' as const },
    { id: 'following', label: 'Following', value: stats.following, type: 'following' as const },
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar animate-in fade-in duration-500" onScroll={handleScroll} data-dyad-component="ProfilePage">
      <header className="p-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">@{user.username}</h1>
        <button 
          onClick={() => setSettingsSection('main')}
          className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full active:scale-90 transition-transform"
        >
          <Settings size={22} className="text-navy-950 dark:text-navy-300" />
        </button>
      </header>

      <div className="px-6 py-4 flex flex-col items-center gap-4 text-center max-w-2xl mx-auto w-full">
        <div className="relative group">
          <div className="p-1 rounded-full border-2 border-orange-500 animate-pulse-slow">
            <img src={user.avatar} className="w-24 h-24 rounded-full object-cover border-2 border-white dark:border-black shadow-2xl" alt="" />
          </div>
          <button 
            onClick={() => setSettingsSection('profile')}
            className="absolute bottom-0 right-0 bg-navy-950 text-white p-2 rounded-full border-2 border-white dark:border-black shadow-lg hover:scale-110 transition-transform"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
        
        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight">{user.displayName}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 px-4 font-medium leading-relaxed">{user.bio || 'EyeField Member'}</p>
          <button 
            onClick={() => setSettingsSection('profile')}
            className="text-[10px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-[2px] mt-2 transition-colors flex items-center gap-1 mx-auto"
          >
            Complete your profile
          </button>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
           <span className="flex items-center gap-1"><MapPin size={12} className="text-orange-500" /> {user.businessDetails?.address || 'Global'}</span>
           <span className="flex items-center gap-1 text-navy-950 dark:text-navy-300 truncate max-w-[120px]"><LinkIcon size={12} /> {user.businessDetails?.website || 'eyefield.me'}</span>
           {user.phoneNumber && <span className="flex items-center gap-1"><Phone size={12} /> {user.phoneNumber}</span>}
        </div>

        {loadingStats && stats.echoes === 0 ? (
          <div className="flex justify-center py-6"><LoadingEye size={32} /></div>
        ) : (
          <div className="flex justify-center gap-8 w-full py-6 border-y border-slate-50 dark:border-slate-800">
            {statItems.map((stat) => (
              <button 
                key={stat.label} 
                onClick={() => stat.type && setFollowListType(stat.type)}
                className="text-center group cursor-pointer"
                disabled={!stat.type}
              >
                <p className="text-lg font-black group-hover:text-orange-500 transition-colors">{stat.value}</p>
                <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px]">{stat.label}</p>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3 w-full pt-2">
           <button 
             onClick={() => setSettingsSection('main')}
             className="flex-1 bg-navy-950 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform"
           >
             Settings
           </button>
           <button 
             onClick={() => setShowContactSearch(true)}
             className="flex-1 bg-slate-100 dark:bg-slate-900 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2"
           >
             <UserPlus size={16} /> Search
           </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-black sticky top-0 z-10">
          <button 
            onClick={() => setActiveTab('echoes')}
            className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activeTab === 'echoes' ? 'text-navy-950 dark:text-orange-500' : 'text-slate-400'}`}
          >
            <Layers size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">My Echoes</span>
            {activeTab === 'echoes' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-navy-950 dark:bg-orange-500 rounded-t-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activeTab === 'products' ? 'text-navy-950 dark:text-orange-500' : 'text-slate-400'}`}
          >
            <ShoppingBag size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">My Listings</span>
            {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-navy-950 dark:bg-orange-500 rounded-t-full" />}
          </button>
        </div>

        <div className="p-0.5 pb-24">
          {loadingContent && userEchoes.length === 0 ? (
            <div className="flex justify-center py-20"><LoadingEye /></div>
          ) : activeTab === 'echoes' ? (
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-0.5">
              {userEchoes.map((echo) => echo.mediaUrl && (
                <div 
                  key={echo.id} 
                  onClick={() => setSelectedEcho(echo)}
                  className="aspect-square bg-slate-100 dark:bg-slate-800 relative group cursor-pointer overflow-hidden"
                >
                  <img src={echo.mediaUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white">
                    <div className="flex items-center gap-1 text-[10px] font-bold"><Heart size={12} fill="currentColor" /> {echo.likes}</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold"><MessageCircle size={12} fill="currentColor" /> {echo.comments}</div>
                  </div>
                  <button 
                    onClick={(e) => handleDeleteEcho(e, echo.id)}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {userEchoes.length === 0 && !loadingContent && (
                <div className="col-span-full py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">No echoes yet</div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-0.5">
              {userProducts.map((p) => {
                const isServiceOrRental = p.category === 'Services' || p.category === 'Rental/Hiring';
                return (
                  <div 
                    key={p.id} 
                    onClick={() => setSelectedProduct(p)}
                    className="aspect-square bg-slate-100 dark:bg-slate-800 relative group cursor-pointer overflow-hidden"
                  >
                    <img src={p.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="" />
                    <div className="absolute inset-0 bg-orange-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                        {!isServiceOrRental && <span className="text-sm font-black">${p.price}</span>}
                        <div className="flex gap-2 mt-2">
                          <Eye size={10} />
                          <span className="text-[8px] font-bold">View</span>
                        </div>
                    </div>
                    <button 
                      onClick={(e) => handleDeleteProduct(e, p.id)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              <button 
                onClick={() => setShowSell(true)}
                className="aspect-square bg-orange-50 dark:bg-orange-950/20 flex flex-col items-center justify-center border-2 border-dashed border-orange-200 dark:border-orange-800 active:scale-95 transition-transform"
              >
                <Plus size={32} className="text-orange-500 mb-1" strokeWidth={3} />
                <span className="text-[8px] font-black uppercase tracking-widest text-orange-500">Add New</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {settingsSection && <AppSettingsOverlay user={user} setUser={setUser} initialSection={settingsSection} onClose={() => setSettingsSection(null)} />}
      {showContactSearch && <ContactSearchOverlay onClose={() => setShowContactSearch(false)} />}
      {showSell && <SellProductOverlay onClose={() => { setShowSell(false); fetchUserContent(0, 0, true); toast.success('Product Listed'); }} />}
      {followListType && (
        <FollowListOverlay 
          type={followListType} 
          onClose={() => setFollowListType(null)} 
        />
      )}
      {selectedEcho && (
        <EchoDetailOverlay 
          echo={selectedEcho} 
          onClose={() => setSelectedEcho(null)} 
        />
      )}
      {selectedProduct && (
        <ProductDetailOverlay 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => { toast.success("Added to bag"); setSelectedProduct(null); }}
          onBuyNow={() => { toast.success("Inquiry Transmitted"); setSelectedProduct(null); }}
          onViewProfile={(id) => { setSelectedProduct(null); }}
        />
      )}
    </div>
  );
};

export default ProfilePage;