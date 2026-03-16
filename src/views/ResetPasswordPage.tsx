import React, { useState, useRef, useEffect } from 'react';
import { Lock, ChevronRight, CheckCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

interface ResetPasswordPageProps {
  onComplete: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setError('');

    if (password.length < 6) {
      if (isMounted.current) setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      if (isMounted.current) setError("Passwords do not match.");
      return;
    }

    if (isMounted.current) setLoading(true);

    try {
      const { error } = await withTimeout(
        supabase.auth.updateUser({
          password: password
        }) as any,
        15000,
        'ResetPassword_updateUser'
      );

      if (error) {
        if (isMounted.current) setError(error.message);
        if (isMounted.current) setLoading(false);
      } else {
        if (isMounted.current) setSuccess(true);
        if (isMounted.current) setLoading(false);
        setTimeout(() => {
          if (isMounted.current) onComplete();
        }, 2000);
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message);
      if (isMounted.current) setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col p-8 items-center justify-center text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-lg">
          <CheckCircle size={32} />
        </div>
        <h1 className="text-2xl font-black tracking-tighter mb-2">Identity Secured</h1>
        <p className="text-slate-500 font-medium">Your vault password has been updated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col p-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-10">
        <div className="space-y-2 text-center">
          <h1 className="text-4xl font-black tracking-tighter text-navy-950 dark:text-white">New Password</h1>
          <p className="text-slate-500 font-medium">Secure your access to the EyeField.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="New Password"
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white/20 transition-all"
                value={password}
                onChange={(e) => { if (isMounted.current) setPassword(e.target.value); }}
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white/20 transition-all"
                value={confirmPassword}
                onChange={(e) => { if (isMounted.current) setConfirmPassword(e.target.value); }}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl">
              <p className="text-[10px] font-black uppercase text-red-500 tracking-widest text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-950 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Updating Vault...' : <>Update Password <ChevronRight size={16} /></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;