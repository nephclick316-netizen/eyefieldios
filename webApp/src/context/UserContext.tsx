import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Matches the exact profiles + businesses schema used by the mobile app
export interface UserProfile {
  id: string;
  email?: string;
  name: string;           // full_name
  profileName: string;    // full_name
  handle: string;         // username (no @ prefix, stored raw)
  avatar: string;         // avatar_url
  banner?: string;        // banner_url
  bio: string;
  country: string;
  phone: string;          // phone_number
  dateOfBirth?: string;   // date_of_birth
  fullAddress?: string;   // city_address
  status?: string;
  onboarding_completed?: boolean;
  // From businesses table
  businessName?: string;
  businessAddress?: string;
  businessCategory?: string;
  website?: string;
  // UI convenience fields (no DB column — kept for component compatibility)
  address: { street: string; city: string; state: string };
  currency: { code: string; symbol: string };
  showPhone?: boolean;
  showAddress?: boolean;
  visibility?: string;
  currency_code?: string;
  businessSubcategory?: string;
  socials?: { instagram?: string; twitter?: string; linkedin?: string };
  is_verified?: boolean;
}

interface UserContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const parseMediaUrl = (raw: any): string => {
  if (!raw) return "";
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.url) return parsed.url;
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]?.url || String(parsed[0]);
      return typeof parsed === "string" ? parsed : raw;
    } catch {
      return raw.replace(/^["']|["']$/g, "");
    }
  }
  if (typeof raw === "object" && raw !== null && raw.url) return raw.url;
  return "";
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboardedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSession = async (session: any) => {
    if (!session?.user) {
      setUserState(null);
      setIsOnboardedState(false);
      setIsLoading(false);
      return;
    }

    // Select only real columns (matching the mobile app's Profile model)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, username, bio, date_of_birth, country, phone_number, city_address, avatar_url, banner_url, status, onboarding_completed')
      .eq('id', session.user.id)
      .single();

    // Business is optional — use maybeSingle so missing rows don't error
    let business = null;
    if (profile) {
      const { data: bData } = await supabase
        .from('businesses')
        .select('business_name, category, website_url, business_address')
        .eq('user_id', session.user.id)
        .maybeSingle();
      business = bData;
    }

    if (profile) {
      const userData: UserProfile = {
        id: profile.id,
        email: session.user.email,
        name: profile.full_name || session.user.email?.split('@')[0] || "User",
        profileName: profile.full_name || "",
        handle: profile.username || "",
        avatar: parseMediaUrl(profile.avatar_url),
        banner: parseMediaUrl(profile.banner_url),
        bio: profile.bio || "",
        country: profile.country || "",
        phone: profile.phone_number || "",
        dateOfBirth: profile.date_of_birth || "",
        fullAddress: profile.city_address || "",
        status: profile.status || "active",
        onboarding_completed: profile.onboarding_completed || false,
        // Business
        businessName: business?.business_name || "",
        businessAddress: business?.business_address || "",
        businessCategory: business?.category || "",
        website: business?.website_url || "",
        // UI-only fields with safe defaults
        address: { street: profile.city_address || "", city: "", state: "" },
        currency: { code: "USD", symbol: "$" },
        is_verified: false,
        socials: {},
      };
      setUserState(userData);
      setIsOnboardedState(profile.onboarding_completed || false);
    } else {
      setUserState({ id: session.user.id, email: session.user.email } as any);
      setIsOnboardedState(false);
    }

    setIsLoading(false);
  };

  const setUser = (userData: UserProfile) => setUserState(userData);
  const setIsOnboarded = (val: boolean) => setIsOnboardedState(val);

  return (
    <UserContext.Provider value={{ user, setUser, isOnboarded, setIsOnboarded, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};