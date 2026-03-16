import React, { useState, useRef, useContext, useEffect } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { User as UserType, BusinessDetails } from '../types';
import { SettingsContext } from '../App';
import { profileService } from '../services/profileService';
import { storageService } from '../services/storageService';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

export const EditExperienceSection: React.FC<{ user: UserType; setUser: (u: UserType) => void; onBack: () => void }> = ({ user, setUser }) => {
  const [formData, setFormData] = useState({ ...user });
  const [bizData, setBizData] = useState<BusinessDetails>(
    user.businessDetails 
      ? { ...user.businessDetails } 
      : { name: '', category: 'Fashion', description: '', address: '', website: '', socialMedia: '' }
  );
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const settings = useContext(SettingsContext);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isMounted.current) {
      setLoading(true);
      try {
        const url = await storageService.uploadAvatar(user.id, file);
        if (isMounted.current && url) {
          setFormData({ ...formData, avatar: url });
        }
      } catch (error) {
        alert("Failed to upload image.");
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }
  };

  const save = async () => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const updatedUser = { ...formData, businessDetails: bizData };
      const { error } = await profileService.updateProfile(user.id, updatedUser);
      
      if (error) throw error;
      
      if (isMounted.current) setUser(updatedUser);
      alert("Profile updated in the EyeField.");
    } catch (error) {
      alert("Failed to save changes.");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-10 pb-20 overflow-y-auto no-scrollbar">
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="p-1 rounded-full border-2 border-blue-600 animate-pulse-slow">
            <img src={formData.avatar} className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-4 border-navy-500/20" alt="" />
          </div>
          <button 
            onClick={() => !loading && fileInputRef.current?.click()}
            className="absolute -bottom-2 -right-2 bg-navy-950 text-white p-3 rounded-2xl shadow-xl border-2 border-white dark:border-black active:scale-90 transition-transform disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Public Avatar</p>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 border-b pb-2">{settings?.t('personal_info')}</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Display Identity</label>
            <input value={formData.displayName} onChange={e => { if (isMounted.current) setFormData({...formData, displayName: e.target.value}); }} placeholder="Full Name" className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-blue-600/20 transition-all" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">EyeField Handle</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">@</span>
              <input value={formData.username} onChange={e => { if (isMounted.current) setFormData({...formData, username: e.target.value}); }} placeholder="username" className="w-full bg-slate-50 dark:bg-slate-900 py-4 pl-12 pr-6 rounded-2xl outline-none font-bold text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Gender</label>
              <select value={formData.gender} onChange={e => { if (isMounted.current) setFormData({...formData, gender: e.target.value as any}); }} className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm appearance-none">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Prefer not to say</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Phone Signal</label>
              <input value={formData.phoneNumber} onChange={e => { if (isMounted.current) setFormData({...formData, phoneNumber: e.target.value}); }} placeholder="+00 000 000" className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Neural Bio</label>
            <textarea value={formData.bio} onChange={e => { if (isMounted.current) setFormData({...formData, bio: e.target.value}); }} placeholder="Tell the EyeField about you..." className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm resize-none" rows={3} />
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-10">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 border-b pb-2">{settings?.t('business_info')}</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Business Name</label>
            <input value={bizData.name} onChange={e => { if (isMounted.current) setBizData({...bizData, name: e.target.value}); }} placeholder="Entity Name" className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Industry Sector</label>
            <select value={bizData.category} onChange={e => { if (isMounted.current) setBizData({...bizData, category: e.target.value}); }} className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm appearance-none">
              {['Fashion', 'Tech', 'Health', 'Consulting', 'Retail', 'Food & Beverage', 'Arts', 'Services', 'Education', 'Real Estate', 'Travel', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Operational Address</label>
            <input value={bizData.address} onChange={e => { if (isMounted.current) setBizData({...bizData, address: e.target.value}); }} placeholder="Field Address" className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Web Portal</label>
              <input value={bizData.website} onChange={e => { if (isMounted.current) setBizData({...bizData, website: e.target.value}); }} placeholder="eyefield.me" className="w-full bg-slate-50 dark:bg-slate-900 py-4 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-navy-950 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Social Feed</label>
              <input value={bizData.socialMedia} onChange={e => { if (isMounted.current) setBizData({...bizData, socialMedia: e.target.value}); }} placeholder="@handle" className="w-full bg-slate-50 dark:bg-slate-900 py-4 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-navy-950 outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-4">Listing Narrative</label>
            <textarea value={bizData.description} onChange={e => { if (isMounted.current) setBizData({...bizData, description: e.target.value}); }} placeholder="Venture Description" className="w-full bg-slate-50 dark:bg-slate-900 py-4 px-6 rounded-2xl outline-none font-bold text-sm resize-none" rows={3} />
          </div>
        </div>
      </div>

      <button 
        onClick={save} 
        disabled={loading}
        className="w-full bg-navy-950 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-2"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {settings?.t('save')} Experience
      </button>
    </div>
  );
};