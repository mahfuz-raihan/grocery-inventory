"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If user is already logged in, redirect them out of the login screen
    const token = localStorage.getItem("erp_token");
    if (token) {
      const role = localStorage.getItem("erp_role") || "cashier";
      if (role === "cashier") {
        router.push("/");
      } else {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setLoading(true);

    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Authentication failed. Incorrect email or password.");
      }

      const data = await response.json();

      // Store in localStorage
      localStorage.setItem("erp_token", data.access_token);
      localStorage.setItem("erp_role", data.role);
      localStorage.setItem("erp_email", email);
      
      try {
        const payload = JSON.parse(atob(data.access_token.split('.')[1]));
        if (payload && payload.id) {
          localStorage.setItem("erp_user_id", payload.id);
        }
      } catch (e) {
        console.error("Failed to parse JWT payload for user ID", e);
      }

      if (data.branch_id) {
        localStorage.setItem("erp_branch_id", data.branch_id);
      } else {
        localStorage.removeItem("erp_branch_id");
      }

      // Role-based routing
      if (data.role === "cashier") {
        router.push("/");
      } else if (["purchase_user", "production_user", "sales_user"].includes(data.role)) {
        router.push("/inventory");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4 relative">
      {/* Subtle brand ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm bg-white border border-border p-8 rounded-lg shadow-[0_4px_24px_rgba(0,0,0,0.04)] relative z-10">
        <div className="flex flex-col items-center mb-6">
          {/* Logo Icon */}
          <div className="w-12 h-12 bg-brand rounded-md flex items-center justify-center shadow-sm mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">ERP Pro</h1>
          <p className="text-slate-500 mt-1 text-xs text-center">Enter credentials to access the ERP Terminal</p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-medium flex items-start gap-2.5">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-md text-slate-900 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition text-xs font-mono placeholder:text-slate-400 placeholder:font-sans"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="w-full px-3.5 py-2.5 bg-white border border-border rounded-md text-slate-900 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition text-xs placeholder:text-slate-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2 mt-2 shadow-xs"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>
      </div>
      <div className="mt-6 text-center text-xs text-slate-400">
        Enterprise Grade POS &amp; Inventory Control &bull; v2.0
      </div>
    </div>
  );
}
