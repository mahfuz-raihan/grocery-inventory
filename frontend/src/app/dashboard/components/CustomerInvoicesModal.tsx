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
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <span>🧾 Invoices History:</span>
              <span className="text-blue-400">{customer.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Phone: {customer.phone} | Total Invoices: {customer.total_invoices} | Total Spend: {formatPrice(customer.total_spent)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
          >
            Close
          </button>
        </div>

        {/* Invoices Table */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {customer.invoices.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              No invoices recorded for this customer.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase border-b border-slate-200">
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
                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-3 font-mono font-bold text-blue-600">{inv.receipt_number}</td>
                      <td className="p-3 text-slate-600">{formatDateTime(inv.created_at)}</td>
                      <td className="p-3 text-center font-bold text-slate-700">
                        {inv.items.reduce((s, i) => s + i.quantity, 0)} pcs
                      </td>
                      <td className="p-3 text-right text-slate-500">{formatPrice(inv.discount)}</td>
                      <td className="p-3 text-right font-extrabold text-slate-900">{formatPrice(inv.total_amount)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            inv.status === "Paid"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
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
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs transition border border-blue-200 shadow-sm"
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

