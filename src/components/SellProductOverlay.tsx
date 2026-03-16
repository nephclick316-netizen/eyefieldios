import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Tag, DollarSign, Layout, Loader2, Check, Plus, Info } from 'lucide-react';
import { productService } from '../services/productService';
import { storageService } from '../services/storageService';
import { supabase } from '../utils/supabaseClient';
import { ProductCondition } from '../types';
import { withTimeout } from '../utils/queryUtils';

const MAX_PRODUCT_IMAGES = 3;

export const SellProductOverlay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'Fashion',
    condition: 'New' as ProductCondition,
    description: ''
  });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const categories = [
    'Accommodations',
    'Rental/Hiring',
    'Auto Mobile',
    'Fashion',
    'Tech',
    'Home',
    'Art',
    'Lifestyle',
    'Food',
    'Services',
    'Real Estate'
  ];

  const conditions: ProductCondition[] = ['New', 'Used', 'Refurbished'];

  const isServiceOrRental = formData.category === 'Services' || formData.category === 'Rental/Hiring';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!isMounted.current || files.length === 0) return;

    const remaining = MAX_PRODUCT_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, Math.max(0, remaining)) as File[];
    if (toAdd.length === 0) {
      e.target.value = '';
      return;
    }

    setImageFiles((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [...prev, ...toAdd.map((f: File) => URL.createObjectURL(f))]);
    e.target.value = '';
  };

  const removeImageAt = (index: number) => {
    if (!isMounted.current) return;
    const previewToRemove = imagePreviews[index];
    if (previewToRemove) URL.revokeObjectURL(previewToRemove);

    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0 || !formData.name || (!isServiceOrRental && !formData.price) || !isMounted.current) return;

    setLoading(true);
    try {
      const { data: { session } } = await withTimeout(supabase.auth.getSession() as any, 10000, 'SellProduct_getSession');
      if (!session?.user || !isMounted.current) throw new Error("No active session found. Please sign in again.");

      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const uploadedUrl = await storageService.uploadProductImage(session.user.id, file);
        if (!uploadedUrl) throw new Error("Image upload failed.");
        uploadedUrls.push(uploadedUrl);
      }

      const primaryUrl = uploadedUrls[0];

      await productService.createProduct(session.user.id, {
        name: formData.name,
        price: isServiceOrRental ? 0 : parseFloat(formData.price),
        category: formData.category,
        condition: isServiceOrRental ? undefined : formData.condition,
        description: formData.description,
        imageUrl: primaryUrl,
        imageUrls: uploadedUrls
      });

      if (isMounted.current) onClose();
    } catch (error: any) {
      console.error("Listing error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to list product: ${errorMessage}`);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-bottom duration-300 pt-safe overflow-y-auto no-scrollbar">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full" disabled={loading}>
          <X size={24} />
        </button>
        <h2 className="text-sm font-black uppercase tracking-widest">List Product</h2>
        <div className="w-10" />
      </header>

      <form onSubmit={handleList} className="space-y-8 pb-10">
        <div className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
            Product Images (max {MAX_PRODUCT_IMAGES})
          </label>
          <div className="grid grid-cols-3 gap-3">
            {imagePreviews.map((preview, index) => (
              <div
                key={preview}
                className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 group"
              >
                <img src={preview} className="w-full h-full object-cover" alt="" />
                <button
                  type="button"
                  onClick={() => removeImageAt(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {imagePreviews.length < MAX_PRODUCT_IMAGES && (
              <button
                type="button"
                onClick={() => !loading && fileInputRef.current?.click()}
                className="aspect-square rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <Plus size={24} className="text-slate-300" />
                <span className="text-[8px] font-black uppercase mt-1 text-slate-400">Add Image</span>
              </button>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Product Name</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                placeholder="e.g. 2024 Luxury Sedan"
                className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950"
                value={formData.name}
                onChange={e => { if (isMounted.current) setFormData({ ...formData, name: e.target.value }); }}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Category</label>
              <div className="relative">
                <Layout className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none appearance-none"
                  value={formData.category}
                  onChange={e => { if (isMounted.current) setFormData({ ...formData, category: e.target.value }); }}
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Price (USD)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  placeholder={isServiceOrRental ? "N/A" : "0.00"}
                  className={`w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 focus:ring-navy-950 ${isServiceOrRental ? 'opacity-50 cursor-not-allowed' : ''}`}
                  value={isServiceOrRental ? '' : formData.price}
                  onChange={e => { if (isMounted.current) setFormData({ ...formData, price: e.target.value }); }}
                  disabled={isServiceOrRental}
                  required={!isServiceOrRental}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Condition</label>
            <div className="relative">
              <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                className={`w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none appearance-none ${isServiceOrRental ? 'opacity-50 cursor-not-allowed' : ''}`}
                value={isServiceOrRental ? '' : formData.condition}
                onChange={e => { if (isMounted.current) setFormData({ ...formData, condition: e.target.value as ProductCondition }); }}
                disabled={isServiceOrRental}
                required={!isServiceOrRental}
              >
                {!isServiceOrRental && conditions.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                {isServiceOrRental && <option value="">Not Applicable</option>}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
            <textarea
              rows={4}
              placeholder="Describe the item's essence..."
              className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl py-4 px-6 text-sm font-bold outline-none resize-none"
              value={formData.description}
              onChange={e => { if (isMounted.current) setFormData({ ...formData, description: e.target.value }); }}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || imageFiles.length === 0}
          className="w-full bg-navy-950 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          List in Cascadea
        </button>
      </form>
    </div>
  );
};