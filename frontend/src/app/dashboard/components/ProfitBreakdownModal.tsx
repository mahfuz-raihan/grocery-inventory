"use client";

import React from "react";
import {
  SaleInvoice,
  CatalogProduct,
  Branch,
  formatPrice,
  formatDateTime,
  getInvoiceCost,
  getInvoiceNetProfit,
} from "../types";

interface ProfitBreakdownModalProps {
  invoice: SaleInvoice | null;
  catalogProducts: CatalogProduct[];
  branches: Branch[];
  onClose: () => void;
  onViewInvoice?: (invoice: SaleInvoice) => void;
}

export const ProfitBreakdownModal: React.FC<ProfitBreakdownModalProps> = ({
  invoice,
  catalogProducts,
  branches,
  onClose,
  onViewInvoice,
}) => {
  if (!invoice) return null;

  const branch = branches.find((b) => b.id === invoice.branch_id);
  const warehouseName = branch ? branch.name : "Main Warehouse";

  // Financial aggregates
  const grossSubtotal = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );
  const discount = invoice.discount || 0;
  const netRevenue = invoice.total_amount;
  const totalCost = getInvoiceCost(invoice, catalogProducts);
  const { netProfit, marginPercent } = getInvoiceNetProfit(invoice, catalogProducts);
  const markupPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;
  const isProfitable = netProfit >= 0;

  // Item calculations
  const itemRows = invoice.items.map((item, idx) => {
    const prod = catalogProducts.find((p) => p.id === item.product_id);
    const unitCost =
      prod?.average_cost && prod.average_cost > 0
        ? prod.average_cost
        : prod?.purchase_cost || 0;

    const lineRevenue = item.quantity * item.unit_price;
    const lineCost = item.quantity * unitCost;
    const lineProfit = lineRevenue - lineCost;
    const lineMargin = lineRevenue > 0 ? (lineProfit / lineRevenue) * 100 : 0;

    return {
      index: idx + 1,
      name: prod ? prod.name : item.product_name || `Product (${item.product_id.slice(0, 8)})`,
      sku: prod?.sku || "—",
      unit: prod?.unit || "pcs",
      quantity: item.quantity,
      unitPrice: item.unit_price,
      unitCost,
      lineRevenue,
      lineCost,
      lineProfit,
      lineMargin,
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold uppercase tracking-wide">Profit Calculation</h3>
                <span className="text-xs bg-blue-600 font-mono px-2 py-0.5 rounded font-bold text-white">
                  {invoice.receipt_number}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    invoice.status === "Paid"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Customer: {invoice.customer_name || "Walk-in"} • {warehouseName} • {formatDateTime(invoice.created_at)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs bg-slate-50/50 overflow-y-auto max-h-[80vh]">
          {/* Direct Calculation Flow Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">
              Calculation Summary
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center">
              {/* Subtotal */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block">Gross Subtotal</span>
                <span className="text-sm font-bold font-mono text-slate-800 block mt-1 tabular-nums">
                  {formatPrice(grossSubtotal)}
                </span>
              </div>

              {/* Discount */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block">(-) Discount</span>
                <span className="text-sm font-bold font-mono text-red-600 block mt-1 tabular-nums">
                  {discount > 0 ? `-${formatPrice(discount)}` : "৳0.00"}
                </span>
              </div>

              {/* Net Revenue */}
              <div className="p-2.5 bg-blue-50/60 rounded-lg border border-blue-100">
                <span className="text-[10px] text-blue-700 font-bold block">(=) Net Revenue</span>
                <span className="text-sm font-bold font-mono text-blue-700 block mt-1 tabular-nums">
                  {formatPrice(netRevenue)}
                </span>
              </div>

              {/* Total Cost */}
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-500 font-medium block">(-) Total Cost</span>
                <span className="text-sm font-bold font-mono text-slate-700 block mt-1 tabular-nums">
                  {formatPrice(totalCost)}
                </span>
              </div>

              {/* Net Profit */}
              <div className={`p-2.5 rounded-lg border ${
                isProfitable ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
              }`}>
                <span className={`text-[10px] font-bold block ${
                  isProfitable ? "text-emerald-700" : "text-red-700"
                }`}>
                  (=) Net Profit
                </span>
                <span className={`text-sm font-bold font-mono block mt-1 tabular-nums ${
                  isProfitable ? "text-emerald-700" : "text-red-700"
                }`}>
                  {isProfitable ? "+" : ""}{formatPrice(netProfit)}
                </span>
              </div>

              {/* Profit Margin */}
              <div className={`p-2.5 rounded-lg border ${
                isProfitable ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
              }`}>
                <span className={`text-[10px] font-bold block ${
                  isProfitable ? "text-emerald-700" : "text-red-700"
                }`}>
                  Margin %
                </span>
                <span className={`text-sm font-bold font-mono block mt-1 tabular-nums ${
                  isProfitable ? "text-emerald-700" : "text-red-700"
                }`}>
                  {marginPercent.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Arithmetic Formula Visibility */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-600 bg-slate-50 px-3 py-2 rounded-lg">
              <div>
                <span className="text-slate-400">Net Profit =</span> {formatPrice(netRevenue)} <span className="text-slate-400">-</span> {formatPrice(totalCost)} <span className="text-slate-400">=</span> <strong className={isProfitable ? "text-emerald-700" : "text-red-700"}>{isProfitable ? "+" : ""}{formatPrice(netProfit)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Margin =</span> ({formatPrice(netProfit)} ÷ {formatPrice(netRevenue)}) × 100 <span className="text-slate-400">=</span> <strong className={isProfitable ? "text-emerald-700" : "text-red-700"}>{marginPercent.toFixed(1)}%</strong>
              </div>
              <div>
                <span className="text-slate-400">Markup =</span> ({formatPrice(netProfit)} ÷ {formatPrice(totalCost)}) × 100 <span className="text-slate-400">=</span> <strong>{markupPercent.toFixed(1)}%</strong>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-2.5 bg-slate-900 text-white flex justify-between items-center text-xs">
              <span className="font-bold uppercase tracking-wider text-[11px]">
                Itemized Numbers
              </span>
              <span className="font-mono text-slate-300 text-[11px]">
                {itemRows.length} {itemRows.length === 1 ? "Item" : "Items"}
              </span>
            </div>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold text-[10px] uppercase border-b border-slate-200">
                  <th className="p-2 text-center w-8">#</th>
                  <th className="p-2">Item</th>
                  <th className="p-2 text-center w-14">Qty</th>
                  <th className="p-2 text-right w-20">Rate</th>
                  <th className="p-2 text-right w-20">Cost</th>
                  <th className="p-2 text-right w-24">Revenue</th>
                  <th className="p-2 text-right w-24">Cost</th>
                  <th className="p-2 text-right w-24">Profit</th>
                  <th className="p-2 text-right w-16">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itemRows.map((it) => {
                  const itProfitPositive = it.lineProfit >= 0;
                  return (
                    <tr key={it.index} className="hover:bg-slate-50/60">
                      <td className="p-2 text-center text-slate-400 font-mono">{it.index}</td>
                      <td className="p-2">
                        <span className="font-semibold text-slate-800 block">{it.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">SKU: {it.sku}</span>
                      </td>
                      <td className="p-2 text-center font-mono tabular-nums font-bold text-slate-800">
                        {it.quantity}
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums text-slate-600">
                        {formatPrice(it.unitPrice)}
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums text-slate-600">
                        {formatPrice(it.unitCost)}
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums font-bold text-blue-700">
                        {formatPrice(it.lineRevenue)}
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums text-slate-700">
                        {formatPrice(it.lineCost)}
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums font-bold">
                        <span className={itProfitPositive ? "text-emerald-600" : "text-red-600"}>
                          {itProfitPositive ? "+" : ""}{formatPrice(it.lineProfit)}
                        </span>
                      </td>
                      <td className="p-2 text-right font-mono tabular-nums font-bold">
                        <span className={itProfitPositive ? "text-emerald-700" : "text-red-700"}>
                          {it.lineMargin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                {/* Line Total */}
                <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                  <td colSpan={2} className="p-2 text-slate-600 uppercase text-[10px]">Total:</td>
                  <td className="p-2 text-center font-mono">
                    {itemRows.reduce((sum, it) => sum + it.quantity, 0)}
                  </td>
                  <td colSpan={2}></td>
                  <td className="p-2 text-right font-mono text-blue-700">{formatPrice(grossSubtotal)}</td>
                  <td className="p-2 text-right font-mono text-slate-700">{formatPrice(totalCost)}</td>
                  <td className="p-2 text-right font-mono text-emerald-700">
                    {formatPrice(grossSubtotal - totalCost)}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {grossSubtotal > 0 ? (((grossSubtotal - totalCost) / grossSubtotal) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                {/* Discount Row if any */}
                {discount > 0 && (
                  <tr className="bg-amber-50/50 font-bold border-t border-amber-200 text-slate-800">
                    <td colSpan={5} className="p-2 text-right uppercase text-[10px] text-amber-800">
                      Less Discount:
                    </td>
                    <td className="p-2 text-right font-mono text-red-600">-{formatPrice(discount)}</td>
                    <td></td>
                    <td className="p-2 text-right font-mono text-red-600">-{formatPrice(discount)}</td>
                    <td></td>
                  </tr>
                )}

                {/* Net Final Row */}
                <tr className="bg-slate-900 font-extrabold text-white text-xs border-t-2 border-slate-900">
                  <td colSpan={5} className="p-2.5 text-right uppercase tracking-wider text-slate-300 text-[10px]">
                    Net Final:
                  </td>
                  <td className="p-2.5 text-right font-mono text-blue-300">{formatPrice(netRevenue)}</td>
                  <td className="p-2.5 text-right font-mono text-slate-300">{formatPrice(totalCost)}</td>
                  <td className="p-2.5 text-right font-mono text-emerald-400">
                    {isProfitable ? "+" : ""}{formatPrice(netProfit)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-400">{marginPercent.toFixed(1)}%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-between items-center gap-3">
          <div className="text-xs text-slate-500">
            Net Profit: <span className={`font-mono font-bold ${isProfitable ? "text-emerald-600" : "text-red-600"}`}>{isProfitable ? "+" : ""}{formatPrice(netProfit)} ({marginPercent.toFixed(1)}%)</span>
          </div>
          <div className="flex items-center gap-2">
            {onViewInvoice && (
              <button
                onClick={() => {
                  onClose();
                  onViewInvoice(invoice);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                View Invoice
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
