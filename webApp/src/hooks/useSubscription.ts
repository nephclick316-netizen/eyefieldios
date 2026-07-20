// src/hooks/useSubscription.ts
// Universal hook — works in this app AND any other app on the same Supabase project

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "unpaid"
  | "paused"
  | null;

export type SubscriptionTier =
  | "luhande"   // Prestige / Enterprise
  | "elite"     // $129/mo
  | "deluxe"    // $25/mo
  | "nova"      // $10/mo
  | "free"
  | null;

export interface SubscriptionData {
  id: string | null;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  priceId: string | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
}

const PRICE_TO_TIER: Record<string, SubscriptionTier> = {
  "price_1TM2gMFMANTBOZicJhJNUTJC": "nova",
  "price_1TM2gMFMANTBOZicu4Aoziqd": "nova",
  "price_1TM2hDFMANTBOZicFi4jMAE7": "deluxe",
  "price_1TM2i1FMANTBOZic4iNXzcVX": "deluxe",
  "price_1TM2j1FMANTBOZicTYwg8sF6": "elite",
  "price_1TM2jWFMANTBOZicvOQhthB5": "elite",
};

const DEFAULT_DATA: SubscriptionData = {
  id: null,
  status: null,
  tier: "free",
  priceId: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchSubscription() {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (isMounted) {
          setSubscription(DEFAULT_DATA);
          setIsLoading(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select("id, status, price_id, current_period_end, cancel_at_period_end")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isMounted) {
        if (error || !data) {
          setSubscription(DEFAULT_DATA);
        } else {
          setSubscription({
            id: data.id,
            status: data.status as SubscriptionStatus,
            tier: PRICE_TO_TIER[data.price_id] ?? "free",
            priceId: data.price_id,
            currentPeriodEnd: data.current_period_end
              ? new Date(data.current_period_end)
              : null,
            cancelAtPeriodEnd: data.cancel_at_period_end ?? false,
          });
        }
        setIsLoading(false);
      }
    }

    fetchSubscription();

    // Re-fetch on auth state changes (e.g., user logs in on other app)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchSubscription();
    });

    // Real-time updates when Stripe webhook updates the subscription
    const channel = supabase
      .channel("subscription-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        () => fetchSubscription()
      )
      .subscribe();

    return () => {
      isMounted = false;
      authSub?.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Helpers
  const isSubscribed = subscription.status === "active" || subscription.status === "trialing";
  const hasAccess = (requiredTier: SubscriptionTier) => {
    if (requiredTier === "free") return true;
    const order: SubscriptionTier[] = ["free", "nova", "deluxe", "elite", "luhande"];
    const userLevel = order.indexOf(subscription.tier ?? "free");
    const reqLevel = order.indexOf(requiredTier);
    return isSubscribed && userLevel >= reqLevel;
  };

  return { subscription, isLoading, isSubscribed, hasAccess };
}

// ─────────────────────────────────────────────────────────
// Utility functions callable from any component / page
// ─────────────────────────────────────────────────────────

/** Redirect user to Stripe Checkout for a given price */
export async function redirectToCheckout(priceId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User is not authenticated.");

  const res = await supabase.functions.invoke("create-checkout-session", {
    body: { priceId },
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (res.error) {
    console.error("Stripe Checkout Error:", res.error);
    // Try to get a more descriptive error if available
    const errorMsg = res.error.message || "Failed to start checkout session";
    throw new Error(errorMsg);
  }
  
  if (res.data?.url) {
    window.location.href = res.data.url;
  } else {
    throw new Error("No checkout URL returned from server.");
  }
}

/** Redirect user to Stripe Customer Portal to manage their subscription */
export async function redirectToPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("User is not authenticated.");

  const res = await supabase.functions.invoke("create-portal-link", {
    body: {},
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (res.error) throw new Error(res.error.message);
  if (res.data?.url) window.location.href = res.data.url;
}
