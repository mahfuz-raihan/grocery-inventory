"use client";

import { useState, useEffect } from "react";

interface Product {
    id: string;
    sku: string;
    name: string;
    selling_price: number;
    current_stock: number;
}

interface Branch {
    id: string;
    name: string;
    location: string;
}

interface BranchCreate {
    name: string;
    location: string;
}

interface GRNItemCreate {
    product_id: string;
    quantity_received: number;
    cost_price: number;
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

const DUMMY_PRODUCTS = [
    { id: "11111111-1111-1111-1111-111111111111", sku: "APP-01", name: "Organic Apples (Dummy)", selling_price: 350.00, current_stock: 0 },
    { id: "22222222-2222-2222-2222-222222222222", sku: "MIL-01", name: "Whole Milk 1L (Dummy)", selling_price: 90.00, current_stock: 0 },
    { id: "33333333-3333-3333-3333-333333333333", sku: "BRD-01", name: "Sourdough Bread (Dummy)", selling_price: 150.00, current_stock: 0 },
];

const api = {
    getProducts: async (): Promise<Product[]> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/products`);
            if (!response.ok) throw new Error("Failed to fetch products");
            
            const data = await response.json();
            if (data.length === 0) return DUMMY_PRODUCTS;
            return data;
        } catch (error) {
            console.error("API Error (getProducts):", error);
            return DUMMY_PRODUCTS;
        }
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
    createBranch: async (payload: BranchCreate): Promise<Branch> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/branches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Failed to create branch");
            return await response.json();
        } catch (error) {
            console.error("API Error (createBranch):", error);
            throw error;
        }
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
    },
    submitGRN: async (payload: GRNCreate) => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/grn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || "GRN submission failed");
            }
            return await response.json();
        } catch (error) {
            console.error("API Error (submitGRN):", error);
            throw error;
        }
    }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "grn" | "branches">("analytics");
  
  // Currency State (Base is BDT)
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const USD_EXCHANGE_RATE = 117.0; // 1 USD = 117 BDT
  
  // Analytics State
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // GRN State
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Branch Creation State
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("");
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [branchSuccessMessage, setBranchSuccessMessage] = useState("");

  // Helper to auto-generate sequential invoice references
  const generateInvoiceRef = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomSeq = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-GRN-${timestamp}-${randomSeq}`;
  };

  // Helper to format prices dynamically based on selected currency
  const formatPrice = (priceInBDT: number) => {
    if (currency === "USD") {
      return "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2);
    }
    return "৳" + priceInBDT.toFixed(2);
  };

  // Initial Data Fetch
  useEffect(() => {
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
        if (branchesData.length > 0) {
            setSelectedBranchId(branchesData[0].id);
        }
        setInvoiceRef(generateInvoiceRef()); // Auto-generate first invoice ref
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchInitialData();
  }, []);

  // Handle GRN Submission
  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !costPrice || !supplierName || !selectedBranchId) {
      alert("Please fill in all required fields and ensure a branch is selected.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      // Convert cost price to BDT if USD is selected
      const finalCostPriceBDT = currency === "USD" 
        ? parseFloat(costPrice) * USD_EXCHANGE_RATE 
        : parseFloat(costPrice);

      await api.submitGRN({
        branch_id: selectedBranchId, // Using the real selected branch!
        supplier_name: supplierName,
        invoice_reference: invoiceRef,
        items: [{
          product_id: selectedProductId,
          quantity_received: parseFloat(quantity),
          cost_price: finalCostPriceBDT
        }]
      });
      
      setSuccessMessage(`Successfully received ${quantity} units from ${supplierName} at selected branch!`);
      
      // Reset form
      setSupplierName("");
      setQuantity("");
      setCostPrice("");
      setSelectedProductId("");
      setInvoiceRef(generateInvoiceRef()); 
      
    } catch (error) {
      console.error("GRN Submit Error:", error);
      alert("Failed to submit GRN. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Branch Creation
  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchLocation) return;
    
    setIsSubmittingBranch(true);
    setBranchSuccessMessage("");
    
    try {
      const newBranch = await api.createBranch({
        name: newBranchName,
        location: newBranchLocation
      });
      
      setBranches(prev => [...prev, newBranch]);
      if (!selectedBranchId) {
        setSelectedBranchId(newBranch.id);
      }
      
      setBranchSuccessMessage(`✅ Branch "${newBranchName}" created successfully!`);
      setNewBranchName("");
      setNewBranchLocation("");
    } catch (error) {
      console.error("Branch Creation Error:", error);
      alert("Failed to create branch. Check console for details.");
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header with Currency Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Enterprise Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time HQ Analytics & Branch Management</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Real-time Currency Toggle */}
            <div className="bg-white border rounded-lg p-1 shadow-sm flex items-center">
              <button 
                onClick={() => setCurrency("BDT")}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${currency === "BDT" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-50"}`}
              >
                BDT (৳)
              </button>
              <button 
                onClick={() => setCurrency("USD")}
                className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${currency === "USD" ? "bg-emerald-100 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}
              >
                USD ($)
              </button>
            </div>

            <a href="/" className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 font-medium text-blue-600 transition-colors">
              ← Back to POS
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-8 border-b pb-px">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === "analytics" ? "bg-white border-t border-l border-r border-b-0 text-blue-600" : "text-gray-500 hover:text-gray-700 bg-gray-100"
            }`}
            style={{ marginBottom: activeTab === "analytics" ? "-1px" : "0" }}
          >
            HQ Analytics
          </button>
          <button
            onClick={() => setActiveTab("grn")}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === "grn" ? "bg-white border-t border-l border-r border-b-0 text-blue-600" : "text-gray-500 hover:text-gray-700 bg-gray-100"
            }`}
            style={{ marginBottom: activeTab === "grn" ? "-1px" : "0" }}
          >
            Receive Stock (GRN)
          </button>
          <button
            onClick={() => setActiveTab("branches")}
            className={`px-6 py-3 font-semibold rounded-t-lg transition-colors ${
              activeTab === "branches" ? "bg-white border-t border-l border-r border-b-0 text-blue-600" : "text-gray-500 hover:text-gray-700 bg-gray-100"
            }`}
            style={{ marginBottom: activeTab === "branches" ? "-1px" : "0" }}
          >
            Manage Branches
          </button>
        </div>

        {/* Tab Content: HQ Analytics */}
        {activeTab === "analytics" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Today&apos;s Performance</h2>
            
            {loadingReport ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-24 bg-gray-200 rounded-xl w-full"></div>
                </div>
              </div>
            ) : report ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200">
                  <h3 className="text-blue-600 font-semibold mb-2">Total Revenue</h3>
                  <p className="text-5xl font-bold text-blue-900">{formatPrice(report.total_revenue)}</p>
                  <p className="text-sm text-blue-500 mt-2">Across all recorded transactions today</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-2xl border border-emerald-200">
                  <h3 className="text-emerald-600 font-semibold mb-2">Transaction Volume</h3>
                  <p className="text-5xl font-bold text-emerald-900">{report.transaction_count}</p>
                  <p className="text-sm text-emerald-500 mt-2">Successful checkouts</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No data available for today yet.</p>
            )}
          </div>
        )}

        {/* Tab Content: Manage Branches */}
        {activeTab === "branches" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Create New Branch</h2>
            <p className="text-gray-500 mb-6 text-sm">Add a new store location to the ERP system.</p>

            {branchSuccessMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium">
                {branchSuccessMessage}
              </div>
            )}

            <form onSubmit={handleCreateBranch} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g., Dhaka Main Branch"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newBranchLocation}
                  onChange={(e) => setNewBranchLocation(e.target.value)}
                  placeholder="e.g., Gulshan 1"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingBranch}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md disabled:bg-gray-400"
              >
                {isSubmittingBranch ? "Creating..." : "Create Branch"}
              </button>
            </form>

            {/* List Existing Branches */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold text-gray-800 mb-4">Existing Branches ({branches.length})</h3>
              {branches.length === 0 ? (
                <p className="text-sm text-gray-500">No branches created yet.</p>
              ) : (
                <ul className="space-y-2">
                  {branches.map(b => (
                    <li key={b.id} className="p-3 bg-gray-50 rounded-lg border text-sm flex justify-between items-center">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-gray-500">{b.location}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}