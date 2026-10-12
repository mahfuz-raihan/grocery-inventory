"use client";

import React, { useState, useEffect } from "react";
import { api, Branch, Product, Transfer } from "../../types";
import { toast } from "@/components/ui/Toast";

interface TransfersTabProps {
  transfers: Transfer[];
  setTransfers: React.Dispatch<React.SetStateAction<Transfer[]>>;
  products: Product[];
  branches: Branch[];
  onTransferCompleted?: () => void;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({
  transfers,
  setTransfers,
  products,
  branches,
  onTransferCompleted,
}) => {
  const [txProduct, setTxProduct] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txQty, setTxQty] = useState("");
  const [txRef, setTxRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!txProduct && products.length > 0) {
      setTxProduct(products[0].id);
    }
    if (!txFrom && branches.length > 0) {
      setTxFrom(branches[0].id);
    }
    if (!txTo && branches.length > 1) {
      setTxTo(branches[1].id);
    } else if (!txTo && branches.length > 0) {
      setTxTo(branches[0].id);
    }
  }, [products, branches, txProduct, txFrom, txTo]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txProduct || !txFrom || !txTo || !txQty) return;
    if (txFrom === txTo) {
      toast.warning("Source and Destination warehouses must be different!");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        product_id: txProduct,
        from_branch_id: txFrom,
        to_branch_id: txTo,
        quantity: parseFloat(txQty),
        reference: txRef,
      };
      const newTx = await api.createTransfer(payload);
      setTransfers((prev) => [newTx, ...prev]);
      setTxQty("");
      setTxRef("");

      if (onTransferCompleted) {
        onTransferCompleted();
      }

      toast.success("Inventory transfer complete!");
    } catch (err: any) {
      toast.error(err.message || "Failed to transfer inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="erp-card p-6 h-fit">
        <h3 className="text-base font-bold text-slate-900 mb-4">Stock Transfer</h3>
        {products.length === 0 && (
          <div className="mb-4 text-xs bg-amber-50 text-amber-800 p-3 rounded-md border border-amber-200">
            ⚠️ Register products before transfers.
          </div>
        )}
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Product</label>
            <select
              className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={txProduct}
              onChange={(e) => setTxProduct(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Origin</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={txFrom}
                onChange={(e) => setTxFrom(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Destination</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={txTo}
                onChange={(e) => setTxTo(e.target.value)}
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Transfer Qty</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border border-border rounded-md text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={txQty}
                onChange={(e) => setTxQty(e.target.value)}
                placeholder="10.00"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reference</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md text-xs font-mono text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. TR-204"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || products.length === 0}
            className="btn-primary w-full py-2.5 text-xs font-semibold justify-center disabled:opacity-50"
          >
            {isSubmitting ? "Executing..." : "Execute Transfer"}
          </button>
        </form>
      </div>

      <div className="erp-card p-6 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-900 mb-4">Stock Transfers Log</h3>
        {transfers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-md border border-border">No transfers executed yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border">
                <tr>
                  <th className="p-3">Product SKU</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {transfers.map((t) => {
                  const pName = products.find((p) => p.id === t.product_id)?.sku || "Unknown";
                  const fBranch = branches.find((b) => b.id === t.from_branch_id)?.name || "Unknown";
                  const tBranch = branches.find((b) => b.id === t.to_branch_id)?.name || "Unknown";
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-semibold text-slate-900">{pName}</td>
                      <td className="p-3 text-slate-700 font-medium">{fBranch}</td>
                      <td className="p-3 text-slate-700 font-medium">{tBranch}</td>
                      <td className="p-3 font-mono font-bold tabular-nums text-brand">{t.quantity}</td>
                      <td className="p-3 font-mono text-slate-600">{t.reference || "-"}</td>
                      <td className="p-3 text-xs text-slate-400 font-mono tabular-nums">{new Date(t.created_at).toLocaleString()}</td>
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

