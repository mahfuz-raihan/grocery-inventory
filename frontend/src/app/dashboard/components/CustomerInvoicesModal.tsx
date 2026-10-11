"use client";

import React from "react";
import { CustomerSummary, SaleInvoice, formatPrice, formatDateTime } from "../types";

interface CustomerInvoicesModalProps {
  customer: CustomerSummary | null;
  onClose: () => void;
  onViewInvoice: (inv: SaleInvoice) => void;
}

export const CustomerInvoicesModal: React.FC<CustomerInvoicesModalProps> = ({
  customer,
  onClose,
  onViewInvoice,
}) => {
  if (!customer) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-xl border border-border max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-slate-50/80 backdrop-blur border-b border-border flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2 text-slate-900">
              <span>🧾 Invoices History:</span>
              <span className="text-brand font-extrabold">{customer.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Phone: {customer.phone} | Total Invoices: {customer.total_invoices} | Total Spend: {formatPrice(customer.total_spent)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-secondary px-3 py-1.5 font-medium rounded-lg text-xs transition"
          >
            Close
          </button>
        </div>

        {/* Invoices Table */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-slate-50/30">
          {customer.invoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No invoices recorded for this customer.
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden shadow-xs bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold text-[10px] uppercase border-b border-border">
                    <th className="p-3">Invoice ID</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-center">Items</th>
                    <th className="p-3 text-right">Discount</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customer.invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-mono font-bold text-brand hover:underline cursor-pointer" onClick={() => onViewInvoice(inv)}>{inv.receipt_number}</td>
                      <td className="p-3 text-slate-600 font-mono text-[11px]">{formatDateTime(inv.created_at)}</td>
                      <td className="p-3 text-center font-bold font-mono text-slate-700">
                        {inv.items.reduce((s, i) => s + i.quantity, 0)} pcs
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">{formatPrice(inv.discount)}</td>
                      <td className="p-3 text-right font-extrabold font-mono text-slate-900">{formatPrice(inv.total_amount)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            inv.status === "Paid"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            onViewInvoice(inv);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-semibold rounded-lg text-xs transition border border-emerald-200 shadow-xs"
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
      </div>
    </div>
  );
};

