"use client";

import React from "react";
import {
  SaleInvoice,
  CatalogProduct,
  CompanyProfile,
  Branch,
  formatPrice,
  formatDateTime,
} from "../types";

interface InvoiceModalProps {
  invoice: SaleInvoice | null;
  onClose: () => void;
  catalogProducts: CatalogProduct[];
  branches: Branch[];
  companyProfile: CompanyProfile | null;
}

// Exported High-Definition Print Function with Forced Color Adjustment and Bold Typography
export const printSaleInvoice = (
  invoice: SaleInvoice,
  catalogProducts: CatalogProduct[],
  branches: Branch[],
  companyProfile: CompanyProfile | null
) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print invoices.");
    return;
  }

  const branch = branches.find((b) => b.id === invoice.branch_id);
  const warehouseName = branch ? branch.name : "Main Warehouse";

  const getProductName = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    return prod ? prod.name : `Product (${productId.slice(0, 8)})`;
  };

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const itemsHtml = invoice.items
    .map(
      (item, idx) => `
      <tr style="background: ${idx % 2 === 1 ? "#f8fafc" : "#ffffff"};">
        <td style="padding: 7px 10px; border: 1px solid #94a3b8; font-size: 11px; text-align: center; font-weight: 700; color: #000000;">${idx + 1}</td>
        <td style="padding: 7px 10px; border: 1px solid #94a3b8; font-size: 12px; font-weight: 800; color: #000000;">
          ${getProductName(item.product_id)}
        </td>
        <td style="padding: 7px 10px; border: 1px solid #94a3b8; font-size: 12px; text-align: center; font-weight: 900; color: #000000; font-family: monospace, sans-serif;">${item.quantity}</td>
        <td style="padding: 7px 10px; border: 1px solid #94a3b8; font-size: 12px; text-align: right; font-weight: 700; color: #000000;">৳${item.unit_price.toFixed(2)}</td>
        <td style="padding: 7px 10px; border: 1px solid #94a3b8; font-size: 12px; text-align: right; font-weight: 900; color: #000000;">৳${(item.quantity * item.unit_price).toFixed(2)}</td>
      </tr>
    `
    )
    .join("");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${invoice.receipt_number}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
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
            font-size: 12px;
            line-height: 1.45;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            text-rendering: optimizeLegibility;
          }
          .invoice-box {
            max-width: 100%;
            margin: 0 auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border-bottom: 3px solid #000000;
            padding-bottom: 10px;
          }
          .header-table td { vertical-align: top; }
          .company-name {
            font-size: 22px;
            font-weight: 900;
            color: #000000;
            margin: 0 0 3px 0;
            letter-spacing: -0.02em;
            text-transform: uppercase;
          }
          .company-info {
            font-size: 11px;
            color: #0f172a;
            font-weight: 600;
            margin: 2px 0;
          }
          .invoice-title {
            font-size: 20px;
            font-weight: 900;
            color: #000000;
            margin: 0 0 4px 0;
            text-align: right;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }
          .invoice-no {
            font-family: monospace, monospace;
            font-weight: 900;
            color: #1e40af;
            font-size: 13px;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            background: #f8fafc;
            border: 2px solid #0f172a;
            border-radius: 6px;
          }
          .meta-table td {
            padding: 9px 12px;
            vertical-align: top;
            font-size: 11.5px;
            width: 50%;
          }
          .meta-label {
            font-size: 9.5px;
            font-weight: 900;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            margin-bottom: 3px;
          }
          .meta-value {
            font-size: 13px;
            font-weight: 800;
            color: #000000;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18px;
          }
          .items-table th {
            background: #0f172a !important;
            color: #ffffff !important;
            font-size: 11px;
            font-weight: 900;
            text-transform: uppercase;
            padding: 8px 10px;
            border: 1.5px solid #0f172a;
            letter-spacing: 0.04em;
          }
          .items-table td {
            border: 1px solid #94a3b8;
          }
          .summary-table {
            width: 48%;
            margin-left: auto;
            border-collapse: collapse;
            margin-bottom: 22px;
          }
          .summary-table td {
            padding: 5px 10px;
            font-size: 12px;
            color: #000000;
          }
          .summary-table .total-row td {
            border-top: 3px solid #000000;
            border-bottom: 3px solid #000000;
            font-size: 15px;
            font-weight: 900;
            color: #000000;
            padding-top: 8px;
            padding-bottom: 8px;
            background: #f1f5f9;
          }
          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 10.5px;
            font-weight: 900;
            text-transform: uppercase;
            border: 1.5px solid ${invoice.status === "Paid" ? "#16a34a" : "#dc2626"};
            background: ${invoice.status === "Paid" ? "#dcfce7 !important; color: #14532d !important;" : "#fee2e2 !important; color: #7f1d1d !important;"};
          }
          .footer-signatures {
            margin-top: 38px;
            display: flex;
            justify-content: space-between;
            padding: 0 10px;
          }
          .sign-line {
            border-top: 1.5px solid #000000;
            width: 160px;
            text-align: center;
            padding-top: 5px;
            font-weight: 800;
            color: #000000;
            font-size: 11px;
          }
          .footer-note {
            border-top: 1px dashed #64748b;
            padding-top: 10px;
            font-size: 10px;
            font-weight: 600;
            color: #334155;
            text-align: center;
            margin-top: 22px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table class="header-table">
            <tr>
              <td>
                <h1 class="company-name">${companyProfile?.name || "MANOR FURNITURE & INTERIORS"}</h1>
                <p class="company-info">${companyProfile?.address || "Bozlur Mor, Kushtia Road, Bangladesh"}</p>
                <p class="company-info">Phone: ${companyProfile?.phone || "01700-000000"}${companyProfile?.email ? ` | Email: ${companyProfile.email}` : ""}</p>
              </td>
              <td style="text-align: right;">
                <h2 class="invoice-title">SALES INVOICE</h2>
                <p class="company-info" style="margin-top: 4px;"><strong>Invoice No:</strong> <span class="invoice-no">${invoice.receipt_number}</span></p>
                <p class="company-info"><strong>Date:</strong> ${formatDateTime(invoice.created_at)}</p>
                <p class="company-info" style="margin-top: 4px;"><strong>Status:</strong> <span class="status-badge">${invoice.status}</span></p>
              </td>
            </tr>
          </table>

          <table class="meta-table">
            <tr>
              <td>
                <div class="meta-label">Bill To (Customer Details)</div>
                <div class="meta-value">${invoice.customer_name || "Walk-in Customer"}</div>
                <div style="color: #0f172a; font-weight: 600; margin-top: 3px;">Phone: ${invoice.customer_phone || "—"}</div>
                <div style="color: #0f172a; font-weight: 600; margin-top: 1px;">Address: ${invoice.customer_address || "—"}</div>
              </td>
              <td style="border-left: 2px solid #0f172a;">
                <div class="meta-label">Dispatch / Point of Sale</div>
                <div class="meta-value">Warehouse: ${warehouseName}</div>
                <div style="color: #0f172a; font-weight: 600; margin-top: 3px;">Payment Method: Cash / Card Settlement</div>
                <div style="color: #0f172a; font-weight: 600; margin-top: 1px;">Settlement Date: ${formatDateTime(invoice.created_at)}</div>
              </td>
            </tr>
          </table>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 38px; text-align: center;">#</th>
                <th style="text-align: left;">Item Description</th>
                <th style="width: 65px; text-align: center;">Qty</th>
                <th style="width: 95px; text-align: right;">Rate (৳)</th>
                <th style="width: 105px; text-align: right;">Amount (৳)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td style="font-weight: 700; color: #1e293b;">Subtotal:</td>
              <td style="text-align: right; font-weight: 800; color: #000000;">৳${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-weight: 700; color: #1e293b;">Discount:</td>
              <td style="text-align: right; font-weight: 800; color: #dc2626;">-৳${invoice.discount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Grand Total:</td>
              <td style="text-align: right;">৳${invoice.total_amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="font-weight: 800; color: #15803d; font-size: 11px;">Paid Amount:</td>
              <td style="text-align: right; font-weight: 900; color: #15803d; font-size: 11.5px;">
                ৳${invoice.status === "Paid" ? invoice.total_amount.toFixed(2) : "0.00"}
              </td>
            </tr>
          </table>

          <div class="footer-signatures">
            <div class="sign-line">
              Customer Signature
            </div>
            <div class="sign-line">
              Authorized Officer
            </div>
          </div>

          <div class="footer-note">
            Thank you for your business! Goods once sold can only be exchanged per company warranty terms. This is a computer-generated invoice.
          </div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 750);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  onClose,
  catalogProducts,
  branches,
  companyProfile,
}) => {
  if (!invoice) return null;

  const branch = branches.find((b) => b.id === invoice.branch_id);
  const warehouseName = branch ? branch.name : "Main Warehouse";

  const getProductName = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    return prod ? prod.name : `Item #${productId.slice(0, 8)}`;
  };

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  const handlePrint = () => {
    printSaleInvoice(invoice, catalogProducts, branches, companyProfile);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold">📄 Invoice Preview</span>
            <span className="text-xs bg-blue-600 font-mono px-2 py-0.5 rounded font-bold">
              {invoice.receipt_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-sm"
              title="Print or Save as PDF (A4 Layout)"
            >
              <span>🖨️</span>
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Compact A4 Preview Card */}
        <div className="p-6 bg-slate-100 overflow-y-auto max-h-[78vh]">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-800 space-y-4">
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">
                  {companyProfile?.name || "MANOR FURNITURE & INTERIORS"}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {companyProfile?.address || "Bozlur Mor, Kushtia Road, Bangladesh"}
                </p>
                <p className="text-[11px] text-slate-500">
                  Phone: {companyProfile?.phone || "01700-000000"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-blue-700 font-extrabold text-sm uppercase tracking-wider block">
                  Retail Invoice
                </span>
                <span className="font-mono font-bold text-xs text-slate-900 block mt-0.5">
                  {invoice.receipt_number}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {formatDateTime(invoice.created_at)}
                </span>
              </div>
            </div>

            {/* Customer & Warehouse Details */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Customer Information
                </span>
                <p className="font-bold text-slate-900 text-xs">{invoice.customer_name}</p>
                <p className="text-slate-600 text-[11px]">Phone: {invoice.customer_phone}</p>
                <p className="text-slate-600 text-[11px]">Address: {invoice.customer_address}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Warehouse & Status
                </span>
                <p className="font-bold text-slate-900 text-xs">{warehouseName}</p>
                <div className="mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      invoice.status === "Paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    Payment: {invoice.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white font-bold text-[10px] uppercase">
                    <th className="p-2 text-center w-8">#</th>
                    <th className="p-2">Item Description</th>
                    <th className="p-2 text-center w-16">Qty</th>
                    <th className="p-2 text-right w-24">Rate</th>
                    <th className="p-2 text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                      <td className="p-2 font-semibold text-slate-800">
                        {getProductName(item.product_id)}
                      </td>
                      <td className="p-2 text-center font-bold text-slate-900">{item.quantity}</td>
                      <td className="p-2 text-right text-slate-600">{formatPrice(item.unit_price)}</td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {formatPrice(item.quantity * item.unit_price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary Grid */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Discount:</span>
                  <span className="font-semibold text-red-600">-{formatPrice(invoice.discount)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-900 text-sm border-t border-slate-300 pt-1.5">
                  <span>Grand Total:</span>
                  <span className="text-blue-900">{formatPrice(invoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                  <span>Amount Paid:</span>
                  <span>{formatPrice(invoice.status === "Paid" ? invoice.total_amount : 0)}</span>
                </div>
              </div>
            </div>

            {/* Compact Footer */}
            <div className="border-t border-slate-200 pt-3 text-center text-[10px] text-slate-400">
              A4 Page Format • Valid Computer-Generated Tax & Sales Invoice
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

