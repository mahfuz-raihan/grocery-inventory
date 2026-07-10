// --- Type Definitions ---
export interface Product {
    id: string;
    sku: string;
    name: string;
    selling_price: number;
    current_stock: number;
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
    }[];
    status: "paid" | "pending";
    customer_name?: string;
    customer_phone?: string;
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
    }
};