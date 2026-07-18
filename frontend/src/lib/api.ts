// --- Type Definitions ---
export interface Product {
    id: string;
    product_id?: string;
    sku: string;
    name: string;
    selling_price: number;
    current_stock: number;
    supplier_name?: string;
}

export interface CartItem extends Product {
    cartQuantity: number;
    subtotal: number;
}

export interface CheckoutRequest {
    branch_id: string;
    cashier_id: string;
    items: {
        product_id: string;
        quantity: number;
        unit_price: number;
        supplier_name?: string | null;
    }[];
    status: "paid" | "pending";
    customer_name?: string;
    customer_phone?: string;
    customer_address?: string;
    discount?: number;
}

// New GRN Types
export interface GRNItemCreate {
    product_id: string;
    quantity_received: number;
    cost_price: number;
}

export interface GRNCreate {
    branch_id: string;
    supplier_name: string;
    invoice_reference?: string;
    items: GRNItemCreate[];
}

// New Report Types
export interface DailyReport {
    date: string;
    branch_id: string | null;
    total_revenue: number;
    transaction_count: number;
}

// --- API Functions ---
const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return '';
};

export const api = {
    getProducts: async (branchId?: string): Promise<Product[]> => {
        try {
            const baseUrl = getApiBaseUrl();
            let url = `${baseUrl}/api/v1/inventory/products?supplier_wise=true`;
            if (branchId) {
                url += `&branch_id=${branchId}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to fetch products");
            return await response.json();
        } catch (error) {
            console.error("API Error (getProducts):", error);
            return [];
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
            console.error("API Error (checkout):", error);
            throw error;
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
    },

    // NEW: Fetch Daily Sales Report
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

    // NEW: Submit Goods Receipt Note
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
    },

    getSetting: async (key: string): Promise<any> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/settings/${key}`);
            if (!response.ok) throw new Error("Failed to fetch settings");
            const data = await response.json();
            return JSON.parse(data.value);
        } catch (error) {
            console.error("API Error (getSetting):", error);
            if (key === "rbac_rules") {
                return {
                    visible_inventory_tabs: {
                        owner: ["stock_list", "products", "receiving", "warehouses", "suppliers", "transfers", "adjustments", "reports"],
                        manager: ["stock_list", "products", "receiving", "reports"],
                        cashier: ["stock_list", "products"],
                        stock_handler: ["stock_list", "products"]
                    },
                    pos_warehouse_select: ["owner"],
                    product_price_edit: ["owner"],
                    company_profile_edit: ["owner"]
                };
            }
            throw error;
        }
    },

    updateSetting: async (key: string, value: string): Promise<any> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/inventory/settings/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
            if (!response.ok) throw new Error("Failed to update setting");
            return await response.json();
        } catch (error) {
            console.error("API Error (updateSetting):", error);
            throw error;
        }
    },

    getUser: async (userId: string): Promise<any> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/auth/users/${userId}`);
            if (!response.ok) throw new Error("Failed to fetch user profile");
            return await response.json();
        } catch (error) {
            console.error("API Error (getUser):", error);
            throw error;
        }
    },

    updateUser: async (userId: string, payload: any): Promise<any> => {
        try {
            const baseUrl = getApiBaseUrl();
            const response = await fetch(`${baseUrl}/api/v1/auth/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("Failed to update user profile");
            return await response.json();
        } catch (error) {
            console.error("API Error (updateUser):", error);
            throw error;
        }
    }
};