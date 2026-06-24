// frontend/src/app/layout.tsx
import React from "react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "ERP Inventory App",
  description: "A simple ERP inventory management app",
  manifest: "/manifest.json", 
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}
        
        {/* Vanilla Service Worker Registration */}
        <Script 
          id="service-worker-registration" 
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: "if ('serviceWorker' in navigator) { window.addEventListener('load', function() { navigator.serviceWorker.register('/sw.js').then(function(registration) { console.log('Service Worker active!'); }, function(err) { console.error('Service Worker failed: ', err); }); }); }"
          }}
        />
      </body>
    </html>
  );
}