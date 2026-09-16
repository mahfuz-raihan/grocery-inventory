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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Adjustment</h3>
        <form onSubmit={handleAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Product</label>
            <select
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warehouse Location</label>
            <select
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Qty</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                value={adjCurrent}
                onChange={(e) => setAdjCurrent(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity Change</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={adjChange}
                onChange={(e) => setAdjChange(e.target.value)}
                placeholder="e.g. -5.0 or 15.0"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Adjustment</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="e.g. Stock audit variance, Damaged core"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
            <textarea
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-16"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || products.length === 0}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : "Register Correction"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Adjustments Audit Log</h3>
        {adjustments.length === 0 ? (
          <p className="text-sm text-gray-500">No stock corrections logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                <tr>
                  <th className="p-3">Product SKU</th>
                  <th className="p-3">Warehouse</th>
                  <th className="p-3">Delta</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Approved By</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => {
                  const pName = products.find((p) => p.id === a.product_id)?.sku || "Unknown";
                  const fBranch = branches.find((b) => b.id === a.branch_id)?.name || "Unknown";
                  return (
                    <tr key={a.id} className="border-b hover:bg-gray-55">
                      <td className="p-3 font-semibold text-gray-900">{pName}</td>
                      <td className="p-3">{fBranch}</td>
                      <td
                        className={`p-3 font-bold ${a.adjusted_quantity < 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {a.adjusted_quantity > 0 ? `+${a.adjusted_quantity}` : a.adjusted_quantity}
                      </td>
                      <td className="p-3">{a.reason}</td>
                      <td className="p-3 text-xs">{a.approved_by}</td>
                      <td className="p-3 text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</td>
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

