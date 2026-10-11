"use client";

import React from "react";
import { api } from "../../types";

interface CompanyProfileModalProps {
  showCompanyModal: boolean;
  setShowCompanyModal: (v: boolean) => void;
  companyName: string;
  setCompanyName: (v: string) => void;
  companyAddress: string;
  setCompanyAddress: (v: string) => void;
  companyPhone: string;
  setCompanyPhone: (v: string) => void;
  companyEmail: string;
  setCompanyEmail: (v: string) => void;
  companyContact: string;
  setCompanyContact: (v: string) => void;
  setCompanyProfile: (v: any) => void;
  rbacRules: any;
}

export default function CompanyProfileModal({
  showCompanyModal,
  setShowCompanyModal,
  companyName,
  setCompanyName,
  companyAddress,
  setCompanyAddress,
  companyPhone,
  setCompanyPhone,
  companyEmail,
  setCompanyEmail,
  companyContact,
  setCompanyContact,
  setCompanyProfile,
  rbacRules,
}: CompanyProfileModalProps) {
  if (!showCompanyModal) return null;

  const handleUpdateCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = localStorage.getItem("erp_role");
    const canEditProfile = rbacRules ? rbacRules.company_profile_edit?.includes(role) : (role === "owner");
    if (!canEditProfile) {
      alert("Unauthorized: You do not have permissions to modify the Company Profile.");
      return;
    }
    try {
      const payload = {
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        contact_person: companyContact
      };
      const updated = await api.updateCompanyProfile(payload);
      setCompanyProfile(updated);
      setShowCompanyModal(false);
      alert("✅ Company profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update company profile");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl border border-border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/80 backdrop-blur sticky top-0 z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5"><span>🏢</span> Update Company Profile</h3>
            <p className="text-xs text-slate-500 mt-0.5">This information is shown on GRN forms and invoices</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCompanyModal(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleUpdateCompanyProfile} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Name *</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs font-medium text-slate-800 transition"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Manor Furniture"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Address *</label>
            <textarea
              className="w-full p-2.5 border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs text-slate-800 h-20 transition resize-none"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="e.g. Bozlur Mor, Kushita"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs font-mono text-slate-800 transition"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="e.g. 01700000000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
              <input
                type="email"
                className="w-full p-2.5 border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs font-mono text-slate-800 transition"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="e.g. accounts@manor.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Authorized Signatory / Contact Person</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-lg focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs text-slate-800 transition"
              value={companyContact}
              onChange={(e) => setCompanyContact(e.target.value)}
              placeholder="e.g. Manager"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-border">
            <button
              type="button"
              onClick={() => setShowCompanyModal(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-xs"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

