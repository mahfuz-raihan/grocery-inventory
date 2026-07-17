"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  unit?: string | null;
  selling_price: number;
  purchase_cost?: number;
  average_cost?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_quantity?: number;
  is_active?: boolean;
  product_type?: string;
  parent_id?: string | null;
  color?: string | null;
  size?: string | null;
  current_stock: number;
  variants?: Product[];
}

interface ProductCreate {
  sku: string;
  name: string;
  unit: string;
  selling_price: number;
}

interface Branch {
  id: string;
  name: string;
  address: string;
}


interface GRNItemCreate {
  product_id: string;
  quantity_received: number;
  cost_price: number;
  ordered_quantity?: number;
  damaged_quantity?: number;
  batch_number?: string;
}

interface GRNCreate {
  branch_id: string;
  supplier_name: string;
  invoice_reference?: string;
  items: GRNItemCreate[];
}

interface DailyReport {
  date: string;
  branch_id: string | null;
  total_revenue: number;
  transaction_count: number;
}

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const api = {
  getProducts: async (): Promise<Product[]> => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/inventory/products`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return await response.json();
    } catch (error) {
      console.error("API Error (getProducts):", error);
      return [];
    }
  },
  getProductDetail: async (id: string): Promise<any> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/inventory/products/${id}`);
    if (!response.ok) throw new Error("Failed to fetch product details");
    return await response.json();
  },
  createProduct: async (payload: any): Promise<Product> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/inventory/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, is_active: true, initial_stock_quantity: 0 })
    });
    if (!response.ok) throw new Error("Failed to create product");
    return await response.json();
  },
  updateProduct: async (id: string, payload: any): Promise<Product> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/inventory/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update product");
    return await response.json();
  },
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
  createBranch: async (payload: { name: string, address: string }): Promise<Branch> => {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/v1/inventory/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to create branch");
    return await response.json();
  },

  getDailyReport: async (): Promise<DailyReport> => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/sales/reports/daily`);
      if (!response.ok) throw new Error("Failed to fetch report");
      return await response.json();
    } catch (error) {
      console.error("API Error (getDailyReport):", error);
      return { date: new Date().toISOString(), branch_id: null, total_revenue: 0, transaction_count: 0 };
    }
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const USD_EXCHANGE_RATE = 117.0;

  const [report, setReport] = useState<DailyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // Global State
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Branch State
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("");
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [branchSuccessMessage, setBranchSuccessMessage] = useState("");
  const formatPrice = (priceInBDT: number) => currency === "USD" ? "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2) : "৳" + priceInBDT.toFixed(2);

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    setUserRole(role);

    if (role === "cashier") {
      router.push("/");
      return;
    }

    // Redirect new specialized roles to inventory panel — they don't use the dashboard
    if (["purchase_user", "production_user", "sales_user"].includes(role || "")) {
      router.push("/inventory");
      return;
    }

    // Default tab based on role permissions
    setActiveTab("analytics");

    const fetchInitialData = async () => {
      try {
        const [reportData, productsData, branchesData] = await Promise.all([
          api.getDailyReport(),
          api.getProducts(),
          api.getBranches()
        ]);
        setReport(reportData);
        setProducts(productsData);
        setBranches(branchesData);
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchInitialData();
  }, [router]);

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchLocation) return;

    setIsSubmittingBranch(true);
    setBranchSuccessMessage("");

    try {
      const newBranch = await api.createBranch({ name: newBranchName, address: newBranchLocation });
      setBranches(prev => [...prev, newBranch]);
      if (!selectedBranchId) setSelectedBranchId(newBranch.id);
      setBranchSuccessMessage(`✅ Branch "${newBranchName}" created!`);
      setNewBranchName(""); setNewBranchLocation("");
    } catch (error) {
      console.error(error);
      alert("Failed to create branch.");
    } finally {
      setIsSubmittingBranch(false);
    }
  };




  const getAuthorizedTabs = () => {
    if (userRole === "owner") {
      return [
        { id: "analytics", label: "HQ Analytics" },
        { id: "branches", label: "Manage Branches" }
      ];
    }
    if (userRole === "manager") {
      return [
        { id: "analytics", label: "HQ Analytics" }
      ];
    }
    if (userRole === "stock_handler") {
      return [
        { id: "analytics", label: "HQ Analytics" }
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time HQ Analytics & Branch Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white border rounded-lg p-1 shadow-sm flex items-center">
              <button onClick={() => setCurrency("BDT")} className={`px-4 py-1.5 text-sm font-bold rounded-md ${currency === "BDT" ? "bg-blue-100 text-blue-700" : "text-gray-500"}`}>BDT (৳)</button>
              <button onClick={() => setCurrency("USD")} className={`px-4 py-1.5 text-sm font-bold rounded-md ${currency === "USD" ? "bg-emerald-100 text-emerald-700" : "text-gray-500"}`}>USD ($)</button>
            </div>
            <a href="/" className="px-4 py-2 bg-white border rounded-lg shadow-sm font-medium text-blue-600">← Back to POS</a>
          </div>
        </div>

        <div className="flex space-x-2 mb-8 border-b pb-px">
          {getAuthorizedTabs().map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-6 py-3 font-semibold ${activeTab === tab.id ? "bg-white border-t border-l border-r border-b-0 text-blue-600" : "text-gray-500 bg-gray-100"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "analytics" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Today&apos;s Performance</h2>
            {loadingReport ? <div>Loading...</div> : report ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-blue-50 p-6 rounded-2xl">
                  <h3 className="text-blue-600 font-semibold">Total Revenue</h3>
                  <p className="text-5xl font-bold text-blue-900">{formatPrice(report.total_revenue)}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-2xl">
                  <h3 className="text-emerald-600 font-semibold">Transactions</h3>
                  <p className="text-5xl font-bold text-emerald-900">{report.transaction_count}</p>
                </div>
              </div>
            ) : <p>No data.</p>}
          </div>
        )}



        {activeTab === "branches" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Create New Branch</h2>
            {branchSuccessMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{branchSuccessMessage}</div>}
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <input type="text" className="w-full p-2.5 border rounded-lg" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Branch Name (e.g. Dhaka Central)" required />
              <input type="text" className="w-full p-2.5 border rounded-lg" value={newBranchLocation} onChange={(e) => setNewBranchLocation(e.target.value)} placeholder="Location Details" required />
              <button type="submit" disabled={isSubmittingBranch} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Create Branch</button>
            </form>
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold mb-4">Existing Branches ({branches.length})</h3>
              {branches.map(b => <div key={b.id} className="p-3 bg-gray-50 border rounded-lg mb-2 flex justify-between">{b.name} <span className="text-gray-500">{b.address}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}