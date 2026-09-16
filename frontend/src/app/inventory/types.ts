export interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_head_office: boolean;
  branch_type: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  unit?: string | null;
  selling_price: number;
  min_selling_price?: number;
  purchase_cost?: number;
  commission?: number;
  additional_cost?: number;
  average_cost?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_quantity?: number;
  is_active?: boolean;
  product_type?: string;
  parent_id?: string | null;
  color?: string | null;
  size?: string | null;
  current_stock: number;
  variants?: Product[];
  category_id?: string | null;
  supplier_id?: string | null;
  tax_rate?: number;
  product_image?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  thickness?: number | null;
  weight?: number | null;
  material_type?: string | null;
  wood_type?: string | null;
  board_type?: string | null;
}

export interface Transfer {
  id: string;
  product_id: string;
  from_branch_id: string;
  to_branch_id: string;
  quantity: number;
  status: string;
  reference?: string;
  created_at: string;
}

export interface Adjustment {
  id: string;
  product_id: string;
  branch_id: string;
  current_quantity: number;
  adjusted_quantity: number;
  reason: string;
  notes?: string;
  approved_by: string;
  created_at: string;
}

export interface ValuationDetail {
  product_id: string;
  sku: string;
  name: string;
  product_type: string;
  current_stock: number;
  unit_cost: number;
  total_value: number;
}

export interface ValuationReport {
  total_valuation: number;
  total_items: number;
  valuation_details: ValuationDetail[];
}

export interface LowStockItem {
  product_id: string;
  sku: string;
  name: string;
  product_type: string;
  current_stock: number;
  min_stock_level: number;
  reorder_quantity: number;
}

export interface GRNItem {
  id?: string;
  product_id: string;
  quantity_received: number | string;
  cost_price: number | string;
  commission?: number | string;
  ordered_quantity?: number | string;
  damaged_quantity?: number | string;
  batch_number?: string;
  unit_price?: number;
  selling_price?: number;
}

export const USD_EXCHANGE_RATE = 117.0;

export const formatPriceHelper = (priceInBDT: number, currency: "BDT" | "USD" = "BDT"): string => {
  return currency === "USD"
    ? "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2)
    : "৳" + priceInBDT.toFixed(2);
};

export const getLocalDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

export const api = {
  getBranches: async (): Promise<Branch[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/branches`);
    if (!response.ok) throw new Error("Failed to fetch branches");
    return await response.json();
  },
  createBranch: async (payload: any): Promise<Branch> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create warehouse");
    }
    return await response.json();
  },
  getSuppliers: async (): Promise<Supplier[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/suppliers`);
    if (!response.ok) throw new Error("Failed to fetch suppliers");
    return await response.json();
  },
  createSupplier: async (payload: any): Promise<Supplier> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/suppliers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create supplier");
    }
    return await response.json();
  },
  updateSupplier: async (id: string, payload: any): Promise<Supplier> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/suppliers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update supplier");
    }
    return await response.json();
  },
  getCategories: async (): Promise<any[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/categories`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return await response.json();
  },
  createCategory: async (payload: any): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create category");
    }
    return await response.json();
  },
  updateCategory: async (id: string, payload: any): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to update category");
    }
    return await response.json();
  },
  deleteCategory: async (id: string): Promise<void> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to delete category");
    }
  },
  getGRNs: async (): Promise<any[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/grn`);
    if (!response.ok) throw new Error("Failed to fetch GRN logs");
    return await response.json();
  },
  submitGRN: async (payload: any): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/grn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "GRN submission failed");
    }
    return await response.json();
  },
  getProducts: async (branchId?: string): Promise<Product[]> => {
    const url = branchId
      ? `${getApiBaseUrl()}/api/v1/inventory/products?branch_id=${branchId}`
      : `${getApiBaseUrl()}/api/v1/inventory/products`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch products");
    return await response.json();
  },
  getProductDetail: async (id: string): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/products/${id}`);
    if (!response.ok) throw new Error("Failed to fetch product details");
    return await response.json();
  },
  createProduct: async (payload: any): Promise<Product> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, is_active: true, initial_stock_quantity: 0 })
    });
    if (!response.ok) throw new Error("Failed to create product");
    return await response.json();
  },
  updateProduct: async (id: string, payload: any): Promise<Product> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to update product");
    return await response.json();
  },
  getTransfers: async (): Promise<Transfer[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/transfers`);
    if (!response.ok) throw new Error("Failed to fetch transfers");
    return await response.json();
  },
  createTransfer: async (payload: any): Promise<Transfer> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/transfers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.detail || "Transfer failed");
    }
    return await response.json();
  },
  getAdjustments: async (): Promise<Adjustment[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/adjustments`);
    if (!response.ok) throw new Error("Failed to fetch adjustments");
    return await response.json();
  },
  createAdjustment: async (payload: any): Promise<Adjustment> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/adjustments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to submit adjustment");
    return await response.json();
  },
  getStockList: async (params?: { supplier_name?: string; category_id?: string; branch_id?: string; stock_status?: string; search?: string }): Promise<any[]> => {
    let url = `${getApiBaseUrl()}/api/v1/inventory/stock-list`;
    const qs: string[] = [];
    if (params?.supplier_name) qs.push(`supplier_name=${encodeURIComponent(params.supplier_name)}`);
    if (params?.category_id) qs.push(`category_id=${params.category_id}`);
    if (params?.branch_id) qs.push(`branch_id=${params.branch_id}`);
    if (params?.stock_status) qs.push(`stock_status=${params.stock_status}`);
    if (params?.search) qs.push(`search=${encodeURIComponent(params.search)}`);
    if (qs.length) url += `?${qs.join("&")}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch stock list");
    return await response.json();
  },
  getStockListSummary: async (): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/stock-list/summary`);
    if (!response.ok) throw new Error("Failed to fetch stock list summary");
    return await response.json();
  },
  getValuationReport: async (): Promise<ValuationReport> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/reports/valuation`);
    if (!response.ok) throw new Error("Failed to fetch valuation");
    return await response.json();
  },
  getLowStockReport: async (): Promise<LowStockItem[]> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/reports/low-stock`);
    if (!response.ok) throw new Error("Failed to fetch low stock report");
    return await response.json();
  },
  getMovementReport: async (branchId?: string, productId?: string, type?: string): Promise<any[]> => {
    let url = `${getApiBaseUrl()}/api/v1/inventory/reports/movement?limit=200`;
    if (branchId) url += `&branch_id=${branchId}`;
    if (productId) url += `&product_id=${productId}`;
    if (type) url += `&movement_type=${type}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch movements");
    return await response.json();
  },
  getConsumptionReport: async (branchId?: string): Promise<any[]> => {
    let url = `${getApiBaseUrl()}/api/v1/inventory/reports/consumption`;
    if (branchId) url = `${url}?branch_id=${branchId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch consumption report");
    return await response.json();
  },
  getDeadStockReport: async (days: number = 30, branchId?: string): Promise<any[]> => {
    let url = `${getApiBaseUrl()}/api/v1/inventory/reports/dead-stock?days=${days}`;
    if (branchId) url += `&branch_id=${branchId}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch dead stock report");
    return await response.json();
  },
  getCompanyProfile: async (): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/company-profile`);
    if (!response.ok) throw new Error("Failed to fetch company profile");
    return await response.json();
  },
  updateCompanyProfile: async (payload: any): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/company-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update company profile");
    return await response.json();
  },
  getSetting: async (key: string): Promise<any> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/settings/${key}`);
    if (!response.ok) throw new Error("Failed to fetch settings");
    const data = await response.json();
    return JSON.parse(data.value);
  }
};

