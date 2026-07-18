"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, CartItem, CheckoutRequest } from "../lib/api";
import {
  saveProductsLocal,
  getProductsLocal,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueueItem
} from "../lib/db";

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

const posApi = {
  getProducts: async (branchId?: string): Promise<Product[]> => {
    try {
      const baseUrl = getApiBaseUrl();
      let url = `${baseUrl}/api/v1/inventory/products?supplier_wise=true`;
      if (branchId) {
        url += `&branch_id=${branchId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();

      // Cache real data to local browser DB immediately via imported function
      await saveProductsLocal(data);
      return data;

    } catch (error) {
      console.warn("Backend API not reachable. Loading from local Offline Database...", error);

      // Fallback: retrieve products from local DB via imported function
      const localProducts = await getProductsLocal();
      if (localProducts && localProducts.length > 0) {
        return localProducts;
      }

      // Final fallback for purely visual previews
      return [
        { id: "1", sku: "APP-01", name: "Organic Apples", selling_price: 2.99, current_stock: 100, supplier_name: "Supplier A" },
        { id: "2", sku: "MIL-01", name: "Whole Milk 1 Gallon", selling_price: 4.50, current_stock: 45, supplier_name: "Supplier B" },
        { id: "3", sku: "BRD-01", name: "Sourdough Bread", selling_price: 5.25, current_stock: 20, supplier_name: "Supplier A" },
      ];
    }
  },
  checkout: async (payload: CheckoutRequest) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/sales/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Checkout failed");
      }
      return await response.json();
    } catch (error) {
      console.warn("Could not reach backend. Saving transaction to offline queue!", error);

      // Queue the checkout locally via imported function
      await addToSyncQueue(payload);
      return { receipt_number: `INV-OFFLINE-${Date.now().toString().slice(-6)}`, offline: true };
    }
  },
  updateSale: async (saleId: string, payload: { customer_name?: string; customer_phone?: string; customer_address?: string; discount?: number }) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/sales/${saleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Update sale failed");
      }
      return await response.json();
    } catch (error) {
      console.error("API Error (updateSale):", error);
      throw error;
    }
  },
  completeSale: async (saleId: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/sales/${saleId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Complete sale failed");
      }
      return await response.json();
    } catch (error) {
      console.error("API Error (completeSale):", error);
      throw error;
    }
  }
};

export default function POSTerminal() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  // --- CUSTOMER & DISCOUNT STATE ---
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [discountStr, setDiscountStr] = useState("");

  // --- EDIT MODAL STATES ---
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editDiscount, setEditDiscount] = useState("");

  // --- POS SUPPLIER FILTER ---
  const [posSupplierFilter, setPosSupplierFilter] = useState("");

  // --- DEFAULT BRANCH (resolved from DB at startup) ---
  const [defaultBranchId, setDefaultBranchId] = useState<string>("");
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);

  // --- CATEGORIES STATE ---
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // --- COMPANY PROFILE STATE ---
  const [companyProfile, setCompanyProfile] = useState<{ name: string; address: string; phone: string } | null>(null);

  // --- COMPLETED SALE (INVOICE) STATE ---
  const [completedSale, setCompletedSale] = useState<{
    id?: string;
    receipt_number: string;
    customer_name: string;
    customer_phone: string;
    customer_address: string;
    items: {
      name: string;
      sku: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
      supplier_name?: string;
    }[];
    gross_total: number;
    discount: number;
    net_total: number;
    status: "pending" | "paid";
    date: string;
  } | null>(null);

  useEffect(() => {
    if (completedSale) {
      setEditName(completedSale.customer_name);
      setEditPhone(completedSale.customer_phone);
      setEditAddress(completedSale.customer_address);
      setEditDiscount(completedSale.discount.toString());
    }
  }, [completedSale]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- OFFLINE CAPABILITY STATE ---
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    if (role === "stock_handler") {
      router.push("/dashboard");
      return;
    }
  }, [router]);

  // Debounced recurring customer details lookup by phone number
  useEffect(() => {
    if (customerPhone.trim().length >= 8) {
      const delayDebounceFn = setTimeout(async () => {
        try {
          const baseUrl = getApiBaseUrl();
          const res = await fetch(`${baseUrl}/api/v1/sales/customer/${encodeURIComponent(customerPhone.trim())}`);
          if (res.ok) {
            const data = await res.json();
            if (data.customer_name) {
              setCustomerName(data.customer_name);
            }
            if (data.customer_address) {
              setCustomerAddress(data.customer_address);
            }
          }
        } catch (error) {
          console.error("Failed to fetch recurring customer info:", error);
        }
      }, 400);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [customerPhone]);

  const fetchProductsList = async (branchId?: string) => {
    try {
      setLoading(true);
      const data = await posApi.getProducts(branchId);
      setProducts(data);

      const baseUrl = getApiBaseUrl();

      // Resolve a real branch_id from the DB so checkout FK never fails.
      // Priority: localStorage (user-set) → first branch from DB → empty string.
      const savedBranch = localStorage.getItem("erp_branch_id");
      const role = localStorage.getItem("erp_role");
      const branchRes = await fetch(`${baseUrl}/api/v1/inventory/branches`);
      if (branchRes.ok) {
        const branchList: { id: string; name: string }[] = await branchRes.json();
        setBranches(branchList);
        if (branchList.length > 0) {
          // Use saved branch only if it's in the actual branches list
          const validSaved = savedBranch && branchList.find(b => b.id === savedBranch);
          const resolvedId = validSaved ? savedBranch! : branchList[0].id;
          const forcedId = (role && role !== "owner" && savedBranch) ? savedBranch : resolvedId;
          localStorage.setItem("erp_branch_id", forcedId);
          setDefaultBranchId(forcedId);
          if (role && role !== "owner") {
            setSelectedBranchId(forcedId);
          }
        }
      }

      const catRes = await fetch(`${baseUrl}/api/v1/inventory/categories`);
      if (catRes.ok) setCategories(await catRes.json());

      const profileRes = await fetch(`${baseUrl}/api/v1/inventory/company-profile`);
      if (profileRes.ok) setCompanyProfile(await profileRes.json());
    } catch (error) {
      console.error("Failed to load products/categories/profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    fetchProductsList(branchId || undefined);
  };

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    setUserRole(role);
    const userBranchId = localStorage.getItem("erp_branch_id");
    
    if (role !== "owner" && userBranchId) {
      setSelectedBranchId(userBranchId);
      fetchProductsList(userBranchId);
    } else {
      fetchProductsList();
    }

    const checkSyncQueue = async () => {
      const queue = await getSyncQueue();
      setPendingSync(queue.length);
    };
    checkSyncQueue();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingOrders(); // Auto-sync when internet comes back
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncPendingOrders = async () => {
    const queue = await getSyncQueue();
    if (queue.length === 0) return;

    let successCount = 0;
    const baseUrl = getApiBaseUrl();

    for (const item of queue) {
      try {
        const response = await fetch(`${baseUrl}/api/v1/sales/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item.payload)
        });
        if (response.ok) {
          await clearSyncQueueItem(item.id);
          successCount++;
        }
      } catch (error) {
        console.error("Failed to sync offline order", error);
      }
    }

    const remaining = await getSyncQueue();
    setPendingSync(remaining.length);

    if (successCount > 0) {
      alert(`✅ Successfully synced ${successCount} offline orders to the Main Server!`);
      fetchProductsList(); // Refresh stock
    }
  };

  // Autocomplete Suggestions logic
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.supplier_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [products, searchQuery]);

  // Unique suppliers from product list for filter pills
  const uniquePosSuppliers = useMemo(() => {
    return Array.from(new Set(products.map(p => p.supplier_name || "— No Supplier"))).sort() as string[];
  }, [products]);

  // Main list filters (search + supplier)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.supplier_name || "").toLowerCase().includes(q);
      const supplierKey = p.supplier_name || "— No Supplier";
      const matchSupplier = !posSupplierFilter || supplierKey === posSupplierFilter;
      return matchSearch && matchSupplier;
    });
  }, [products, searchQuery, posSupplierFilter]);

  // Group filtered products by supplier
  const posGrouped = useMemo(() => {
    const groups: Record<string, typeof products> = {};
    for (const p of filteredProducts) {
      const key = p.supplier_name || "— No Supplier";
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    }
    return groups;
  }, [filteredProducts]);
  const posSupplierGroups = useMemo(() => Object.keys(posGrouped).sort(), [posGrouped]);

  // Calculate cart totals
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.subtotal, 0);
  }, [cart]);

  const discountValue = useMemo(() => {
    const val = parseFloat(discountStr) || 0.0;
    return Math.max(0.0, val);
  }, [discountStr]);

  const netPayable = useMemo(() => {
    return Math.max(0.0, cartTotal - discountValue);
  }, [cartTotal, discountValue]);

  // Helper to compute available stock for a product, subtracting what's currently in the cart
  const getAvailableStock = (product: Product) => {
    const cartItem = cart.find(
      (item) => item.id === product.id && item.supplier_name === product.supplier_name
    );
    return Math.max(0, product.current_stock - (cartItem ? cartItem.cartQuantity : 0));
  };

  // --- Cart Actions ---
  const addToCart = (product: Product) => {
    const available = getAvailableStock(product);
    if (available <= 0) return;

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.supplier_name === product.supplier_name
      );
      if (existing) {
        return prev.map((item) =>
          item.id === product.id && item.supplier_name === product.supplier_name
            ? { ...item, cartQuantity: item.cartQuantity + 1, subtotal: (item.cartQuantity + 1) * item.selling_price }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1, subtotal: product.selling_price }];
    });
  };

  const updateQuantity = (productId: string, supplierName: string | undefined, delta: number) => {
    const product = products.find(
      (p) => p.id === productId && p.supplier_name === supplierName
    );
    if (!product) return;

    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId && item.supplier_name === supplierName) {
          const newQty = item.cartQuantity + delta;
          if (newQty > product.current_stock) {
            return item;
          }
          const finalQty = Math.max(0, newQty);
          return { ...item, cartQuantity: finalQty, subtotal: finalQty * item.selling_price };
        }
        return item;
      }).filter((item) => item.cartQuantity > 0)
    );
  };

  // --- Checkout Action ---
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setLastReceipt(null);

    // Snapshot cart before clearing (needed for optimistic update)
    const cartSnapshot = [...cart];
    const cartTotalSnapshot = cartTotal;
    const netPayableSnapshot = netPayable;
    const discountSnapshot = discountValue;

    try {
      // Branch ID is resolved from selected warehouse, falling back to cashier default branch.
      const branchId = selectedBranchId || localStorage.getItem("erp_branch_id") || defaultBranchId;
      const cashierId = localStorage.getItem("erp_user_id") || "";

      const payload: CheckoutRequest = {
        branch_id: branchId,
        cashier_id: cashierId,
        status: "paid",
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        customer_address: customerAddress.trim() || undefined,
        discount: discountSnapshot,
        items: cartSnapshot.map((item) => ({
          product_id: item.product_id || item.id,
          quantity: item.cartQuantity,
          unit_price: item.selling_price,
          supplier_name: item.supplier_name || null,
        })),
      };

      const response = await posApi.checkout(payload);

      // Save details for printable invoice preview
      setCompletedSale({
        id: response.id,
        receipt_number: response.receipt_number || `INV-LOCAL-${Date.now().toString().slice(-6)}`,
        customer_name: customerName.trim() || "Walk-in Customer",
        customer_phone: customerPhone.trim() || "—",
        customer_address: customerAddress.trim() || "—",
        items: cartSnapshot.map(item => ({
          name: item.name,
          sku: item.sku,
          quantity: item.cartQuantity,
          unit_price: item.selling_price,
          subtotal: item.subtotal,
          supplier_name: item.supplier_name
        })),
        gross_total: cartTotalSnapshot,
        discount: discountSnapshot,
        net_total: netPayableSnapshot,
        status: "paid",
        date: new Date().toLocaleString()
      });

      // ── OPTIMISTIC STOCK DEDUCTION ──────────────────────────────────────
      // Immediately subtract sold quantities from the local products state so the
      // POS list shows correct stock without waiting for the async NATS round-trip.
      setProducts(prev =>
        prev.map(p => {
          const soldItem = cartSnapshot.find(
            c => (c.product_id || c.id) === p.product_id && c.supplier_name === p.supplier_name
          );
          if (!soldItem) return p;
          return { ...p, current_stock: Math.max(0, p.current_stock - soldItem.cartQuantity) };
        })
      );
      // ────────────────────────────────────────────────────────────────────

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerAddress("");
      setDiscountStr("");
      setSearchQuery("");
      setLastReceipt(response.receipt_number);

      if (response.offline) {
        const queue = await getSyncQueue();
        setPendingSync(queue.length);
      }

      // Wait 500ms for NATS deduction to land in inventory DB, then re-fetch.
      // (NATS round-trip: publish → broker → inventory subscriber → DB write ≈ 40-200ms)
      // The optimistic update already shows the correct count instantly;
      // this re-fetch syncs the authoritative server value.
      setTimeout(() => { fetchProductsList(selectedBranchId || undefined); }, 500);
      // Second re-fetch at 3s as a safety net for slow environments
      setTimeout(() => { fetchProductsList(selectedBranchId || undefined); }, 3000);

    } catch (error) {
      console.error("Checkout process error:", error);
      alert("Checkout failed. Please check the console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = async () => {
    if (completedSale && completedSale.id && completedSale.status === "pending") {
      try {
        await posApi.completeSale(completedSale.id);
        setCompletedSale((prev) => (prev ? { ...prev, status: "paid" } : null));
        await fetchProductsList(selectedBranchId || undefined); // Reload active stock counts
      } catch (err) {
        console.error("Failed to finalize payment:", err);
        alert("Failed to finalize payment in database. Cannot print invoice.");
        return;
      }
    }
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const activeBranchName = branches.find(b => b.id === (selectedBranchId || defaultBranchId))?.name || "Default Warehouse";

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {/* Print Styles Block */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* Hide everything by default */
          body * { visibility: hidden !important; }

          /* Show only the print area and its children */
          #print-area, #print-area * { visibility: visible !important; }

          /* Position the print area to fill the page */
          #print-area {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            color: black !important;
            padding: 24px !important;
            font-size: 11px !important;
            overflow: visible !important;
          }

          /* Page setup */
          @page {
            size: A4;
            margin: 12mm 14mm;
          }

          /* Force visible for print-only elements */
          .print\\:flex { display: flex !important; }
          .hidden.print\\:flex { display: flex !important; visibility: visible !important; }
          .print\\:hidden { display: none !important; }
        }
      `}} />

      {/* LEFT PANE: Product Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white p-4 shadow-sm border-b z-10 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-1.5">
              <span>🛒</span> POS Terminal
            </h1>

            {!isOnline && (
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                Offline Mode
              </span>
            )}
          </div>

          {/* Autocomplete Search input wrapper */}
          <div className="relative flex-1 max-w-xl">
            <div className="flex items-center bg-slate-50 border rounded-xl focus-within:ring-2 focus-within:ring-blue-500 transition shadow-inner">
              <span className="pl-3 text-slate-400">🔍</span>
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                className="w-full p-2.5 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 font-medium"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(""); setShowSuggestions(false); }}
                  className="pr-3 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dynamic Suggestions List Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <>
                <div
                  className="fixed inset-0 z-25"
                  onClick={() => setShowSuggestions(false)}
                />
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden max-h-72 overflow-y-auto divide-y animate-fadeIn">
                  {searchSuggestions.map((product) => {
                    const availableStock = getAvailableStock(product);
                    const outOfStock = availableStock <= 0;
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (!outOfStock) {
                            addToCart(product);
                            setSearchQuery("");
                            setShowSuggestions(false);
                          }
                        }}
                        className={`p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors ${outOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-slate-800 text-sm truncate">{product.name} {product.supplier_name ? `(${product.supplier_name})` : ""}</p>
                          <p className="text-xs font-mono font-bold text-blue-600">{product.sku}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-900 text-sm">৳{product.selling_price.toFixed(2)}</p>
                          <p className={`text-[10px] px-1.5 py-0.5 rounded font-bold inline-block ${availableStock > 0
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-50 text-red-600"
                            }`}>
                            Stock: {availableStock}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Warehouse Dropdown Selector */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Warehouse:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              disabled={userRole !== "owner"}
              className={`p-2 border rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition ${userRole !== "owner" ? "cursor-not-allowed bg-slate-100 opacity-80" : ""}`}
            >
              {userRole === "owner" && <option value="">All Warehouses</option>}
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Supplier Filter Pills ── */}
        {uniquePosSuppliers.length > 1 && (
          <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier:</span>
            <button
              onClick={() => setPosSupplierFilter("")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${!posSupplierFilter
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
            >
              All
            </button>
            {uniquePosSuppliers.map(s => (
              <button
                key={s}
                onClick={() => setPosSupplierFilter(s === posSupplierFilter ? "" : s)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${posSupplierFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Catalog — Supplier-Grouped Table */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 font-medium animate-pulse">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
              <span className="text-4xl">🔎</span>
              <p className="font-medium">No matching products found.</p>
              {(searchQuery || posSupplierFilter) && (
                <button
                  onClick={() => { setSearchQuery(""); setPosSupplierFilter(""); }}
                  className="text-blue-600 text-xs font-semibold hover:underline"
                >Clear filters</button>
              )}
            </div>
          ) : (
            posSupplierGroups.map(supplierKey => (
              <div key={supplierKey} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                {/* Supplier header */}
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="font-bold text-slate-800 text-sm">{supplierKey}</span>
                    <span className="text-xs text-slate-400">{posGrouped[supplierKey].length} product{posGrouped[supplierKey].length !== 1 ? "s" : ""}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${posGrouped[supplierKey].every(p => getAvailableStock(p) <= 0)
                    ? "bg-red-50 text-red-600 border-red-200"
                    : posGrouped[supplierKey].some(p => getAvailableStock(p) <= 0)
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                    {posGrouped[supplierKey].filter(p => getAvailableStock(p) > 0).length} in stock
                  </span>
                </div>

                {/* Product rows */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Product Name</th>
                        <th className="px-4 py-2.5">SKU</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Warehouse</th>
                        <th className="px-4 py-2.5 text-center">Stock</th>
                        <th className="px-4 py-2.5 text-right">Price</th>
                        <th className="px-4 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                      {posGrouped[supplierKey].map((product) => {
                        const availableStock = getAvailableStock(product);
                        const outOfStock = availableStock <= 0;
                        const catName = categories.find(c => c.id === product.category_id)?.name || "—";
                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-blue-50/40 transition-colors ${outOfStock ? "opacity-50" : ""}`}
                          >
                            <td className="px-4 py-2.5 font-semibold text-slate-900">{product.name}</td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{product.sku}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{catName}</td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {selectedBranchId
                                ? (branches.find(b => b.id === selectedBranchId)?.name || "—")
                                : "All Warehouses"
                              }
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${outOfStock
                                ? "bg-red-50 text-red-700 border-red-200"
                                : availableStock <= 5
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                }`}>
                                {outOfStock ? "Out of Stock" : `${availableStock}`}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">৳{product.selling_price.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => !outOfStock && addToCart(product)}
                                disabled={outOfStock}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${outOfStock
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                  : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white border border-blue-200"
                                  }`}
                              >
                                + Add to Cart
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANE: Cart & Checkout Summary */}
      <div className="w-[26rem] bg-white border-l shadow-xl flex flex-col h-full flex-shrink-0 z-20 overflow-hidden">
        <div className="p-4 bg-slate-900 text-slate-100 flex justify-between items-center shadow-md">
          <h2 className="text-sm font-bold flex flex-col gap-0.5 leading-tight">
            <span className="flex items-center gap-1.5 text-base"><span>🛒</span> Current Cart</span>
            <span className="text-[10px] text-slate-300 font-normal">Selling from: <strong className="text-amber-400 font-semibold">{activeBranchName}</strong></span>
          </h2>
          <div className="flex items-center space-x-2">
            {pendingSync > 0 && (
              <button
                onClick={syncPendingOrders}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm transition flex items-center gap-1"
              >
                ↻ Sync {pendingSync}
              </button>
            )}
            <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-semibold">{cart.length} Items</span>
          </div>
        </div>

        {/* Scrollable Cart Items - Compact & Styled */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-27rem)] min-h-[10rem] p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
              <span className="text-4xl">🛍️</span>
              <p className="font-semibold text-xs">Cart is currently empty</p>
              <p className="text-[10px] text-slate-400">Add products to get started.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.id}-${item.supplier_name || 'no-supplier'}`}
                className="flex justify-between items-center bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 gap-2 transition hover:border-slate-300"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 text-xs truncate leading-tight">
                    {item.name}
                  </h4>
                  <div className="text-[10px] text-slate-500 mt-0.5 flex flex-col gap-0.5">
                    <span className="font-mono">SKU: {item.sku} &bull; ৳{item.selling_price.toFixed(2)}</span>
                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md inline-block w-fit mt-0.5">
                      📍 {activeBranchName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center bg-white border rounded-lg overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, item.supplier_name, -1)}
                    className="text-slate-500 hover:bg-slate-100 px-2 py-1 text-xs font-bold"
                  >
                    −
                  </button>
                  <span className="font-bold text-slate-800 w-6 text-center text-xs">{item.cartQuantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.supplier_name, 1)}
                    className="text-slate-500 hover:bg-slate-100 px-2 py-1 text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="w-16 text-right font-bold text-slate-900 text-xs flex-shrink-0">
                  ৳{item.subtotal.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer Information & Calculations - Completely Compact to stay above fold */}
        <div className="p-3 bg-slate-50 border-t space-y-3 flex-shrink-0">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-2">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                className="p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium w-full"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium w-full"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Customer Address"
              className="p-1.5 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium w-full"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
            <div className="pt-2 flex items-center justify-between border-t gap-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Discount</label>
              <div className="relative w-28">
                <span className="absolute left-2 top-1 text-xs font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="p-1 pl-5 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-right font-bold w-full"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs font-medium text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-700">৳{cartTotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount Applied:</span>
                <span className="font-bold">-৳{discountValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-800 font-bold border-t pt-1.5 mt-1.5">
              <span className="text-xs">Net Payable:</span>
              <span className="text-xl text-emerald-600">৳{netPayable.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-2.5 rounded-xl text-white font-bold text-sm transition-all shadow-md
              ${cart.length === 0
                ? "bg-slate-300 cursor-not-allowed shadow-none"
                : isProcessing
                  ? "bg-blue-400 cursor-wait"
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/25 active:scale-[0.98]"
              }`}
          >
            {isProcessing ? "Processing..." : "Complete Checkout"}
          </button>
        </div>
      </div>

      {/* COMPLETED SALE / PREMIUM INVOICE MODAL */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl border max-w-lg w-full shadow-2xl overflow-hidden flex flex-col my-8">

            {/* Modal Actions Header */}
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center gap-3">
              <h3 className="font-bold text-slate-800">Invoice Complete</h3>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg text-xs transition flex items-center gap-1 shadow-sm border border-blue-200"
                >
                  🖨️ Print Invoice
                </button>
                <button
                  onClick={() => setCompletedSale(null)}
                  className="px-3.5 py-1.5 bg-slate-800 text-white hover:bg-slate-900 font-bold rounded-lg text-xs transition shadow-sm"
                >
                  Close & New Sale
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div className="p-8 bg-white flex-1 overflow-y-auto" id="print-area">
              <div className="space-y-6">

                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b pb-4 gap-4">
                  <div>
                    <h1 className="text-xl font-bold text-slate-900">{companyProfile?.name || "GROCERY ERP"}</h1>
                    <p className="text-xs text-slate-500 font-medium">{companyProfile?.address || "Bozlur Mor, Kushita Road"}</p>
                    <p className="text-xs text-slate-500 font-medium">Phone: {companyProfile?.phone || "01700-000000"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoice ID</span>
                    <h2 className="text-base font-mono font-bold text-blue-600">{completedSale.receipt_number}</h2>
                    <p className="text-xs text-slate-400 font-medium">{completedSale.date}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-50 p-4 rounded-xl border flex flex-col text-xs gap-3">
                  <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px]">Billing & Customer Details</span>

                  {/* PRINT VIEW ONLY */}
                  <div className="hidden print:flex justify-between w-full">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{completedSale.customer_name}</p>
                      <p className="text-slate-500 font-medium mt-0.5">Phone: {completedSale.customer_phone}</p>
                      <p className="text-slate-500 font-medium mt-0.5">Address: {completedSale.customer_address}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Status</span>
                      <p className="text-emerald-600 font-bold mt-0.5 uppercase tracking-wider text-[10px]">
                        {completedSale.status === "paid" ? "Payment Paid" : "Payment Pending"}
                      </p>
                    </div>
                  </div>

                  {/* SCREEN VIEW */}
                  <div className="print:hidden">
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">Customer Name</label>
                          <input
                            type="text"
                            className="w-full p-1.5 border rounded bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] font-bold text-slate-400">Customer Phone</label>
                          <input
                            type="text"
                            className="w-full p-1.5 border rounded bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400">Customer Address</label>
                        <input
                          type="text"
                          className="w-full p-1.5 border rounded bg-white text-xs font-semibold focus:ring-1 focus:ring-blue-500 outline-none"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-4 pt-1">
                        <div>
                          <label className="text-[9px] font-bold text-slate-400 block">Invoice Discount (৳)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            className="p-1 border rounded text-xs font-bold text-slate-800 bg-white focus:ring-1 focus:ring-blue-500 outline-none w-28 text-right"
                            value={editDiscount}
                            onChange={(e) => setEditDiscount(e.target.value)}
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="block font-bold text-slate-400 uppercase tracking-wider text-[8px]">Status</span>
                            <span className={`font-bold uppercase tracking-wider text-[9px] ${completedSale.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                              {completedSale.status === "paid" ? "Paid" : "Pending"}
                            </span>
                          </div>
                          <button
                            onClick={async () => {
                              if (!completedSale.id) return;
                              try {
                                const updated = await posApi.updateSale(completedSale.id, {
                                  customer_name: editName,
                                  customer_phone: editPhone,
                                  customer_address: editAddress,
                                  discount: parseFloat(editDiscount) || 0.0
                                });
                                setCompletedSale(prev => prev ? {
                                  ...prev,
                                  customer_name: updated.customer_name || "Walk-in Customer",
                                  customer_phone: updated.customer_phone || "—",
                                  customer_address: updated.customer_address || "—",
                                  discount: updated.discount,
                                  net_total: updated.total_amount
                                } : null);
                                alert("✅ Invoice updated in database successfully!");
                              } catch (err) {
                                console.error("Failed to update sale:", err);
                                alert("Failed to update sale in DB");
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition shadow self-end"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item List Table */}
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[9px]">
                      <th className="py-2.5">Item Description</th>
                      <th className="py-2.5 text-center">Qty</th>
                      <th className="py-2.5 text-right">Price</th>
                      <th className="py-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {completedSale.items.map((item, idx) => (
                      <tr key={idx} className="py-3">
                        <td className="py-3 pr-4">
                          <p className="font-bold text-slate-900">{item.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</span>
                        </td>
                        <td className="py-3 text-center font-semibold">{item.quantity}</td>
                        <td className="py-3 text-right">৳{item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-slate-900">৳{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="border-t pt-4 flex flex-col items-end text-xs gap-1.5">
                  <div className="w-48 flex justify-between font-medium text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">৳{completedSale.gross_total.toFixed(2)}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div className="w-48 flex justify-between text-red-500 font-medium">
                      <span>Discount:</span>
                      <span>-৳{completedSale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="w-48 flex justify-between items-center text-sm font-bold text-slate-900 border-t pt-2 mt-1">
                    <span>Grand Total:</span>
                    <span className="text-lg text-emerald-600">৳{completedSale.net_total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Footer Message */}
                <div className="text-center text-[10px] text-slate-400 font-medium pt-8 border-t border-dashed">
                  <p>Thank you for shopping with us!</p>
                  <p className="mt-0.5">Please keep this invoice copy for your records.</p>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}