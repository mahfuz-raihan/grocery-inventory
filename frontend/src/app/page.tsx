"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Product, CartItem, CheckoutRequest, api } from "../lib/api";
import {
  saveProductsLocal,
  getProductsLocal,
  addToSyncQueue,
  getSyncQueue,
  clearSyncQueueItem
} from "../lib/db";
import { InvoiceModal, printThermalReceipt } from "./dashboard/components/InvoiceModal";
import { SaleInvoice, Branch, CompanyProfile } from "./dashboard/types";
import { getExpiryStatus } from "./inventory/types";
import { toast } from "@/components/ui/Toast";

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
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      return { receipt_number: `INV-SOLD-${todayStr}-OFF-${Date.now().toString().slice(-3)}`, offline: true };
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

  // --- POS SUPPLIER FILTER ---
  const [posSupplierFilter, setPosSupplierFilter] = useState("");

  // --- DEFAULT BRANCH (resolved from DB at startup) ---
  const [defaultBranchId, setDefaultBranchId] = useState<string>("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [rbacRules, setRbacRules] = useState<any>(null);

  // --- CATEGORIES STATE ---
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  // --- COMPANY PROFILE STATE ---
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);

  // --- COMPLETED SALE (INVOICE) STATE ---
  const [completedInvoice, setCompletedInvoice] = useState<SaleInvoice | null>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- OFFLINE CAPABILITY STATE ---
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);

  // --- 80mm RECEIPT AUTO-PRINT STATE ---
  const [autoPrintThermal, setAutoPrintThermal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedAutoPrint = localStorage.getItem("pos_autoprint_thermal");
      if (savedAutoPrint === "true") {
        setAutoPrintThermal(true);
      }
    }
  }, []);

  const toggleAutoPrintThermal = (val: boolean) => {
    setAutoPrintThermal(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("pos_autoprint_thermal", val ? "true" : "false");
    }
  };

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
    
    async function initPage() {
      try {
        const rules = await api.getSetting("rbac_rules");
        setRbacRules(rules);
        
        // Use dynamically configured permission instead of hardcoded check
        const canSelectWarehouse = rules ? rules.pos_warehouse_select?.includes(role) : (role === "owner");
        
        if (!canSelectWarehouse && userBranchId) {
          setSelectedBranchId(userBranchId);
          fetchProductsList(userBranchId);
        } else {
          fetchProductsList();
        }
      } catch (err) {
        console.error("Failed to load settings rules", err);
        // Fallback to static rules
        if (role !== "owner" && userBranchId) {
          setSelectedBranchId(userBranchId);
          fetchProductsList(userBranchId);
        } else {
          fetchProductsList();
        }
      }
    }

    initPage();

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
      toast.success(`Successfully synced ${successCount} offline orders to Main Server!`);
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
    if (available <= 0) {
      toast.warning(`"${product.name}" is out of stock.`);
      return;
    }

    const expiry = getExpiryStatus(product.expiry_date);
    if (expiry?.status === "expired") {
      toast.error(`Perishable Alert: "${product.name}" is EXPIRED! Check batch.`, "Perishable Alert");
    } else if (expiry?.status === "near_expiry") {
      toast.warning(`Perishable Notice: "${product.name}" expires in ${expiry.days} days.`, "Near Expiry");
    }

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
    toast.success(`Added "${product.name}" to cart`);
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

      // Save details for printable invoice preview (matches Dashboard Sold Invoices)
      const createdInvoice: SaleInvoice = {
        id: response.id || `inv-${Date.now()}`,
        receipt_number:
          response.receipt_number ||
          `INV-SOLD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-001`,
        branch_id: branchId,
        customer_name: customerName.trim() || "Walk-in Customer",
        customer_phone: customerPhone.trim() || "—",
        customer_address: customerAddress.trim() || "—",
        total_amount: netPayableSnapshot,
        discount: discountSnapshot,
        status: "Paid",
        created_at: new Date().toISOString(),
        items: cartSnapshot.map((item) => ({
          id: item.id,
          product_id: item.product_id || item.id,
          product_name: item.name,
          quantity: item.cartQuantity,
          unit_price: item.selling_price,
          subtotal: item.subtotal,
        })),
      };

      setCompletedInvoice(createdInvoice);

      // ── OPTIMISTIC STOCK DEDUCTION ──────────────────────────────────────
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

      if (autoPrintThermal) {
        try {
          printThermalReceipt(
            createdInvoice,
            products.map((p) => ({
              id: p.product_id || p.id,
              name: p.name,
              sku: p.sku,
              average_cost: p.selling_price,
            })),
            branches,
            companyProfile
          );
        } catch (printErr) {
          console.error("Auto-print thermal error:", printErr);
        }
        toast.success(`Order ${response.receipt_number} completed & 80mm slip printed!`);
      } else {
        toast.success(`Order ${response.receipt_number} completed successfully!`);
      }

      setTimeout(() => { fetchProductsList(selectedBranchId || undefined); }, 500);
      setTimeout(() => { fetchProductsList(selectedBranchId || undefined); }, 3000);

    } catch (error) {
      console.error("Checkout process error:", error);
      toast.error("Checkout failed. Please check the console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const activeBranchName = branches.find(b => b.id === (selectedBranchId || defaultBranchId))?.name || "Default Warehouse";

  return (
    <div className="flex h-full w-full bg-surface font-sans text-slate-800 overflow-hidden relative">
      {/* LEFT PANE: Product Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Top Controls Header */}
        <div className="bg-white p-4 border-b border-slate-200 z-10 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-8 h-8 rounded-md bg-emerald-50 border border-emerald-200 text-brand flex items-center justify-center text-sm shadow-xs">
                🛒
              </span>
              <span>POS Terminal</span>
            </h1>

            {!isOnline && (
              <span className="badge-danger animate-pulse">
                Offline Mode
              </span>
            )}
          </div>

          {/* Autocomplete Search input wrapper */}
          <div className="relative flex-1 max-w-xl">
            <div className="flex items-center bg-slate-50/80 border border-slate-200 rounded-md focus-within:bg-white focus-within:border-brand focus-within:ring-1 focus-within:ring-brand transition-all shadow-xs">
              <span className="pl-3 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                className="w-full p-2 bg-transparent outline-none text-xs text-slate-900 placeholder-slate-400 font-medium"
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
                  className="pr-3 text-slate-400 hover:text-slate-600 text-xs font-bold"
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
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-md shadow-dropdown z-30 overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
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
                        className={`p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors ${outOfStock ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        <div className="min-w-0 pr-4">
                          <p className="font-semibold text-slate-900 text-xs truncate">
                            {product.name} {product.supplier_name ? `(${product.supplier_name})` : ""}
                          </p>
                          <p className="text-[11px] font-mono font-medium text-slate-500">{product.sku}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold font-mono text-slate-900 text-xs">৳{product.selling_price.toFixed(2)}</p>
                          <p className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-block mt-0.5 ${availableStock > 0
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
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
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Warehouse:</span>
            <select
              value={selectedBranchId}
              onChange={(e) => handleBranchChange(e.target.value)}
              disabled={rbacRules ? !rbacRules.pos_warehouse_select?.includes(userRole) : (userRole !== "owner")}
              className={`px-3 py-1.5 border border-slate-200 rounded-md text-xs font-medium text-slate-700 bg-slate-50 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all shadow-xs ${(rbacRules ? !rbacRules.pos_warehouse_select?.includes(userRole) : (userRole !== "owner")) ? "cursor-not-allowed bg-slate-100 opacity-80" : ""}`}
            >
              {(rbacRules ? rbacRules.pos_warehouse_select?.includes(userRole) : (userRole === "owner")) && <option value="">All Warehouses</option>}
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Supplier Filter Pills ── */}
        {uniquePosSuppliers.length > 1 && (
          <div className="px-5 py-2.5 bg-white border-b border-slate-200 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Supplier:</span>
            <button
              onClick={() => setPosSupplierFilter("")}
              className={`px-3 py-1 rounded text-xs font-medium border transition-all ${!posSupplierFilter
                ? "bg-brand text-white border-brand shadow-xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                }`}
            >
              All
            </button>
            {uniquePosSuppliers.map(s => (
              <button
                key={s}
                onClick={() => setPosSupplierFilter(s === posSupplierFilter ? "" : s)}
                className={`px-3 py-1 rounded text-xs font-medium border transition-all ${posSupplierFilter === s
                  ? "bg-brand text-white border-brand shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
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
              <span className="text-3xl">🔎</span>
              <p className="font-medium text-xs text-slate-600">No matching products found.</p>
              {(searchQuery || posSupplierFilter) && (
                <button
                  onClick={() => { setSearchQuery(""); setPosSupplierFilter(""); }}
                  className="text-brand text-xs font-semibold hover:underline"
                >Clear filters</button>
              )}
            </div>
          ) : (
            posSupplierGroups.map(supplierKey => (
              <div key={supplierKey} className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-card">
                {/* Supplier header */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 text-brand border border-emerald-200 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="font-bold text-slate-900 text-xs">{supplierKey}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{posGrouped[supplierKey].length} product{posGrouped[supplierKey].length !== 1 ? "s" : ""}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${posGrouped[supplierKey].every(p => getAvailableStock(p) <= 0)
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : posGrouped[supplierKey].some(p => getAvailableStock(p) <= 0)
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                    }`}>
                    {posGrouped[supplierKey].filter(p => getAvailableStock(p) > 0).length} in stock
                  </span>
                </div>

                {/* Product rows */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Product Name</th>
                        <th className="px-4 py-2.5">SKU</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Warehouse</th>
                        <th className="px-4 py-2.5 text-center">Stock</th>
                        <th className="px-4 py-2.5 text-right">Price</th>
                        <th className="px-4 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {posGrouped[supplierKey].map((product) => {
                        const availableStock = getAvailableStock(product);
                        const outOfStock = availableStock <= 0;
                        const catName = categories.find(c => c.id === product.category_id)?.name || "—";
                        return (
                          <tr
                            key={product.id}
                            className={`hover:bg-slate-50/70 transition-colors ${outOfStock ? "opacity-50" : ""}`}
                          >
                            <td className="px-4 py-2.5 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{product.name}</span>
                                {(() => {
                                  const exp = getExpiryStatus(product.expiry_date);
                                  if (!exp) return null;
                                  return (
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${exp.color}`} title={`Expiry: ${product.expiry_date}`}>
                                      {exp.label}
                                    </span>
                                  );
                                })()}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="font-mono text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200/60">{product.sku}</span>
                            </td>
                            <td className="px-4 py-2.5 text-slate-500">{catName}</td>
                            <td className="px-4 py-2.5 text-slate-500">
                              {selectedBranchId
                                ? (branches.find(b => b.id === selectedBranchId)?.name || "—")
                                : "All Warehouses"
                              }
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border ${outOfStock
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : availableStock <= 5
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                }`}>
                                {outOfStock ? "Out of Stock" : `${availableStock}`}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">৳{product.selling_price.toFixed(2)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => !outOfStock && addToCart(product)}
                                disabled={outOfStock}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all shadow-xs ${outOfStock
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                  : "bg-emerald-50 text-brand hover:bg-brand hover:text-white border border-emerald-200"
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

      {/* RIGHT PANE: Cart & Checkout Summary (Shopify & Toast POS Inspired) */}
      <div className="w-[26rem] bg-white border-l border-slate-200 shadow-xl flex flex-col h-full flex-shrink-0 z-20 overflow-hidden">
        
        {/* Cart Top Bar */}
        <div className="p-3.5 bg-slate-900 text-slate-100 flex justify-between items-center shadow-xs flex-shrink-0">
          <h2 className="text-xs font-bold flex flex-col gap-0.5 leading-tight">
            <span className="flex items-center gap-1.5 text-sm font-bold text-white">
              <span>🛒</span> Current Cart
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Selling from: <strong className="text-amber-400 font-semibold">{activeBranchName}</strong>
            </span>
          </h2>
          <div className="flex items-center space-x-2">
            {pendingSync > 0 && (
              <button
                onClick={syncPendingOrders}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-bold shadow-xs transition flex items-center gap-1"
              >
                ↻ Sync {pendingSync}
              </button>
            )}
            <span className="bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium border border-slate-700">
              {cart.length} Items
            </span>
          </div>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-8">
              <span className="text-3xl">🛍️</span>
              <p className="font-semibold text-xs text-slate-600">Cart is currently empty</p>
              <p className="text-[11px] text-slate-400">Add products to get started.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={`${item.id}-${item.supplier_name || 'no-supplier'}`}
                className="flex justify-between items-center bg-slate-50/70 border border-slate-200 rounded-md p-2.5 gap-2 transition hover:bg-slate-50 hover:border-slate-300 shadow-xs"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 text-xs truncate leading-tight">
                    {item.name}
                  </h4>
                  <div className="text-[10px] text-slate-500 mt-1 flex flex-col gap-0.5">
                    <span className="font-mono">SKU: {item.sku} &bull; ৳{item.selling_price.toFixed(2)}</span>
                    <span className="text-[9px] font-medium text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded inline-block w-fit mt-0.5">
                      📍 {activeBranchName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center bg-white border border-slate-200 rounded-md overflow-hidden flex-shrink-0 shadow-xs">
                  <button
                    onClick={() => updateQuantity(item.id, item.supplier_name, -1)}
                    className="text-slate-600 hover:bg-slate-100 px-2 py-1 text-xs font-bold transition-colors"
                  >
                    −
                  </button>
                  <span className="font-bold font-mono text-slate-900 w-6 text-center text-xs">{item.cartQuantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.supplier_name, 1)}
                    className="text-slate-600 hover:bg-slate-100 px-2 py-1 text-xs font-bold transition-colors"
                  >
                    +
                  </button>
                </div>

                <div className="w-16 text-right font-mono font-bold text-slate-900 text-xs flex-shrink-0">
                  ৳{item.subtotal.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer Information & Calculations */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-200 space-y-2.5 flex-shrink-0">
          <div className="bg-white p-2.5 rounded-md border border-slate-200 space-y-2 shadow-xs">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                placeholder="Customer Name"
                className="p-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium w-full transition-all"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="p-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium w-full transition-all"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <input
              type="text"
              placeholder="Customer Address"
              className="p-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none font-medium w-full transition-all"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
            />
            <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 gap-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount</label>
              <div className="relative w-28">
                <span className="absolute left-2 top-1 text-xs font-mono font-bold text-slate-400">৳</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="p-1 pl-5 border border-slate-200 rounded-md text-xs bg-slate-50 focus:bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none text-right font-mono font-bold text-slate-900 w-full transition-all"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 text-xs font-medium text-slate-500 px-0.5">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold font-mono text-slate-800">৳{cartTotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Discount Applied:</span>
                <span className="font-bold font-mono">-৳{discountValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-900 font-bold border-t border-slate-200 pt-1.5 mt-1">
              <span className="text-xs">Net Payable:</span>
              <span className="text-xl text-brand font-black font-mono tracking-tight">৳{netPayable.toFixed(2)}</span>
            </div>
          </div>

          {/* 80mm Slip Auto-Print Toggle */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={autoPrintThermal}
                onChange={(e) => toggleAutoPrintThermal(e.target.checked)}
                className="w-3.5 h-3.5 text-brand rounded border-slate-300 focus:ring-brand cursor-pointer"
              />
              <span>Auto-print 80mm receipt</span>
            </label>
            <span className="text-[10px] text-slate-500 font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">🧾 80mm</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-2.5 rounded-md text-white font-semibold text-sm transition-all shadow-sm
              ${cart.length === 0
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : isProcessing
                  ? "bg-brand/80 cursor-wait"
                  : "bg-brand hover:bg-brand-hover active:scale-[0.99] shadow-xs"
              }`}
          >
            {isProcessing ? "Processing..." : "Complete Checkout"}
          </button>
        </div>
      </div>

      {/* UNIFIED A4 INVOICE PREVIEW MODAL (SAME AS SOLD INVOICES) */}
      {completedInvoice && (
        <InvoiceModal
          invoice={completedInvoice}
          onClose={() => setCompletedInvoice(null)}
          catalogProducts={products.map((p) => ({
            id: p.product_id || p.id,
            name: p.name,
            sku: p.sku,
            average_cost: p.selling_price,
          }))}
          branches={branches}
          companyProfile={companyProfile}
        />
      )}

    </div>
  );
}