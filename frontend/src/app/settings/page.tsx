"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "company" | "rbac">("profile");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Company Profile fields
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [companySuccess, setCompanySuccess] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);

  // RBAC fields
  const [rbacRules, setRbacRules] = useState<any>(null);
  const [savingRbac, setSavingRbac] = useState(false);
  const [rbacSuccess, setRbacSuccess] = useState<string | null>(null);
  const [rbacError, setRbacError] = useState<string | null>(null);

  const rolesList = ["owner", "manager", "cashier", "stock_handler"];
  const inventoryTabsList = [
    { id: "stock_list", label: "📋 Stock List" },
    { id: "products", label: "📦 Manage Products" },
    { id: "receiving", label: "📥 Stock Receiving" },
    { id: "warehouses", label: "🏢 Warehouses" },
    { id: "suppliers", label: "🤝 Suppliers" },
    { id: "transfers", label: "🔄 Stock Transfers" },
    { id: "adjustments", label: "⚙️ Adjustments Log" },
    { id: "reports", label: "📊 Valuation & Reports" }
  ];

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    const uid = localStorage.getItem("erp_user_id");
    setUserRole(role);
    setUserId(uid);

    // Deep-link check for ?tab=company or ?tab=rbac or ?tab=profile
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const tabParam = searchParams.get("tab");
      if (tabParam === "company") {
        setActiveTab("company");
      } else if (tabParam === "rbac") {
        setActiveTab("rbac");
      } else if (tabParam === "profile") {
        setActiveTab("profile");
      }
    }

    async function loadData() {
      try {
        if (uid) {
          const user = await api.getUser(uid);
          setFullName(user.full_name || "");
          setEmail(user.email || "");
        }
        
        const rbac = await api.getSetting("rbac_rules");
        setRbacRules(rbac);

        try {
          const comp = await api.getCompanyProfile();
          if (comp) {
            setCompanyName(comp.name || "");
            setCompanyAddress(comp.address || "");
            setCompanyPhone(comp.phone || "");
            setCompanyEmail(comp.email || "");
            setCompanyContact(comp.contact_person || "");
          }
        } catch (compErr) {
          console.error("Failed to load company profile", compErr);
        }
      } catch (err) {
        console.error("Failed to load settings data", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (password && password !== confirmPassword) {
      setProfileError("Passwords do not match!");
      return;
    }

    if (password && password.length < 8) {
      setProfileError("Password must be at least 8 characters long!");
      return;
    }

    if (!userId) return;

    setSavingProfile(true);
    try {
      const payload: any = { full_name: fullName };
      if (password) {
        payload.password = password;
      }
      await api.updateUser(userId, payload);
      setProfileSuccess("✅ Profile updated successfully!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const canEditCompany = rbacRules?.company_profile_edit
    ? rbacRules.company_profile_edit.includes(userRole)
    : (userRole === "owner" || !userRole);

  const handleUpdateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySuccess(null);
    setCompanyError(null);

    if (!canEditCompany) {
      setCompanyError("Unauthorized: You do not have permission to modify the Company Profile.");
      return;
    }

    if (!companyName.trim()) {
      setCompanyError("Company legal name is required.");
      return;
    }

    setSavingCompany(true);
    try {
      const payload = {
        name: companyName.trim(),
        address: companyAddress.trim(),
        phone: companyPhone.trim(),
        email: companyEmail.trim(),
        contact_person: companyContact.trim(),
      };
      await api.updateCompanyProfile(payload);
      setCompanySuccess("✅ Company profile updated successfully!");
    } catch (err: any) {
      setCompanyError(err.message || "Failed to update company profile");
    } finally {
      setSavingCompany(false);
    }
  };

  const handleToggleTabPermission = (role: string, tabId: string) => {
    if (!rbacRules) return;
    const currentTabs = rbacRules.visible_inventory_tabs[role] || [];
    let updatedTabs;
    if (currentTabs.includes(tabId)) {
      updatedTabs = currentTabs.filter((id: string) => id !== tabId);
    } else {
      updatedTabs = [...currentTabs, tabId];
    }
    setRbacRules({
      ...rbacRules,
      visible_inventory_tabs: {
        ...rbacRules.visible_inventory_tabs,
        [role]: updatedTabs
      }
    });
  };

  const handleToggleFeatureFlag = (flagName: string, role: string) => {
    if (!rbacRules) return;
    const currentFlags = rbacRules[flagName] || [];
    let updatedFlags;
    if (currentFlags.includes(role)) {
      updatedFlags = currentFlags.filter((r: string) => r !== role);
    } else {
      updatedFlags = [...currentFlags, role];
    }
    setRbacRules({
      ...rbacRules,
      [flagName]: updatedFlags
    });
  };

  const handleSaveRbac = async () => {
    if (!rbacRules) return;
    setSavingRbac(true);
    setRbacSuccess(null);
    setRbacError(null);

    try {
      await api.updateSetting("rbac_rules", JSON.stringify(rbacRules));
      setRbacSuccess("✅ Access Control rules saved successfully!");
    } catch (err: any) {
      setRbacError(err.message || "Failed to save settings");
    } finally {
      setSavingRbac(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-400 font-semibold text-sm animate-pulse">Loading Application Settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-canvas text-slate-800 pb-12">
      <div className="max-w-4xl space-y-6">
        
        {/* Tab Navigation header */}
        <div className="inline-flex bg-slate-100/90 p-1 rounded-md border border-border gap-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeTab === "profile"
                ? "bg-white text-slate-900 shadow-sm border border-border/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            👤 User Profile
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
              activeTab === "company"
                ? "bg-white text-slate-900 shadow-sm border border-border/60"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            🏢 Company Profile
          </button>
          {userRole === "owner" && (
            <button
              onClick={() => setActiveTab("rbac")}
              className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
                activeTab === "rbac"
                  ? "bg-white text-slate-900 shadow-sm border border-border/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              🔒 Access Control Rules
            </button>
          )}
        </div>

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <div className="erp-card overflow-hidden">
            <div className="p-5 border-b border-border bg-slate-50/80 backdrop-blur">
              <h3 className="text-base font-bold text-slate-900">User Profile Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure your personal information and security credentials</p>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-medium">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs font-medium">
                  ⚠️ {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Registered Email</label>
                  <input
                    type="email"
                    disabled
                    className="w-full p-2.5 border border-border rounded-md bg-slate-100 cursor-not-allowed text-slate-400 font-mono text-xs font-medium"
                    value={email}
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Email address cannot be changed.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs font-medium text-slate-800 bg-white transition"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-6 space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Security Credentials (Change Password)</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Leave fields blank if you do not wish to update your password</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">New Password</label>
                    <input
                      type="password"
                      className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 bg-white transition"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 bg-white transition"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn-primary text-xs"
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Company Profile */}
        {activeTab === "company" && (
          <div className="erp-card overflow-hidden">
            <div className="p-5 border-b border-border bg-slate-50/80 backdrop-blur flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Company Profile Settings</h3>
                <p className="text-xs text-slate-500 mt-0.5">Manage enterprise organization name, contact details, and invoice headers</p>
              </div>
              {!canEditCompany && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-xs font-medium">
                  🔒 Read-Only Mode
                </span>
              )}
            </div>

            <form onSubmit={handleUpdateCompany} className="p-6 space-y-6">
              {companySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-medium">
                  {companySuccess}
                </div>
              )}
              {companyError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs font-medium">
                  ⚠️ {companyError}
                </div>
              )}

              {!canEditCompany && (
                <div className="p-3 bg-slate-50 border border-border rounded-md text-slate-600 text-xs font-medium">
                  ℹ️ You are viewing the organization profile in read-only mode. Access to modify company profile details is restricted by administrator permissions.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Company Legal Name *</label>
                  <input
                    type="text"
                    required
                    disabled={!canEditCompany || savingCompany}
                    className={`w-full p-2.5 border border-border rounded-md text-xs font-medium focus:ring-1 focus:ring-brand focus:border-brand ${
                      !canEditCompany ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white text-slate-900"
                    }`}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Acme Enterprise Ltd."
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Appears on invoices, purchase orders, receipts, and reports.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contact Person</label>
                  <input
                    type="text"
                    disabled={!canEditCompany || savingCompany}
                    className={`w-full p-2.5 border border-border rounded-md text-xs font-medium focus:ring-1 focus:ring-brand focus:border-brand ${
                      !canEditCompany ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white text-slate-900"
                    }`}
                    value={companyContact}
                    onChange={(e) => setCompanyContact(e.target.value)}
                    placeholder="e.g. John Doe (Managing Director)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Official Phone</label>
                  <input
                    type="tel"
                    disabled={!canEditCompany || savingCompany}
                    className={`w-full p-2.5 border border-border rounded-md text-xs font-medium focus:ring-1 focus:ring-brand focus:border-brand ${
                      !canEditCompany ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white text-slate-900"
                    }`}
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="+880 1XXXXXXXXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Official Email</label>
                  <input
                    type="email"
                    disabled={!canEditCompany || savingCompany}
                    className={`w-full p-2.5 border border-border rounded-md text-xs font-medium focus:ring-1 focus:ring-brand focus:border-brand ${
                      !canEditCompany ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white text-slate-900"
                    }`}
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Office / Factory Address</label>
                  <textarea
                    rows={3}
                    disabled={!canEditCompany || savingCompany}
                    className={`w-full p-2.5 border border-border rounded-md text-xs font-medium focus:ring-1 focus:ring-brand focus:border-brand resize-none ${
                      !canEditCompany ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white text-slate-900"
                    }`}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Corporate headquarters and facility address..."
                  />
                </div>
              </div>

              {canEditCompany && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={savingCompany}
                    className="btn-primary text-xs"
                  >
                    {savingCompany ? "Saving Profile..." : "Save Company Profile"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Tab 3: RBAC Config */}
        {activeTab === "rbac" && userRole === "owner" && rbacRules && (
          <div className="erp-card overflow-hidden">
            <div className="p-5 border-b border-border bg-slate-50/80 backdrop-blur">
              <h3 className="text-base font-bold text-slate-900">Access Control Matrix</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure visible tabs and action locks centrally across user roles</p>
            </div>

            <div className="p-6 space-y-6">
              {rbacSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-xs font-medium">
                  {rbacSuccess}
                </div>
              )}
              {rbacError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-800 text-xs font-medium">
                  ⚠️ {rbacError}
                </div>
              )}

              {/* 1. Visible Inventory Tabs */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">1. Factory Inventory Control Tab Visibility</h4>
                <div className="border border-border rounded-md overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[11px] border-b border-border">
                      <tr>
                        <th className="p-3">Inventory Panel Tabs</th>
                        {rolesList.map(role => (
                          <th key={role} className="p-3 text-center capitalize">{role.replace('_', ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {inventoryTabsList.map(tab => (
                        <tr key={tab.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="p-3 font-medium text-slate-800 text-xs">{tab.label}</td>
                          {rolesList.map(role => {
                            const isChecked = rbacRules.visible_inventory_tabs[role]?.includes(tab.id);
                            return (
                              <td key={role} className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked || false}
                                  onChange={() => handleToggleTabPermission(role, tab.id)}
                                  className="h-4 w-4 text-brand rounded border-border focus:ring-brand cursor-pointer"
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Feature Actions Matrix */}
              <div className="border-t border-border pt-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">2. Security Lockouts & Feature Actions</h4>
                
                <div className="border border-border rounded-md overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[11px] border-b border-border">
                      <tr>
                        <th className="p-3">Global Application Actions</th>
                        {rolesList.map(role => (
                          <th key={role} className="p-3 text-center capitalize">{role.replace('_', ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <span className="font-medium text-slate-900 text-xs block">🔄 POS Warehouse Select</span>
                          <span className="text-[10px] text-slate-400">Allows cashier/user to toggle warehouse branches at POS</span>
                        </td>
                        {rolesList.map(role => {
                          const isChecked = rbacRules.pos_warehouse_select?.includes(role);
                          return (
                            <td key={role} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked || false}
                                onChange={() => handleToggleFeatureFlag("pos_warehouse_select", role)}
                                className="h-4 w-4 text-brand rounded border-border focus:ring-brand cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <span className="font-medium text-slate-900 text-xs block">🏷️ Edit Selling & Purchase Price</span>
                          <span className="text-[10px] text-slate-400">Allows modifying prices centrally in catalog/GRN receiving</span>
                        </td>
                        {rolesList.map(role => {
                          const isChecked = rbacRules.product_price_edit?.includes(role);
                          return (
                            <td key={role} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked || false}
                                onChange={() => handleToggleFeatureFlag("product_price_edit", role)}
                                className="h-4 w-4 text-brand rounded border-border focus:ring-brand cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3">
                          <span className="font-medium text-slate-900 text-xs block">🏢 Edit Company Profile Details</span>
                          <span className="text-[10px] text-slate-400">Allows updating firm phone, address, and credentials</span>
                        </td>
                        {rolesList.map(role => {
                          const isChecked = rbacRules.company_profile_edit?.includes(role);
                          return (
                            <td key={role} className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked || false}
                                onChange={() => handleToggleFeatureFlag("company_profile_edit", role)}
                                className="h-4 w-4 text-brand rounded border-border focus:ring-brand cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={handleSaveRbac}
                  disabled={savingRbac}
                  className="btn-primary text-xs"
                >
                  {savingRbac ? "Saving Rules..." : "Save Access Controls"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
