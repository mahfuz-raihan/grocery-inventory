"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const role = localStorage.getItem("erp_role");
    setUserRole(role);

    if (role === "cashier") {
      router.push("/");
      return;
    }

    // Redirect specialized roles to inventory panel as they don't use the dashboard
    if (["purchase_user", "production_user", "sales_user"].includes(role || "")) {
      router.push("/inventory");
      return;
    }
  }, [router]);

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 animate-pulse font-medium">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center transition-all duration-300 hover:shadow-md">
        <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-800 mb-3">Dashboard Rebuild Pending</h1>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
          The dashboard component has been cleaned up and is ready for the new implementation. 
        </p>

        <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 mb-8">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
          Ready for Rebuild Instructions
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="px-6 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition duration-200 shadow-sm"
          >
            Go to POS Terminal
          </a>
          <a
            href="/inventory"
            className="px-6 py-2.5 bg-white text-slate-700 text-sm font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition duration-200 shadow-sm"
          >
            Inventory Control
          </a>
        </div>
      </div>
    </div>
  );
}