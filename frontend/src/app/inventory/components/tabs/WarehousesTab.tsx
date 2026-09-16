"use client";

import React, { useState } from "react";
import { api, Branch } from "../../types";

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
      alert("✅ Warehouse created successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create warehouse");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Create Factory Warehouse</h3>
        <form onSubmit={handleCreateWarehouse} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Warehouse Name</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={warehouseName}
              onChange={(e) => setWarehouseName(e.target.value)}
              placeholder="e.g. Raw Material Storage A"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Location Address</label>
            <textarea
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
              value={warehouseAddress}
              onChange={(e) => setWarehouseAddress(e.target.value)}
              placeholder="Factory Zone A, Block C..."
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isSubmitting ? "Creating..." : "Create Warehouse"}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Active Warehouses ({activeWarehouses.length})</h3>
        {activeWarehouses.length === 0 ? (
          <p className="text-sm text-gray-500">No factory warehouses registered yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeWarehouses.map((b) => (
              <div
                key={b.id}
                className="p-4 bg-gray-50 border rounded-xl flex flex-col justify-between hover:shadow-sm"
              >
                <div>
                  <h4 className="font-bold text-blue-900">{b.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{b.address || "No address listed"}</p>
                </div>
                <span className="mt-3 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full w-fit">
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

