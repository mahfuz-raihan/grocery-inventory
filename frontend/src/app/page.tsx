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
    getProducts: async (): Promise<Product[]> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/products`);
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
                { id: "1", sku: "APP-01", name: "Organic Apples", selling_price: 2.99, current_stock: 100 },
                { id: "2", sku: "MIL-01", name: "Whole Milk 1 Gallon", selling_price: 4.50, current_stock: 45 },
                { id: "3", sku: "BRD-01", name: "Sourdough Bread", selling_price: 5.25, current_stock: 20 },
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
  const [discountStr, setDiscountStr] = useState("");

  // --- COMPLETED SALE (INVOICE) STATE ---
  const [completedSale, setCompletedSale] = useState<{
    receipt_number: string;
    customer_name: string;
    customer_phone: string;
    items: {
      name: string;
      sku: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }[];
    gross_total: number;
    discount: number;
    net_total: number;
    date: string;
  } | null>(null);

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

  const fetchProductsList = async () => {
    try {
      const data = await posApi.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsList();

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
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 8);
  }, [products, searchQuery]);

  // Main list filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

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

  // --- Cart Actions ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, cartQuantity: item.cartQuantity + 1, subtotal: (item.cartQuantity + 1) * item.selling_price }
            : item
        );
      }
      return [...prev, { ...product, cartQuantity: 1, subtotal: product.selling_price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.cartQuantity + delta);
          return { ...item, cartQuantity: newQty, subtotal: newQty * item.selling_price };
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

    try {
      const branchId = localStorage.getItem("erp_branch_id") || "00000000-0000-0000-0000-000000000001";
      const cashierId = localStorage.getItem("erp_user_id") || "00000000-0000-0000-0000-000000000002";

      const payload: CheckoutRequest = {
        branch_id: branchId,
        cashier_id: cashierId,
        status: "paid",
        customer_name: customerName.trim() || undefined,
        customer_phone: customerPhone.trim() || undefined,
        discount: discountValue,
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.cartQuantity,
          unit_price: item.selling_price,
        })),
      };

      const response = await posApi.checkout(payload);
      
      // Save details for printable invoice preview
      setCompletedSale({
        receipt_number: response.receipt_number || `INV-LOCAL-${Date.now().toString().slice(-6)}`,
        customer_name: customerName.trim() || "Walk-in Customer",
        customer_phone: customerPhone.trim() || "—",
        items: cart.map(item => ({
          name: item.name,
          sku: item.sku,
          quantity: item.cartQuantity,
          unit_price: item.selling_price,
          subtotal: item.subtotal
        })),
        gross_total: cartTotal,
        discount: discountValue,
        net_total: netPayable,
        date: new Date().toLocaleString()
      });

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setDiscountStr("");
      setSearchQuery("");
      setLastReceipt(response.receipt_number);
      
      if (response.offline) {
          const queue = await getSyncQueue();
          setPendingSync(queue.length);
      }

      // Sync and reload available stocks immediately
      await fetchProductsList();
      
    } catch (error) {
      console.error("Checkout process error:", error);
      alert("Checkout failed. Please check the console.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-50 font-sans text-slate-800 overflow-hidden relative">
      {/* Print Styles Block */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
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
                  {searchSuggestions.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        addToCart(product);
                        setSearchQuery("");
                        setShowSuggestions(false);
                      }}
                      className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <p className="font-semibold text-slate-800 text-sm truncate">{product.name}</p>
                        <p className="text-xs font-mono font-bold text-blue-600">{product.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-slate-900 text-sm">${product.selling_price.toFixed(2)}</p>
                        <p className={`text-[10px] px-1.5 py-0.5 rounded font-bold inline-block ${
                          product.current_stock > 0 
                            ? "bg-slate-100 text-slate-600" 
                            : "bg-red-50 text-red-600"
                        }`}>
                          Stock: {product.current_stock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Catalog Grid View */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-500 font-medium animate-pulse">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <span className="text-4xl">🔎</span>
              <p className="font-medium">No matching products found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const outOfStock = product.current_stock <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => {
                      if (!outOfStock) addToCart(product);
                    }}
                    className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all active:scale-98 flex flex-col justify-between h-32 relative group overflow-hidden ${
                      outOfStock 
                        ? "opacity-60 cursor-not-allowed" 
                        : "cursor-pointer hover:border-blue-300"
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800 leading-tight text-sm line-clamp-2">{product.name}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1">SKU: {product.sku}</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-base font-bold text-blue-600">${product.selling_price.toFixed(2)}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        outOfStock 
                          ? "bg-red-100 text-red-800" 
                          : "bg-slate-100 text-slate-600"
                      }`}>
                        {outOfStock ? "Out of Stock" : `Qty: ${product.current_stock}`}
                      </span>
                    </div>
                    {/* Add hover overlay effect */}
                    {!outOfStock && (
                      <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Cart & Checkout Summary */}
      <div className="w-[26rem] bg-white border-l shadow-xl flex flex-col h-full flex-shrink-0 z-20">
        <div className="p-4 bg-slate-900 text-slate-100 flex justify-between items-center shadow-md">
          <h2 className="text-lg font-bold flex items-center gap-1.5">
            <span>🛒</span> Current Cart
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

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <span className="text-5xl">🛍️</span>
              <p className="font-semibold text-sm">Cart is currently empty</p>
              <p className="text-xs text-slate-400">Click products or use search to add items.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b border-slate-100 pb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 text-sm truncate">{item.name}</h4>
                  <div className="text-slate-500 text-xs mt-0.5">${item.selling_price.toFixed(2)} / each</div>
                </div>
                
                <div className="flex items-center space-x-2 bg-slate-100 rounded-xl px-2 py-1 flex-shrink-0">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-slate-600 hover:text-red-500 font-extrabold px-1.5 py-0.5 text-sm">−</button>
                  <span className="font-bold text-slate-800 w-4 text-center text-xs">{item.cartQuantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-slate-600 hover:text-green-500 font-extrabold px-1.5 py-0.5 text-sm">+</button>
                </div>
                
                <div className="w-16 text-right font-bold text-slate-800 text-sm flex-shrink-0">
                  ${item.subtotal.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer Information & Calculations */}
        <div className="p-4 bg-slate-50 border-t space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Customer Details</h3>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Customer Name"
                className="p-2 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <input
                type="text"
                placeholder="Phone Number"
                className="p-2 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
            <div className="pt-1.5 flex items-center justify-between border-t gap-4">
              <label className="text-xs font-bold text-slate-500 uppercase">Manual Discount</label>
              <div className="relative w-28">
                <span className="absolute left-2.5 top-2 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="p-1.5 pl-6 border rounded-lg text-xs bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none text-right font-bold w-full"
                  value={discountStr}
                  onChange={(e) => setDiscountStr(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-500 font-medium">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="font-bold text-slate-700">${cartTotal.toFixed(2)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount Applied:</span>
                <span className="font-bold">-${discountValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-800 font-bold border-t pt-2 mt-2">
              <span className="text-sm">Net Payable:</span>
              <span className="text-2xl text-emerald-600">${netPayable.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-3.5 rounded-xl text-white font-bold text-lg transition-all shadow-md
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
                    <h1 className="text-xl font-bold text-slate-900">GROCERY ERP</h1>
                    <p className="text-xs text-slate-500 font-medium">Bozlur Mor, Kushita Road</p>
                    <p className="text-xs text-slate-500 font-medium">Phone: 01700-000000</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Invoice ID</span>
                    <h2 className="text-base font-mono font-bold text-blue-600">{completedSale.receipt_number}</h2>
                    <p className="text-xs text-slate-400 font-medium">{completedSale.date}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-slate-50 p-4 rounded-xl border flex justify-between text-xs gap-4">
                  <div>
                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Billed To</span>
                    <p className="font-bold text-slate-800 text-sm">{completedSale.customer_name}</p>
                    <p className="text-slate-500 font-medium mt-0.5">Phone: {completedSale.customer_phone}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-bold text-slate-400 uppercase tracking-wider text-[9px] mb-1">Cashier Desk</span>
                    <p className="font-bold text-slate-800">POS Terminal #1</p>
                    <p className="text-emerald-600 font-bold mt-0.5">Payment Paid</p>
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
                        <td className="py-3 text-right">${item.unit_price.toFixed(2)}</td>
                        <td className="py-3 text-right font-bold text-slate-900">${item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Financial Summary */}
                <div className="border-t pt-4 flex flex-col items-end text-xs gap-1.5">
                  <div className="w-48 flex justify-between font-medium text-slate-500">
                    <span>Subtotal:</span>
                    <span className="font-bold text-slate-800">${completedSale.gross_total.toFixed(2)}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div className="w-48 flex justify-between text-red-500 font-medium">
                      <span>Discount:</span>
                      <span>-${completedSale.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="w-48 flex justify-between items-center text-sm font-bold text-slate-900 border-t pt-2 mt-1">
                    <span>Grand Total:</span>
                    <span className="text-lg text-emerald-600">${completedSale.net_total.toFixed(2)}</span>
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