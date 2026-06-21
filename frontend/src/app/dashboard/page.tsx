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
            return data.length === 0 ? DUMMY_PRODUCTS : data;
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
    createBranch: async (payload: { name: string, location: string }): Promise<Branch> => {
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
    },
    submitGRN: async (payload: GRNCreate) => {
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
    }
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"analytics" | "grn" | "branches">("analytics");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const USD_EXCHANGE_RATE = 117.0;
  
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

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

  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("");
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [branchSuccessMessage, setBranchSuccessMessage] = useState("");

  const generateInvoiceRef = () => `INV-GRN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const formatPrice = (priceInBDT: number) => currency === "USD" ? "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2) : "৳" + priceInBDT.toFixed(2);

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
        if (branchesData.length > 0) setSelectedBranchId(branchesData[0].id);
        setInvoiceRef(generateInvoiceRef());
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchInitialData();
  }, []);

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !costPrice || !supplierName || !selectedBranchId) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const price = parseFloat(costPrice);
      await api.submitGRN({
        branch_id: selectedBranchId,
        supplier_name: supplierName,
        invoice_reference: invoiceRef,
        items: [{
          product_id: selectedProductId,
          quantity_received: parseFloat(quantity),
          cost_price: currency === "USD" ? price * USD_EXCHANGE_RATE : price
        }]
      });
      
      setSuccessMessage(`Successfully received ${quantity} units from ${supplierName}!`);
      setSupplierName(""); setQuantity(""); setCostPrice(""); setSelectedProductId("");
      setInvoiceRef(generateInvoiceRef());
    } catch (error) {
      alert("Failed to submit GRN.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchLocation) return;
    
    setIsSubmittingBranch(true);
    setBranchSuccessMessage("");
    
    try {
      const newBranch = await api.createBranch({ name: newBranchName, location: newBranchLocation });
      setBranches(prev => [...prev, newBranch]);
      if (!selectedBranchId) setSelectedBranchId(newBranch.id);
      setBranchSuccessMessage(`✅ Branch "${newBranchName}" created!`);
      setNewBranchName(""); setNewBranchLocation("");
    } catch (error) {
      alert("Failed to create branch.");
    } finally {
      setIsSubmittingBranch(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Enterprise Dashboard</h1>
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
          {(["analytics", "grn", "branches"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 font-semibold ${activeTab === tab ? "bg-white border text-blue-600" : "text-gray-500 bg-gray-100"}`}>
              {tab === "analytics" ? "HQ Analytics" : tab === "grn" ? "Receive Stock (GRN)" : "Manage Branches"}
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

        {activeTab === "grn" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Receive Supplier Delivery</h2>
            {successMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{successMessage}</div>}
            {branches.length === 0 && <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg">⚠️ No branches found.</div>}
            <form onSubmit={handleGRNSubmit} className="space-y-4">
              <select className="w-full p-2.5 border rounded-lg" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required>
                <option value="" disabled>-- Select branch --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <input type="text" className="w-full p-2.5 border rounded-lg" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier Name" required />
              <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-100" value={invoiceRef} readOnly />
              <select className="w-full p-2.5 border rounded-lg" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
                <option value="" disabled>-- Select product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full p-2.5 border rounded-lg" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" required />
                <input type="number" className="w-full p-2.5 border rounded-lg" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="Unit Cost" required />
              </div>
              <button type="submit" disabled={isSubmitting || products.length === 0 || branches.length === 0} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">{isSubmitting ? "Processing..." : "Submit GRN"}</button>
            </form>
          </div>
        )}

        {activeTab === "branches" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Create New Branch</h2>
            {branchSuccessMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{branchSuccessMessage}</div>}
            <form onSubmit={handleCreateBranch} className="space-y-4">
              <input type="text" className="w-full p-2.5 border rounded-lg" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} placeholder="Branch Name" required />
              <input type="text" className="w-full p-2.5 border rounded-lg" value={newBranchLocation} onChange={(e) => setNewBranchLocation(e.target.value)} placeholder="Location" required />
              <button type="submit" disabled={isSubmittingBranch} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg">Create Branch</button>
            </form>
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold mb-4">Existing Branches ({branches.length})</h3>
              {branches.map(b => <div key={b.id} className="p-3 bg-gray-50 border rounded-lg mb-2 flex justify-between">{b.name} <span className="text-gray-500">{b.location}</span></div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}