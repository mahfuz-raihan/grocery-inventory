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
}

// --- API Functions ---
const API_BASE = '/api/v1';

export const api = {
    /**
     * Fetches the product list from the Inventory service.
     * We can easily add a search query parameter here later!
     */
    getProducts: async (): Promise<Product[]> => {
        try {
            const response = await fetch(`${API_BASE}/inventory/products`);
            if (!response.ok) throw new Error("Failed to fetch products");
            return await response.json();
        } catch (error) {
            console.error("API Error (getProducts):", error);
            return [];
        }
    },

    /**
     * Sends the cart to the Sales service for checkout and receipt generation.
     */
    checkout: async (payload: CheckoutRequest) => {
        try {
            const response = await fetch(`${API_BASE}/sales/checkout`, {
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
    }
};