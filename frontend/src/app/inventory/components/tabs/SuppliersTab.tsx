"use client";

import React, { useState } from "react";
import { api, Supplier } from "../../types";
import { toast } from "@/components/ui/Toast";

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
        toast.success("Supplier updated successfully!");
      } else {
        const newS = await api.createSupplier(payload);
        setSuppliers((prev) => [...prev, newS]);
        toast.success("Supplier registered successfully!");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err.message || "Failed to save supplier info");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="erp-card p-6 h-fit">
        <h3 className="text-base font-bold text-slate-900 mb-4">
          {editingSupplier ? "✏️ Edit Supplier" : "Register Supplier"}
        </h3>
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Supplier Company Name</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              placeholder="e.g. Timberwood Ltd"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Contact Person</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md text-xs font-mono bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                className="w-full p-2.5 border border-border rounded-md text-xs font-mono bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
                value={supplierEmail}
                onChange={(e) => setSupplierEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Office Address</label>
            <textarea
              className="w-full p-2.5 border border-border rounded-md text-xs bg-white text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none h-16 transition"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={supplierActive}
                onChange={(e) => setSupplierActive(e.target.checked)}
                className="w-4 h-4 rounded text-brand focus:ring-brand border-border"
              />
              <span>Supplier Status (Active)</span>
            </label>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-2.5 text-xs font-semibold justify-center disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : editingSupplier ? "Save Changes" : "Register Supplier"}
          </button>
          {editingSupplier && (
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary w-full py-2 text-xs font-medium justify-center"
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="erp-card p-6 lg:col-span-2">
        <h3 className="text-base font-bold text-slate-900 mb-4">Registered Suppliers ({suppliers.length})</h3>
        {suppliers.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-md border border-border">No suppliers registered.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border">
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
              <tbody className="divide-y divide-border/60">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3 text-slate-600">{s.contact_person || "-"}</td>
                    <td className="p-3 text-slate-600 font-mono">{s.phone || "-"}</td>
                    <td className="p-3 text-slate-600 font-mono">{s.email || "-"}</td>
                    <td className="p-3 text-[11px] text-slate-500 max-w-xs truncate">{s.address || "-"}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${
                          s.is_active !== false ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-rose-50 text-rose-800 border-rose-200"
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
                          className="px-2.5 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded text-xs font-medium mr-1.5 transition"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const updated = await api.updateSupplier(s.id, { is_active: s.is_active === false });
                              setSuppliers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
                              toast.success(`Status updated for ${s.name}`);
                            } catch (err) {
                              toast.error("Failed to toggle supplier status");
                            }
                          }}
                          className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                            s.is_active !== false
                              ? "bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200"
                              : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200"
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

