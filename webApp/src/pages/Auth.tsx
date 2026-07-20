import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/context/LanguageContext";
import { useUser } from "@/context/UserContext";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Mail, Lock, User, Info, Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { t, language, setLanguage } = useLanguage();
  const { user, isOnboarded } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (isOnboarded) {
        navigate("/");
      } else {
        navigate("/onboarding");
      }
    }
  }, [user, isOnboarded, navigate]);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate("/");
      } else {
        if (password.length < 8 || password.length > 32) {
          toast.error("Password must be between 8 and 32 characters.");
          setLoading(false);
          return;
        }
        if (!acceptTerms) {
          toast.error("Please accept the Terms and Privacy Policy to continue.");
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            }
          }
        });
        if (error) throw error;
        toast.success("Account created! Check your email for verification.");
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/onboarding");
        }
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 blur-[120px] rounded-full" />
      
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => navigate("/cascadea")}
        className="absolute top-6 right-6 p-3 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all z-50 border border-white/10"
      >
        <X size={20} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-12 space-y-4">
          <motion.div 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] bg-accent/5 mb-4 overflow-hidden"
          >
            <img src={logo} alt="EyeField Logo" className="w-full h-full object-contain p-2" />
          </motion.div>
          <h1 className="text-5xl font-black tracking-tighter">
            <span className="text-black dark:text-white">Eye</span>
            <span className="text-[#000080] dark:text-accent">Field</span>
          </h1>
          <div className="max-w-xs mx-auto space-y-2 flex flex-col items-center">
            <p className="text-muted-foreground font-black uppercase tracking-widest text-[10px] leading-tight">
              Socail media meets e-shop Post your feeds and and buy and sell your product with ease
            </p>
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-accent transition-colors">
                  <Info size={14} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">How we use your google account</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 rounded-2xl bg-background/95 backdrop-blur-md border-white/10 shadow-xl">
                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                  EyeField uses your Google account to securely authenticate and sync your profile data.
                  We only access your name, email, and profile picture to enhance your experience.
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="bg-secondary/30 backdrop-blur-xl p-8 rounded-[3rem] border border-white/5 shadow-2xl space-y-8">
          <div className="flex p-1 bg-background/50 rounded-2xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                isLogin ? "bg-[#000080] text-white shadow-lg shadow-[#000080]/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.login")}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl text-sm font-black transition-all ${
                !isLogin ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("auth.signup")}
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  key="signup-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <Label htmlFor="name" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <Input 
                      id="name" 
                      placeholder="John Doe" 
                      required={!isLogin}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-12 h-14 rounded-2xl bg-background/50 border-none focus-visible:ring-accent" 
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-black text-muted-foreground uppercase tracking-widest ml-2">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-background/50 border-none focus-visible:ring-accent" 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-2">
                <Label htmlFor="password" className="text-xs font-black text-muted-foreground uppercase tracking-widest">Password</Label>
                {isLogin && <button type="button" className="text-[10px] font-black text-accent hover:underline">Forgot?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  required
                  minLength={8}
                  maxLength={32}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-14 rounded-2xl bg-background/50 border-none focus-visible:ring-accent" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-accent transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="flex items-start gap-3 px-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-1 border-white/20 data-[state=checked]:bg-accent data-[state=checked]:border-accent" 
                />
                <Label htmlFor="terms" className="text-[10px] font-bold text-muted-foreground leading-relaxed cursor-pointer">
                  I accept the <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
                </Label>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl bg-[#000080] hover:bg-[#000080]/90 text-white font-black text-lg shadow-xl shadow-[#000080]/20 group">
              {loading ? (
                 <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? t("auth.login") : t("auth.signup")}
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black">
              <span className="bg-transparent px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGoogleAuth}
            className="w-full h-14 rounded-2xl border-white/10 hover:border-accent/50 hover:bg-accent/5 gap-3 font-bold text-foreground/90 transition-all duration-300 group relative overflow-hidden shadow-sm hover:shadow-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#4285F4]/5 via-[#EA4335]/5 to-[#FBBC05]/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
            <svg className="w-5 h-5 z-10" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="z-10 group-hover:text-accent transition-colors">{t("auth.google")}</span>
          </Button>

          {isLogin && (
            <div className="text-center">
              <p className="text-[10px] font-bold text-muted-foreground">
                By logging in, you agree to our <Link to="/terms" className="text-accent hover:underline">Terms</Link> and <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>
              </p>
            </div>
          )}
        </div>

        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex gap-2">
            {(["en", "fr", "ar", "es"] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                  language === lang ? "bg-accent text-white" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
            © 2024 EYEFIELD
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;