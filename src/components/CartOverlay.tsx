import React from 'react';
import { ChevronLeft, Trash2, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface CartOverlayProps {
  items: Product[];
  onClose: () => void;
  onRemove: (id: string) => void;
}

export const CartOverlay: React.FC<CartOverlayProps> = ({ items, onClose, onRemove }) => {
  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="fixed inset-0 z-[1200] bg-white dark:bg-black p-6 flex flex-col animate-in slide-in-from-right duration-300 pt-safe">
      <header className="flex justify-between items-center mb-10">
        <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><ChevronLeft size={24} /></button>
        <h2 className="text-sm font-black uppercase tracking-widest">Your Bag</h2>
        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
             <ShoppingBag size={48} />
             <p className="font-black uppercase tracking-[5px]">Signal Empty</p>
          </div>
        ) : (
          items.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
              <img src={item.imageUrl} className="w-16 h-16 rounded-2xl object-cover" alt="" />
              <div className="flex-1">
                <h4 className="text-sm font-black truncate">{item.name}</h4>
                <p className="text-xs font-bold text-orange-500">${item.price}</p>
              </div>
              <button onClick={() => onRemove(item.id)} className="p-2 text-red-500 bg-white dark:bg-black rounded-xl shadow-sm">
                <Trash2 size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-6 pb-safe">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-black uppercase text-slate-400">Total Signal</span>
            <span className="text-2xl font-black">${total.toFixed(2)}</span>
          </div>
          <button className="w-full bg-navy-950 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-transform">
            Checkout Now
          </button>
        </div>
      )}
    </div>
  );
};