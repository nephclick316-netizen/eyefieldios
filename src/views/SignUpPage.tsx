import React, { useState, useRef, useEffect } from 'react';
import { Mail, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { withTimeout } from '../utils/queryUtils';

interface SignUpPageProps {
  onSignUp: () => void;
  onGoToSignIn: () => void;
}

const SignUpPage: React.FC<SignUpPageProps> = ({ onSignUp, onGoToSignIn }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleGoogleSignUp = async () => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted.current) return;
    setError('');

    if (password !== confirmPassword) {
      if (isMounted.current) setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      if (isMounted.current) setError("Password must be at least 6 characters.");
      return;
    }

    if (isMounted.current) setLoading(true);

    try {
      const { error } = await withTimeout(
        supabase.auth.signUp({
          email,
          password,
        }) as any,
        15000,
        'SignUp_emailPassword'
      );

      if (error) {
        if (error.message.includes('rate limit')) {
          if (isMounted.current) setError("Too many attempts. Please wait a few minutes.");
        } else {
          if (isMounted.current) setError(error.message);
        }
        if (isMounted.current) setLoading(false);
      } else {
        if (isMounted.current) onSignUp();
      }
    } catch (err: any) {
      if (isMounted.current) setError(err.message);
      if (isMounted.current) setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col p-8 animate-in fade-in duration-500">
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full gap-10">
        <div className="space-y-2 text-center">
          <img src="/Logo-icon2.png" alt="EyeField Logo" className="w-24 h-24 mx-auto mb-4 object-contain" />
          <h1 className="text-4xl font-black tracking-tighter text-navy-950 dark:text-white">EyeField</h1>
          <p className="text-slate-500 font-medium">Your identity begins here.</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-4 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
            Sign up with Google
          </button>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">or use email</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-navy-950 dark:focus:ring-white/20 transition-all"
                  value={confirmPassword}
                  onChange={(e) => { if (isMounted.current) setConfirmPassword(e.target.value); }}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-900 flex items-start gap-3">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-950 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Initializing...' : <>Create Account <ChevronRight size={16} /></>}
              </button>
            </div>
          </form>
        </div>

        <div className="text-center pt-4">
          <p className="text-sm text-slate-500 font-medium">
            Already registered? <button onClick={onGoToSignIn} className="text-navy-950 dark:text-blue-600 font-bold">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;