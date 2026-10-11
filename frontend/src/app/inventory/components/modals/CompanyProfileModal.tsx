"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../types";

export interface CompanyProfileModalProps {
  isOpen?: boolean;
  showCompanyModal?: boolean;
  onClose?: () => void;
  setShowCompanyModal?: (v: boolean) => void;
  companyProfile?: any;
  onProfileUpdated?: (updated: any) => void;
  setCompanyProfile?: (v: any) => void;
  rbacRules?: any;
  // Optional legacy props
  companyName?: string;
  setCompanyName?: (v: string) => void;
  companyAddress?: string;
  setCompanyAddress?: (v: string) => void;
  companyPhone?: string;
  setCompanyPhone?: (v: string) => void;
  companyEmail?: string;
  setCompanyEmail?: (v: string) => void;
  companyContact?: string;
  setCompanyContact?: (v: string) => void;
}

export const CompanyProfileModal: React.FC<CompanyProfileModalProps> = ({
  isOpen,
  showCompanyModal,
  onClose,
  setShowCompanyModal,
  companyProfile,
  onProfileUpdated,
  setCompanyProfile,
  rbacRules,
  companyName: legacyName,
  companyAddress: legacyAddress,
  companyPhone: legacyPhone,
  companyEmail: legacyEmail,
  companyContact: legacyContact,
}) => {
  const isVisible = isOpen ?? showCompanyModal ?? false;

  const handleClose = () => {
    if (onClose) onClose();
    if (setShowCompanyModal) setShowCompanyModal(false);
  };

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [contact, setContact] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync form fields when modal opens or companyProfile updates
  useEffect(() => {
    if (!isVisible) return;

    if (companyProfile) {
      setName(companyProfile.name || "");
      setAddress(companyProfile.address || "");
      setPhone(companyProfile.phone || "");
      setEmail(companyProfile.email || "");
      setContact(companyProfile.contact_person || "");
    } else if (legacyName || legacyAddress) {
      setName(legacyName || "");
      setAddress(legacyAddress || "");
      setPhone(legacyPhone || "");
      setEmail(legacyEmail || "");
      setContact(legacyContact || "");
    } else {
      // Fetch latest profile from API if not provided in props
      setIsLoading(true);
      api
        .getCompanyProfile()
        .then((profile) => {
          if (profile) {
            setName(profile.name || "");
            setAddress(profile.address || "");
            setPhone(profile.phone || "");
            setEmail(profile.email || "");
            setContact(profile.contact_person || "");
            if (onProfileUpdated) onProfileUpdated(profile);
            if (setCompanyProfile) setCompanyProfile(profile);
          }
        })
        .catch((err) => {
          console.error("Failed to load company profile", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isVisible, companyProfile, legacyName, legacyAddress, legacyPhone, legacyEmail, legacyContact]);

  if (!isVisible) return null;

  const handleUpdateCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const role = typeof window !== "undefined" ? localStorage.getItem("erp_role") : null;
    const canEditProfile = rbacRules?.company_profile_edit
      ? rbacRules.company_profile_edit.includes(role)
      : role === "owner" || !role;

    if (!canEditProfile) {
      alert("Unauthorized: You do not have permissions to modify the Company Profile.");
      return;
    }

    if (!name.trim()) {
      setErrorMessage("Company name is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        contact_person: contact.trim(),
      };
      const updated = await api.updateCompanyProfile(payload);

      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
      if (setCompanyProfile) {
        setCompanyProfile(updated);
      }

      handleClose();
      alert("✅ Company profile updated successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update company profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-lg border border-border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleUp">
        <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/80 backdrop-blur sticky top-0 z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              <span>🏢</span> Update Company Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">This information is shown on GRN forms and invoices</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs font-semibold">
            {errorMessage}
          </div>
        )}

        {isLoading ? (
          <div className="p-10 text-center text-xs text-slate-400 font-medium animate-pulse">
            Loading company profile...
          </div>
        ) : (
          <form onSubmit={handleUpdateCompanyProfile} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Company Name *
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs font-medium text-slate-800 transition"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Manor Furniture"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Address *
              </label>
              <textarea
                className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs text-slate-800 h-20 transition resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Bozlur Mor, Kushita"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs font-mono text-slate-800 transition"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs font-mono text-slate-800 transition"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. accounts@manor.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Authorized Signatory / Contact Person
              </label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white text-xs text-slate-800 transition"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. Manager"
              />
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-border">
              <button
                type="button"
                onClick={handleClose}
                className="btn-secondary text-xs"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompanyProfileModal;


