"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, Layers, ShoppingBag, Activity, Trash2, ShieldCheck, ShieldAlert, Search, Loader2, RefreshCw, TrendingUp, Banknote, Save, Edit2 } from 'lucide-react';
import { adminService } from '../services/adminService';
import { currencyService, CurrencyRate } from '../services/currencyService';
import { User } from '../types';
import LoadingEye from '../components/LoadingEye';
import { toast } from 'react-hot-toast';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalEchoes: 0, totalProducts: 0, totalPulses: 0 });
  const [users, setUsers] = useState<User[]>([]);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>('');

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    fetchData();
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchData = async () => {
    if (isMounted.current) setLoading(true);
    try {
      const [globalStats, allUsers, currencyRates] = await Promise.all([
        adminService.getGlobalStats(),
        adminService.getAllUsers(),
        currencyService.getRates()
      ]);
      if (isMounted.current) {
        setStats(globalStats);
        const uniqueUsers = Array.from(new Map((allUsers || []).map(u => [u.id, u])).values());
        setUsers(uniqueUsers);
        setRates(currencyRates);
      }
    } catch (error) {
      toast.error("Failed to fetch admin data");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast.success("Field Data Synchronized");
  };

  const handleUpdateRate = async (code: string) => {
    const val = parseFloat(tempRate);
    if (isNaN(val) || val <= 0) {
      toast.error("Invalid rate value");
      return;
    }

    try {
      await currencyService.updateRate(code, val);
      setRates(prev => prev.map(r => r.code === code ? { ...r, rate_to_usd: val } : r));
      setEditingRate(null);
      toast.success(`${code} rate updated`);
    } catch (error) {
      toast.error("Failed to update rate");
    }
  };

  const filteredUsers = users.filter(u => {
    const name = (u.displayName || '').toLowerCase();
    const handle = (u.username || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || handle.includes(query);
  });

  if (loading) return <div className="h-full flex items-center justify-center"><LoadingEye size={50} /></div>;

  return (
    <div className="p-6 space-y-8 pb-24 h-full overflow-y-auto no-scrollbar max-w-screen-2xl mx-auto w-full" data-dyad-component="AdminDashboard">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter">Command Center</h1>
          <p className="text-[10px] font-black uppercase tracking-[4px] text-slate-400">EyeField Administration</p>
        </div>
        <button 
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-3 bg-navy-950 text-white rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {[
          { label: 'Total Peers', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Echo Signals', value: stats.totalEchoes, icon: Layers, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/20' },
          { label: 'Market Items', value: stats.totalProducts, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
          { label: 'Pulse Feeds', value: stats.totalPulses, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/20' },
        ].map((stat, i) => (
          <div key={i} className={`${stat.bg} p-6 lg:p-8 rounded-[32px] border border-white/10 shadow-sm`}>
            <div className={`p-2 w-fit rounded-xl bg-white dark:bg-black mb-4 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <p className="text-2xl lg:text-3xl font-black">{stat.value}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Currency Management */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">Currency Matrix (1 USD =)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rates.map((rate) => (
            <div key={rate.code} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-navy-950 dark:text-white">
                    <Banknote size={18} />
                  </div>
                  <span className="text-sm font-black">{rate.code}</span>
                </div>
                {editingRate === rate.code ? (
                  <button onClick={() => handleUpdateRate(rate.code)} className="p-2 bg-emerald-500 text-white rounded-xl active:scale-90 transition-transform">
                    <Save size={16} />
                  </button>
                ) : (
                  <button onClick={() => { setEditingRate(rate.code); setTempRate(rate.rate_to_usd.toString()); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl active:scale-90 transition-transform">
                    <Edit2 size={16} />
                  </button>
                )}
              </div>
              {editingRate === rate.code ? (
                <input 
                  type="number" 
                  value={tempRate}
                  onChange={e => setTempRate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950"
                  autoFocus
                />
              ) : (
                <p className="text-xl font-black">{rate.symbol}{rate.rate_to_usd.toLocaleString()}</p>
              )}
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rate.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* User Management */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Peer Matrix</h3>
          <div className="relative w-48 lg:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search peers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-xl py-2.5 pl-9 pr-3 text-[10px] font-bold outline-none focus:ring-2 focus:ring-navy-950"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Identity</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                  <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover border border-slate-100" alt="" />
                        <div>
                          <p className="text-sm font-black">{user.displayName || 'Unknown'}</p>
                          <p className="text-[10px] text-slate-400 font-bold">@{user.username || 'unknown'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <button 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                          user.isVerified 
                            ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30' 
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                        }`}
                      >
                        {user.isVerified ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                        {user.isVerified ? 'Verified' : 'Standard'}
                      </button>
                    </td>
                    <td className="p-5 text-right">
                      <button 
                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;