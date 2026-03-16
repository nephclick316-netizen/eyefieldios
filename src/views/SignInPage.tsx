import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, ChevronRight, AlertCircle, Eye } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

interface SignInPageProps {
  onSignIn: () => void;
  onGoToSignUp: () => void;
}

const SignInPage: React.FC<SignInPageProps> = ({ onSignIn, onGoToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoError, setLogoError] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setLoading(true);
    setError('');

    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }) as any,
        15000,
        'SignIn_password'
      );

      if (error) {
        if (isMounted.current) setError(error.message);
        if (isMounted.current) setLoading(false);
      } else {
        if (isMounted.current) onSignIn();
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message);
      if (isMounted.current) setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setLoading(true);
    setError('');

    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }) as any,
        15000,
        'SignIn_resetPassword'
      );

      if (error) {
        if (isMounted.current) setError(error.message);
      } else {
        if (isMounted.current) setResetEmailSent(true);
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const Logo = () => (
    <div className="w-24 h-24 flex items-center justify-center mx-auto mb-6 overflow-hidden">
      {!logoError ? (
        <img 
          src="/Logo-icon2.png" 
          alt="EyeField Logo" 
          className="w-full h-full object-contain" 
          onError={() => setLogoError(true)}
        />
      ) : (
        <Eye size={48} className="text-navy-950 dark:text-white" />
      )}
    </div>
  );

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col p-8 animate-in fade-in duration-500 no-scrollbar overflow-hidden">
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-8">
          <div className="space-y-2 text-center">
            <Logo />
            <h1 className="text-3xl font-black tracking-tighter text-navy-950 dark:text-white">Recover Signal</h1>
            <p className="text-slate-500 font-medium">We'll send a pulse to your inbox.</p>
          </div>

          {resetEmailSent ? (
            <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-3xl border border-green-100 dark:border-green-900 text-center space-y-2 animate-in zoom-in duration-300">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300">Reset link transmitted!</p>
              <p className="text-[10px] text-green-600 dark:text-green-400 uppercase font-black">Check your neural feed</p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleForgotPasswordSubmit}>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  placeholder="Recovery email"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white/20 transition-all"
                  value={email}
                  onChange={(e) => { if (isMounted.current) setEmail(e.target.value); }}
                  required
                />
              </div>
              {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy-950 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                >
                  {loading ? 'Transmitting...' : 'Send Recovery Pulse'}
                </button>
                <button
                  type="button"
                  onClick={() => { if (isMounted.current) setIsForgotPassword(false); }}
                  className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest"
                >
                  Back to Login
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col p-8 animate-in fade-in duration-500 no-scrollbar overflow-hidden">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-10">
        <div className="space-y-2 text-center">
          <Logo />
          <h1 className="text-4xl font-black tracking-tighter text-navy-950 dark:text-white">EyeField</h1>
          <p className="text-slate-500 font-medium">Welcome back to the EyeField.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-4 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">or use email</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  placeholder="Email address"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white/20 transition-all"
                  value={email}
                  onChange={(e) => { if (isMounted.current) setEmail(e.target.value); }}
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white/20 transition-all"
                  value={password}
                  onChange={(e) => { if (isMounted.current) setPassword(e.target.value); }}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-xl">
                <p className="text-[10px] font-black uppercase text-red-500 tracking-widest text-center">{error}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => { if (isMounted.current) setIsForgotPassword(true); }}
                className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot identity?
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-950 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500 font-medium">
            New here? <button onClick={onGoToSignUp} className="text-navy-950 dark:text-blue-600 font-bold">Join the Field</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;