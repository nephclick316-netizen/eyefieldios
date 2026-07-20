import React, { useState, useEffect, useRef } from 'react';
import { User, Check, Briefcase, Phone, Globe, Instagram, MapPin, Camera } from 'lucide-react';
import { User as UserType } from '../types';
import { AFRICAN_COUNTRIES_DATA } from '../utils/countryData';
import { supabase } from '../utils/supabaseClient';
import { profileService } from '../services/profileService';
import { storageService } from '../services/storageService';
import { withTimeout } from '../utils/queryUtils';

interface OnboardingPageProps {
  onComplete: (userData: Partial<UserType>) => void;
}

const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUsernameEdited, setIsUsernameEdited] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const randomSuffix = useRef(Math.floor(Math.random() * 10000));

  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    gender: 'male' as const,
    countryCode: '+254',
    phoneNumber: '',
    businessName: '',
    businessCategory: 'Fashion',
    businessDescription: '',
    businessAddress: '',
    website: '',
    socialMedia: ''
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (step === 1 && !isUsernameEdited && formData.displayName) {
      const generated = formData.displayName.toLowerCase().replace(/[^a-z0-9]/g, '_') + randomSuffix.current;
      if (isMounted.current) setFormData(prev => ({ ...prev, username: generated }));
    }
  }, [formData.displayName, step, isUsernameEdited]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isMounted.current) {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview); // Clean up previous preview
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;

    if (step === 1) {
      if (!formData.displayName || !formData.username || !formData.phoneNumber) {
        alert("Please fill all required personal fields.");
        return;
      }
      if (isMounted.current) setStep(2);
    } else {
      setLoading(true);

      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'Onboarding_getSession');
      if (!session?.user || !isMounted.current) return;

      let avatarUrl = avatarPreview;
      if (avatarFile) {
        const uploadedUrl = await storageService.uploadAvatar(session.user.id, avatarFile);
        if (isMounted.current && uploadedUrl) avatarUrl = uploadedUrl;
      }

      const businessDetails = {
        name: formData.businessName,
        category: formData.businessCategory,
        description: formData.businessDescription,
        address: formData.businessAddress,
        website: formData.website,
        socialMedia: formData.socialMedia
      };

      const updates: Partial<UserType> = {
        displayName: formData.displayName,
        username: formData.username,
        avatar: avatarUrl || undefined,
        gender: formData.gender as any,
        phoneNumber: `${formData.countryCode} ${formData.phoneNumber}`,
        businessDetails
      };

      try {
        await profileService.updateProfile(session.user.id, updates);
        if (isMounted.current) onComplete(updates);
      } catch (error: any) {
        alert(error.message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    }
  };

  const selectedCountry = AFRICAN_COUNTRIES_DATA.find(c => c.code === formData.countryCode);

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8 animate-in fade-in duration-500 flex flex-col no-scrollbar overflow-y-auto">
      <div className="max-w-sm mx-auto w-full flex-1 flex flex-col">
        <header className="space-y-4 mb-10">
          <h1 className="text-3xl font-black tracking-tighter">
            {step === 1 ? "Set your signature" : "Grow your signal"}
          </h1>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">
            {step === 1
              ? "Tell us who you are in the EyeField. Your handle is your unique identifier."
              : "Tell the EyeField about your venture. This helps peers discover your services."
            }
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          {step === 1 ? (
            <div className="space-y-6 flex-1">
              {/* Avatar Picker */}
              <div className="flex flex-col items-center gap-4 mb-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img src={avatarPreview} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <User className="text-slate-300" size={40} />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-navy-950 text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform"
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Image</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    placeholder="e.g. Alex Carter"
                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                    value={formData.displayName}
                    onChange={e => { if (isMounted.current) setFormData({ ...formData, displayName: e.target.value }); }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                  <input
                    placeholder="username"
                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                    value={formData.username}
                    onChange={e => {
                      if (isMounted.current) {
                        setFormData({ ...formData, username: e.target.value });
                        setIsUsernameEdited(true);
                      }
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Gender *</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none appearance-none"
                  value={formData.gender}
                  onChange={e => { if (isMounted.current) setFormData({ ...formData, gender: e.target.value as any }); }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Phone Signal *</label>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none appearance-none"
                      value={formData.countryCode}
                      onChange={e => { if (isMounted.current) setFormData({ ...formData, countryCode: e.target.value }); }}
                    >
                      {AFRICAN_COUNTRIES_DATA.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code} ({country.name})
                        </option>
                      ))}
                    </select>
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                      {selectedCountry?.flag}
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      placeholder={selectedCountry?.placeholder || 'XXX XXX XXXX'}
                      className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                      value={formData.phoneNumber}
                      onChange={e => { if (isMounted.current) setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') }); }}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Name *</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    placeholder="e.g. EyeField Boutique"
                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                    value={formData.businessName}
                    onChange={e => { if (isMounted.current) setFormData({ ...formData, businessName: e.target.value }); }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Business Category *</label>
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none appearance-none"
                  value={formData.businessCategory}
                  onChange={e => { if (isMounted.current) setFormData({ ...formData, businessCategory: e.target.value }); }}
                >
                  {['Fashion', 'Tech', 'Health', 'Consulting', 'Retail', 'Food & Beverage', 'Arts', 'Services', 'Education', 'Real Estate', 'Travel', 'Other'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description *</label>
                <textarea
                  rows={3}
                  placeholder="What is the essence of your venture?"
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none resize-none"
                  value={formData.businessDescription}
                  onChange={e => { if (isMounted.current) setFormData({ ...formData, businessDescription: e.target.value }); }}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    placeholder="e.g. 123 Field Lane"
                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                    value={formData.businessAddress}
                    onChange={e => { if (isMounted.current) setFormData({ ...formData, businessAddress: e.target.value }); }}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Web Portal</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      placeholder="eyefield.com"
                      className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                      value={formData.website}
                      onChange={e => { if (isMounted.current) setFormData({ ...formData, website: e.target.value }); }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Social Feed</label>
                  <div className="relative">
                    <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      placeholder="@handle"
                      className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-10 pr-4 text-[11px] font-bold focus:ring-2 focus:ring-navy-950 outline-none"
                      value={formData.socialMedia}
                      onChange={e => { if (isMounted.current) setFormData({ ...formData, socialMedia: e.target.value }); }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-10 w-full bg-navy-950 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? 'Transmitting...' : step === 1 ? "Next Step" : "Enter the EyeField"} <Check size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;