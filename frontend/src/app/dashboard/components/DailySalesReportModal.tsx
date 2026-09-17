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

interface DailySalesReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: SaleInvoice[];
  catalogProducts: CatalogProduct[];
  branches: Branch[];
  companyProfile: CompanyProfile | null;
}

export const DailySalesReportModal: React.FC<DailySalesReportModalProps> = ({
  isOpen,
  onClose,
  invoices,
  catalogProducts,
  branches,
  companyProfile,
}) => {
  // Get today's local date in YYYY-MM-DD format
  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  const getProductName = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    return prod ? prod.name : `Product (${productId.slice(0, 8)})`;
  };

  const getBranchName = (branchId: string) => {
    const match = branches.find((b) => b.id === branchId);
    return match ? match.name : "Warehouse";
  };

  // Filter invoices for selected date & branch, sorted chronologically (earliest to latest)
  const dailyInvoices = useMemo(() => {
    return invoices
      .filter((inv) => {
        const invDate = formatDateOnly(inv.created_at);
        if (invDate !== selectedDate) return false;
        if (selectedBranch !== "all" && inv.branch_id !== selectedBranch) return false;
        return true;
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [invoices, selectedDate, selectedBranch]);

  // Aggregate daily metrics
  const totalInvoicesCount = dailyInvoices.length;
  const totalDailySales = dailyInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalDailyCost = dailyInvoices.reduce(
    (sum, inv) => sum + getInvoiceCost(inv, catalogProducts),
    0
  );
  const totalDailyProfit = totalDailySales - totalDailyCost;
  const dailyProfitMargin =
    totalDailySales > 0 ? (totalDailyProfit / totalDailySales) * 100 : 0;
  const totalDailyPaid = dailyInvoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalDailyDue = dailyInvoices
    .filter((inv) => inv.status === "Due")
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  // Format date nicely for report display
  const formatReportDate = (dStr: string) => {
    if (!dStr) return "";
    const [y, m, d] = dStr.split("-").map(Number);
    if (!y || !m || !d) return dStr;
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Format time only (e.g. 02:45 PM)
  const formatTimeOnly = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  // Handle Print via clean A4 Landscape Window
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the daily sales report.");
      return;
    }

    const branchLabel =
      selectedBranch === "all"
        ? "All Branches / Warehouses"
        : getBranchName(selectedBranch);

    const rowsHtml =
      dailyInvoices.length === 0
        ? `<tr><td colspan="10" style="text-align: center; padding: 25px; color: #000000; font-weight: 700; font-style: italic;">No sales recorded on this date.</td></tr>`
        : dailyInvoices
            .map((inv, idx) => {
              const cost = getInvoiceCost(inv, catalogProducts);
              const { netProfit, marginPercent } = getInvoiceNetProfit(inv, catalogProducts);
              const itemsList = inv.items
                .map((it) => `${getProductName(it.product_id)} (${it.quantity})`)
                .join(", ");

              return `
              <tr style="background: ${idx % 2 === 1 ? "#f8fafc" : "#ffffff"};">
                <td style="text-align: center; padding: 6px 6px; font-size: 10px; font-weight: 800; border: 1px solid #94a3b8; color: #000000;">${idx + 1}</td>
                <td style="text-align: center; padding: 6px 6px; font-size: 10px; font-weight: 700; border: 1px solid #94a3b8; color: #000000; white-space: nowrap;">${formatTimeOnly(inv.created_at)}</td>
                <td style="padding: 6px 6px; font-family: monospace; font-size: 11px; font-weight: 900; border: 1px solid #94a3b8; color: #1e3a8a; white-space: nowrap;">${inv.receipt_number}</td>
                <td style="padding: 6px 6px; font-size: 10px; border: 1px solid #94a3b8; color: #000000;">
                  <div style="font-weight: 800; color: #000000;">${inv.customer_name || "Walk-in"}</div>
                  <div style="font-size: 9.5px; color: #334155; font-weight: 600;">${inv.customer_phone || ""}</div>
                </td>
                <td style="padding: 6px 6px; font-size: 10px; border: 1px solid #94a3b8; max-width: 220px; color: #000000; font-weight: 600;">
                  ${itemsList || "—"}
                </td>
                <td style="text-align: center; padding: 6px 6px; font-size: 10px; border: 1px solid #94a3b8; font-weight: 700; color: #000000;">
                  ${getBranchName(inv.branch_id)}
                </td>
                <td style="text-align: right; padding: 6px 6px; font-size: 11px; font-weight: 900; border: 1px solid #94a3b8; color: #000000; white-space: nowrap;">
                  ৳${inv.total_amount.toFixed(2)}
                </td>
                <td style="text-align: right; padding: 6px 6px; font-size: 10.5px; font-weight: 700; color: #334155; border: 1px solid #94a3b8; white-space: nowrap;">
                  ৳${cost.toFixed(2)}
                </td>
                <td style="text-align: right; padding: 6px 6px; font-size: 11px; font-weight: 900; border: 1px solid #94a3b8; color: ${netProfit >= 0 ? "#047857" : "#b91c1c"}; white-space: nowrap;">
                  ${netProfit >= 0 ? "+" : ""}৳${netProfit.toFixed(2)}
                  <span style="font-size: 9px; font-weight: 800; display: block; color: #334155;">${marginPercent.toFixed(1)}%</span>
                </td>
                <td style="text-align: center; padding: 6px 6px; font-size: 10px; border: 1px solid #94a3b8; white-space: nowrap;">
                  <span style="padding: 3px 8px; border-radius: 4px; font-weight: 900; font-size: 9px; text-transform: uppercase; border: 1.5px solid ${inv.status === "Paid" ? "#15803d" : "#b45309"}; background: ${inv.status === "Paid" ? "#dcfce7; color: #14532d;" : "#fef3c7; color: #78350f;"}">
                    ${inv.status}
                  </span>
                </td>
              </tr>
            `;
            })
            .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Sales Report - ${selectedDate}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #000000;
              margin: 0;
              padding: 6px;
              font-size: 11px;
              line-height: 1.4;
              -webkit-font-smoothing: antialiased;
              text-rendering: optimizeLegibility;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #000000;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .kpi-row {
              display: grid;
              grid-template-columns: repeat(6, 1fr);
              gap: 8px;
              margin-bottom: 14px;
            }
            .kpi-card {
              border: 1.5px solid #0f172a;
              border-radius: 6px;
              padding: 6px 8px;
              background: #f8fafc;
              text-align: center;
            }
            .kpi-title {
              font-size: 9px;
              text-transform: uppercase;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.04em;
            }
            .kpi-value {
              font-size: 14px;
              font-weight: 900;
              color: #000000;
              margin-top: 3px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 16px;
            }
            th {
              background: #0f172a;
              color: #ffffff;
              font-size: 9.5px;
              font-weight: 800;
              text-transform: uppercase;
              padding: 7px 6px;
              border: 1.5px solid #0f172a;
              letter-spacing: 0.03em;
            }
            td {
              border: 1px solid #94a3b8;
            }
            .footer-total-row td {
              background: #e2e8f0;
              font-weight: 900;
              font-size: 11px;
              border-top: 2.5px solid #000000;
              border-bottom: 2.5px solid #000000;
              padding: 7px 6px;
              color: #000000;
            }
            .signatures {
              margin-top: 24px;
              display: flex;
              justify-content: space-between;
              padding: 0 30px;
            }
            .sign-box {
              border-top: 2px solid #000000;
              width: 190px;
              text-align: center;
              padding-top: 5px;
              font-size: 10px;
              font-weight: 800;
              color: #000000;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -0.02em;">
                ${companyProfile?.name || "MANOR FURNITURE & INTERIORS"}
              </h1>
              <p style="margin: 3px 0 0 0; font-size: 10.5px; color: #0f172a; font-weight: 600;">
                ${companyProfile?.address || "Bozlur Mor, Kushtia Road, Bangladesh"} | Phone: ${companyProfile?.phone || "01700-000000"}
              </p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #0f172a; font-weight: 700;">
                Warehouse Scope: <strong>${branchLabel}</strong>
              </p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 16px; font-weight: 900; color: #1e40af; letter-spacing: 0.04em;">
                DAILY SALES DETAILS REPORT
              </h2>
              <p style="margin: 3px 0 0 0; font-size: 11px; font-weight: 800; color: #000000;">
                📅 ${formatReportDate(selectedDate)}
              </p>
              <p style="margin: 2px 0 0 0; font-size: 9.5px; color: #334155; font-weight: 600;">
                Generated: ${formatDateTime(new Date().toISOString())}
              </p>
            </div>
          </div>

          <!-- Executive Daily Summary KPIs -->
          <div class="kpi-row">
            <div class="kpi-card">
              <div class="kpi-title">Total Invoices</div>
              <div class="kpi-value">${totalInvoicesCount}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Sales (Revenue)</div>
              <div class="kpi-value" style="color: #1e40af;">৳${totalDailySales.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Total Cost (COGS)</div>
              <div class="kpi-value" style="color: #0f172a;">৳${totalDailyCost.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Daily Net Profit</div>
              <div class="kpi-value" style="color: ${totalDailyProfit >= 0 ? "#047857" : "#b91c1c"};">
                ${totalDailyProfit >= 0 ? "+" : ""}৳${totalDailyProfit.toFixed(2)}
                <span style="font-size: 9.5px; display: block; font-weight: 800;">${dailyProfitMargin.toFixed(1)}% margin</span>
              </div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Cash Settled / Paid</div>
              <div class="kpi-value" style="color: #047857;">৳${totalDailyPaid.toFixed(2)}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-title">Receivables / Due</div>
              <div class="kpi-value" style="color: #b45309;">৳${totalDailyDue.toFixed(2)}</div>
            </div>
          </div>

          <!-- Itemized Daily Sales Audit Table -->
          <table>
            <thead>
              <tr>
                <th style="width: 25px; text-align: center;">#</th>
                <th style="width: 65px; text-align: center;">Time</th>
                <th style="width: 140px; text-align: left;">Invoice No</th>
                <th style="width: 130px; text-align: left;">Customer</th>
                <th style="text-align: left;">Items Breakdown</th>
                <th style="width: 90px; text-align: center;">Warehouse</th>
                <th style="width: 80px; text-align: right;">Amount</th>
                <th style="width: 75px; text-align: right;">Cost</th>
                <th style="width: 85px; text-align: right;">Net Profit</th>
                <th style="width: 60px; text-align: center;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr class="footer-total-row">
                <td colspan="6" style="text-align: right; padding-right: 12px; text-transform: uppercase;">
                  Daily Grand Totals (${totalInvoicesCount} Invoices):
                </td>
                <td style="text-align: right; white-space: nowrap;">৳${totalDailySales.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap; color: #000000;">৳${totalDailyCost.toFixed(2)}</td>
                <td style="text-align: right; white-space: nowrap; color: ${totalDailyProfit >= 0 ? "#047857" : "#b91c1c"};">
                  ${totalDailyProfit >= 0 ? "+" : ""}৳${totalDailyProfit.toFixed(2)}
                </td>
                <td style="text-align: center; font-size: 9px; font-weight: 800; color: #0f172a;">
                  ${totalDailyDue > 0 ? "Due: ৳" + totalDailyDue.toFixed(0) : "All Cleared"}
                </td>
              </tr>
            </tfoot>
          </table>

          <!-- Sign-Off & Verification Block -->
          <div class="signatures">
            <div class="sign-box">
              Prepared By (Cashier / Executive)
              <div style="font-size: 8.5px; color: #475569; margin-top: 2px; font-weight: 600;">Signature & Date</div>
            </div>
            <div class="sign-box">
              Checked & Verified By (Accounts)
              <div style="font-size: 8.5px; color: #475569; margin-top: 2px; font-weight: 600;">Signature & Date</div>
            </div>
            <div class="sign-box">
              Approved By (Branch / General Manager)
              <div style="font-size: 8.5px; color: #475569; margin-top: 2px; font-weight: 600;">Signature & Date</div>
            </div>
          </div>

          <div style="text-align: center; margin-top: 20px; font-size: 9.5px; color: #475569; font-weight: 600; border-top: 1px dashed #94a3b8; padding-top: 6px;">
            Daily Sales Reconciliation Report • Strictly Confidential & For Internal HQ Auditing
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        {/* Top Control Header */}
        <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">🖨️ Daily Sales Details Report</span>
              <span className="text-xs bg-blue-600 px-2 py-0.5 rounded font-mono font-bold">
                {selectedDate}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Print-ready daily sales breakdown with per-invoice cost, net profit, and reconciliation signatures.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow-md"
              title="Print standard A4 landscape report"
            >
              <span>🖨️</span>
              <span>Print A4 Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Date Picker */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="font-bold text-slate-500">📅 Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-bold text-slate-800 focus:outline-none cursor-pointer bg-transparent"
              />
            </div>

            {/* Quick shortcuts */}
            <button
              type="button"
              onClick={() => setSelectedDate(getTodayStr())}
              className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                selectedDate === getTodayStr()
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDate(getYesterdayStr())}
              className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                selectedDate === getYesterdayStr()
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              Yesterday
            </button>

            {/* Warehouse Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
              <span className="font-bold text-slate-500">🏢 Warehouse:</span>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="text-xs font-bold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
              >
                <option value="all">All Warehouses</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-slate-500 font-medium text-[11px]">
            Showing <strong className="text-slate-800">{dailyInvoices.length}</strong> invoice(s) for {formatReportDate(selectedDate)}
          </div>
        </div>

        {/* Scrollable Report Body */}
        <div className="p-5 overflow-y-auto space-y-5 bg-slate-100/70">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Invoices
              </span>
              <p className="text-xl font-extrabold text-slate-900 mt-1">{totalInvoicesCount}</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Sales
              </span>
              <p className="text-xl font-extrabold text-blue-600 mt-1">
                {formatPrice(totalDailySales)}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Cost
              </span>
              <p className="text-xl font-extrabold text-slate-600 mt-1">
                {formatPrice(totalDailyCost)}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Net Profit
              </span>
              <p
                className={`text-xl font-extrabold mt-1 ${
                  totalDailyProfit >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {totalDailyProfit >= 0 ? "+" : ""}
                {formatPrice(totalDailyProfit)}
              </p>
              <span className="text-[9px] text-slate-400 font-medium">
                {dailyProfitMargin.toFixed(1)}% margin
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Settled / Cash
              </span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">
                {formatPrice(totalDailyPaid)}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Due / Credit
              </span>
              <p className="text-xl font-extrabold text-amber-600 mt-1">
                {formatPrice(totalDailyDue)}
              </p>
            </div>
          </div>

          {/* Itemized Table Preview */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Itemized Sales Log ({formatReportDate(selectedDate)})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                A4 Landscape Print Format
              </span>
            </div>

            {dailyInvoices.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <span className="text-3xl block mb-2">🧾</span>
                <p className="font-bold text-slate-600 text-sm">No sales found on this date</p>
                <p className="text-xs mt-1">Please select another date using the date picker above.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                      <th className="p-2.5 text-center w-8">#</th>
                      <th className="p-2.5 text-center w-20">Time</th>
                      <th className="p-2.5">Invoice ID</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Products Sold</th>
                      <th className="p-2.5 text-center">Warehouse</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5 text-right">Cost</th>
                      <th className="p-2.5 text-right">Net Profit</th>
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyInvoices.map((inv, idx) => {
                      const cost = getInvoiceCost(inv, catalogProducts);
                      const { netProfit, marginPercent } = getInvoiceNetProfit(
                        inv,
                        catalogProducts
                      );
                      const itemsSummary = inv.items
                        .map((it) => `${getProductName(it.product_id)} (${it.quantity})`)
                        .join(", ");

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50 transition">
                          <td className="p-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="p-2.5 text-center text-slate-500 font-mono whitespace-nowrap">
                            {formatTimeOnly(inv.created_at)}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                            {inv.receipt_number}
                          </td>
                          <td className="p-2.5">
                            <span className="font-bold text-slate-800 block">
                              {inv.customer_name || "Walk-in"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {inv.customer_phone || "—"}
                            </span>
                          </td>
                          <td className="p-2.5 max-w-[240px] truncate text-slate-600 text-[11px]" title={itemsSummary}>
                            {itemsSummary || "—"}
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap text-slate-600">
                            {getBranchName(inv.branch_id)}
                          </td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            {formatPrice(inv.total_amount)}
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-600 whitespace-nowrap">
                            {formatPrice(cost)}
                          </td>
                          <td className="p-2.5 text-right whitespace-nowrap">
                            <span
                              className={`font-bold block ${
                                netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                              }`}
                            >
                              {netProfit >= 0 ? "+" : ""}
                              {formatPrice(netProfit)}
                            </span>
                            <span className="text-[9px] text-slate-400 block font-medium">
                              {marginPercent.toFixed(1)}%
                            </span>
                          </td>
                          <td className="p-2.5 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                inv.status === "Paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-900 font-extrabold text-xs text-slate-900">
                      <td colSpan={6} className="p-3 text-right uppercase tracking-wider">
                        Daily Totals ({totalInvoicesCount} Invoices):
                      </td>
                      <td className="p-3 text-right text-blue-700 font-black whitespace-nowrap">
                        {formatPrice(totalDailySales)}
                      </td>
                      <td className="p-3 text-right text-slate-600 whitespace-nowrap">
                        {formatPrice(totalDailyCost)}
                      </td>
                      <td
                        className={`p-3 text-right whitespace-nowrap ${
                          totalDailyProfit >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {totalDailyProfit >= 0 ? "+" : ""}
                        {formatPrice(totalDailyProfit)}
                      </td>
                      <td className="p-3 text-center text-[10px] text-slate-500 whitespace-nowrap">
                        {totalDailyDue > 0 ? `Due: ${formatPrice(totalDailyDue)}` : "All Paid"}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

