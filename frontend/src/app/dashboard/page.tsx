"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ChartDataPoint {
  label: string;
  amount: number;
  count: number;
}

interface RecentSaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface RecentSale {
  id: string;
  receipt_number: string;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  discount: number;
  status: "Paid" | "Due";
  created_at: string;
  items: RecentSaleItem[];
}

interface AnalyticsResponse {
  total_revenue: number;
  total_orders: number;
  charts: {
    daily: ChartDataPoint[];
    weekly: ChartDataPoint[];
    monthly: ChartDataPoint[];
    yearly: ChartDataPoint[];
  };
  recent_sales: RecentSale[];
}

interface CatalogProduct {
  id: string;
  name: string;
}

interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
}

interface Branch {
  id: string;
  name: string;
  branch_type: string;
}

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

  // Tabs (Defaults to Sales Analytics)
  const [activeTab, setActiveTab] = useState<string>("sales_analytics");

  // Date Filter State
  const [dateFilter, setDateFilter] = useState<string>("last30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);

  // Unified Chart time aggregation group view
  const [chartGroup, setChartGroup] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");

  // API Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Recent sales table expansion & modal state
  const [showAllSales, setShowAllSales] = useState<boolean>(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<RecentSale | null>(null);

  // Redirect validation & fetch catalog, profile, and branches
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

  const fetchAnalytics = async (start: Date, end: Date) => {
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const role = localStorage.getItem("erp_role");
      const branchId = localStorage.getItem("erp_branch_id");
      let url = `${baseUrl}/api/v1/sales/reports/analytics?start_date=${encodeURIComponent(start.toISOString())}&end_date=${encodeURIComponent(end.toISOString())}`;
      if (role !== "owner" && branchId) {
        url += `&branch_id=${encodeURIComponent(branchId)}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const data: AnalyticsResponse = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("API error:", error);
    } finally {
      setLoading(false);
    }
  };

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
  }, [dateFilter, isClient]);

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

  const formatPrice = (priceInBDT: number) => {
    return `৳${priceInBDT.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, "0");

    return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
  };

  const getProductNamesString = (items: RecentSaleItem[]) => {
    if (!items || items.length === 0) return "No products";
    const names = items.map(item => {
      const match = catalogProducts.find(p => p.id === item.product_id);
      return match ? match.name : `Product (${item.product_id.slice(0, 8)})`;
    });
    if (names.length === 1) return names[0];
    return `${names[0]} (+${names.length - 1} items)`;
  };

  const getWarehouseName = (branchId: string) => {
    const match = branches.find(b => b.id === branchId);
    return match ? match.name : `Warehouse (${branchId.slice(0, 8)})`;
  };

  const handlePrintInvoice = (sale: RecentSale) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const subtotal = sale.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

    const itemsHtml = sale.items.map(item => {
      const prod = catalogProducts.find(p => p.id === item.product_id);
      const name = prod ? prod.name : `Product (${item.product_id.slice(0, 8)})`;
      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">৳${item.unit_price.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">৳${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${sale.receipt_number}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
            .header p { margin: 4px 0; font-size: 13px; color: #64748b; }
            .details { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 13px; }
            .details h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
            .details p { margin: 4px 0; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            th { background-color: #f8fafc; padding: 10px 8px; text-align: left; font-weight: bold; border-bottom: 2px solid #e2e8f0; color: #475569; }
            .summary { display: flex; flex-direction: column; align-items: flex-end; font-size: 13px; gap: 8px; }
            .summary-row { display: flex; width: 250px; justify-content: space-between; }
            .summary-row.total { font-weight: bold; font-size: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px; color: #0f172a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>${companyProfile?.name || "ERP GROCERY"}</h1>
              <p>${companyProfile?.address || "Bozlur Mor, Kushtia Road"}</p>
              <p>Phone: ${companyProfile?.phone || "01700-000000"}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin:0; font-size: 20px; color:#1e293b;">RETAIL INVOICE</h2>
              <p><strong>Invoice ID:</strong> ${sale.receipt_number}</p>
              <p><strong>Date:</strong> ${new Date(sale.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div class="details">
            <div>
              <h3>Customer Info</h3>
              <p><strong>Name:</strong> ${sale.customer_name}</p>
              <p><strong>Phone:</strong> ${sale.customer_phone}</p>
              <p><strong>Address:</strong> ${sale.customer_address}</p>
            </div>
            <div style="text-align: right;">
              <h3>Warehouse</h3>
              <p style="font-weight: bold; color: #1e293b;">${getWarehouseName(sale.branch_id)}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>৳${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Discount:</span>
              <span>৳${sale.discount.toFixed(2)}</span>
            </div>
            <div class="summary-row total">
              <span>Total Amount:</span>
              <span>৳${sale.total_amount.toFixed(2)}</span>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 animate-pulse font-medium">Loading Dashboard...</div>
      </div>
    );
  }

  // Get active charts data lists
  const chartData = analytics?.charts?.[chartGroup] || [];

  // Filter list of displayed sales
  const recentSalesList = analytics?.recent_sales || [];
  const displayedSales = showAllSales ? recentSalesList : recentSalesList.slice(0, 10);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Block with dropdown on the upper-right corner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">HQ Dashboard</h1>
            <p className="text-slate-500 mt-1 font-medium">Real-time HQ Sales Analytics & Operations Control</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-64">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">Select Date Range</span>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all cursor-pointer"
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

        {/* Custom Date Pickers - Slides down right underneath the header */}
        {showCustomRange && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-end gap-3 animate-fadeIn">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">Start Date</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-500">End Date</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <button
              onClick={applyCustomRange}
              className="px-5 py-2 bg-slate-950 text-white text-xs font-bold rounded-lg border border-slate-950 hover:bg-slate-900 transition shadow-sm"
            >
              Apply Custom Range
            </button>
          </div>
        )}

        {/* Tab Selection Row */}
        <div className="flex border-b border-slate-200 gap-2 pb-px">
          <button
            onClick={() => setActiveTab("sales_analytics")}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === "sales_analytics"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
          >
            Sales Analytics
          </button>
        </div>

        {activeTab === "sales_analytics" && (
          <div className="space-y-6">
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                <div className="h-32 bg-white border border-slate-200 rounded-2xl"></div>
                <div className="h-32 bg-white border border-slate-200 rounded-2xl"></div>
              </div>
            ) : (
              <>
                {/* KPI Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Revenue Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                      <p className="text-3xl font-extrabold text-slate-900">{formatPrice(analytics?.total_revenue || 0)}</p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Settled Sales
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>

                  {/* Orders Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</span>
                      <p className="text-3xl font-extrabold text-slate-900">{analytics?.total_orders || 0}</p>
                      <div className="pt-2">
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          Paid Orders
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                  </div>

                </div>

                {/* Unified Sales & Orders Line Chart */}
                <LineChart
                  title="Unified Sales & Orders Performance"
                  data={chartData}
                  activeGroup={chartGroup}
                  setActiveGroup={setChartGroup}
                  formatPrice={formatPrice}
                />

                {/* Recent Sales Table Chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base tracking-tight">Recent Sales Details</h3>
                      <p className="text-xs text-slate-400 font-medium">Latest transactions recorded in the selected period</p>
                    </div>
                    <button
                      onClick={() => setShowAllSales(!showAllSales)}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition duration-150 sm:self-center"
                    >
                      {showAllSales ? "Show Less" : "View All"}
                    </button>
                  </div>

                  {recentSalesList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span className="text-sm font-semibold">No recent transactions in this range</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-400">
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left first:rounded-l-xl">Order ID</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left">Date</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left">Warehouse</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left">Customer Name</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left">Product</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left">Discount</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left">Amount</th>
                            <th className="text-xs font-bold uppercase tracking-wider p-3 text-left last:rounded-r-xl">Invoice</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {displayedSales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-slate-50/50 transition duration-150">
                              <td className="p-3 text-xs font-bold text-slate-800">{sale.receipt_number}</td>
                              <td className="p-3 text-xs text-slate-500 font-semibold">
                                {formatDateTime(sale.created_at)}
                              </td>
                              <td className="p-3 text-sm text-slate-700 font-semibold">
                                {getWarehouseName(sale.branch_id)}
                              </td>
                              <td className="p-3 text-sm text-slate-600 font-semibold">{sale.customer_name}</td>
                              <td className="p-3 text-sm text-slate-500 italic max-w-xs truncate" title={sale.items.map(item => catalogProducts.find(p => p.id === item.product_id)?.name || "Unknown Product").join(", ")}>
                                {getProductNamesString(sale.items)}
                              </td>
                              <td className="p-3 text-sm text-slate-500 font-bold">{formatPrice(sale.discount)}</td>
                              <td className="p-3 text-sm font-extrabold text-slate-900">{formatPrice(sale.total_amount)}</td>
                              <td className="p-3 text-xs">
                                <button
                                  onClick={() => setSelectedInvoiceSale(sale)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold shadow-sm transition duration-150"
                                >
                                  View Invoice
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Invoice Modal Overlay */}
      {selectedInvoiceSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-8">
            
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center gap-3">
              <h3 className="font-bold text-slate-800">Sales Invoice</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrintInvoice(selectedInvoiceSale)}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-sm border border-blue-200"
                >
                  🖨️ Print Invoice
                </button>
                <button
                  onClick={() => setSelectedInvoiceSale(null)}
                  className="px-3.5 py-1.5 bg-slate-800 text-white hover:bg-slate-900 font-bold rounded-lg text-xs transition shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Invoice Contents */}
            <div className="p-6 bg-white flex-1 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Header Profile */}
                <div className="flex justify-between items-start border-b pb-4 gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{companyProfile?.name || "ERP GROCERY"}</h4>
                    <p className="text-[11px] text-slate-500">{companyProfile?.address || "Bozlur Mor, Kushtia Road"}</p>
                    <p className="text-[11px] text-slate-500">Phone: {companyProfile?.phone || "01700-000000"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Invoice ID</span>
                    <h5 className="text-xs font-mono font-bold text-blue-600">{selectedInvoiceSale.receipt_number}</h5>
                    <p className="text-[10px] text-slate-400 font-semibold">{formatDateTime(selectedInvoiceSale.created_at)}</p>
                  </div>
                </div>

                {/* Billing Details */}
                <div className="bg-slate-50 p-4 rounded-xl border text-xs gap-3">
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-2">Billing & Customer Details</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-700">{selectedInvoiceSale.customer_name}</p>
                      <p className="text-slate-500 font-medium">Phone: {selectedInvoiceSale.customer_phone}</p>
                      <p className="text-slate-500 font-medium">Address: {selectedInvoiceSale.customer_address}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Warehouse</span>
                      <p className="font-bold text-slate-800">{getWarehouseName(selectedInvoiceSale.branch_id)}</p>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-2">
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Items Sold</span>
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b">
                          <th className="p-2 font-bold text-slate-500">Product</th>
                          <th className="p-2 font-bold text-slate-500 text-center">Qty</th>
                          <th className="p-2 font-bold text-slate-500 text-right">Price</th>
                          <th className="p-2 font-bold text-slate-500 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {selectedInvoiceSale.items.map((item, idx) => {
                          const prod = catalogProducts.find(p => p.id === item.product_id);
                          const name = prod ? prod.name : `Product (${item.product_id.slice(0, 8)})`;
                          return (
                            <tr key={idx}>
                              <td className="p-2 text-slate-700 font-semibold">{name}</td>
                              <td className="p-2 text-slate-600 text-center font-bold">{item.quantity}</td>
                              <td className="p-2 text-slate-600 text-right font-bold">{formatPrice(item.unit_price)}</td>
                              <td className="p-2 text-slate-900 text-right font-extrabold">{formatPrice(item.quantity * item.unit_price)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total Summary */}
                <div className="border-t pt-4 flex flex-col items-end text-xs gap-2">
                  <div className="flex justify-between w-48 text-slate-500 font-medium">
                    <span>Subtotal:</span>
                    <span>{formatPrice(selectedInvoiceSale.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0))}</span>
                  </div>
                  <div className="flex justify-between w-48 text-slate-500 font-medium">
                    <span>Discount:</span>
                    <span>{formatPrice(selectedInvoiceSale.discount)}</span>
                  </div>
                  <div className="flex justify-between w-48 text-slate-900 font-extrabold text-sm border-t pt-2 mt-1">
                    <span>Total Amount:</span>
                    <span>{formatPrice(selectedInvoiceSale.total_amount)}</span>
                  </div>
                </div>

              </div>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

function LineChart({
  title,
  data,
  activeGroup,
  setActiveGroup,
  formatPrice,
}: {
  title: string;
  data: ChartDataPoint[];
  activeGroup: "daily" | "weekly" | "monthly" | "yearly";
  setActiveGroup: (g: "daily" | "weekly" | "monthly" | "yearly") => void;
  formatPrice: (v: number) => string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxAmount = data.reduce((max, p) => p.amount > max ? p.amount : max, 0) || 1;
  const maxCount = data.reduce((max, p) => p.count > max ? p.count : max, 0) || 1;

  const steps = 4;
  const leftAxisLabels = Array.from({ length: steps + 1 }, (_, i) => {
    const value = maxAmount * ((steps - i) / steps);
    return formatPrice(value);
  });

  const rightAxisLabels = Array.from({ length: steps + 1 }, (_, i) => {
    const value = maxCount * ((steps - i) / steps);
    return Math.ceil(value).toString();
  });

  const n = data.length;

  const getX = (index: number) => {
    if (n <= 1) return 500;
    return (index / (n - 1)) * 940 + 30; // 30px padding left/right
  };

  const getYAmount = (amount: number) => {
    return 180 - (amount / maxAmount) * 150 + 10; // 10px padding top/bottom, height 150
  };

  const getYCount = (count: number) => {
    return 180 - (count / maxCount) * 150 + 10;
  };

  // Helper to generate perfectly smooth curved Bezier spline control paths
  const getBezierCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      
      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const amountPoints = data.map((p, i) => ({ x: getX(i), y: getYAmount(p.amount) }));
  const amountLinePath = getBezierCurvePath(amountPoints);
  const amountAreaPath = n > 0 ? `${amountLinePath} L ${getX(n - 1)} 190 L ${getX(0)} 190 Z` : "";

  const ordersPoints = data.map((p, i) => ({ x: getX(i), y: getYCount(p.count) }));
  const ordersLinePath = getBezierCurvePath(ordersPoints);
  const ordersAreaPath = n > 0 ? `${ordersLinePath} L ${getX(n - 1)} 190 L ${getX(0)} 190 Z` : "";

  const formatLabel = (label: string, group: string) => {
    if (group === "daily") {
      try {
        const parts = label.split("-");
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        }
      } catch (e) {}
    }
    if (group === "monthly") {
      try {
        const parts = label.split("-");
        if (parts.length === 2) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
          return dateObj.toLocaleDateString("en-US", { month: "short" });
        }
      } catch (e) {}
    }
    return label.split("-").slice(-2).join("-") || label;
  };

  const labelStep = n > 30 ? 5 : n > 15 ? 3 : 1;

  // Position tooltip box immediately to the right or left (prevents clipping)
  const isFarRight = hoveredIndex !== null && hoveredIndex / (n - 1 || 1) > 0.8;
  const tooltipLeftOffset = hoveredIndex !== null 
    ? (isFarRight ? `calc(${getX(hoveredIndex) / 10}% - 12px)` : `calc(${getX(hoveredIndex) / 10}% + 12px)`)
    : "0%";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 transition-all duration-300 hover:shadow-md flex flex-col h-[320px] overflow-hidden w-full select-none">
      
      {/* Header and Legend labels */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h3>
          <div className="flex items-center gap-3.5 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-[10px] font-bold text-slate-500">Sales (৳)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-slate-500">Order</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Group By</span>
          <select
            value={activeGroup}
            onChange={(e) => setActiveGroup(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all cursor-pointer"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <svg className="w-10 h-10 mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
          </svg>
          <span className="text-xs font-semibold">No transactions for this interval</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          <div className="flex-1 flex items-stretch h-44 overflow-hidden relative">
            {/* Left Y-Axis (Revenue) */}
            <div className="w-20 pr-2 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-right border-r border-slate-100 flex-shrink-0 pointer-events-none">
              {leftAxisLabels.map((lbl, idx) => (
                <span key={idx} className="truncate">{lbl}</span>
              ))}
            </div>

            {/* Coordinate Plane Area */}
            <div className="flex-1 relative pl-1 pr-1">
              
              {/* Horizontal Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-1">
                {Array.from({ length: steps }).map((_, idx) => (
                  <div key={idx} className="w-full border-t border-dashed border-slate-100 flex-1"></div>
                ))}
                <div className="w-full border-t border-slate-200"></div>
              </div>

              {/* Floating Custom Tooltip Box */}
              {hoveredIndex !== null && (
                <div
                  className={`absolute top-2 z-30 pointer-events-none transition-all duration-150 ${isFarRight ? "-translate-x-full" : "translate-x-0"}`}
                  style={{ left: tooltipLeftOffset }}
                >
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-md space-y-0.5 min-w-[120px]">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{data[hoveredIndex].label}</div>
                    <div className="text-[10px] text-slate-600 flex justify-between gap-3">
                      <span>Sale:</span>
                      <span className="font-extrabold text-blue-600">{formatPrice(data[hoveredIndex].amount)}</span>
                    </div>
                    <div className="text-[10px] text-slate-600 flex justify-between gap-3">
                      <span>Order:</span>
                      <span className="font-extrabold text-emerald-600">{data[hoveredIndex].count}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* White badge background for X-Axis Hover Date */}
              {hoveredIndex !== null && (
                <div
                  style={{ left: `${getX(hoveredIndex) / 10}%` }}
                  className="absolute bottom-[-8px] transform -translate-x-1/2 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[8px] font-extrabold text-slate-800 shadow-sm z-20"
                >
                  {formatLabel(data[hoveredIndex].label, activeGroup)}
                </div>
              )}

              {/* SVG Curve Plot */}
              <svg className="w-full h-full overflow-visible z-10 relative" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  {/* Vibrant Blue Gradient */}
                  <linearGradient id="amountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  {/* Bright Green Gradient */}
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Fill Area - Sales (Vibrant Blue) */}
                <path d={amountAreaPath} fill="url(#amountGrad)" className="transition-all duration-300" />
                <path d={amountLinePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />

                {/* Fill Area - Order (Bright Green) */}
                <path d={ordersAreaPath} fill="url(#ordersGrad)" className="transition-all duration-300" />
                <path d={ordersLinePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />

                {/* Hover Guide vertical line */}
                {hoveredIndex !== null && (
                  <line
                    x1={getX(hoveredIndex)}
                    y1={0}
                    x2={getX(hoveredIndex)}
                    y2={190}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                  />
                )}

                {/* Intersection Point circles */}
                {hoveredIndex !== null && (
                  <>
                    {/* Sales (Blue dot on blue line) */}
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getYAmount(data[hoveredIndex].amount)}
                      r={5}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    {/* Order (Green dot on green line) */}
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getYCount(data[hoveredIndex].count)}
                      r={5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  </>
                )}

                {/* Invisible hover hitbox slices */}
                {data.map((p, i) => {
                  const xStart = n > 1 ? (getX(i) + getX(i - 1)) / 2 : 0;
                  const xEnd = n > 1 ? (getX(i + 1) + getX(i)) / 2 : 1000;
                  const x = i === 0 ? 0 : xStart;
                  const w = i === 0 ? xEnd : i === n - 1 ? 1000 - xStart : xEnd - xStart;

                  return (
                    <rect
                      key={i}
                      x={x}
                      y={0}
                      width={w}
                      height={200}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
            </div>

            {/* Right Y-Axis (Orders Count) */}
            <div className="w-12 pl-2 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-left border-l border-slate-100 flex-shrink-0 pointer-events-none">
              {rightAxisLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          {/* X-Axis Labels Row */}
          <div className="h-5 relative mt-1 border-t border-slate-100 flex-shrink-0 w-full pl-20 pr-12">
            <div className="relative w-full h-full">
              {data.map((p, i) => {
                if (i % labelStep !== 0 && i !== n - 1) return null;
                return (
                  <span
                    key={i}
                    style={{ left: `${getX(i) / 10}%` }}
                    className="absolute top-0.5 transform -translate-x-1/2 text-[8px] font-bold text-slate-400 whitespace-nowrap"
                  >
                    {formatLabel(p.label, activeGroup)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}