import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./context/UserContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./context/ThemeContext";
import { CartProvider } from "./context/CartContext";
import { CallProvider } from "./context/CallContext";
import WelcomeToast from "./components/notifications/BeautifulToast";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Echo from "./pages/Echo";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Endocard from "./pages/Endocard";
import Contacts from "./pages/Contacts";
import Business from "./pages/Business";
import OnboardingScreen from "./pages/OnboardingScreen";
import Auth from "./pages/Auth";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Cart from "./pages/Cart";
import Admin from "./pages/Admin";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Shop from "./pages/Shop";
import Kope from "./pages/Kope";
import Booking from "./pages/Booking";
import AccountDeletion from "./pages/AccountDeletion";
import Cascadea from "./pages/Cascadea";
import Calls from "./pages/Calls";
import ConnectingCallOverlay from "./components/calls/ConnectingCallOverlay";
import ActiveCallOverlay from "./components/calls/ActiveCallOverlay";

import { NotificationProvider } from "./context/NotificationProvider";
import DataPrefetcher from "./components/DataPrefetcher";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isOnboarded, isLoading } = useUser();
  
  if (isLoading) return null;
  if (!user) return <Navigate to="/login" />;
  if (!isOnboarded && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/policy" element={<PrivacyPolicy />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      
      {/* Public Routes */}
      <Route path="/" element={<Index />} />
      <Route path="/cascadea" element={<Cascadea />} />
      <Route path="/echo" element={<Echo />} />
      <Route path="/marketplace/:id" element={<ProductDetail />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/kope" element={<Kope />} />
      <Route path="/booking" element={<Booking />} />
      
      {/* Protected Routes */}
      <Route path="/onboarding" element={<ProtectedRoute><OnboardingScreen /></ProtectedRoute>} />
      <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/profile/:handle" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/endocard" element={<ProtectedRoute><Endocard /></ProtectedRoute>} />
      <Route path="/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
      <Route path="/business" element={<ProtectedRoute><Business /></ProtectedRoute>} />
      <Route path="/calls" element={<ProtectedRoute><Calls /></ProtectedRoute>} />
      <Route path="/contact" element={<ProtectedRoute><Contact /></ProtectedRoute>} />
      <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="/delete-account" element={<ProtectedRoute><AccountDeletion /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <UserProvider>
          <CallProvider>
            <NotificationProvider>
              <DataPrefetcher>
                <CartProvider>
                  <TooltipProvider>
                    <Toaster />
                    <WelcomeToast />
                    <ConnectingCallOverlay />
                    <ActiveCallOverlay />
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <AppRoutes />
                    </BrowserRouter>
                  </TooltipProvider>
                </CartProvider>
              </DataPrefetcher>
            </NotificationProvider>
          </CallProvider>
        </UserProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;