"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import './globals.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isClient, setIsClient] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Fetch auth status
    const token = localStorage.getItem("erp_token");
    const role = localStorage.getItem("erp_role");
    const email = localStorage.getItem("erp_email");

    setUserRole(role);
    setUserEmail(email);

    const isLoginPage = pathname === '/login';
    if (!token && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("erp_token");
    localStorage.removeItem("erp_role");
    localStorage.removeItem("erp_branch_id");
    localStorage.removeItem("erp_email");
    setUserRole(null);
    setUserEmail(null);
    router.push('/login');
  };

  const isLoginPage = pathname === '/login';

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!userEmail) return "AD";
    return userEmail.slice(0, 2).toUpperCase();
  };

  if (!isClient) {
    return (
      <html lang="en">
        <head>
          <title>Premium ERP System</title>
          <link rel="manifest" href="/manifest.json" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body className="bg-slate-900 text-slate-300 flex items-center justify-center h-screen">
          <div className="text-lg font-semibold animate-pulse">Loading Grocery ERP...</div>
        </body>
      </html>
    );
  }

  // If on login page, render child component full screen without sidebar/header
  if (isLoginPage) {
    return (
      <html lang="en">
        <head>
          <title>Login - Premium ERP System</title>
          <link rel="manifest" href="/manifest.json" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body className="bg-slate-900 text-slate-300 antialiased font-sans">
          {children}
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <head>
        <title>Premium ERP System</title>
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      brand: { 500: '#3b82f6', 600: '#2563eb' },
                      surface: { DEFAULT: '#f8fafc', dark: '#0f172a' }
                    }
                  }
                }
              }
            }
          `}}
        />
      </head>
      <body className="bg-surface text-slate-800 flex h-screen overflow-hidden antialiased font-sans">
        
        {/* Sidebar */}
        <aside className="w-64 bg-surface-dark text-slate-300 flex-shrink-0 hidden md:flex flex-col shadow-xl z-20">
          <div className="h-16 flex items-center px-6 border-b border-slate-700/50 bg-slate-900/50">
            <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              ERP Pro
            </span>
          </div>
          
          <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
            {/* Show Dashboard to Owner, Manager, Stock Handler */}
            {userRole && ["owner", "manager", "stock_handler"].includes(userRole) && (
              <a href="/dashboard" className={`flex items-center px-4 py-3 rounded-xl transition-all ${pathname === '/dashboard' ? 'text-white bg-brand-600 shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                <span className="font-medium">Dashboard</span>
              </a>
            )}
            
            {/* Show POS to Owner, Manager, Cashier */}
            {userRole && ["owner", "manager", "cashier"].includes(userRole) && (
              <a href="/" className={`flex items-center px-4 py-3 rounded-xl transition-all ${pathname === '/' ? 'text-white bg-brand-600 shadow-sm' : 'hover:bg-slate-800 hover:text-white'}`}>
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="font-medium">Point of Sale</span>
              </a>
            )}
          </nav>

          <div className="p-4 border-t border-slate-700/50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-red-950/30 hover:text-red-300 rounded-xl transition-all font-medium"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Content Wrapper */}
        <div className="flex-1 flex flex-col min-w-0 bg-surface">
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 flex-shrink-0">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-slate-800">
                {pathname === '/dashboard' ? 'HQ Enterprise Dashboard' : 'Point of Sale Terminal'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800">{userEmail}</p>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{userRole?.replace('_', ' ')}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 font-bold shadow-sm">
                {getUserInitials()}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>

      </body>
    </html>
  );
}