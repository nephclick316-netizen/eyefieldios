"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const SignInPage = dynamic(() => import('../views/SignInPage'), { ssr: false });
const SignUpPage = dynamic(() => import('../views/SignUpPage'), { ssr: false });
const OnboardingPage = dynamic(() => import('../views/OnboardingPage'), { ssr: false });

export default function Home() {
  const { session, currentUser, loadingAuth, refreshProfile } = useAuth();
  const [showSignUp, setShowSignUp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && session && currentUser) {
      // Small timeout to ensure context is fully ready before navigation
      const timer = setTimeout(() => {
        router.replace('/cascadea');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [session, currentUser, loadingAuth, router]);

  if (loadingAuth) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-black text-white font-black">
        <div className="text-4xl tracking-tighter animate-pulse">EyeField</div>
        <div className="mt-4 w-8 h-1 bg-white/20 rounded-full overflow-hidden">
          <div className="w-full h-full bg-white animate-[loading_1.5s_infinite]" />
        </div>
      </div>
    );
  }

  if (!session) {
    return showSignUp ? (
      <SignUpPage onSignUp={() => setShowSignUp(false)} onGoToSignIn={() => setShowSignUp(false)} />
    ) : (
      <SignInPage onSignIn={() => { }} onGoToSignUp={() => setShowSignUp(true)} />
    );
  }

  if (!currentUser) {
    return <OnboardingPage onComplete={refreshProfile} />;
  }

  return null; // Redirecting...
}