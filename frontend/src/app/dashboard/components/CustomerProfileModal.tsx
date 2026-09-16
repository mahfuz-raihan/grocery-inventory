"use client";

import React, { useState } from "react";
import { CustomerSummary, CatalogProduct, formatPrice, formatDateOnly } from "../types";

interface CustomerProfileModalProps {
  customer: CustomerSummary | null;
  onClose: () => void;
  catalogProducts: CatalogProduct[];
  onCustomerUpdated: (oldPhone: string, oldName: string, updated: { name: string; phone: string; address: string }) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customer,
  onClose,
  catalogProducts,
  onCustomerUpdated,
}) => {
  if (!customer) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(customer.name);
  const [editPhone, setEditPhone] = useState(customer.phone === "—" ? "" : customer.phone);
  const [editAddress, setEditAddress] = useState(customer.address === "—" ? "" : customer.address);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getProductName = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    return prod ? prod.name : `Product (${productId.slice(0, 8)})`;
  };

  // Find top purchased products
  const productCountMap: Record<string, number> = {};
  for (const inv of customer.invoices) {
    for (const item of inv.items) {
      productCountMap[item.product_id] =
        (productCountMap[item.product_id] || 0) + item.quantity;
    }
  }
  const topProducts = Object.entries(productCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([pid, qty]) => ({
      name: getProductName(pid),
      qty,
    }));

  const sortedDates = customer.invoices
    .map((i) => new Date(i.created_at).getTime())
    .sort();
  const firstOrderDate = sortedDates.length > 0 ? new Date(sortedDates[0]).toISOString() : "";
  const avgOrderValue =
    customer.total_invoices > 0 ? customer.total_spent / customer.total_invoices : 0;

  const handleSave = async () => {
    if (!editName.trim()) {
      setErrorMessage("Customer name cannot be empty.");
      return;
    }
    setErrorMessage("");
    setIsSaving(true);
    try {
      const baseUrl = window.location.origin;
      const res = await fetch(`${baseUrl}/api/v1/sales/customers/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_phone: customer.phone,
          current_name: customer.name,
          new_name: editName.trim(),
          new_phone: editPhone.trim() || "—",
          new_address: editAddress.trim() || "—",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to update customer profile");
      }

      onCustomerUpdated(customer.phone, customer.name, {
        name: editName.trim(),
        phone: editPhone.trim() || "—",
        address: editAddress.trim() || "—",
      });

      setIsEditing(false);
      alert("✅ Customer profile updated successfully across all invoices!");
    } catch (err: any) {
      setErrorMessage(err.message || "Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-lg">
              {customer.name ? customer.name[0].toUpperCase() : "C"}
            </div>
            <div>
              <h3 className="font-bold text-base text-white">{customer.name}</h3>
              <p className="text-xs text-slate-400">Unique Customer Profile & CRM Record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition"
              >
                ✏️ Edit Info
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Edit Form or View Info */}
          {isEditing ? (
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                Edit Customer Details
              </span>
              {errorMessage && (
                <div className="p-2.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg">
                  {errorMessage}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                    placeholder="e.g. 01700-000000"
                  />
                </div>
              </div>
              <div className="text-xs">
                <label className="block text-slate-500 font-bold mb-1">Shipping / Billing Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-600 font-semibold"
                  placeholder="Address"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setErrorMessage("");
                  }}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-xs transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition shadow-sm"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Phone Number
                </span>
                <span className="font-bold text-slate-800 text-sm">{customer.phone}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Address
                </span>
                <span className="font-semibold text-slate-700">{customer.address}</span>
              </div>
            </div>
          )}

          {/* CRM Analytics KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Orders
              </span>
              <span className="text-xl font-extrabold text-slate-900">{customer.total_invoices}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Lifetime Spend
              </span>
              <span className="text-xl font-extrabold text-emerald-600">{formatPrice(customer.total_spent)}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Avg Order Value
              </span>
              <span className="text-xl font-extrabold text-blue-600">{formatPrice(avgOrderValue)}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Member Since
              </span>
              <span className="text-sm font-bold text-slate-800">
                {firstOrderDate ? formatDateOnly(firstOrderDate) : "—"}
              </span>
            </div>
          </div>

          {/* Top Purchased Items */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block mb-3">
              🏆 Top Purchased Items
            </span>
            {topProducts.length === 0 ? (
              <p className="text-slate-400 italic">No products purchased yet</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[11px]">
                      {p.qty} units
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

