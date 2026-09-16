"use client";

import React, { useState, useEffect } from "react";
import { api, Branch, Product, Transfer } from "../../types";

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
      alert("Source and Destination warehouses must be different!");
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

      alert("✅ Inventory transfer complete!");
    } catch (err: any) {
      alert(err.message || "Failed to transfer inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Transfer</h3>
        {products.length === 0 && (
          <div className="mb-4 text-xs bg-yellow-50 text-yellow-700 p-3 rounded border">
            ⚠️ Register products before transfers.
          </div>
        )}
        <form onSubmit={handleTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Product</label>
            <select
              className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origin</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transfer Qty</label>
              <input
                type="number"
                step="0.01"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={txQty}
                onChange={(e) => setTxQty(e.target.value)}
                placeholder="10.00"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reference</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                placeholder="e.g. TR-204"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || products.length === 0}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isSubmitting ? "Executing..." : "Execute Transfer"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Transfers Log</h3>
        {transfers.length === 0 ? (
          <p className="text-sm text-gray-500">No transfers executed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                <tr>
                  <th className="p-3">Product SKU</th>
                  <th className="p-3">From</th>
                  <th className="p-3">To</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Ref</th>
                  <th className="p-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => {
                  const pName = products.find((p) => p.id === t.product_id)?.sku || "Unknown";
                  const fBranch = branches.find((b) => b.id === t.from_branch_id)?.name || "Unknown";
                  const tBranch = branches.find((b) => b.id === t.to_branch_id)?.name || "Unknown";
                  return (
                    <tr key={t.id} className="border-b hover:bg-gray-55">
                      <td className="p-3 font-semibold text-gray-900">{pName}</td>
                      <td className="p-3">{fBranch}</td>
                      <td className="p-3">{tBranch}</td>
                      <td className="p-3 font-bold text-blue-600">{t.quantity}</td>
                      <td className="p-3">{t.reference || "-"}</td>
                      <td className="p-3 text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
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

