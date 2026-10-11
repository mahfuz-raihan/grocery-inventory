"use client";

import React, { useState, useEffect } from "react";
import { Adjustment, api, Branch, Product } from "../../types";

interface AdjustmentsTabProps {
  adjustments: Adjustment[];
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustment[]>>;
  products: Product[];
  branches: Branch[];
  userEmail?: string;
  onAdjustmentCompleted?: () => void;
}

export const AdjustmentsTab: React.FC<AdjustmentsTabProps> = ({
  adjustments,
  setAdjustments,
  products,
  branches,
  userEmail,
  onAdjustmentCompleted,
}) => {
  const [adjProduct, setAdjProduct] = useState("");
  const [adjBranch, setAdjBranch] = useState("");
  const [adjCurrent, setAdjCurrent] = useState("");
  const [adjChange, setAdjChange] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjNotes, setAdjNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!adjProduct && products.length > 0) {
      setAdjProduct(products[0].id);
    }
    if (!adjBranch && branches.length > 0) {
      setAdjBranch(branches[0].id);
    }
  }, [products, branches, adjProduct, adjBranch]);

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || !adjBranch || !adjChange || !adjReason) return;

    setIsSubmitting(true);
    try {
      const payload = {
        product_id: adjProduct,
        branch_id: adjBranch,
        current_quantity: parseFloat(adjCurrent || "0"),
        adjusted_quantity: parseFloat(adjChange),
        reason: adjReason,
        notes: adjNotes,
        approved_by: userEmail || "Self",
      };
      const newAdj = await api.createAdjustment(payload);
      setAdjustments((prev) => [newAdj, ...prev]);
      setAdjChange("");
      setAdjReason("");
      setAdjNotes("");
      setAdjCurrent("");

      if (onAdjustmentCompleted) {
        onAdjustmentCompleted();
      }

      alert("✅ Adjustment logged successfully!");
    } catch (err) {
      alert("Failed to register stock adjustment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="erp-card p-6 h-fit">
        <h3 className="text-base font-bold text-slate-900 mb-4">Inventory Adjustment</h3>
        <form onSubmit={handleAdjustment} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Product</label>
            <select
              className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={adjProduct}
              onChange={(e) => setAdjProduct(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Location</label>
            <select
              className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={adjBranch}
              onChange={(e) => setAdjBranch(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Qty</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-border rounded-md bg-slate-50/50 text-xs font-mono text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={adjCurrent}
                onChange={(e) => setAdjCurrent(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Quantity Change</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-border rounded-md text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={adjChange}
                onChange={(e) => setAdjChange(e.target.value)}
                placeholder="e.g. -5.0 or 15.0"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reason for Adjustment</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="e.g. Stock audit variance, Damaged core"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Internal Notes</label>
            <textarea
              className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none h-16 text-xs bg-white text-slate-800 transition"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || products.length === 0}
            className="btn-primary w-full py-2.5 text-xs font-semibold justify-center disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Register Correction"}
          </button>
        </form>
      </div>

      <div className="erp-card p-6 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-900 mb-4">Adjustments Audit Log</h3>
        {adjustments.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-md border border-border">No stock corrections logged yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Product SKU</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Delta</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {adjustments.map((a) => {
                  const pName = products.find((p) => p.id === a.product_id)?.sku || "Unknown";
                  const fBranch = branches.find((b) => b.id === a.branch_id)?.name || "Unknown";
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-semibold text-slate-900">{pName}</td>
                      <td className="p-3 text-slate-700 font-medium">{fBranch}</td>
                      <td
                        className={`p-3 font-mono font-bold tabular-nums ${a.adjusted_quantity < 0 ? "text-rose-600" : "text-emerald-700"}`}
                      >
                        {a.adjusted_quantity > 0 ? `+${a.adjusted_quantity}` : a.adjusted_quantity}
                      </td>
                      <td className="p-3 text-slate-700">{a.reason}</td>
                      <td className="p-3 text-xs text-slate-500">{a.approved_by}</td>
                      <td className="p-3 text-xs text-slate-400 font-mono tabular-nums">{new Date(a.created_at).toLocaleString()}</td>
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

