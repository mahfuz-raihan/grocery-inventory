"use client";

import { useState, useEffect } from "react";

interface Product {
    id: string;
    sku: string;
    name: string;
    selling_price: number;
    current_stock: number;
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
  const [activeTab, setActiveTab] = useState<"analytics" | "grn">("analytics");
  
  // Analytics State
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // GRN State
  const [products, setProducts] = useState<Product[]>([]);
  const [supplierName, setSupplierName] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Initial Data Fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [reportData, productsData] = await Promise.all([
          api.getDailyReport(),
          api.getProducts()
        ]);
        setReport(reportData);
        setProducts(productsData);
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
    if (!selectedProductId || !quantity || !costPrice || !supplierName) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      await api.submitGRN({
        branch_id: "00000000-0000-0000-0000-000000000001", // Dummy Branch ID for Phase 1
        supplier_name: supplierName,
        invoice_reference: invoiceRef,
        items: [{
          product_id: selectedProductId,
          quantity_received: parseFloat(quantity),
          cost_price: parseFloat(costPrice)
        }]
      });
      
      setSuccessMessage(`Successfully received ${quantity} units from ${supplierName}!`);
      // Reset form
      setSupplierName("");
      setInvoiceRef("");
      setQuantity("");
      setCostPrice("");
      setSelectedProductId("");
    } catch (error) {
      console.error("GRN Submit Error:", error);
      alert("Failed to submit GRN. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Enterprise Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time HQ Analytics & Branch Management</p>
          </div>
          <a href="/" className="px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 font-medium text-blue-600 transition-colors">
            ← Back to POS
          </a>
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
                  <p className="text-5xl font-bold text-blue-900">${report.total_revenue.toFixed(2)}</p>
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

        {/* Tab Content: Goods Receipt Note */}
        {activeTab === "grn" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Receive Supplier Delivery</h2>
            <p className="text-gray-500 mb-6 text-sm">Log incoming stock to update the Ledger and set Cost Basis.</p>

            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg font-medium">
                ✅ {successMessage}
              </div>
            )}

            <form onSubmit={handleGRNSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                  <input
                    type="text"
                    required
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g., Fresh Farms LLC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Reference</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="e.g., INV-9982"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Product *</label>
                <select
                  required
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="" disabled>-- Select a product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost Price ($) *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || products.length === 0}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-md disabled:bg-gray-400"
              >
                {isSubmitting ? "Processing..." : "Submit GRN to Ledger"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}