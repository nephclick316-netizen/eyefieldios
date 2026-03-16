import React, { useState, useEffect, useContext, useRef } from 'react';
import { X, MapPin, Link as LinkIcon, Heart, MessageCircle, UserPlus, UserMinus, Briefcase, Phone, Layers, ShoppingBag, Eye, Loader2 } from 'lucide-react';
import { User as UserType, Echo, Product } from '../types';
import { profileService } from '../services/profileService';
import { statsService } from '../services/statsService';
import { followService } from '../services/followService';
import { echoService } from '../services/echoService';
import { productService } from '../services/productService';
import { supabase } from '../utils/supabaseClient';
import { EchoDetailOverlay } from './EchoDetailOverlay';
import { ProductDetailOverlay } from './ProductDetailOverlay';
import { SettingsContext } from '../App';
import { withTimeout } from '../utils/queryUtils';
import { toast } from 'react-hot-toast';
import LoadingEye from './LoadingEye';

export const OtherProfileOverlay: React.FC<{ userId: string; onClose: () => void }> = ({ userId, onClose }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'echoes' | 'products'>('products');
  const [stats, setStats] = useState({ echoes: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedEcho, setSelectedEcho] = useState<Echo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const settings = useContext(SettingsContext);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  const fetchData = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'OtherProfile_getSession');
      if (isMounted.current) setCurrentUserId(session?.user?.id || null);

      const [profile, profileStats, userEchoesRes, userProductsRes, followingStatus] = await Promise.all([
        profileService.getProfile(userId),
        statsService.getProfileStats(userId),
        echoService.getUserEchoes(userId),
        productService.getUserProducts(userId),
        session?.user ? followService.isFollowing(session.user.id, userId) : Promise.resolve(false)
      ]);

      if (isMounted.current) {
        setUser(profile);
        setStats(profileStats);
        setEchoes(userEchoesRes.data);
        setProducts(userProductsRes.data);
        setIsFollowing(followingStatus);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
      toast.error("Failed to load profile data.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUserId || !isMounted.current) return;

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(currentUserId, userId);
        if (isMounted.current) setIsFollowing(false);
        if (isMounted.current) setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
      } else {
        await followService.followUser(currentUserId, userId);
        if (isMounted.current) setIsFollowing(true);
        if (isMounted.current) setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      }
    } catch (error) {
      console.error("Failed to toggle follow status:", error);
      toast.error("Failed to update follow status.");
    } finally {
      if (isMounted.current) setFollowLoading(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 z-[1500] bg-white dark:bg-black flex items-center justify-center">
      <LoadingEye size={40} />
    </div>
  );

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[1500] bg-white dark:bg-black flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar">
      <header className="p-4 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-20 pt-safe">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><X size={20} /></button>
        <h1 className="text-sm font-bold">@{user.username}</h1>
        <div className="w-10" />
      </header>

      <div className="px-6 py-4 flex flex-col items-center gap-4 text-center">
        <img src={user.avatar} className="w-24 h-24 rounded-full object-cover border-2 border-orange-500 shadow-2xl" alt="" />

        <div className="space-y-1">
          <h2 className="text-xl font-black tracking-tight">{user.displayName}</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 px-4 font-medium leading-relaxed">{user.bio || 'EyeField Member'}</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
          <span className="flex items-center gap-1"><MapPin size={12} className="text-orange-500" /> {user.businessDetails?.address || 'Global'}</span>
          {user.businessDetails?.website && <span className="flex items-center gap-1 text-navy-950 dark:text-navy-300"><LinkIcon size={12} /> {user.businessDetails.website}</span>}
        </div>

        <div className="flex justify-center gap-8 w-full py-6 border-y border-slate-50 dark:border-slate-800">
          <div className="text-center">
            <p className="text-lg font-black">{stats.echoes}</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px]">Echoes</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black">{stats.followers}</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px]">Followers</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-black">{stats.following}</p>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-[2px]">Following</p>
          </div>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={handleFollowToggle}
            disabled={followLoading || currentUserId === userId}
            className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 ${isFollowing ? 'bg-slate-100 dark:bg-slate-900 text-slate-500' : 'bg-navy-950 text-white'
              } ${currentUserId === userId ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {followLoading ? <Loader2 className="animate-spin" size={16} /> : isFollowing ? <><UserMinus size={16} /> Unfollow</> : <><UserPlus size={16} /> Follow</>}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-black sticky top-0 z-10">
          <button
            onClick={() => { if (isMounted.current) setActiveTab('products'); }}
            className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activeTab === 'products' ? 'text-navy-950 dark:text-orange-500' : 'text-slate-400'}`}
          >
            <ShoppingBag size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Listings</span>
            {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-navy-950 dark:bg-orange-500 rounded-t-full" />}
          </button>
          <button
            onClick={() => { if (isMounted.current) setActiveTab('echoes'); }}
            className={`flex-1 flex flex-col items-center py-4 gap-1 relative transition-colors ${activeTab === 'echoes' ? 'text-navy-950 dark:text-orange-500' : 'text-slate-400'}`}
          >
            <Layers size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Echoes</span>
            {activeTab === 'echoes' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-navy-950 dark:bg-orange-500 rounded-t-full" />}
          </button>
        </div>

        <div className="p-0.5 pb-10">
          {activeTab === 'products' ? (
            <div className="grid grid-cols-3 gap-0.5">
              {products.map((p) => {
                const isServiceOrRental = p.category === 'Services' || p.category === 'Rental/Hiring';
                return (
                  <div
                    key={p.id}
                    onClick={() => { if (isMounted.current) setSelectedProduct(p); }}
                    className="aspect-square bg-slate-100 dark:bg-slate-800 relative group cursor-pointer overflow-hidden"
                  >
                    <img src={p.imageUrl} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-orange-500/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center">
                      {!isServiceOrRental && <span className="text-sm font-black">${p.price}</span>}
                      <div className="flex gap-2 mt-2">
                        <Eye size={10} />
                        <span className="text-[8px] font-bold">View</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {products.length === 0 && <div className="col-span-3 py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">No listings yet</div>}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {echoes.map((echo) => echo.mediaUrl && (
                <div
                  key={echo.id}
                  onClick={() => { if (isMounted.current) setSelectedEcho(echo); }}
                  className="aspect-square bg-slate-100 dark:bg-slate-800 relative group cursor-pointer overflow-hidden"
                >
                  <img src={echo.mediaUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 text-white">
                    <div className="flex items-center gap-1 text-[10px] font-bold"><Heart size={12} fill="currentColor" /> {echo.likes}</div>
                    <div className="flex items-center gap-1 text-[10px] font-bold"><MessageCircle size={12} fill="currentColor" /> {echo.comments}</div>
                  </div>
                </div>
              ))}
              {echoes.length === 0 && <div className="col-span-3 py-20 text-center opacity-20 font-black uppercase tracking-widest text-xs">No echoes yet</div>}
            </div>
          )}
        </div>
      </div>

      {selectedEcho && (
        <EchoDetailOverlay
          echo={selectedEcho}
          onClose={() => { if (isMounted.current) setSelectedEcho(null); }}
        />
      )}

      {selectedProduct && (
        <ProductDetailOverlay
          product={selectedProduct}
          onClose={() => { if (isMounted.current) setSelectedProduct(null); }}
          onAddToCart={() => { toast.success("Added to bag!"); if (isMounted.current) setSelectedProduct(null); }}
          onBuyNow={() => { toast.success("Inquiry Transmitted"); if (isMounted.current) setSelectedProduct(null); }}
          onViewProfile={() => { if (isMounted.current) setSelectedProduct(null); }}
        />
      )}
    </div>
  );
};

export default OtherProfileOverlay;