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
        <div className="text-slate-400 font-semibold animate-pulse">Loading System Users...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Pane: Create User Form */}
      <div className="bg-white p-8 rounded-xl shadow-sm border lg:col-span-1 h-fit">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Create New User</h2>
        {userSuccessMessage && (
          <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm transition-all">
            {userSuccessMessage}
          </div>
        )}
        
        {branches.length === 0 && (
          <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200 text-sm">
            ⚠️ <b>No branches found.</b> Create a branch first to assign users.
          </div>
        )}

        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
            <input
              type="text"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newUserFullName}
              onChange={(e) => setNewUserFullName(e.target.value)}
              placeholder="e.g. John Doe"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email Address</label>
            <input
              type="email"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              placeholder="e.g. john@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">System Role</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Branch</label>
              <select
                className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg transition hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isSubmittingUser ? "Registering..." : "Register User"}
          </button>
        </form>
      </div>

      {/* Right Pane: User Cards */}
      <div className="bg-white p-8 rounded-xl shadow-sm border lg:col-span-2">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Registered Users ({users.length})</h2>
        {users.length === 0 ? (
          <p className="text-sm text-gray-500">No users found. Create one on the left panel.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[550px] overflow-y-auto pr-2">
            {users.map(u => {
              const roleColors: Record<string, string> = {
                owner: "bg-indigo-50 text-indigo-700 border-indigo-200",
                manager: "bg-blue-50 text-blue-700 border-blue-200",
                cashier: "bg-emerald-50 text-emerald-700 border-emerald-200",
                stock_handler: "bg-amber-50 text-amber-700 border-amber-200",
                purchase_user: "bg-orange-50 text-orange-700 border-orange-200",
                production_user: "bg-violet-50 text-violet-700 border-violet-200",
                sales_user: "bg-teal-50 text-teal-700 border-teal-200"
              };

              const branchName = branches.find(b => b.id === u.branch_id)?.name || "All Branches";

              return (
                <div key={u.id} className="p-5 bg-gray-50 border rounded-xl flex flex-col justify-between hover:shadow-md hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-800">{u.full_name}</h4>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${roleColors[u.role as keyof typeof roleColors] || "bg-gray-100 text-gray-700"}`}>
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-2 border-t pt-3">
                    <span>Branch: <b className="text-gray-600">{branchName}</b></span>
                    <span>Joined: {new Date(u.created_at).toLocaleDateString()}</span>
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
