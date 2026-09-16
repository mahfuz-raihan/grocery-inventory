"use client";

import React, { useState, useMemo } from "react";
import {
  SaleInvoice,
  CatalogProduct,
  Branch,
  CompanyProfile,
  formatPrice,
  formatDateTime,
  formatDateOnly,
  getInvoiceCost,
  getInvoiceNetProfit,
} from "../types";

interface SoldInvoicesTabProps {
  invoices: SaleInvoice[];
  catalogProducts: CatalogProduct[];
  branches: Branch[];
  companyProfile: CompanyProfile | null;
  onViewInvoice: (inv: SaleInvoice) => void;
  onDeleteInvoice: (invoiceId: string) => Promise<void>;
  onOpenDailyReport?: () => void;
}

interface ColumnOption {
  key: string;
  label: string;
  visible: boolean;
}

export const SoldInvoicesTab: React.FC<SoldInvoicesTabProps> = ({
  invoices,
  catalogProducts,
  branches,
  companyProfile,
  onViewInvoice,
  onDeleteInvoice,
  onOpenDailyReport,
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    | "date_desc"
    | "date_asc"
    | "amount_desc"
    | "amount_asc"
    | "profit_desc"
    | "profit_asc"
    | "id_asc"
    | "customer_asc"
  >("date_desc");

  // Three-dot open menu track
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Column Visibility State
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState<ColumnOption[]>([
    { key: "receipt_number", label: "Invoice ID", visible: true },
    { key: "customer", label: "Customer", visible: true },
    { key: "date", label: "Date", visible: true },
    { key: "created_on", label: "Created On", visible: true },
    { key: "amount", label: "Amount", visible: true },
    { key: "paid", label: "Paid", visible: true },
    { key: "cost", label: "Cost", visible: true },
    { key: "profit", label: "Net Profit", visible: true },
    { key: "status", label: "Status", visible: true },
    { key: "actions", label: "Actions", visible: true },
  ]);

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const isVisible = (key: string) => {
    return columns.find((c) => c.key === key)?.visible ?? true;
  };

  const getBranchName = (branchId: string) => {
    const match = branches.find((b) => b.id === branchId);
    return match ? match.name : "Warehouse";
  };

  const getProductName = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    return prod ? prod.name : `Product (${productId.slice(0, 8)})`;
  };

  // Filtered & Sorted Invoices
  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        // Status filter
        if (statusFilter !== "all" && inv.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
        // Branch filter
        if (branchFilter !== "all" && inv.branch_id !== branchFilter) {
          return false;
        }
        // Search term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const matchReceipt = inv.receipt_number.toLowerCase().includes(term);
          const matchName = (inv.customer_name || "").toLowerCase().includes(term);
          const matchPhone = (inv.customer_phone || "").toLowerCase().includes(term);
          if (!matchReceipt && !matchName && !matchPhone) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "date_desc") {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === "date_asc") {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === "amount_desc") {
          return b.total_amount - a.total_amount;
        }
        if (sortBy === "amount_asc") {
          return a.total_amount - b.total_amount;
        }
        if (sortBy === "profit_desc") {
          const pA = getInvoiceNetProfit(a, catalogProducts).netProfit;
          const pB = getInvoiceNetProfit(b, catalogProducts).netProfit;
          return pB - pA;
        }
        if (sortBy === "profit_asc") {
          const pA = getInvoiceNetProfit(a, catalogProducts).netProfit;
          const pB = getInvoiceNetProfit(b, catalogProducts).netProfit;
          return pA - pB;
        }
        if (sortBy === "id_asc") {
          return a.receipt_number.localeCompare(b.receipt_number);
        }
        if (sortBy === "customer_asc") {
          return (a.customer_name || "").localeCompare(b.customer_name || "");
        }
        return 0;
      });
  }, [invoices, statusFilter, branchFilter, searchTerm, sortBy, catalogProducts]);

  // Overall KPIs
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalOrders = invoices.length;
  const totalCost = invoices.reduce(
    (sum, inv) => sum + getInvoiceCost(inv, catalogProducts),
    0
  );
  const totalProfit = totalAmount - totalCost;
  const overallMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;
  const paidAmount = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  const dueAmount = invoices
    .filter((inv) => inv.status === "Due")
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  // Trigger PDF print/download for a single invoice directly
  const handleDownloadPdf = (inv: SaleInvoice) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = inv.items
      .map(
        (item, idx) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center;">${idx + 1}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600;">
            ${getProductName(item.product_id)}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: bold;">${item.quantity}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right;">৳${item.unit_price.toFixed(2)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: right; font-weight: bold;">৳${(item.quantity * item.unit_price).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice - ${inv.receipt_number}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            * { box-sizing: border-box; }
            body { font-family: sans-serif; color: #1e293b; padding: 10px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            th { background: #0f172a; color: white; padding: 6px 8px; font-size: 10px; text-transform: uppercase; }
            td { border: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 15px;">
            <div>
              <h1 style="margin: 0; font-size: 18px; color: #0f172a;">${companyProfile?.name || "MANOR FURNITURE"}</h1>
              <p style="margin: 2px 0; font-size: 11px; color: #64748b;">${companyProfile?.address || "Bozlur Mor, Kushtia"}</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 16px; color: #1e40af;">SALES INVOICE</h2>
              <p style="margin: 2px 0; font-family: monospace; font-weight: bold;">${inv.receipt_number}</p>
              <p style="margin: 2px 0; font-size: 10px; color: #64748b;">${formatDateTime(inv.created_at)}</p>
            </div>
          </div>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; margin-bottom: 15px; border-radius: 6px;">
            <strong>Customer:</strong> ${inv.customer_name} | Phone: ${inv.customer_phone} | Address: ${inv.customer_address}
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px; text-align: center;">#</th>
                <th style="text-align: left;">Product</th>
                <th style="width: 50px; text-align: center;">Qty</th>
                <th style="width: 80px; text-align: right;">Rate</th>
                <th style="width: 90px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="width: 250px; margin-left: auto; text-align: right; line-height: 1.6;">
            <div>Subtotal: <strong>৳${(inv.total_amount + inv.discount).toFixed(2)}</strong></div>
            <div>Discount: <strong style="color: #dc2626;">-৳${inv.discount.toFixed(2)}</strong></div>
            <div style="border-top: 2px solid #0f172a; padding-top: 4px; font-size: 14px; font-weight: bold;">
              Grand Total: ৳${inv.total_amount.toFixed(2)}
            </div>
            <div style="color: #16a34a; font-weight: bold; font-size: 11px;">Status: ${inv.status}</div>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 750); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDelete = async (inv: SaleInvoice) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete invoice ${inv.receipt_number} (${formatPrice(inv.total_amount)})? This action cannot be undone.`
    );
    if (!confirmed) return;
    try {
      await onDeleteInvoice(inv.id);
      setOpenMenuId(null);
      alert(`✅ Invoice ${inv.receipt_number} deleted successfully.`);
    } catch (err: any) {
      alert(err.message || "Failed to delete invoice");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards Row: 6-Card Executive Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Total Invoices (Sales Amount) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Sales
            </span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs">💰</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{formatPrice(totalAmount)}</p>
          <div className="mt-1 text-[10px] text-slate-400 font-medium truncate">
            Gross invoiced revenue
          </div>
        </div>

        {/* Total Cost of Goods Sold */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Cost
            </span>
            <span className="p-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs">🏷️</span>
          </div>
          <p className="text-xl font-extrabold text-slate-700 mt-2">{formatPrice(totalCost)}</p>
          <div className="mt-1 text-[10px] text-slate-400 font-medium truncate">
            Cost of goods sold (COGS)
          </div>
        </div>

        {/* Total Net Profit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Net Profit
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs">📈</span>
          </div>
          <p
            className={`text-xl font-extrabold mt-2 ${
              totalProfit >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {totalProfit >= 0 ? "+" : ""}
            {formatPrice(totalProfit)}
          </p>
          <div className="mt-1 text-[10px] text-emerald-600 font-semibold truncate">
            {overallMargin.toFixed(1)}% profit margin
          </div>
        </div>

        {/* Total Orders (Count) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs">📦</span>
          </div>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{totalOrders}</p>
          <div className="mt-1 text-[10px] text-slate-400 font-medium truncate">
            Total invoices generated
          </div>
        </div>

        {/* Total Paid Amount */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Settled / Paid
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs">✓</span>
          </div>
          <p className="text-xl font-extrabold text-emerald-600 mt-2">{formatPrice(paidAmount)}</p>
          <div className="mt-1 text-[10px] text-emerald-600 font-medium truncate">
            Cleared receipts
          </div>
        </div>

        {/* Total Due / Pending Amount */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Receivables
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs">⏳</span>
          </div>
          <p className="text-xl font-extrabold text-amber-600 mt-2">{formatPrice(dueAmount)}</p>
          <div className="mt-1 text-[10px] text-amber-600 font-medium truncate">
            Pending customer collections
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar: Search, Filters, Sorting, Columns & Daily Sales Print */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Facility */}
          <div className="relative flex-1 min-w-[260px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Invoice ID (INV-SOLD-...), Customer Name, or Phone..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="due">Due / Pending</option>
            </select>

            {/* Warehouse Filter */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition max-w-[160px]"
            >
              <option value="all">All Warehouses</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Sorting Facility */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition"
            >
              <option value="date_desc">📅 Date: Newest First</option>
              <option value="date_asc">📅 Date: Oldest First</option>
              <option value="amount_desc">💰 Amount: Highest First</option>
              <option value="amount_asc">💰 Amount: Lowest First</option>
              <option value="profit_desc">📈 Profit: Highest First</option>
              <option value="profit_asc">📉 Profit: Lowest First</option>
              <option value="id_asc">🔢 Invoice ID: A-Z</option>
              <option value="customer_asc">👤 Customer: A-Z</option>
            </select>

            {/* Column Active/Deactive Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <span>Columns 👁️</span>
              </button>

              {showColumnMenu && (
                <div className="absolute right-0 top-11 w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 text-xs space-y-2 animate-fadeIn">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1 border-b">
                    Toggle Table Columns
                  </div>
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                  <div className="pt-2 border-t flex justify-end">
                    <button
                      onClick={() => setShowColumnMenu(false)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Print Daily Sales Details Button */}
            {onOpenDailyReport && (
              <button
                type="button"
                onClick={onOpenDailyReport}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Print Daily Sales Details Report"
              >
                <span>🖨️</span>
                <span>Daily Sales Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Sold Invoices Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="text-4xl block mb-2">🧾</span>
            <p className="font-bold text-slate-600 text-sm">No sold invoices found</p>
            <p className="text-xs mt-1">Try adjusting your search keywords or filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                  {isVisible("receipt_number") && <th className="p-3">Invoice ID</th>}
                  {isVisible("customer") && <th className="p-3">Customer</th>}
                  {isVisible("date") && <th className="p-3">Date</th>}
                  {isVisible("created_on") && <th className="p-3">Created On</th>}
                  {isVisible("amount") && <th className="p-3 text-right">Amount</th>}
                  {isVisible("paid") && <th className="p-3 text-right">Paid</th>}
                  {isVisible("cost") && <th className="p-3 text-right">Cost</th>}
                  {isVisible("profit") && <th className="p-3 text-right">Net Profit</th>}
                  {isVisible("status") && <th className="p-3 text-center">Status</th>}
                  {isVisible("actions") && <th className="p-3 text-center w-16">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const paidValue = inv.status === "Paid" ? inv.total_amount : 0;
                  const invoiceCost = getInvoiceCost(inv, catalogProducts);
                  const { netProfit, marginPercent } = getInvoiceNetProfit(inv, catalogProducts);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition duration-150">
                      {/* Invoice ID */}
                      {isVisible("receipt_number") && (
                        <td className="p-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                          {inv.receipt_number}
                        </td>
                      )}

                      {/* Customer */}
                      {isVisible("customer") && (
                        <td className="p-3">
                          <span className="font-bold text-slate-800 block">{inv.customer_name}</span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            📞 {inv.customer_phone}
                          </span>
                        </td>
                      )}

                      {/* Date */}
                      {isVisible("date") && (
                        <td className="p-3 text-slate-600 whitespace-nowrap font-medium">
                          {formatDateOnly(inv.created_at)}
                        </td>
                      )}

                      {/* Created On */}
                      {isVisible("created_on") && (
                        <td className="p-3 text-slate-500 whitespace-nowrap">
                          {formatDateTime(inv.created_at)}
                        </td>
                      )}

                      {/* Amount */}
                      {isVisible("amount") && (
                        <td className="p-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                          {formatPrice(inv.total_amount)}
                        </td>
                      )}

                      {/* Paid */}
                      {isVisible("paid") && (
                        <td className="p-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                          {formatPrice(paidValue)}
                        </td>
                      )}

                      {/* Cost */}
                      {isVisible("cost") && (
                        <td className="p-3 text-right font-medium text-slate-600 whitespace-nowrap">
                          {formatPrice(invoiceCost)}
                        </td>
                      )}

                      {/* Net Profit */}
                      {isVisible("profit") && (
                        <td className="p-3 text-right whitespace-nowrap">
                          <span
                            className={`font-bold block ${
                              netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                            }`}
                          >
                            {netProfit >= 0 ? "+" : ""}
                            {formatPrice(netProfit)}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium block">
                            {marginPercent.toFixed(1)}% margin
                          </span>
                        </td>
                      )}

                      {/* Status */}
                      {isVisible("status") && (
                        <td className="p-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              inv.status === "Paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      )}

                      {/* Three-Dot Actions Dropdown */}
                      {isVisible("actions") && (
                        <td className="p-3 text-center relative">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(openMenuId === inv.id ? null : inv.id)
                            }
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-black text-sm transition"
                            title="Options"
                          >
                            ⋮
                          </button>

                          {openMenuId === inv.id && (
                            <div className="absolute right-3 top-10 w-44 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 py-1 text-left text-xs animate-fadeIn">
                              <button
                                onClick={() => {
                                  onViewInvoice(inv);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                              >
                                <span>👁️</span>
                                <span>View Invoice</span>
                              </button>
                              <button
                                onClick={() => {
                                  handleDownloadPdf(inv);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                              >
                                <span>📄</span>
                                <span>Download PDF</span>
                              </button>
                              <div className="border-t border-slate-100 my-0.5"></div>
                              <button
                                onClick={() => handleDelete(inv)}
                                className="w-full px-3 py-2 text-left hover:bg-red-50 flex items-center gap-2 text-red-600 font-semibold"
                              >
                                <span>🗑️</span>
                                <span>Delete Invoice</span>
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
