"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "rbac">("profile");
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

    async function loadData() {
      try {
        if (uid) {
          const user = await api.getUser(uid);
          setFullName(user.full_name || "");
          setEmail(user.email || "");
        }
        
        const rbac = await api.getSetting("rbac_rules");
        setRbacRules(rbac);
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
        <div className="text-slate-400 font-semibold animate-pulse">Loading Application Settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Tab Navigation header */}
        <div className="flex border-b border-gray-200 bg-white p-2 rounded-xl border shadow-sm max-w-fit space-x-1">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "profile" ? "bg-blue-600 text-white shadow-sm font-bold" : "text-gray-500 hover:text-gray-700 hover:bg-gray-55"}`}
          >
            👤 User Profile
          </button>
          {userRole === "owner" && (
            <button
              onClick={() => setActiveTab("rbac")}
              className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all ${activeTab === "rbac" ? "bg-blue-600 text-white shadow-sm font-bold" : "text-gray-500 hover:text-gray-700 hover:bg-gray-55"}`}
            >
              🔒 Access Control Rules
            </button>
          )}
        </div>

        {/* Tab 1: Profile */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="text-lg font-bold text-gray-850">User Profile Settings</h3>
              <p className="text-xs text-gray-500 mt-1">Configure your personal information and security credentials</p>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6">
              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold">
                  {profileSuccess}
                </div>
              )}
              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold">
                  ⚠️ {profileError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Registered Email</label>
                  <input
                    type="email"
                    disabled
                    className="w-full p-2.5 border rounded-lg bg-gray-100 cursor-not-allowed text-gray-500 font-semibold"
                    value={email}
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Email address cannot be changed.</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              <div className="border-t pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-gray-800">Security Credentials (Change Password)</h4>
                  <p className="text-xs text-gray-500 mt-1">Leave fields blank if you do not wish to update your password</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">New Password</label>
                    <input
                      type="password"
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Confirm Password</label>
                    <input
                      type="password"
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold disabled:bg-gray-400 shadow-sm"
                >
                  {savingProfile ? "Saving Profile..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: RBAC Config */}
        {activeTab === "rbac" && userRole === "owner" && rbacRules && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b bg-slate-50">
              <h3 className="text-lg font-bold text-gray-855">Dynamic Access Control Matrix</h3>
              <p className="text-xs text-gray-500 mt-1">Configure visible tabs and action locks centrally across user roles</p>
            </div>

            <div className="p-6 space-y-6">
              {rbacSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-semibold">
                  {rbacSuccess}
                </div>
              )}
              {rbacError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-semibold">
                  ⚠️ {rbacError}
                </div>
              )}

              {/* 1. Visible Inventory Tabs */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800">1. Factory Inventory Control Tab Visibility</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Inventory Panel Tabs</th>
                        {rolesList.map(role => (
                          <th key={role} className="p-3 text-center capitalize">{role.replace('_', ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryTabsList.map(tab => (
                        <tr key={tab.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-semibold text-slate-700 text-sm">{tab.label}</td>
                          {rolesList.map(role => {
                            const isChecked = rbacRules.visible_inventory_tabs[role]?.includes(tab.id);
                            return (
                              <td key={role} className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isChecked || false}
                                  onChange={() => handleToggleTabPermission(role, tab.id)}
                                  className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
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
              <div className="border-t pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-800">2. Security Lockouts & Feature Actions</h4>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 font-bold text-slate-700 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-3">Global Application Actions</th>
                        {rolesList.map(role => (
                          <th key={role} className="p-3 text-center capitalize">{role.replace('_', ' ')}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-semibold text-slate-750 text-sm block">🔄 POS Warehouse Select</span>
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
                                className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-semibold text-slate-750 text-sm block">🏷️ Edit Selling & Purchase Price</span>
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
                                className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                      <tr className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <span className="font-semibold text-slate-760 text-sm block">🏢 Edit Company Profile Details</span>
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
                                className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="button"
                  onClick={handleSaveRbac}
                  disabled={savingRbac}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold disabled:bg-gray-400 shadow-sm"
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
