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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await posApi.getProducts();
        setProducts(data);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();

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
      }
  };

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
      }).filter((item) => item.cartQuantity > 0) // Remove if quantity is 0
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
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.cartQuantity,
          unit_price: item.selling_price,
        })),
      };

      const response = await posApi.checkout(payload);
      
      setCart([]);
      setLastReceipt(response.receipt_number);
      
      if (response.offline) {
          const queue = await getSyncQueue();
          setPendingSync(queue.length);
      }
      
    } catch (error) {
      console.error("Checkout process error:", error);
      alert("Checkout failed. Please check the console.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* LEFT PANE: Product Catalog */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white p-4 shadow-sm border-b z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-600">Grocery POS</h1>
            
            {!isOnline && (
                <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200 animate-pulse">
                    ⚠️ OFFLINE MODE
                </span>
            )}

            <a href="/dashboard" className="px-3 py-1 bg-gray-100 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-200 transition-colors">HQ Dashboard →</a>
          </div>
          <input
            type="text"
            placeholder="Search products by name or SKU (Manual Entry)..."
            className="w-1/2 p-3 border rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 cursor-pointer transition-all active:scale-95 flex flex-col justify-between h-32"
                >
                  <div>
                    <h3 className="font-semibold text-gray-700 leading-tight line-clamp-2">{product.name}</h3>
                    <span className="text-xs text-gray-400 block mt-1">SKU: {product.sku}</span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-lg font-bold text-emerald-600">${product.selling_price.toFixed(2)}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">
                      Stock: {product.current_stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANE: Cart & Checkout */}
      <div className="w-96 bg-white shadow-2xl border-l flex flex-col z-20">
        <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold">Current Order</h2>
          <div className="flex items-center space-x-3">
              {pendingSync > 0 && (
                  <button onClick={syncPendingOrders} className="bg-yellow-500 hover:bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow transition-colors">
                      ↻ Sync {pendingSync} Queued
                  </button>
              )}
              <span className="bg-gray-700 px-3 py-1 rounded-full text-sm">{cart.length} Items</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <span className="text-4xl">🛒</span>
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800 text-sm">{item.name}</h4>
                  <div className="text-gray-500 text-xs mt-1">${item.selling_price.toFixed(2)} / each</div>
                </div>
                
                <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-2 py-1">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-gray-600 hover:text-red-500 font-bold px-2">−</button>
                  <span className="font-semibold w-4 text-center">{item.cartQuantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-gray-600 hover:text-green-500 font-bold px-2">+</button>
                </div>
                
                <div className="w-16 text-right font-bold text-gray-800">
                  ${item.subtotal.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t">
          {lastReceipt && (
            <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-sm text-center font-medium border border-green-200">
              ✅ Sale Complete! <br />
              <span className="font-mono font-bold text-lg">{lastReceipt}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center mb-4 text-xl font-bold text-gray-800">
            <span>Total:</span>
            <span className="text-3xl text-emerald-600">${cartTotal.toFixed(2)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className={`w-full py-4 rounded-xl text-white font-bold text-xl transition-all shadow-lg
              ${cart.length === 0 
                ? "bg-gray-300 cursor-not-allowed shadow-none" 
                : isProcessing 
                  ? "bg-blue-400 cursor-wait" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-blue-500/30 active:scale-[0.98]"
              }`}
          >
            {isProcessing ? "Processing..." : "Pay / Checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}