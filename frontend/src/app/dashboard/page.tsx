"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Product {
    id: string;
    sku: string;
    name: string;
    selling_price: number;
    current_stock: number;
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

interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    branch_id: string | null;
    is_active: boolean;
    created_at: string;
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
    createProduct: async (payload: ProductCreate): Promise<Product> => {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/v1/inventory/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, is_active: true, initial_stock_quantity: 0 })
        });
        if (!response.ok) throw new Error("Failed to create product");
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to create user");
        }
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("analytics");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const USD_EXCHANGE_RATE = 117.0;
  
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loadingReport, setLoadingReport] = useState(true);

  // Global State
  const [products, setProducts] = useState<Product[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);

  // User Form State
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [newUserRole, setNewUserRole] = useState("cashier");
  const [newUserBranchId, setNewUserBranchId] = useState("");
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userSuccessMessage, setUserSuccessMessage] = useState("");

  // GRN State
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);
  const [grnSuccessMessage, setGrnSuccessMessage] = useState("");

  // Branch State
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchLocation, setNewBranchLocation] = useState("");
  const [isSubmittingBranch, setIsSubmittingBranch] = useState(false);
  const [branchSuccessMessage, setBranchSuccessMessage] = useState("");

  // Product State
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("Pieces");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productSuccessMessage, setProductSuccessMessage] = useState("");

  const generateInvoiceRef = () => `INV-GRN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const formatPrice = (priceInBDT: number) => currency === "USD" ? "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2) : "৳" + priceInBDT.toFixed(2);

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    setUserRole(role);
    
    if (role === "cashier") {
      router.push("/");
      return;
    }

    // Default tab based on role permissions
    if (role === "stock_handler") {
      setActiveTab("grn");
    } else {
      setActiveTab("analytics");
    }

    const fetchInitialData = async () => {
      try {
        const [reportData, productsData, branchesData, usersData] = await Promise.all([
          api.getDailyReport(),
          api.getProducts(),
          api.getBranches(),
          api.getUsers()
        ]);
        setReport(reportData);
        setProducts(productsData);
        setBranches(branchesData);
        setUsers(usersData);
        if (branchesData.length > 0) {
          setSelectedBranchId(branchesData[0].id);
          setNewUserBranchId(branchesData[0].id);
        }
        setInvoiceRef(generateInvoiceRef());
      } catch (error) {
        console.error("Error loading dashboard data", error);
      } finally {
        setLoadingReport(false);
      }
    };
    fetchInitialData();
  }, [router]);

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !quantity || !costPrice || !supplierName || !selectedBranchId) return;

    setIsSubmittingGRN(true);
    setGrnSuccessMessage("");

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
      
      setGrnSuccessMessage(`Successfully received ${quantity} units from ${supplierName}!`);
      setSupplierName(""); setQuantity(""); setCostPrice(""); setSelectedProductId("");
      setInvoiceRef(generateInvoiceRef());
      
      // Refresh products to show updated stock
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      console.error(error);
      alert("Failed to submit GRN. Check console for details.");
    } finally {
      setIsSubmittingGRN(false);
    }
  };

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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductSku || !newProductName || !newProductPrice) return;
    
    setIsSubmittingProduct(true);
    setProductSuccessMessage("");
    
    try {
      // Products in the database are stored in base currency (BDT)
      const finalPrice = currency === "USD" 
        ? parseFloat(newProductPrice) * USD_EXCHANGE_RATE 
        : parseFloat(newProductPrice);

      const newProduct = await api.createProduct({ 
          sku: newProductSku, 
          name: newProductName,
          unit: newProductUnit,
          selling_price: finalPrice
      });
      
      setProducts(prev => [...prev, newProduct]);
      setProductSuccessMessage(`✅ Product "${newProductName}" created successfully!`);
      setNewProductSku(""); setNewProductName(""); setNewProductPrice("");
    } catch (error) {
      console.error(error);
      alert("Failed to create product. SKU might already exist.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

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

  const getAuthorizedTabs = () => {
    if (userRole === "owner") {
      return [
        { id: "analytics", label: "HQ Analytics" },
        { id: "grn", label: "Receive Stock (GRN)" },
        { id: "branches", label: "Manage Branches" },
        { id: "products", label: "Manage Products" },
        { id: "users", label: "Manage Users & Roles" }
      ];
    }
    if (userRole === "manager") {
      return [
        { id: "analytics", label: "HQ Analytics" },
        { id: "grn", label: "Receive Stock (GRN)" },
        { id: "products", label: "Manage Products" }
      ];
    }
    if (userRole === "stock_handler") {
      return [
        { id: "grn", label: "Receive Stock (GRN)" },
        { id: "products", label: "Manage Products" }
      ];
    }
    return [];
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

        {activeTab === "grn" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Receive Supplier Delivery</h2>
            {grnSuccessMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{grnSuccessMessage}</div>}
            
            {/* Critical Warnings if missing master data */}
            {branches.length === 0 && <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">⚠️ <b>No branches found.</b> Go to &quot;Manage Branches&quot; to create one first.</div>}
            {products.length === 0 && <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">⚠️ <b>No products found.</b> Go to &quot;Manage Products&quot; to create your catalog first.</div>}
            
            <form onSubmit={handleGRNSubmit} className="space-y-4">
              <select className="w-full p-2.5 border rounded-lg" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required>
                <option value="" disabled>-- Select destination branch --</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" className="w-full p-2.5 border rounded-lg" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} placeholder="Supplier Name" required />
                <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-100" value={invoiceRef} readOnly title="Auto-generated invoice reference" />
              </div>
              <select className="w-full p-2.5 border rounded-lg" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
                <option value="" disabled>-- Select product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" className="w-full p-2.5 border rounded-lg" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty Received" required step="0.01" />
                <input type="number" className="w-full p-2.5 border rounded-lg" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder={`Unit Cost Price (${currency === "USD" ? "$" : "৳"})`} required step="0.01" />
              </div>
              <button type="submit" disabled={isSubmittingGRN || products.length === 0 || branches.length === 0} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg transition hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmittingGRN ? "Processing..." : "Submit GRN to Ledger"}
              </button>
            </form>
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

        {activeTab === "products" && (
          <div className="bg-white p-8 rounded-xl shadow-sm border max-w-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Product to Catalog</h2>
            {productSuccessMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{productSuccessMessage}</div>}
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} placeholder="SKU (e.g., MILK-01)" required />
                <select className="w-full p-2.5 border rounded-lg bg-white" value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)}>
                  <option value="Pieces">Pieces</option>
                  <option value="Liters">Liters</option>
                  <option value="Kg">Kilograms</option>
                  <option value="Carton">Carton</option>
                </select>
              </div>
              <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Product Name (e.g., Whole Milk 1L)" required />
              <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} placeholder={`Retail Selling Price (${currency === "USD" ? "$" : "৳"})`} required />
              <button type="submit" disabled={isSubmittingProduct} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700">Add Product to Catalog</button>
            </form>
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-bold mb-4">Current Catalog ({products.length})</h3>
              {products.length === 0 ? <p className="text-sm text-gray-500">Catalog is empty. Please add a product.</p> : (
                  <div className="max-h-64 overflow-y-auto pr-2">
                    {products.map(p => (
                        <div key={p.id} className="p-3 bg-gray-50 border rounded-lg mb-2 flex justify-between items-center">
                            <div>
                                <div className="font-medium">{p.name}</div>
                                <div className="text-xs text-gray-500">SKU: {p.sku} | Stock: {p.current_stock}</div>
                            </div>
                            <div className="font-bold text-emerald-600">{formatPrice(p.selling_price)}</div>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "users" && (
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
                      <option value="owner">Owner</option>
                      <option value="manager">Manager</option>
                      <option value="cashier">Cashier</option>
                      <option value="stock_handler">Stock Handler</option>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {users.map(u => {
                    const roleColors = {
                      owner: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      manager: "bg-blue-50 text-blue-700 border-blue-200",
                      cashier: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      stock_handler: "bg-amber-50 text-amber-700 border-amber-200"
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
        )}

      </div>
    </div>
  );
}