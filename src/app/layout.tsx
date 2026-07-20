import React from 'react';
import type { Metadata } from "next";
import "./globals.css";
import ToastProvider from "../components/ToastProvider";

export const metadata: Metadata = {
  title: "EyeField",
  description: "A premium all-in-one social and e-commerce platform",
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  }
};

import ClientProviders from '../components/ClientProviders';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="antialiased">
        <ToastProvider />
        <ClientProviders>
          {children}
        </ClientProviders>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}