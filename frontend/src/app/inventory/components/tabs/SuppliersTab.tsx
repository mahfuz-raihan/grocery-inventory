"use client";

import React, { useState } from "react";
import { api, Supplier } from "../../types";

interface SuppliersTabProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  userRole: string;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ suppliers, setSuppliers, userRole }) => {
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierActive, setSupplierActive] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setEditingSupplier(null);
    setSupplierName("");
    setSupplierContact("");
    setSupplierPhone("");
    setSupplierEmail("");
    setSupplierAddress("");
    setSupplierActive(true);
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: any = {
        name: supplierName.trim(),
        contact_person: supplierContact.trim(),
        phone: supplierPhone.trim(),
        email: supplierEmail.trim(),
        address: supplierAddress.trim(),
        is_active: supplierActive,
      };

      if (editingSupplier) {
        const updated = await api.updateSupplier(editingSupplier.id, payload);
        setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        alert("✅ Supplier updated successfully!");
      } else {
        const newS = await api.createSupplier(payload);
        setSuppliers((prev) => [...prev, newS]);
        alert("✅ Supplier registered successfully!");
      }
      resetForm();
    } catch (err: any) {
      alert(err.message || "Failed to save supplier info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {editingSupplier ? "✏️ Edit Supplier" : "Register Supplier"}
        </h3>
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier Company Name</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Timberwood Ltd"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Person</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
              <input
                type="email"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Office Address</label>
            <textarea
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-16"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase cursor-pointer select-none">
              <input
                type="checkbox"
                checked={supplierActive}
                onChange={(e) => setSupplierActive(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span>Supplier Status (Active)</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {isSubmitting ? "Saving..." : editingSupplier ? "Save Changes" : "Register Supplier"}
          </button>
          {editingSupplier && (
            <button
              type="button"
              onClick={resetForm}
              className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Registered Suppliers ({suppliers.length})</h3>
        {suppliers.length === 0 ? (
          <p className="text-sm text-gray-500">No suppliers registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Office Address</th>
                  <th className="p-3 text-center">Status</th>
                  {userRole && ["owner", "manager"].includes(userRole) && <th className="p-3 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-55">
                    <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                    <td className="p-3 text-xs">{s.contact_person || "-"}</td>
                    <td className="p-3 text-xs">{s.phone || "-"}</td>
                    <td className="p-3 text-xs">{s.email || "-"}</td>
                    <td className="p-3 text-[11px] text-gray-500 max-w-xs truncate">{s.address || "-"}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.is_active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {userRole && ["owner", "manager"].includes(userRole) && (
                      <td className="p-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSupplier(s);
                            setSupplierName(s.name);
                            setSupplierContact(s.contact_person || "");
                            setSupplierPhone(s.phone || "");
                            setSupplierEmail(s.email || "");
                            setSupplierAddress(s.address || "");
                            setSupplierActive(s.is_active !== false);
                          }}
                          className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-bold mr-1.5 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const updated = await api.updateSupplier(s.id, { is_active: s.is_active === false });
                              setSuppliers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                              alert(`Status updated for ${s.name}`);
                            } catch (err) {
                              alert("Failed to toggle supplier status");
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                            s.is_active !== false
                              ? "bg-red-50 text-red-700 hover:bg-red-100"
                              : "bg-green-50 text-green-700 hover:bg-green-100"
                          }`}
                        >
                          {s.is_active !== false ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

