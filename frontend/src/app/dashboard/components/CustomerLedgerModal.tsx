"use client";

import React from "react";
import { CustomerSummary, CatalogProduct, formatPrice, formatDateTime } from "../types";

interface CustomerLedgerModalProps {
  customer: CustomerSummary | null;
  onClose: () => void;
  catalogProducts: CatalogProduct[];
}

export const CustomerLedgerModal: React.FC<CustomerLedgerModalProps> = ({
  customer,
  onClose,
  catalogProducts,
}) => {
  if (!customer) return null;

  const getProductName = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    return prod ? prod.name : `Product (${productId.slice(0, 8)})`;
  };

  // Flatten all line items chronologically (earliest to latest for running balance)
  const sortedInvoices = [...customer.invoices].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let runningTotal = 0;
  let totalUnits = 0;
  const ledgerRows: any[] = [];

  for (const inv of sortedInvoices) {
    for (const item of inv.items) {
      const itemSubtotal = item.quantity * item.unit_price;
      runningTotal += itemSubtotal;
      totalUnits += item.quantity;
      ledgerRows.push({
        date: inv.created_at,
        receipt_number: inv.receipt_number,
        product_id: item.product_id,
        supplier_name: item.supplier_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: itemSubtotal,
        status: inv.status,
        cumulative_total: runningTotal,
      });
    }
  }

  // Display latest first in table
  const displayRows = [...ledgerRows].reverse();

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>📊 Customer Purchase Ledger:</span>
              <span className="text-blue-400">{customer.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Phone: {customer.phone} | Complete itemized purchase timeline and financial ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
          >
            Close
          </button>
        </div>

        {/* Financial Summary Cards */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Invoices
            </span>
            <span className="text-lg font-extrabold text-slate-900">{customer.total_invoices}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Items Purchased
            </span>
            <span className="text-lg font-extrabold text-slate-900">{totalUnits} pcs</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Gross Purchases
            </span>
            <span className="text-lg font-extrabold text-slate-900">{formatPrice(runningTotal)}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Paid Spend
            </span>
            <span className="text-lg font-extrabold text-emerald-600">{formatPrice(customer.total_spent)}</span>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="p-6 overflow-y-auto max-h-[62vh]">
          {displayRows.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No item purchase history found for this customer.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
                    <th className="p-3">Date</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Product Description</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Unit Rate</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-right">Running Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 text-slate-500 whitespace-nowrap">{formatDateTime(row.date)}</td>
                      <td className="p-3 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {row.receipt_number}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {getProductName(row.product_id)}
                      </td>
                      <td className="p-3 text-center font-bold text-slate-700">{row.quantity}</td>
                      <td className="p-3 text-right text-slate-600">{formatPrice(row.unit_price)}</td>
                      <td className="p-3 text-right font-bold text-slate-900">{formatPrice(row.subtotal)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        {formatPrice(row.cumulative_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

