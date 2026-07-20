"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Star, Rocket, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useSubscription, redirectToCheckout, redirectToPortal } from "@/hooks/useSubscription";

// ─── Map Price IDs ────────────────────────────────────────────────────────────
// Replace these with your REAL Stripe Price IDs from the Stripe Dashboard
const PRICE_IDS = {
  nova_monthly:   "price_1TM2gMFMANTBOZicJhJNUTJC",
  nova_yearly:    "price_1TM2gMFMANTBOZicu4Aoziqd",
  deluxe_monthly: "price_1TM2hDFMANTBOZicFi4jMAE7",
  deluxe_yearly:  "price_1TM2i1FMANTBOZic4iNXzcVX",
  elite_monthly:  "price_1TM2j1FMANTBOZicTYwg8sF6",
  elite_yearly:   "price_1TM2jWFMANTBOZicvOQhthB5",
};

// ─── PricingTier Component ────────────────────────────────────────────────────
const PricingTier = ({
  title,
  monthlyPrice,
  yearlyPrice,
  isYearly,
  description,
  features,
  isPopular = false,
  isElite = false,
  icon: Icon,
  accentColor = "accent",
  buttonText = "Get Started",
  priceId,
  isCurrent = false,
  onAction,
  isActionLoading = false,
}: {
  title: string;
  monthlyPrice: string;
  yearlyPrice: string;
  isYearly: boolean;
  description: string;
  features: string[];
  isPopular?: boolean;
  isElite?: boolean;
  icon: any;
  accentColor?: string;
  buttonText?: string;
  priceId?: string;
  isCurrent?: boolean;
  onAction: () => void;
  isActionLoading?: boolean;
}) => {
  const price = isYearly ? yearlyPrice : monthlyPrice;

  const colorMap: Record<string, string> = {
    accent:  "bg-accent text-white shadow-accent/20",
    blue:    "bg-blue-500 text-white shadow-blue-500/20",
    indigo:  "bg-indigo-600 text-white shadow-indigo-600/20",
    emerald: "bg-emerald-500 text-white shadow-emerald-500/20",
    gold:    "bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 text-slate-900 shadow-yellow-500/30",
  };

  const borderMap: Record<string, string> = {
    accent:  "border-accent/20 hover:border-accent/40",
    blue:    "border-blue-500/20 hover:border-blue-500/40",
    indigo:  "border-indigo-600/20 hover:border-indigo-600/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    gold:    "border-yellow-500/20 hover:border-yellow-500/50",
  };

  const getButtonLabel = () => {
    if (isCurrent) return "Manage Plan";
    if (price === "0") return "Current Plan";
    if (price === "Contact Sales") return buttonText;
    return buttonText;
  };

  const getButtonStyles = () => {
    if (isCurrent) return "bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30";
    if (accentColor === "gold") return "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-950 shadow-lg shadow-yellow-500/20";
    if (isPopular) return "bg-accent hover:bg-accent/90 text-white";
    if (isElite)   return "bg-indigo-600 hover:bg-indigo-700 text-white";
    return "bg-white dark:bg-secondary hover:bg-gray-50 dark:hover:bg-white/10 text-foreground border border-white/10";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Card className={`relative flex flex-col h-full rounded-[3rem] border-white/10 overflow-hidden transition-all duration-500 bg-white/5 backdrop-blur-xl ${borderMap[accentColor]} ${
        isPopular ? "ring-2 ring-accent/30 shadow-2xl shadow-accent/10" : ""
      } ${isCurrent ? "ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-500/10" : ""}`}>

        {isPopular && !isCurrent && (
          <div className="absolute top-0 right-0">
            <div className="bg-accent text-white px-6 py-1.5 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-widest shadow-lg">
              Most Popular
            </div>
          </div>
        )}
        {isCurrent && (
          <div className="absolute top-0 right-0">
            <div className="bg-emerald-500 text-white px-6 py-1.5 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-widest shadow-lg">
              ✓ Active Plan
            </div>
          </div>
        )}

        <CardHeader className="space-y-4 p-8">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${colorMap[accentColor]}`}
          >
            <Icon size={28} />
          </motion.div>
          <div>
            <CardTitle className="text-3xl font-black tracking-tight">{title}</CardTitle>
            <CardDescription className="font-bold text-muted-foreground/80 mt-1">{description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex-grow space-y-8 p-8 pt-0">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter">
              {price === "0" ? "Free" : price === "Contact Sales" ? "Contact" : `$${price}`}
            </span>
            {price !== "0" && price !== "Contact Sales" && (
              <span className="text-muted-foreground font-black text-sm uppercase tracking-widest">/mo</span>
            )}
            {price === "Contact Sales" && (
              <span className="text-muted-foreground font-black text-sm uppercase tracking-widest">Sales</span>
            )}
          </div>

          <ul className="space-y-4">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3 text-sm font-bold">
                <div className={`mt-1 shrink-0 p-0.5 rounded-full ${colorMap[accentColor]}`}>
                  <Check size={12} strokeWidth={4} />
                </div>
                <span className="text-foreground/90 leading-tight">{feature}</span>
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="p-8 pt-0">
          <Button
            className={`w-full h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-xl ${getButtonStyles()}`}
            onClick={onAction}
            disabled={isActionLoading || (!priceId && price !== "0" && price !== "Contact Sales")}
          >
            {isActionLoading ? (
              <><Loader2 className="mr-2 animate-spin" size={20} /> Processing…</>
            ) : (
              <>
                {getButtonLabel()}
                {isCurrent && <ExternalLink className="ml-2" size={16} />}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

// ─── Main Pricing Page ────────────────────────────────────────────────────────
const Pricing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  const { subscription, isLoading: subLoading, isSubscribed } = useSubscription();

  // Show toast on return from Stripe
  React.useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("🎉 Subscription activated! Welcome to the premium experience.");
    }
    if (searchParams.get("canceled") === "true") {
      toast.info("Checkout canceled. You can upgrade anytime.");
    }
  }, [searchParams]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/");
  };

  const handleCheckout = async (priceId: string) => {
    try {
      setLoadingPriceId(priceId);
      await redirectToCheckout(priceId);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to start checkout. Please try again.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleManage = async () => {
    try {
      setLoadingPriceId("portal");
      await redirectToPortal();
    } catch (err: any) {
      toast.error(err.message ?? "Failed to open billing portal.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  const getPriceId = (key: keyof typeof PRICE_IDS) =>
    PRICE_IDS[key];

  const isTierCurrent = (tierKey: string) => {
    if (!isSubscribed) return false;
    return subscription.tier === tierKey;
  };

  const tiers = [
    {
      title: "Starter",
      monthlyPrice: "0",
      yearlyPrice: "0",
      icon: Star,
      accentColor: "emerald",
      description: "Essential AI tools for everyone.",
      features: [
        "AI Product Search",
        "Find Anyone with Endocard",
        "Find Anything with Endocard",
        "In-app AI Guidance",
        "Standard Support",
      ],
      priceId: undefined as string | undefined,
      tierKey: "free",
      onAction: () => {},
    },
    {
      title: "Endocard Nova",
      monthlyPrice: "10",
      yearlyPrice: "8",
      icon: Zap,
      accentColor: "blue",
      description: "Enhanced AI assistance.",
      features: [
        "Everything in the free version",
        "Enjoy 10 more videos and photos on Cascadia and echoes",
        "Talk to Endocard for 5minutes and discover everything it can do for you.",
        "Your Cascadia articles, promoted on Kope up to 5times for a week.",
        "Advanced Endocard AI included",
      ],
      priceId: isYearly ? getPriceId("nova_yearly") : getPriceId("nova_monthly"),
      tierKey: "nova",
      buttonText: "Upgrade to Nova",
    },
    {
      title: "Endocard Deluxe",
      monthlyPrice: "25",
      yearlyPrice: "20",
      icon: Crown,
      accentColor: "accent",
      description: "For serious sellers & creators.",
      features: [
        "Everything in the endocard Nova",
        "Turn your voice into text in seconds",
        "Get 7 days of continuous promotion for your products on Kope.",
        "Personalized profile themes",
        "Verified account badge",
        "Product simulation powered by Endocard",
        "Smart inventory management for your business",
      ],
      priceId: isYearly ? getPriceId("deluxe_yearly") : getPriceId("deluxe_monthly"),
      tierKey: "deluxe",
      isPopular: true,
      buttonText: "Upgrade to Deluxe",
    },
    {
      title: "Endocard Elite",
      monthlyPrice: "129",
      yearlyPrice: "99",
      icon: Rocket,
      accentColor: "indigo",
      description: "The ultimate automation suite.",
      features: [
        "Everything in the Endocard deluxe",
        "Smart WhatsApp automation",
        "Smart email automation",
        "Interact with AI Endocard by voice for your services",
        "Automatically make your reservations with AI Endocard",
        "Smart business management",
        "Extreme Endocard AI intelligence",
      ],
      priceId: isYearly ? getPriceId("elite_yearly") : getPriceId("elite_monthly"),
      tierKey: "elite",
      isElite: true,
      buttonText: "Go Elite",
    },
    {
      title: "Endocard Luhande",
      monthlyPrice: "Contact Sales",
      yearlyPrice: "Contact Sales",
      icon: Star,
      accentColor: "gold",
      description: "Prestige enterprise solutions.",
      features: [
        "Everything in the Endocard Elite",
        "Free website creation",
      ],
      priceId: undefined,
      tierKey: "luhande",
      buttonText: "Contact Sales",
      onAction: () => navigate("/contact"),
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white relative overflow-hidden pb-20">
      {/* Animated background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-accent/20 blur-[150px] rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, -40, 0], y: [0, -50, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full"
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 pt-12 space-y-16 relative z-10">
        <header className="flex flex-col items-center text-center space-y-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="rounded-full hover:bg-white/10 self-start md:absolute md:left-12 text-white"
          >
            <ArrowLeft className="mr-2" size={20} /> Back
          </Button>

          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30 px-6 py-1.5 rounded-full font-black uppercase tracking-[0.3em] text-[10px]">
                Premium Experience
              </Badge>
            </motion.div>
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none">
              Supercharge your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-orange-400 to-indigo-400">Experience</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto font-bold text-xl leading-relaxed">
              Choose the perfect plan to unlock the full potential of Endocard AI and the EyeField ecosystem.
            </p>
          </div>

          {/* Billing Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-6 bg-white/5 backdrop-blur-md p-2 rounded-[2rem] border border-white/10 shadow-2xl"
          >
            <span className={`text-sm font-black transition-colors ${!isYearly ? "text-white" : "text-muted-foreground"}`}>Monthly</span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-accent h-8 w-14"
            />
            <div className="flex items-center gap-3">
              <span className={`text-sm font-black transition-colors ${isYearly ? "text-white" : "text-muted-foreground"}`}>Yearly</span>
              <Badge className="bg-emerald-500 text-white border-none text-[10px] font-black px-3 py-1 rounded-full shadow-lg shadow-emerald-500/20">
                SAVE 20%
              </Badge>
            </div>
          </motion.div>
        </header>

        {/* Active subscription banner */}
        {!subLoading && isSubscribed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left"
          >
            <div>
              <p className="font-black text-emerald-300">✓ You have an active {subscription.tier?.toUpperCase()} subscription</p>
              {subscription.currentPeriodEnd && (
                <p className="text-sm text-muted-foreground font-semibold mt-1">
                  {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 rounded-xl font-black"
              onClick={handleManage}
              disabled={loadingPriceId === "portal"}
            >
              {loadingPriceId === "portal" ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
              Manage Billing
            </Button>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-8">
          {tiers.map((tier) => {
            const current = isTierCurrent(tier.tierKey);
            const pid = tier.priceId;
            const isThisLoading = !!pid && loadingPriceId === pid;

            return (
              <PricingTier
                key={tier.title}
                title={tier.title}
                monthlyPrice={tier.monthlyPrice}
                yearlyPrice={tier.yearlyPrice}
                isYearly={isYearly}
                icon={tier.icon}
                accentColor={tier.accentColor}
                description={tier.description}
                features={tier.features}
                isPopular={(tier as any).isPopular}
                isElite={(tier as any).isElite}
                buttonText={(tier as any).buttonText ?? "Get Started"}
                priceId={pid}
                isCurrent={current}
                isActionLoading={isThisLoading || (current && loadingPriceId === "portal")}
                onAction={current ? handleManage : pid ? () => handleCheckout(pid) : () => {}}
              />
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl rounded-[4rem] p-10 md:p-20 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-12 shadow-3xl"
        >
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">Need a custom solution?</h2>
            <p className="text-muted-foreground font-bold text-xl max-w-xl">
              We offer tailored packages for large enterprises and agencies looking to scale with AI.
            </p>
          </div>
          <Button
            variant="outline"
            className="h-20 px-16 rounded-[2rem] font-black text-xl border-white/20 hover:bg-white/10 text-white transition-all hover:scale-105 active:scale-95"
          >
            Contact Sales
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Pricing;