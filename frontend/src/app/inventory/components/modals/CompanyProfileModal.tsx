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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="p-6 border-b flex items-center justify-between bg-blue-50 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-blue-900">🏢 Update Company Profile</h3>
            <p className="text-xs text-blue-600 mt-1">This information is shown on GRN forms and invoices</p>
          </div>
          <button
            type="button"
            onClick={() => setShowCompanyModal(false)}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleUpdateCompanyProfile} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Company Name *</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-semibold text-gray-800"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Manor Furniture"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Address *</label>
            <textarea
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-gray-700 h-20"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              placeholder="e.g. Bozlur Mor, Kushita"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={companyPhone}
                onChange={(e) => setCompanyPhone(e.target.value)}
                placeholder="e.g. 01700000000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
              <input
                type="email"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                value={companyEmail}
                onChange={(e) => setCompanyEmail(e.target.value)}
                placeholder="e.g. accounts@manor.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Authorized Signatory / Contact Person</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
              value={companyContact}
              onChange={(e) => setCompanyContact(e.target.value)}
              placeholder="e.g. Manager"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={() => setShowCompanyModal(false)}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

