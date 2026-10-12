"use client";

import React, { useState } from "react";
import { api, Branch } from "../../types";
import { toast } from "@/components/ui/Toast";

interface WarehousesTabProps {
  branches: Branch[];
  onWarehouseCreated: (branch: Branch) => void;
}

export const WarehousesTab: React.FC<WarehousesTabProps> = ({ branches, onWarehouseCreated }) => {
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeWarehouses = branches.filter((b) => b.branch_type === "warehouse");

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: warehouseName.trim(),
        address: warehouseAddress.trim(),
        branch_type: "warehouse",
      };
      const newB = await api.createBranch(payload);
      onWarehouseCreated(newB);
      setWarehouseName("");
      setWarehouseAddress("");
      toast.success("Warehouse created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="erp-card p-6 h-fit">
        <h3 className="text-base font-bold text-slate-900 mb-4">Create Factory Warehouse</h3>
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Warehouse Name</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              placeholder="e.g. Raw Material Storage A"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Location Address</label>
            <textarea
              className="w-full p-2.5 border border-border rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none h-24 transition"
              value={warehouseAddress}
              onChange={(e) => setWarehouseAddress(e.target.value)}
              placeholder="Factory Zone A, Block C..."
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 text-xs font-semibold justify-center disabled:opacity-50"
          >
            {isSubmitting ? "Creating..." : "Create Warehouse"}
          </button>
        </form>
      </div>

      <div className="erp-card p-6 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-900 mb-4">Active Warehouses ({activeWarehouses.length})</h3>
        {activeWarehouses.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-md border border-border">No factory warehouses registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeWarehouses.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-slate-50/60 border border-border rounded-md flex flex-col justify-between hover:border-slate-300 transition"
              >
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">{b.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{b.address || "No address listed"}</p>
                </div>
                <span className="mt-3 text-[10px] bg-brand-50 text-brand border border-emerald-200 font-semibold px-2 py-0.5 rounded w-fit uppercase tracking-wider">
                  {b.branch_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

