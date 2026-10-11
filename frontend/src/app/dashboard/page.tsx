"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  SaleInvoice,
  CustomerSummary,
  CatalogProduct,
  CompanyProfile,
  Branch,
} from "./types";

import { SalesAnalyticsTab } from "./components/SalesAnalyticsTab";
import { SoldInvoicesTab } from "./components/SoldInvoicesTab";
import { CustomersTab } from "./components/CustomersTab";
import { InvoiceModal } from "./components/InvoiceModal";
import { CustomerInvoicesModal } from "./components/CustomerInvoicesModal";
import { CustomerLedgerModal } from "./components/CustomerLedgerModal";
import { CustomerProfileModal } from "./components/CustomerProfileModal";
import { DailySalesReportModal } from "./components/DailySalesReportModal";

const FILTER_OPTIONS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7", label: "Last 7 Days" },
  { id: "last30", label: "Last 30 Days" },
  { id: "last60", label: "Last 60 Days" },
  { id: "thisMonth", label: "This Month" },
  { id: "lastMonth", label: "Last Month" },
  { id: "custom", label: "Custom Range" },
];

const getDateRange = (filter: string, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (filter) {
    case "today":
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "yesterday":
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case "last7":
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last30":
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "last60":
      start.setDate(now.getDate() - 60);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "thisMonth":
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case "lastMonth":
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case "custom":
      if (customStart && customEnd) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      } else {
        start.setDate(now.getDate() - 30);
        start.setHours(0, 0, 0, 0);
      }
      break;
    default:
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
};

export default function Dashboard() {
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Tabs: "sales_analytics" | "sold_invoices" | "customers"
  const [activeTab, setActiveTab] = useState<string>("sales_analytics");

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<string>("last30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);

  // Chart aggregation view
  const [chartGroup, setChartGroup] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  // API Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [invoicesLoading, setInvoicesLoading] = useState<boolean>(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [invoices, setInvoices] = useState<SaleInvoice[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Recent sales table expansion
  const [showAllSales, setShowAllSales] = useState<boolean>(false);

  // Modal states
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [selectedCustomerForInvoices, setSelectedCustomerForInvoices] = useState<CustomerSummary | null>(null);
  const [selectedCustomerForLedger, setSelectedCustomerForLedger] = useState<CustomerSummary | null>(null);
  const [selectedCustomerForProfile, setSelectedCustomerForProfile] = useState<CustomerSummary | null>(null);
  const [showDailyReportModal, setShowDailyReportModal] = useState<boolean>(false);

  // Fetch initial catalog, profile, and branches
  useEffect(() => {
    setIsClient(true);
    const role = localStorage.getItem("erp_role");
    setUserRole(role);

    if (role === "cashier") {
      router.push("/");
      return;
    }

    if (["purchase_user", "production_user", "sales_user"].includes(role || "")) {
      router.push("/inventory");
      return;
    }

    const fetchCatalog = async () => {
      try {
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/v1/inventory/products`);
        if (res.ok) {
          const data = await res.json();
          setCatalogProducts(data);
        }
      } catch (err) {
        console.error("Error fetching product catalog:", err);
      }
    };

    const fetchCompanyProfile = async () => {
      try {
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/v1/inventory/company-profile`);
        if (res.ok) {
          const data = await res.json();
          setCompanyProfile(data);
        }
      } catch (err) {
        console.error("Error fetching company profile:", err);
      }
    };

    const fetchBranches = async () => {
      try {
        const baseUrl = window.location.origin;
        const res = await fetch(`${baseUrl}/api/v1/inventory/branches`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data);
        }
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    fetchCatalog();
    fetchCompanyProfile();
    fetchBranches();
  }, [router]);

  // Fetch Analytics
  const fetchAnalytics = useCallback(async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const role = localStorage.getItem("erp_role");
      const branchId = localStorage.getItem("erp_branch_id");
      let url = `${baseUrl}/api/v1/sales/reports/analytics?start_date=${encodeURIComponent(
        start.toISOString()
      )}&end_date=${encodeURIComponent(end.toISOString())}`;
      if (role !== "owner" && branchId) {
        url += `&branch_id=${encodeURIComponent(branchId)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("API error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Sold Invoices
  const fetchInvoices = useCallback(async () => {
    setInvoicesLoading(true);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/v1/sales/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  // Fetch data on date filter change
  useEffect(() => {
    if (!isClient) return;
    if (dateFilter !== "custom") {
      setShowCustomRange(false);
      const { start, end } = getDateRange(dateFilter);
      fetchAnalytics(start, end);
    } else {
      setShowCustomRange(true);
      if (!customStartDate || !customEndDate) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        setCustomStartDate(start.toISOString().split("T")[0]);
        setCustomEndDate(end.toISOString().split("T")[0]);
      }
    }
  }, [dateFilter, isClient, fetchAnalytics, customStartDate, customEndDate]);

  // Always fetch invoices on mount
  useEffect(() => {
    if (isClient) {
      fetchInvoices();
    }
  }, [isClient, fetchInvoices]);

  const applyCustomRange = () => {
    if (!customStartDate || !customEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    if (start > end) {
      alert("Start date must be before or equal to end date.");
      return;
    }
    fetchAnalytics(start, end);
  };

  // Delete invoice handler
  const handleDeleteInvoice = async (invoiceId: string) => {
    const baseUrl = window.location.origin;
    const res = await fetch(`${baseUrl}/api/v1/sales/${invoiceId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.detail || "Failed to delete invoice");
    }
    setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
    const { start, end } = getDateRange(dateFilter, customStartDate, customEndDate);
    fetchAnalytics(start, end);
  };

  // Customer update handler (updates state in real-time)
  const handleCustomerUpdated = (
    oldPhone: string,
    oldName: string,
    updated: { name: string; phone: string; address: string }
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        const matchPhone = oldPhone && oldPhone !== "—" && inv.customer_phone === oldPhone;
        const matchName = inv.customer_name === oldName;
        if (matchPhone || matchName) {
          return {
            ...inv,
            customer_name: updated.name,
            customer_phone: updated.phone,
            customer_address: updated.address,
          };
        }
        return inv;
      })
    );
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 animate-pulse font-medium">Loading Dashboard...</div>
      </div>
    );
  }

  const chartData = analytics?.charts?.[chartGroup] || [];
  const recentSalesList = analytics?.recent_sales || [];
  const displayedSales = showAllSales ? recentSalesList : recentSalesList.slice(0, 10);

  const TABS = [
    { id: "sales_analytics", label: "📊 Sales Analytics" },
    { id: "sold_invoices", label: "🧾 Sold Invoices" },
    { id: "customers", label: "👥 Customers" },
  ];

  return (
    <div className="min-h-screen bg-surface-canvas text-slate-900 pb-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 erp-card p-5 border-border shadow-xs rounded-md">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">HQ Dashboard</h1>
            <p className="text-slate-500 mt-0.5 text-xs font-normal">
              Sales Analytics, Sold Invoices & Customer Directory Management
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">
                Select Date Range
              </span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-white border border-border rounded-md px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition cursor-pointer"
              >
                {FILTER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {showCustomRange && (
          <div className="erp-card p-4 border-border rounded-md shadow-xs flex flex-wrap items-end gap-3 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-2 border border-border rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-2 border border-border rounded-md text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition"
              />
            </div>
            <button
              onClick={applyCustomRange}
              className="btn-primary text-xs py-2 px-4 shadow-xs"
            >
              Apply Custom Range
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex border-b border-border gap-2 pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all duration-150 ${
                activeTab === tab.id
                  ? "border-brand text-brand"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Sales Analytics */}
        {activeTab === "sales_analytics" && (
          <SalesAnalyticsTab
            loading={loading}
            analytics={analytics}
            chartData={chartData}
            chartGroup={chartGroup}
            setChartGroup={setChartGroup}
            recentSalesList={recentSalesList}
            displayedSales={displayedSales}
            showAllSales={showAllSales}
            setShowAllSales={setShowAllSales}
            catalogProducts={catalogProducts}
            branches={branches}
            onViewInvoice={(sale) => setSelectedInvoice(sale)}
          />
        )}

        {/* Tab 2: Sold Invoices */}
        {activeTab === "sold_invoices" && (
          <SoldInvoicesTab
            invoices={invoices}
            catalogProducts={catalogProducts}
            branches={branches}
            companyProfile={companyProfile}
            onViewInvoice={(inv) => setSelectedInvoice(inv)}
            onDeleteInvoice={handleDeleteInvoice}
            onOpenDailyReport={() => setShowDailyReportModal(true)}
          />
        )}

        {/* Tab 3: Customers */}
        {activeTab === "customers" && (
          <CustomersTab
            invoices={invoices}
            onOpenCustomerInvoices={(c) => setSelectedCustomerForInvoices(c)}
            onOpenCustomerLedger={(c) => setSelectedCustomerForLedger(c)}
            onOpenCustomerProfile={(c) => setSelectedCustomerForProfile(c)}
          />
        )}
      </div>

      {/* ── MODALS ── */}

      {/* A4 Compact Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          catalogProducts={catalogProducts}
          branches={branches}
          companyProfile={companyProfile}
        />
      )}

      {/* Customer Invoices History Modal */}
      {selectedCustomerForInvoices && (
        <CustomerInvoicesModal
          customer={selectedCustomerForInvoices}
          onClose={() => setSelectedCustomerForInvoices(null)}
          onViewInvoice={(inv) => {
            setSelectedCustomerForInvoices(null);
            setSelectedInvoice(inv);
          }}
        />
      )}

      {/* Customer Ledger Modal */}
      {selectedCustomerForLedger && (
        <CustomerLedgerModal
          customer={selectedCustomerForLedger}
          onClose={() => setSelectedCustomerForLedger(null)}
          catalogProducts={catalogProducts}
        />
      )}

      {/* Customer Profile Modal */}
      {selectedCustomerForProfile && (
        <CustomerProfileModal
          customer={selectedCustomerForProfile}
          onClose={() => setSelectedCustomerForProfile(null)}
          catalogProducts={catalogProducts}
          onCustomerUpdated={handleCustomerUpdated}
        />
      )}

      {/* Daily Sales Details Report Modal */}
      {showDailyReportModal && (
        <DailySalesReportModal
          isOpen={showDailyReportModal}
          onClose={() => setShowDailyReportModal(false)}
          invoices={invoices}
          catalogProducts={catalogProducts}
          branches={branches}
          companyProfile={companyProfile}
        />
      )}
    </div>
  );
}