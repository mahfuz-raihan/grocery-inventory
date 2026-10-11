"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Branch {
    id: string;
    name: string;
    address: string;
}

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    branch_id: string | null;
    is_active: boolean;
    created_at: string;
}

const getApiBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin;
    }
    return "";
};

const api = {
    getBranches: async (): Promise<Branch[]> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/branches`);
            if (!response.ok) throw new Error("Failed to fetch branches");
            return await response.json();
        } catch (error) {
            console.error("API Error (getBranches):", error);
            return [];
        }
    },
    getUsers: async (): Promise<User[]> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/auth/users`);
            if (!response.ok) throw new Error("Failed to fetch users");
            return await response.json();
        } catch (error) {
            console.error("API Error (getUsers):", error);
            return [];
        }
    },
    createUser: async (payload: any): Promise<User> => {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to create user");
        }
        return await response.json();
    }
};

export default function UsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState("cashier");
  const [newUserBranchId, setNewUserBranchId] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userSuccessMessage, setUserSuccessMessage] = useState("");

  useEffect(() => {
    // Route guard: owner role check
    const role = localStorage.getItem("erp_role");
    if (role !== "owner") {
      if (role === "cashier") {
        router.push("/");
      } else {
        router.push("/dashboard");
      }
      return;
    }

    const fetchData = async () => {
      try {
        const [branchesData, usersData] = await Promise.all([
          api.getBranches(),
          api.getUsers()
        ]);
        setBranches(branchesData);
        setUsers(usersData);
        if (branchesData.length > 0) {
          setNewUserBranchId(branchesData[0].id);
        }
      } catch (error) {
        console.error("Error loading user management data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserPassword || !newUserFullName || !newUserRole) return;
    
    setIsSubmittingUser(true);
    setUserSuccessMessage("");
    
    try {
      const payload = {
        email: newUserEmail,
        password: newUserPassword,
        full_name: newUserFullName,
        role: newUserRole,
        branch_id: newUserRole === "owner" ? null : newUserBranchId || null
      };

      const newUser = await api.createUser(payload);
      setUsers(prev => [...prev, newUser]);
      setUserSuccessMessage(`✅ User "${newUserFullName}" registered successfully as "${newUserRole}"!`);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserFullName("");
      setNewUserRole("cashier");
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to create user.");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-400 font-semibold text-sm animate-pulse">Loading System Users...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Pane: Create User Form */}
      <div className="erp-card p-6 lg:col-span-1 h-fit">
        <h2 className="text-base font-bold text-slate-900 mb-5">Create New User</h2>
        {userSuccessMessage && (
          <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-medium transition-all">
            {userSuccessMessage}
          </div>
        )}
        
        {branches.length === 0 && (
          <div className="mb-5 p-3.5 bg-amber-50 text-amber-800 rounded-md border border-amber-200 text-xs font-medium">
            ⚠️ <b>No branches found.</b> Create a branch first to assign users.
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Full Name</label>
            <input
              type="text"
              className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 bg-white transition"
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 bg-white font-mono transition"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="e.g. john@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Password</label>
            <input
              type="password"
              className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 bg-white transition"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">System Role</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 transition"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="owner">🔑 Owner (Full Access)</option>
                <option value="manager">👔 Manager</option>
                <option value="stock_handler">📦 Stock Handler</option>
                <option value="purchase_user">🛒 Purchase User (Receive Products)</option>
                <option value="production_user">🏭 Production User (Consume Materials)</option>
                <option value="sales_user">🛍️ Sales User (View Finished Goods)</option>
                <option value="cashier">🧾 Cashier (POS)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Branch</label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs text-slate-800 transition disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                value={newUserBranchId}
                onChange={(e) => setNewUserBranchId(e.target.value)}
                disabled={newUserRole === "owner" || branches.length === 0}
                required={newUserRole !== "owner"}
              >
                <option value="" disabled>-- Select Branch --</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmittingUser || (newUserRole !== "owner" && branches.length === 0)}
            className="btn-primary text-xs w-full py-2.5 flex items-center justify-center mt-2"
          >
            {isSubmittingUser ? "Registering..." : "Register User"}
          </button>
        </form>
      </div>

      {/* Right Pane: User Cards */}
      <div className="erp-card p-6 lg:col-span-2">
        <h2 className="text-base font-bold text-slate-900 mb-5">Registered Users ({users.length})</h2>
        {users.length === 0 ? (
          <p className="text-xs text-slate-500">No users found. Create one on the left panel.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
            {users.map(u => {
              const roleColors: Record<string, string> = {
                owner: "bg-purple-50 text-purple-800 border-purple-200",
                manager: "bg-blue-50 text-blue-800 border-blue-200",
                cashier: "bg-emerald-50 text-emerald-800 border-emerald-200",
                stock_handler: "bg-amber-50 text-amber-800 border-amber-200",
                purchase_user: "bg-amber-50 text-amber-800 border-amber-200",
                production_user: "bg-indigo-50 text-indigo-800 border-indigo-200",
                sales_user: "bg-teal-50 text-teal-800 border-teal-200"
              };

              const branchName = branches.find(b => b.id === u.branch_id)?.name || "All Branches";

              return (
                <div key={u.id} className="p-4 bg-slate-50/70 border border-border rounded-md flex flex-col justify-between hover:border-slate-300 hover:bg-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-slate-900 text-xs">{u.full_name}</h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{u.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${roleColors[u.role as keyof typeof roleColors] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mt-2 border-t border-border/80 pt-2.5">
                    <span>Branch: <b className="text-slate-700 font-medium">{branchName}</b></span>
                    <span className="font-mono">Joined: {new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
