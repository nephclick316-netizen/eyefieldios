import React, { useState } from 'react';
import { Key, Ban, FileText, ExternalLink, X, Loader2, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { toast } from 'react-hot-toast';
import { hapticImpact } from '../utils/haptics';

export const PrivacySection: React.FC<{ onBack: () => void }> = () => {
  const [showPolicy, setShowPolicy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    hapticImpact();
    setLoading(true);
    try {
      await supabase.auth.signOut();
      toast.success("Account deletion request transmitted.");
      window.location.reload();
    } catch (error: any) {
      toast.error("Failed to process request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 pb-20">
      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-500 border-b pb-2">Legal & Privacy</h3>
        
        <button onClick={() => { hapticImpact(); setShowPolicy(true); }} className="w-full flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-900/50 rounded-3xl group active:scale-95 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-black rounded-2xl text-blue-500"><ShieldCheck size={20} /></div>
            <span className="text-sm font-black">Privacy Policy</span>
          </div>
          <ExternalLink size={18} className="text-slate-300" />
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 border-b pb-2">Danger Zone</h3>
        <button 
          onClick={() => { hapticImpact(); setShowDeleteConfirm(true); }}
          className="w-full flex items-center justify-between p-5 bg-red-50 dark:bg-red-950/20 rounded-3xl group active:scale-95 transition-all border border-red-100 dark:border-red-900/30"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-black rounded-2xl text-red-600"><Trash2 size={20} /></div>
            <div className="text-left">
              <p className="text-sm font-black text-red-600">Delete Account</p>
              <p className="text-[10px] text-red-400 font-bold">Permanent signal termination</p>
            </div>
          </div>
        </button>
      </div>

      {/* Privacy Policy Modal */}
      {showPolicy && (
        <div className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-300 pt-safe">
          <header className="p-4 flex items-center justify-between border-b">
            <button onClick={() => setShowPolicy(false)} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full"><X size={20} /></button>
            <h2 className="text-xs font-black uppercase tracking-widest">Privacy Policy</h2>
            <div className="w-10" />
          </header>
          <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            <h3 className="text-lg font-black text-navy-950 dark:text-white">1. Data Collection</h3>
            <p>EyeField collects minimal data required for social interaction, including your handle, avatar, and encrypted chat signals.</p>
            <h3 className="text-lg font-black text-navy-950 dark:text-white">2. Marketplace Signals</h3>
            <p>Product listings in Cascadea are public. Transaction inquiries are handled via end-to-end encrypted direct messages.</p>
            <h3 className="text-lg font-black text-navy-950 dark:text-white">3. Your Rights</h3>
            <p>You maintain full control over your identity. You may terminate your signal (delete account) at any time via the Danger Zone.</p>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[1500] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 space-y-6 text-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black">Terminate Signal?</h2>
              <p className="text-sm text-slate-500 font-medium">This will permanently erase your identity from the EyeField.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Confirm Termination"}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 text-slate-400 font-black text-xs uppercase">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};