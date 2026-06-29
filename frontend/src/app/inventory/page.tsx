"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active?: boolean;
}

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  is_head_office: boolean;
  branch_type: string;
}

interface Product {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  unit?: string | null;
  selling_price: number;
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

interface Transfer {
  id: string;
  product_id: string;
  from_branch_id: string;
  to_branch_id: string;
  quantity: number;
  status: string;
  reference?: string;
  created_at: string;
}

interface Adjustment {
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

interface ValuationDetail {
  product_id: string;
  sku: string;
  name: string;
  product_type: string;
  current_stock: number;
  unit_cost: number;
  total_value: number;
}

interface ValuationReport {
  total_valuation: number;
  total_items: number;
  valuation_details: ValuationDetail[];
}

interface LowStockItem {
  product_id: string;
  sku: string;
  name: string;
  product_type: string;
  current_stock: number;
  min_stock_level: number;
  reorder_quantity: number;
}

const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
};

const api = {
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
    if (!response.ok) throw new Error("Failed to create warehouse");
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
    if (!response.ok) throw new Error("Failed to create supplier");
    return await response.json();
  },
  updateSupplier: async (id: string, payload: any): Promise<Supplier> => {
    const response = await fetch(`${getApiBaseUrl()}/api/v1/inventory/suppliers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update supplier");
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
    if (!response.ok) throw new Error("Failed to create category");
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
  }
};

export default function InventoryControlPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("products");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const USD_EXCHANGE_RATE = 117.0;
  const formatPrice = (priceInBDT: number) => currency === "USD" ? "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2) : "৳" + priceInBDT.toFixed(2);

  // Custom types and CRUD modal states
  const [productTypes, setProductTypes] = useState<{key: string, label: string}[]>([]);
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [woodTypes, setWoodTypes] = useState<string[]>([]);
  const [showProductTypesModal, setShowProductTypesModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showMaterialTypesModal, setShowMaterialTypesModal] = useState(false);
  const [showWoodTypesModal, setShowWoodTypesModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceDiscount, setInvoiceDiscount] = useState("0");
  const [activeGRN, setActiveGRN] = useState<any>(null);
  const [grnSellingPrice, setGrnSellingPrice] = useState("");
  const [companyProfile, setCompanyProfile] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyContact, setCompanyContact] = useState("");
  const [catalogSubTab, setCatalogSubTab] = useState<"catalog" | "by_product_type" | "by_category">("catalog");

  const updateProductTypes = (newTypes: typeof productTypes) => {
    setProductTypes(newTypes);
    if (typeof window !== "undefined") {
      localStorage.setItem("product_types", JSON.stringify(newTypes));
    }
  };
  const updateMaterialTypes = (newMats: typeof materialTypes) => {
    setMaterialTypes(newMats);
    if (typeof window !== "undefined") {
      localStorage.setItem("material_types", JSON.stringify(newMats));
    }
  };
  const updateWoodTypesState = (newWoods: typeof woodTypes) => {
    setWoodTypes(newWoods);
    if (typeof window !== "undefined") {
      localStorage.setItem("wood_types", JSON.stringify(newWoods));
    }
  };

  // Notification state for low stock alerts
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsDismissed, setNotificationsDismissed] = useState(false);

  // Stock List view state
  const [stockListSearch, setStockListSearch] = useState("");
  const [stockListTypeFilter, setStockListTypeFilter] = useState("");
  const [stockListStatusFilter, setStockListStatusFilter] = useState("");

  // States
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [valuation, setValuation] = useState<ValuationReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  // New reports state
  const [movements, setMovements] = useState<any[]>([]);
  const [consumption, setConsumption] = useState<any[]>([]);
  const [deadStock, setDeadStock] = useState<any[]>([]);
  const [deadStockDays, setDeadStockDays] = useState(30);
  const [filterMovementBranch, setFilterMovementBranch] = useState("");
  const [filterMovementProduct, setFilterMovementProduct] = useState("");
  const [filterMovementType, setFilterMovementType] = useState("");
  const [filterConsumptionBranch, setFilterConsumptionBranch] = useState("");
  const [filterDeadStockBranch, setFilterDeadStockBranch] = useState("");
  const [reportsNestedTab, setReportsNestedTab] = useState<"valuation" | "movement" | "dead_stock" | "consumption">("valuation");

  // Product Catalog, Edit and Details Modal state variables
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [newProductSku, setNewProductSku] = useState("");
  const [newProductName, setNewProductName] = useState("");
  const [newProductUnit, setNewProductUnit] = useState("Pieces");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductType, setNewProductType] = useState("finished_product");
  const [newProductParentId, setNewProductParentId] = useState("");
  const [newProductCost, setNewProductCost] = useState("");
  const [newProductColor, setNewProductColor] = useState("");
  const [newProductSize, setNewProductSize] = useState("");
  const [newProductMinStock, setNewProductMinStock] = useState("");
  const [newProductMaxStock, setNewProductMaxStock] = useState("");
  const [newProductReorderQty, setNewProductReorderQty] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("");
  const [newProductSupplier, setNewProductSupplier] = useState("");
  const [newProductTaxRate, setNewProductTaxRate] = useState("");
  const [newProductImage, setNewProductImage] = useState("");
  const [newProductLength, setNewProductLength] = useState("");
  const [newProductWidth, setNewProductWidth] = useState("");
  const [newProductHeight, setNewProductHeight] = useState("");
  const [newProductThickness, setNewProductThickness] = useState("");
  const [newProductWeight, setNewProductWeight] = useState("");
  const [newProductMaterialType, setNewProductMaterialType] = useState("");
  const [newProductWoodType, setNewProductWoodType] = useState("");
  const [newProductBoardType, setNewProductBoardType] = useState("");

  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const [productSuccessMessage, setProductSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterParent, setFilterParent] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editSku, setEditSku] = useState("");
  const [editName, setEditName] = useState("");
  const [editUnit, setEditUnit] = useState("Pieces");
  const [editPrice, setEditPrice] = useState("");
  const [editType, setEditType] = useState("finished_product");
  const [editParentId, setEditParentId] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editCommission, setEditCommission] = useState("");
  const [editAdditionalCost, setEditAdditionalCost] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editSize, setEditSize] = useState("");
  const [editMinStock, setEditMinStock] = useState("");
  const [editMaxStock, setEditMaxStock] = useState("");
  const [editReorderQty, setEditReorderQty] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [editTaxRate, setEditTaxRate] = useState("");
  const [editImage, setEditImage] = useState("");
  const [editLength, setEditLength] = useState("");
  const [editWidth, setEditWidth] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editThickness, setEditThickness] = useState("");
  const [editWeight, setEditWeight] = useState("");
  const [editMaterialType, setEditMaterialType] = useState("");
  const [editWoodType, setEditWoodType] = useState("");
  const [editBoardType, setEditBoardType] = useState("");

  const [editActive, setEditActive] = useState(true);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  const [viewingProductDetail, setViewingProductDetail] = useState<any | null>(null);
  const [detailActiveTab, setDetailActiveTab] = useState<"overview" | "inventory" | "transactions">("overview");

  // GRN / Receiving States
  const [grns, setGrns] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [grnSupplierId, setGrnSupplierId] = useState("");
  const [grnSupplierName, setGrnSupplierName] = useState("");
  const [grnSupplierContact, setGrnSupplierContact] = useState("");
  const [grnSupplierPhone, setGrnSupplierPhone] = useState("");
  const [grnSupplierEmail, setGrnSupplierEmail] = useState("");
  const [grnSupplierAddress, setGrnSupplierAddress] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [grnQty, setGrnQty] = useState("");
  const [grnCostPrice, setGrnCostPrice] = useState("");
  const [grnCommission, setGrnCommission] = useState("");
  const [grnReceivingDate, setGrnReceivingDate] = useState(new Date().toISOString().split("T")[0]);
  const [grnOrderedQty, setGrnOrderedQty] = useState("");
  const [grnDamagedQty, setGrnDamagedQty] = useState("");
  const [grnBatchNumber, setGrnBatchNumber] = useState("");
  const [grnItemsList, setGrnItemsList] = useState<any[]>([
    {
      product_id: "",
      quantity_received: "",
      cost_price: "",
      selling_price: "",
      commission: "0",
      ordered_quantity: "",
      damaged_quantity: "0",
      batch_number: ""
    }
  ]);
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);
  const [grnSuccessMessage, setGrnSuccessMessage] = useState("");

  // Additional catalog filters
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterCatalogSupplier, setFilterCatalogSupplier] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("");
  const [filterStockStatus, setFilterStockStatus] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Time-based stock level lookup state
  const [historicalDate, setHistoricalDate] = useState(new Date().toISOString().split('T')[0]);

  // Forms
  const [warehouseName, setWarehouseName] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierActive, setSupplierActive] = useState(true);

  const [txProduct, setTxProduct] = useState("");
  const [txFrom, setTxFrom] = useState("");
  const [txTo, setTxTo] = useState("");
  const [txQty, setTxQty] = useState("");
  const [txRef, setTxRef] = useState("");

  const [adjProduct, setAdjProduct] = useState("");
  const [adjBranch, setAdjBranch] = useState("");
  const [adjCurrent, setAdjCurrent] = useState("");
  const [adjChange, setAdjChange] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjNotes, setAdjNotes] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    const email = localStorage.getItem("erp_email") || "";
    setUserRole(role);
    setUserEmail(email);

    if (role && !["owner", "manager", "stock_handler", "purchase_user", "production_user", "sales_user"].includes(role)) {
      router.push("/");
      return;
    }

    // Set default tab based on role
    if (role === "sales_user") {
      setActiveTab("stock_list");
    } else if (role === "purchase_user") {
      setActiveTab("receiving");
    } else if (role === "production_user") {
      setActiveTab("transfers");
    }

    // Load custom types from localStorage
    if (typeof window !== "undefined") {
      const storedTypes = localStorage.getItem("product_types");
      if (storedTypes) {
        setProductTypes(JSON.parse(storedTypes));
      } else {
        const defaults = [
          { key: "finished_product", label: "Finished Furniture Product" },
          { key: "raw_material", label: "Raw Material (Wood/Board)" },
          { key: "semi_finished_product", label: "Semi Finished Component" },
          { key: "consumable", label: "Consumable Item" },
          { key: "spare_parts", label: "Spare Parts" }
        ];
        setProductTypes(defaults);
        localStorage.setItem("product_types", JSON.stringify(defaults));
      }

      const storedMats = localStorage.getItem("material_types");
      if (storedMats) {
        setMaterialTypes(JSON.parse(storedMats));
      } else {
        const defaults = ["Solid Wood", "Plywood", "MDF", "HDF", "Particle Board", "Veneer", "Metal", "Glass", "Plastic"];
        setMaterialTypes(defaults);
        localStorage.setItem("material_types", JSON.stringify(defaults));
      }

      const storedWoods = localStorage.getItem("wood_types");
      if (storedWoods) {
        setWoodTypes(JSON.parse(storedWoods));
      } else {
        const defaults = ["Teak", "Oak", "Mahogany", "Pine", "Maple", "Walnut", "Cherry", "Rosewood", "Garjan", "Gamari"];
        setWoodTypes(defaults);
        localStorage.setItem("wood_types", JSON.stringify(defaults));
      }
    }

    const loadData = async () => {
      try {
        const [branchesData, suppliersData, productsData, transfersData, adjustmentsData, valData, lowData, categoriesData, grnsData] = await Promise.all([
          api.getBranches(),
          api.getSuppliers(),
          api.getProducts(),
          api.getTransfers(),
          api.getAdjustments(),
          api.getValuationReport(),
          api.getLowStockReport(),
          api.getCategories(),
          api.getGRNs(),
        ]);
        setBranches(branchesData);
        setSuppliers(suppliersData);
        setProducts(productsData);
        setTransfers(transfersData);
        setAdjustments(adjustmentsData);
        setValuation(valData);
        setLowStock(lowData);
        setCategories(categoriesData);
        setGrns(grnsData);

        try {
          const companyData = await api.getCompanyProfile();
          setCompanyProfile(companyData);
          setCompanyName(companyData.name || "");
          setCompanyAddress(companyData.address || "");
          setCompanyPhone(companyData.phone || "");
          setCompanyEmail(companyData.email || "");
          setCompanyContact(companyData.contact_person || "");
        } catch (companyErr) {
          console.error("Could not fetch company profile", companyErr);
        }

        if (branchesData.length > 0) {
          setTxFrom(branchesData[0].id);
          setTxTo(branchesData.length > 1 ? branchesData[1].id : branchesData[0].id);
          setAdjBranch(branchesData[0].id);
          setSelectedBranchId(branchesData[0].id);
        }
        if (productsData.length > 0) {
          setTxProduct(productsData[0].id);
          setAdjProduct(productsData[0].id);
          setSelectedProductId(productsData[0].id);
        }
        setInvoiceRef(`INV-GRN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`);
      } catch (err) {
        console.error("Failed to load inventory control data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [router]);

  useEffect(() => {
    const reloadProducts = async () => {
      try {
        const data = await api.getProducts(filterWarehouse || undefined);
        setProducts(data);
      } catch (err) {
        console.error("Failed to load products for warehouse", err);
      }
    };
    if (!loading) {
      reloadProducts();
    }
  }, [filterWarehouse, loading]);

  const fetchMovements = async () => {
    try {
      const data = await api.getMovementReport(
        filterMovementBranch || undefined,
        filterMovementProduct || undefined,
        filterMovementType || undefined
      );
      setMovements(data);
    } catch (err) {
      console.error("Failed to fetch movements", err);
    }
  };

  const fetchConsumption = async () => {
    try {
      const data = await api.getConsumptionReport(filterConsumptionBranch || undefined);
      setConsumption(data);
    } catch (err) {
      console.error("Failed to fetch consumption", err);
    }
  };

  const fetchDeadStock = async () => {
    try {
      const data = await api.getDeadStockReport(deadStockDays, filterDeadStockBranch || undefined);
      setDeadStock(data);
    } catch (err) {
      console.error("Failed to fetch dead stock", err);
    }
  };

  useEffect(() => {
    if (activeTab === "reports") {
      fetchMovements();
      fetchConsumption();
      fetchDeadStock();
    }
  }, [
    activeTab,
    filterMovementBranch,
    filterMovementProduct,
    filterMovementType,
    filterConsumptionBranch,
    filterDeadStockBranch,
    deadStockDays
  ]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductSku || !newProductName) return;

    setIsSubmittingProduct(true);
    setProductSuccessMessage("");

    try {
      const payload = {
        sku: newProductSku,
        name: newProductName,
        unit: newProductUnit,
        selling_price: 0.0, // default, updated on receive
        parent_id: newProductParentId || null,
        product_type: newProductType,
        color: newProductColor || null,
        size: newProductSize || null,
        purchase_cost: 0.0, // default, updated on receive
        min_stock_level: 0.0,
        max_stock_level: 0.0,
        reorder_quantity: 0.0,
        category_id: newProductCategory || null,
        supplier_id: null, // default, updated on receive
        tax_rate: 0.0,
        product_image: newProductImage || null,
        length: newProductLength ? parseFloat(newProductLength) : null,
        width: newProductWidth ? parseFloat(newProductWidth) : null,
        height: newProductHeight ? parseFloat(newProductHeight) : null,
        thickness: newProductThickness ? parseFloat(newProductThickness) : null,
        weight: newProductWeight ? parseFloat(newProductWeight) : null,
        material_type: newProductMaterialType || null,
        wood_type: newProductWoodType || null,
        board_type: newProductBoardType || null
      };

      const newProduct = await api.createProduct(payload);

      setProducts(prev => [...prev, newProduct]);
      setProductSuccessMessage(`✅ Product "${newProductName}" created successfully!`);

      // Reset
      setNewProductSku("");
      setNewProductName("");
      setNewProductColor("");
      setNewProductSize("");
      setNewProductCategory("");
      setNewProductImage("");
      setNewProductLength("");
      setNewProductWidth("");
      setNewProductHeight("");
      setNewProductThickness("");
      setNewProductWeight("");
      setNewProductMaterialType("");
      setNewProductWoodType("");
      setNewProductBoardType("");
      setNewProductParentId("");
      
      // Close modal on success
      setTimeout(() => {
        setShowAddProductModal(false);
        setProductSuccessMessage("");
      }, 1500);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to create product. SKU might already exist.");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditSku(p.sku);
    setEditName(p.name);
    setEditUnit(p.unit || "Pieces");
    setEditPrice(currency === "USD" ? (p.selling_price / USD_EXCHANGE_RATE).toFixed(2) : p.selling_price.toString());
    setEditType(p.product_type || "finished_product");
    setEditParentId(p.parent_id || "");
    setEditCost(p.purchase_cost ? (currency === "USD" ? (p.purchase_cost / USD_EXCHANGE_RATE).toFixed(2) : p.purchase_cost.toString()) : "");
    setEditCommission(p.commission != null ? p.commission.toString() : "0");
    setEditAdditionalCost(p.additional_cost != null ? p.additional_cost.toString() : "0");
    setEditColor(p.color || "");
    setEditSize(p.size || "");
    setEditMinStock(p.min_stock_level ? p.min_stock_level.toString() : "");
    setEditMaxStock(p.max_stock_level ? p.max_stock_level.toString() : "");
    setEditReorderQty(p.reorder_quantity ? p.reorder_quantity.toString() : "");
    setEditCategory(p.category_id || "");
    setEditSupplier(p.supplier_id || "");
    setEditTaxRate(p.tax_rate ? p.tax_rate.toString() : "");
    setEditImage(p.product_image || "");
    setEditLength(p.length ? p.length.toString() : "");
    setEditWidth(p.width ? p.width.toString() : "");
    setEditHeight(p.height ? p.height.toString() : "");
    setEditThickness(p.thickness ? p.thickness.toString() : "");
    setEditWeight(p.weight ? p.weight.toString() : "");
    setEditMaterialType(p.material_type || "");
    setEditWoodType(p.wood_type || "");
    setEditBoardType(p.board_type || "");
    setEditActive(p.is_active !== false);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editSku || !editName) return;
    setIsUpdatingProduct(true);
    try {
      const finalPrice = editPrice ? (currency === "USD" ? parseFloat(editPrice) * USD_EXCHANGE_RATE : parseFloat(editPrice)) : editingProduct.selling_price;
      const costValue = editCost ? (currency === "USD" ? parseFloat(editCost) * USD_EXCHANGE_RATE : parseFloat(editCost)) : (editingProduct.purchase_cost || 0.0);
      const payload = {
        sku: editSku,
        name: editName,
        unit: editUnit,
        selling_price: finalPrice,
        parent_id: editParentId || null,
        product_type: editType,
        color: editColor || null,
        size: editSize || null,
        purchase_cost: costValue,
        commission: editCommission ? parseFloat(editCommission) : 0.0,
        additional_cost: editAdditionalCost ? parseFloat(editAdditionalCost) : 0.0,
        min_stock_level: editMinStock ? parseFloat(editMinStock) : (editingProduct.min_stock_level || 0.0),
        max_stock_level: editMaxStock ? parseFloat(editMaxStock) : (editingProduct.max_stock_level || 0.0),
        reorder_quantity: editReorderQty ? parseFloat(editReorderQty) : (editingProduct.reorder_quantity || 0.0),
        category_id: editCategory || null,
        supplier_id: editSupplier || null,
        tax_rate: editTaxRate ? parseFloat(editTaxRate) : (editingProduct.tax_rate || 0.0),
        product_image: editImage || null,
        length: editLength ? parseFloat(editLength) : null,
        width: editWidth ? parseFloat(editWidth) : null,
        height: editHeight ? parseFloat(editHeight) : null,
        thickness: editThickness ? parseFloat(editThickness) : null,
        weight: editWeight ? parseFloat(editWeight) : null,
        material_type: editMaterialType || null,
        wood_type: editWoodType || null,
        board_type: editBoardType || null,
        is_active: editActive
      };

      const updated = await api.updateProduct(editingProduct.id, payload);
      setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
      setEditingProduct(null);
      alert("✅ Product updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update product");
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleOpenProductDetail = async (p: Product) => {
    try {
      setViewingProductDetail(null); // Clear previous
      const detail = await api.getProductDetail(p.id);
      setViewingProductDetail(detail);
      setDetailActiveTab("overview");
    } catch (err) {
      alert("Failed to load product details");
    }
  };

  const generateInvoiceRef = () => `INV-GRN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields with clear user feedback
    if (!selectedBranchId) { alert("Please select a destination warehouse."); return; }
    if (!grnSupplierName || grnSupplierName.trim().length < 2) {
      alert("Please select a supplier company or enter a Supplier Name (at least 2 characters).");
      return;
    }
    
    // Validate items list
    if (grnItemsList.length === 0) {
      alert("Please add at least one product item to receive.");
      return;
    }

    for (let i = 0; i < grnItemsList.length; i++) {
      const item = grnItemsList[i];
      if (!item.product_id) {
        alert(`Please select a catalog product for item #${i + 1}.`);
        return;
      }
      if (!item.quantity_received || parseFloat(item.quantity_received) <= 0) {
        alert(`Please enter a valid received quantity for item #${i + 1}.`);
        return;
      }
      if (!item.cost_price || parseFloat(item.cost_price) <= 0) {
        alert(`Please enter a valid unit price for item #${i + 1}.`);
        return;
      }
    }

    const resolvedSupplierName = grnSupplierName.trim();

    setIsSubmittingGRN(true);
    setGrnSuccessMessage("");

    try {
      const payloadItems = grnItemsList.map(item => {
        const rawPrice = parseFloat(item.cost_price);
        const commissionPct = parseFloat(item.commission || "0");
        const netCost = rawPrice * (1 - commissionPct / 100);
        const finalCost = currency === "USD" ? netCost * USD_EXCHANGE_RATE : netCost;

        const finalSellingPrice = item.selling_price
          ? (currency === "USD" ? parseFloat(item.selling_price) * USD_EXCHANGE_RATE : parseFloat(item.selling_price))
          : undefined;

        return {
          product_id: item.product_id,
          quantity_received: parseFloat(item.quantity_received),
          cost_price: finalCost,
          ordered_quantity: item.ordered_quantity ? parseFloat(item.ordered_quantity) : parseFloat(item.quantity_received),
          damaged_quantity: item.damaged_quantity ? parseFloat(item.damaged_quantity) : 0.0,
          batch_number: item.batch_number || undefined,
          selling_price: finalSellingPrice,
          unit_price: currency === "USD" ? rawPrice * USD_EXCHANGE_RATE : rawPrice,
          commission: commissionPct
        };
      });

      const payload = {
        branch_id: selectedBranchId,
        supplier_name: resolvedSupplierName,
        supplier_contact: grnSupplierContact || undefined,
        supplier_phone: grnSupplierPhone || undefined,
        supplier_email: grnSupplierEmail || undefined,
        supplier_address: grnSupplierAddress || undefined,
        invoice_reference: invoiceRef || undefined,
        receiving_date: grnReceivingDate || undefined,
        items: payloadItems
      };

      const newGRN = await api.submitGRN(payload);
      setGrns(prev => [newGRN, ...prev]);

      setGrnSuccessMessage(`✅ Successfully received ${grnItemsList.length} items from ${resolvedSupplierName}!`);
      
      // Auto open Invoice Preview Modal
      setActiveGRN(newGRN);
      const grossVal = (newGRN.items || []).reduce((sum: number, it: any) => sum + (it.quantity_received * (it.unit_price || it.cost_price)), 0);
      const diffVal = grossVal - newGRN.total_amount;
      setInvoiceDiscount(diffVal > 0.01 ? diffVal.toFixed(2) : "0");
      setShowInvoiceModal(true);

      // Reset
      setGrnSupplierId("");
      setGrnSupplierName("");
      setGrnSupplierContact("");
      setGrnSupplierPhone("");
      setGrnSupplierEmail("");
      setGrnSupplierAddress("");
      setGrnQty("");
      setGrnCostPrice("");
      setGrnSellingPrice("");
      setGrnCommission("");
      setGrnOrderedQty("");
      setGrnDamagedQty("");
      setGrnBatchNumber("");
      setGrnReceivingDate(new Date().toISOString().split("T")[0]);
      setInvoiceRef(generateInvoiceRef());
      setGrnItemsList([
        {
          product_id: "",
          quantity_received: "",
          cost_price: "",
          selling_price: "",
          commission: "0",
          ordered_quantity: "",
          damaged_quantity: "0",
          batch_number: ""
        }
      ]);

      // Reload products, valuation & reports to show latest stocks & values
      const [updatedProducts, val, low] = await Promise.all([
        api.getProducts(),
        api.getValuationReport(),
        api.getLowStockReport(),
        api.getAdjustments()
      ]);
      setProducts(updatedProducts);
      setValuation(val);
      setLowStock(low);
      setAdjustments(adj => {
        // Adjustments might have changed backend calculations, so reload
        return adj;
      });
      // Close GRN form modal
      setShowGRNModal(false);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to submit GRN. Please check all fields and try again.");
    } finally {
      setIsSubmittingGRN(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!activeGRN) return;
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    const whName = branches.find(b => b.id === activeGRN.branch_id)?.name || "Warehouse";
    const dateObj = new Date(activeGRN.created_at || activeGRN.receiving_date);
    const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Build items rows
    const itemsHtml = (activeGRN.items || []).map((item: any) => {
      const p = products.find(prod => prod.id === item.product_id);
      const unitPriceVal = item.unit_price || item.cost_price;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: left; font-size: 13px;">${p?.name || "Unknown Product"}</td>
          <td style="padding: 12px; text-align: left; font-size: 13px; font-family: monospace;">${p?.sku || "—"}</td>
          <td style="padding: 12px; text-align: center; font-size: 13px;">${item.ordered_quantity || item.quantity_received}</td>
          <td style="padding: 12px; text-align: center; font-size: 13px; font-weight: bold; color: #16a34a;">${item.quantity_received}</td>
          <td style="padding: 12px; text-align: right; font-size: 13px;">${formatPrice(unitPriceVal)}</td>
          <td style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #1e293b;">${formatPrice(item.quantity_received * unitPriceVal)}</td>
        </tr>
      `;
    }).join("");

    const grossTotal = (activeGRN.items || []).reduce((sum: number, item: any) => sum + (item.quantity_received * (item.unit_price || item.cost_price)), 0);
    const discountAmount = parseFloat(invoiceDiscount || "0");
    const netPayable = Math.max(0, grossTotal - discountAmount);
    let summaryRowsHtml = "";
    if (discountAmount > 0.01) {
      summaryRowsHtml += `
        <tr style="background-color: #f8fafc; font-weight: 500;">
          <td colspan="4" style="padding: 10px 12px; text-align: right; font-size: 13px; color: #475569;">Gross Subtotal:</td>
          <td colspan="2" style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: bold;">${formatPrice(grossTotal)}</td>
        </tr>
        <tr style="background-color: #f8fafc; font-weight: 500; color: #c2410c;">
          <td colspan="4" style="padding: 10px 12px; text-align: right; font-size: 13px;">Less: Commission / Discounts:</td>
          <td colspan="2" style="padding: 10px 12px; text-align: right; font-size: 13px; font-weight: bold;">− ${formatPrice(discountAmount)}</td>
        </tr>
      `;
    }
    summaryRowsHtml += `
      <tr class="total-row">
        <td colspan="4" style="padding: 16px 12px; text-align: right; font-size: 15px;">Grand Total (Net Payable):</td>
        <td colspan="2" style="padding: 16px 12px; text-align: right; font-size: 18px; color: #1e3a8a;">${formatPrice(netPayable)}</td>
      </tr>
    `;

    const html = `
      <html>
        <head>
          <title>Invoice - ${activeGRN.invoice_reference}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
            .company-info p { margin: 4px 0 0 0; font-size: 14px; color: #64748b; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0; font-size: 20px; color: #334155; }
            .invoice-details p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
            .bill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .bill-box { background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 16px; border-radius: 12px; }
            .bill-box h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
            .bill-box p { margin: 4px 0; font-size: 14px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; font-size: 11px; text-transform: uppercase; padding: 12px; text-align: left; }
            .total-row { border-top: 2px solid #cbd5e1; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 60px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${companyName || "Manor Furniture"}</h1>
              <p>${companyAddress || "Bozlur Mor, Kushita"}</p>
              <p>Contact: ${companyContact ? `${companyContact} (${companyEmail || companyPhone})` : (companyEmail || "accounts@manorfurniture.com")}</p>
            </div>
            <div class="invoice-details">
              <h2>PURCHASE INVOICE</h2>
              <p><strong>Invoice Ref:</strong> ${activeGRN.invoice_reference || "—"}</p>
              <p><strong>Date Received:</strong> ${dateStr}</p>
            </div>
          </div>
          <div class="bill-grid">
            <div class="bill-box">
              <h3>Supplier Details</h3>
              <p><strong>Company:</strong> ${activeGRN.supplier_name}</p>
              ${activeGRN.supplier_contact ? `<p><strong>Contact Person:</strong> ${activeGRN.supplier_contact}</p>` : ""}
              ${activeGRN.supplier_phone || activeGRN.supplier_email ? `<p><strong>Contact Info:</strong> ${activeGRN.supplier_phone || ""} ${activeGRN.supplier_email ? `| ${activeGRN.supplier_email}` : ""}</p>` : ""}
              ${activeGRN.supplier_address ? `<p><strong>Address:</strong> ${activeGRN.supplier_address}</p>` : ""}
            </div>
            <div class="bill-box">
              <h3>Delivery Details</h3>
              <p><strong>Warehouse Destination:</strong> ${whName}</p>
              <p><strong>Status:</strong> Completed / Received</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Product</th>
                <th style="text-align: left;">SKU</th>
                <th style="text-align: center;">Ordered</th>
                <th style="text-align: center;">Received</th>
                <th style="text-align: right;">Unit Price (DP)</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${summaryRowsHtml}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 80px;">
            <div style="text-align: center; width: 200px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px; color: #64748b;">
              Authorized Signature
            </div>
            <div style="text-align: center; width: 200px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px; color: #64748b;">
              Supplier Acknowledgment
            </div>
          </div>
          <div class="footer">
            Generated by ${companyName || "Manor Furniture"} ERP System &bull; ${new Date().toLocaleString()}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleEmailInvoice = () => {
    if (!activeGRN) return;
    const grossTotal = (activeGRN.items || []).reduce((sum: number, item: any) => sum + (item.quantity_received * (item.unit_price || item.cost_price)), 0);
    const discountAmount = parseFloat(invoiceDiscount || "0");
    const netPayable = Math.max(0, grossTotal - discountAmount);
    const subject = encodeURIComponent(`Purchase Invoice Reference: ${activeGRN.invoice_reference || "—"}`);
    const body = encodeURIComponent(
      `Dear Supplier,\n\nWe have successfully received the delivery for invoice reference ${activeGRN.invoice_reference || "—"} at Manor Furniture.\n\nTotal Received Amount: ${formatPrice(netPayable)}\nDate Received: ${new Date(activeGRN.receiving_date || activeGRN.created_at).toLocaleDateString()}\n\nPlease find the detailed invoice in the system portal.\n\nBest regards,\nManor Furniture`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleUpdateCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: companyName,
        address: companyAddress,
        phone: companyPhone,
        email: companyEmail,
        contact_person: companyContact
      };
      const updated = await api.updateCompanyProfile(payload);
      setCompanyProfile(updated);
      setShowCompanyModal(false);
      alert("✅ Company profile updated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to update company profile");
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName) return;
    try {
      const newCat = await api.createCategory({ name: newCategoryName });
      setCategories(prev => [...prev, newCat]);
      setNewCategoryName("");
      alert("✅ Category created successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create category");
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouseName) return;
    try {
      const payload = { name: warehouseName, address: warehouseAddress, branch_type: "warehouse" };
      const newB = await api.createBranch(payload);
      setBranches(prev => [...prev, newB]);
      setWarehouseName("");
      setWarehouseAddress("");
      alert("✅ Warehouse created successfully!");
    } catch (err) {
      alert("Failed to create warehouse");
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName) return;
    try {
      const payload: any = {
        name: supplierName,
        contact_person: supplierContact,
        phone: supplierPhone,
        email: supplierEmail,
        address: supplierAddress,
        is_active: supplierActive
      };
      if (editingSupplier) {
        const updated = await api.updateSupplier(editingSupplier.id, payload);
        setSuppliers(prev => prev.map(s => s.id === updated.id ? updated : s));
        setEditingSupplier(null);
        setSupplierActive(true);
        alert("✅ Supplier updated successfully!");
      } else {
        const newS = await api.createSupplier(payload);
        setSuppliers(prev => [...prev, newS]);
        alert("✅ Supplier registered successfully!");
      }
      setSupplierName("");
      setSupplierContact("");
      setSupplierPhone("");
      setSupplierEmail("");
      setSupplierAddress("");
    } catch (err) {
      alert("Failed to save supplier info");
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txProduct || !txFrom || !txTo || !txQty) return;
    if (txFrom === txTo) {
      alert("Source and Destination warehouses must be different!");
      return;
    }
    try {
      const payload = {
        product_id: txProduct,
        from_branch_id: txFrom,
        to_branch_id: txTo,
        quantity: parseFloat(txQty),
        reference: txRef,
      };
      const newTx = await api.createTransfer(payload);
      setTransfers(prev => [newTx, ...prev]);
      setTxQty("");
      setTxRef("");

      // Reload valuation & low stock report to show dynamic changes
      const [val, low] = await Promise.all([api.getValuationReport(), api.getLowStockReport()]);
      setValuation(val);
      setLowStock(low);

      alert("✅ Inventory transfer complete!");
    } catch (err: any) {
      alert(err.message || "Failed to transfer inventory");
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProduct || !adjBranch || !adjChange || !adjReason) return;
    try {
      const payload = {
        product_id: adjProduct,
        branch_id: adjBranch,
        current_quantity: parseFloat(adjCurrent || "0"),
        adjusted_quantity: parseFloat(adjChange),
        reason: adjReason,
        notes: adjNotes,
        approved_by: userEmail || "Self",
      };
      const newAdj = await api.createAdjustment(payload);
      setAdjustments(prev => [newAdj, ...prev]);
      setAdjChange("");
      setAdjReason("");
      setAdjNotes("");
      setAdjCurrent("");

      const [val, low] = await Promise.all([api.getValuationReport(), api.getLowStockReport()]);
      setValuation(val);
      setLowStock(low);

      alert("✅ Adjustment logged successfully!");
    } catch (err) {
      alert("Failed to register stock adjustment");
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-400 font-semibold animate-pulse">Loading Inventory Control Panel...</div>
      </div>
    );
  }

  const activeWarehouses = branches.filter(b => b.branch_type === "warehouse");

  // Role-based tab visibility
  const allTabs = [
    { id: "stock_list", label: "📋 Stock List", roles: ["owner", "manager", "stock_handler", "purchase_user", "production_user", "sales_user"] },
    { id: "products", label: "Manage Products", roles: ["owner", "manager", "stock_handler"] },
    { id: "receiving", label: "Stock Receiving", roles: ["owner", "manager", "stock_handler", "purchase_user"] },
    { id: "warehouses", label: "Warehouses", roles: ["owner", "manager"] },
    { id: "suppliers", label: "Suppliers", roles: ["owner", "manager", "purchase_user"] },
    { id: "transfers", label: "Stock Transfers", roles: ["owner", "manager", "stock_handler", "production_user"] },
    { id: "adjustments", label: "Adjustments Log", roles: ["owner", "manager"] },
    { id: "reports", label: "Valuation & Reports", roles: ["owner", "manager", "stock_handler"] }
  ];
  const visibleTabs = allTabs.filter(tab => !userRole || tab.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Low Stock Notification Banner */}
      {lowStock.length > 0 && !notificationsDismissed && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 animate-pulse-once">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">🚨</span>
            <div>
              <span className="font-bold text-red-800 text-sm">{lowStock.length} product{lowStock.length > 1 ? "s" : ""} below minimum stock level!</span>
              <span className="ml-2 text-red-600 text-xs">
                {lowStock.slice(0, 3).map(l => l.name).join(", ")}{lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("reports")}
              className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition whitespace-nowrap"
            >
              View Alerts
            </button>
            <button
              onClick={() => setNotificationsDismissed(true)}
              className="text-red-400 hover:text-red-700 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Tabs + Notification Bell */}
      <div className="flex items-center justify-between mb-8 border-b pb-px">
        <div className="flex space-x-1 overflow-x-auto">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition-all whitespace-nowrap text-sm ${activeTab === tab.id
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Notification Bell */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0 relative">
          {/* Company Profile Edit Button */}
          <button
            onClick={() => {
              if (companyProfile) {
                setCompanyName(companyProfile.name || "");
                setCompanyAddress(companyProfile.address || "");
                setCompanyPhone(companyProfile.phone || "");
                setCompanyEmail(companyProfile.email || "");
                setCompanyContact(companyProfile.contact_person || "");
              }
              setShowCompanyModal(true);
            }}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-bold border border-gray-200 shadow-sm"
            title="Update Company Profile"
          >
            🏢 Company Profile
          </button>

          <button
            onClick={() => { setShowNotifications(!showNotifications); setNotificationsDismissed(true); }}
            className={`relative p-2.5 rounded-xl transition ${lowStock.length > 0 ? "bg-red-50 hover:bg-red-100 text-red-600" : "bg-gray-100 hover:bg-gray-200 text-gray-500"}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {lowStock.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                {lowStock.length > 9 ? "9+" : lowStock.length}
              </span>
            )}
          </button>
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                <span className="font-bold text-gray-800 text-sm">Low Stock Alerts</span>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">{lowStock.length} items</span>
              </div>
              {lowStock.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">✓ All items above safety thresholds</div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y">
                  {lowStock.map(l => (
                    <div key={l.product_id} className="p-3 hover:bg-red-50 transition">
                      <div className="font-semibold text-gray-800 text-xs">{l.name}</div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                        <span>SKU: {l.sku}</span>
                        <span className="text-red-600 font-bold">Stock: {l.current_stock} (Min: {l.min_stock_level})</span>
                      </div>
                      <div className="mt-1 text-[10px] text-blue-600">Reorder: {l.reorder_quantity} units needed</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 border-t bg-gray-50">
                <button onClick={() => { setActiveTab("reports"); setShowNotifications(false); }} className="w-full text-xs text-blue-600 font-bold hover:underline">
                  View Full Low Stock Report →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Panels */}

      {/* ────────────── STOCK LIST TAB ────────────── */}
      {activeTab === "stock_list" && (() => {
        // Compute stock status for each product
        const getStockStatus = (p: Product) => {
          const stock = p.current_stock ?? 0;
          const min = p.min_stock_level ?? 0;
          const max = p.max_stock_level ?? Infinity;
          if (stock <= 0) return "out_of_stock";
          if (stock <= min) return "low_stock";
          if (max !== Infinity && stock > max) return "overstock";
          return "available";
        };

        const statusConfig: Record<string, { label: string; color: string }> = {
          available: { label: "Available", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
          low_stock: { label: "Low Stock", color: "bg-amber-100 text-amber-800 border-amber-200" },
          out_of_stock: { label: "Out of Stock", color: "bg-red-100 text-red-800 border-red-200" },
          overstock: { label: "Overstock", color: "bg-blue-100 text-blue-800 border-blue-200" }
        };

        const stockListFiltered = products.filter(p => {
          const matchesSearch = !stockListSearch ||
            p.name.toLowerCase().includes(stockListSearch.toLowerCase()) ||
            p.sku.toLowerCase().includes(stockListSearch.toLowerCase()) ||
            (p.barcode || "").toLowerCase().includes(stockListSearch.toLowerCase());
          const matchesType = !stockListTypeFilter || p.product_type === stockListTypeFilter;
          const matchesStatus = !stockListStatusFilter || getStockStatus(p) === stockListStatusFilter;
          return matchesSearch && matchesType && matchesStatus;
        });

        const totalStockValue = stockListFiltered.reduce((sum, p) => {
          const cost = p.average_cost ?? p.purchase_cost ?? 0;
          return sum + (p.current_stock ?? 0) * cost;
        }, 0);

        return (
          <div className="space-y-6">
            {/* Summary KPI bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Products", value: stockListFiltered.length, color: "blue" },
                { label: "Total Stock Units", value: stockListFiltered.reduce((s, p) => s + (p.current_stock ?? 0), 0).toLocaleString(), color: "indigo" },
                { label: "Portfolio Value", value: formatPrice(totalStockValue), color: "emerald" },
                { label: "Low / Out of Stock", value: stockListFiltered.filter(p => ["low_stock", "out_of_stock"].includes(getStockStatus(p))).length, color: "red" }
              ].map(kpi => (
                <div key={kpi.label} className={`bg-white rounded-xl p-4 border shadow-sm border-l-4 border-l-${kpi.color}-400`}>
                  <div className={`text-xs font-bold text-${kpi.color}-600 uppercase mb-1`}>{kpi.label}</div>
                  <div className="text-2xl font-black text-gray-800">{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <input
                    type="text"
                    placeholder="🔍 Search by name, SKU or barcode..."
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={stockListSearch}
                    onChange={e => setStockListSearch(e.target.value)}
                  />
                </div>
                <select className="p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={stockListTypeFilter} onChange={e => setStockListTypeFilter(e.target.value)}>
                  <option value="">All Product Types</option>
                  <option value="raw_material">Raw Material</option>
                  <option value="finished_product">Finished Product</option>
                  <option value="semi_finished">Semi-Finished</option>
                  <option value="consumable">Consumable</option>
                  <option value="spare_parts">Spare Parts</option>
                </select>
                <select className="p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={stockListStatusFilter} onChange={e => setStockListStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="available">✅ Available</option>
                  <option value="low_stock">⚠️ Low Stock</option>
                  <option value="out_of_stock">🔴 Out of Stock</option>
                  <option value="overstock">🔵 Overstock</option>
                </select>
              </div>
            </div>

            {/* Full Enterprise Stock Table */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-gray-800">Inventory Stock List ({stockListFiltered.length} products)</h3>
                <span className="text-xs text-gray-500">Prices in {currency} · Last refreshed on load</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {[
                        "Product", "SKU", "Type", "Category",
                        "Current Stock", "Available Qty", "Reserved Qty", "Incoming Qty",
                        "Purchase Cost", "Avg Cost", "Stock Value",
                        "Warehouse", "Status", "Last Updated"
                      ].map(h => (
                        <th key={h} className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {stockListFiltered.length === 0 ? (
                      <tr>
                        <td colSpan={14} className="py-16 text-center text-gray-400 text-sm">No products match your filters.</td>
                      </tr>
                    ) : stockListFiltered.map(p => {
                      const status = getStockStatus(p);
                      const conf = statusConfig[status];
                      const avgCost = p.average_cost ?? p.purchase_cost ?? 0;
                      const stockValue = (p.current_stock ?? 0) * avgCost;
                      // Reserved = 0, Incoming = qty from pending GRNs (we approximate as 0 without a dedicated API)
                      const availableQty = Math.max(0, p.current_stock ?? 0);
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition cursor-pointer" onClick={() => setViewingProductDetail(p)}>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-gray-800 text-xs whitespace-nowrap">{p.name}</div>
                          </td>
                          <td className="px-3 py-3 text-xs font-mono text-gray-600 whitespace-nowrap">{p.sku}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">{(p.product_type || "").replace("_", " ")}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">—</td>
                          <td className={`px-3 py-3 text-xs font-bold whitespace-nowrap ${status === "low_stock" || status === "out_of_stock" ? "text-red-700" : "text-gray-800"}`}>
                            {p.current_stock ?? 0} {p.unit || ""}
                          </td>
                          <td className="px-3 py-3 text-xs text-emerald-700 font-semibold whitespace-nowrap">{availableQty} {p.unit || ""}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">0</td>
                          <td className="px-3 py-3 text-xs text-blue-600 whitespace-nowrap">—</td>
                          <td className="px-3 py-3 text-xs whitespace-nowrap">{p.purchase_cost != null ? formatPrice(p.purchase_cost) : "—"}</td>
                          <td className="px-3 py-3 text-xs font-semibold text-indigo-700 whitespace-nowrap">
                            {avgCost > 0 ? formatPrice(avgCost) : "—"}
                          </td>
                          <td className="px-3 py-3 text-xs font-bold text-gray-900 whitespace-nowrap">{stockValue > 0 ? formatPrice(stockValue) : "—"}</td>
                          <td className="px-3 py-3 text-xs text-gray-500 whitespace-nowrap">
                            {branches.find(b => b.branch_type === "warehouse")?.name || "—"}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${conf.color}`}>{conf.label}</span>
                          </td>
                          <td className="px-3 py-3 text-[10px] text-gray-400 whitespace-nowrap">
                            {new Date().toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {activeTab === "products" && (
        <div className="space-y-6">
          {/* Header Row with CRUD Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Product Management Catalog</h2>
              <p className="text-xs text-gray-500 mt-1">Configure your templates, categories, and wood types</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowProductTypesModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all"
              >
                ⚙️ Manage Types
              </button>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
              >
                ⚙️ Manage Categories
              </button>
              <button
                type="button"
                onClick={() => setShowMaterialTypesModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
              >
                ⚙️ Manage Material Types
              </button>
              <button
                type="button"
                onClick={() => setShowWoodTypesModal(true)}
                className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
              >
                ⚙️ Manage Wood Types
              </button>
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="text-lg">+</span> Add New Product
              </button>
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div className="flex space-x-1 border-b pb-px bg-white p-1 rounded-xl border max-w-fit shadow-sm">
            <button
              onClick={() => setCatalogSubTab("catalog")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${catalogSubTab === "catalog" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              📦 Current Catalog
            </button>
            <button
              onClick={() => setCatalogSubTab("by_product_type")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${catalogSubTab === "by_product_type" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              🏷 By Product Type
            </button>
            <button
              onClick={() => setCatalogSubTab("by_category")}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${catalogSubTab === "by_category" ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
            >
              📁 By Category
            </button>
          </div>

          {/* Catalog Tab View */}
          {catalogSubTab === "catalog" && (() => {
            const filteredCatalog = products.filter(p => {
              const matchesSearch = searchQuery === "" ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

              const matchesType = filterType === "" || p.product_type === filterType;
              const matchesCatalogSupplier = filterCatalogSupplier === "" || p.supplier_id === filterCatalogSupplier;

              return matchesSearch && matchesType && matchesCatalogSupplier;
            });

            return (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                {/* Search & Filters */}
                <div className="p-4 border-b bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by product name/code..."
                      className="p-2.5 border rounded-lg text-sm w-64 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                    />
                    <select
                      className="p-2.5 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700"
                      value={filterCatalogSupplier}
                      onChange={(e) => setFilterCatalogSupplier(e.target.value)}
                    >
                      <option value="">All Suppliers</option>
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <select
                      className="p-2.5 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                    >
                      <option value="">All Product Types</option>
                      {productTypes.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-bold">Currency:</span>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border">
                      <button type="button" onClick={() => setCurrency("BDT")} className={`px-2 py-1 text-xs font-bold rounded ${currency === "BDT" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"}`}>BDT</button>
                      <button type="button" onClick={() => setCurrency("USD")} className={`px-2 py-1 text-xs font-bold rounded ${currency === "USD" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"}`}>USD</button>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Product Name</th>
                        <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Supplier</th>
                        <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Product Code (SKU)</th>
                        <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Product Type</th>
                        <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Category</th>
                        <th className="px-4 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Stock Level(QTY)</th>
                        <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Unit</th>
                        <th className="px-4 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Unit Price</th>
                        <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Commission(%)</th>
                        <th className="px-4 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Purchased Price</th>
                        <th className="px-4 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Additional Cost</th>
                        <th className="px-4 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Selling Price</th>
                        <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                        <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCatalog.length === 0 ? (
                        <tr>
                          <td colSpan={14} className="py-16 text-center text-gray-400">No products found matching filters.</td>
                        </tr>
                      ) : filteredCatalog.map(p => {
                        const stock = p.current_stock ?? 0;
                        const min = p.min_stock_level ?? 0;
                        const max = p.max_stock_level ?? Infinity;
                        
                        let badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200";
                        let statusText = "Available";
                        if (stock <= 0) {
                          badgeColor = "bg-red-100 text-red-800 border-red-200";
                          statusText = "Out of Stock";
                        } else if (stock <= min) {
                          badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
                          statusText = "Low Stock";
                        } else if (max !== Infinity && stock > max) {
                          badgeColor = "bg-blue-100 text-blue-800 border-blue-200";
                          statusText = "Overstock";
                        }

                        const typeLabel = productTypes.find(t => t.key === p.product_type)?.label || p.product_type || "—";
                        const supplierNameStr = suppliers.find(s => s.id === p.supplier_id)?.name || "—";
                        const unitPrice = p.purchase_cost || 0.0;
                        const commVal = p.commission || 0.0;
                        const purchasePrice = unitPrice * (1 - commVal / 100);
                        const addCost = p.additional_cost || 0.0;

                        return (
                          <tr key={p.id} className="hover:bg-blue-50/20 transition cursor-pointer" onClick={() => handleOpenProductDetail(p)}>
                            <td className="px-4 py-3.5 font-semibold text-gray-900">{p.name}</td>
                            <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{supplierNameStr}</td>
                            <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-750 whitespace-nowrap">{p.sku}</td>
                            <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{typeLabel}</td>
                            <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                              {categories.find(c => c.id === p.category_id)?.name || "—"}
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-gray-900">{stock}</td>
                            <td className="px-4 py-3.5 text-xs text-gray-500">{p.unit || "—"}</td>
                            <td className="px-4 py-3.5 text-right font-bold text-gray-700">{formatPrice(unitPrice)}</td>
                            <td className="px-4 py-3.5 text-center text-xs font-semibold text-gray-600">{commVal}%</td>
                            <td className="px-4 py-3.5 text-right font-bold text-emerald-700">{formatPrice(purchasePrice)}</td>
                            <td className="px-4 py-3.5 text-right font-semibold text-orange-600">{formatPrice(addCost)}</td>
                            <td className="px-4 py-3.5 text-right font-bold text-slate-800">{formatPrice(p.selling_price || 0.0)}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenProductDetail(p)}
                                  className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-md text-xs transition"
                                >
                                  Details
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProduct(p)}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-md text-xs transition"
                                >
                                  Edit
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Product Type Summary View */}
          {catalogSubTab === "by_product_type" && (() => {
            const productTypeStats = productTypes.map(type => {
              const typeProds = products.filter(p => p.product_type === type.key);
              const totalStock = typeProds.reduce((sum, p) => sum + (p.current_stock || 0), 0);
              const totalValue = typeProds.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.average_cost || p.purchase_cost || 0)), 0);
              return {
                key: type.key,
                label: type.label,
                count: typeProds.length,
                totalStock,
                totalValue
              };
            });

            return (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Summary By Product Type</h3>
                  <span className="text-xs text-gray-500">Totals calculated from active catalog records</span>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Product Type</th>
                      <th className="px-6 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unique Products</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Stock Units</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Cost Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {productTypeStats.map(stat => (
                      <tr key={stat.key} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-800">{stat.label}</td>
                        <td className="px-6 py-4 text-center font-semibold text-blue-600">{stat.count}</td>
                        <td className="px-6 py-4 text-right font-black text-gray-800">{stat.totalStock}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-700">{formatPrice(stat.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Category Summary View */}
          {catalogSubTab === "by_category" && (() => {
            const categoryStats = [
              ...categories.map(cat => {
                const catProds = products.filter(p => p.category_id === cat.id);
                const totalStock = catProds.reduce((sum, p) => sum + (p.current_stock || 0), 0);
                const totalValue = catProds.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.average_cost || p.purchase_cost || 0)), 0);
                return {
                  name: cat.name,
                  count: catProds.length,
                  totalStock,
                  totalValue
                };
              }),
              (() => {
                const uncategorizedProds = products.filter(p => !p.category_id);
                const totalStock = uncategorizedProds.reduce((sum, p) => sum + (p.current_stock || 0), 0);
                const totalValue = uncategorizedProds.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.average_cost || p.purchase_cost || 0)), 0);
                return {
                  name: "Uncategorized",
                  count: uncategorizedProds.length,
                  totalStock,
                  totalValue
                };
              })()
            ];

            return (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800">Summary By Category</h3>
                  <span className="text-xs text-gray-500">Totals calculated from active catalog records</span>
                </div>
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unique Products</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Stock Units</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Cost Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {categoryStats.map((stat, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4 font-semibold text-gray-800">{stat.name}</td>
                        <td className="px-6 py-4 text-center font-semibold text-blue-600">{stat.count}</td>
                        <td className="px-6 py-4 text-right font-black text-gray-800">{stat.totalStock}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-700">{formatPrice(stat.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {activeTab === "receiving" && (() => {
        // Filter and Sort GRN Log entries
        const rawItems = grns.flatMap(grn => (grn.items || []).map(item => ({ ...item, grn })));

        // Filter items
        const filteredGrnItems = rawItems.filter(item => {
          const matchesSupplier = filterSupplier === "" ||
            item.grn.supplier_name.toLowerCase().includes(filterSupplier.toLowerCase());
          
          const matchesProduct = filterMovementProduct === "" ||
            item.product_id === filterMovementProduct;

          const dateObj = new Date(item.grn.receiving_date || item.grn.created_at);
          
          const matchesStartDate = !filterStartDate || dateObj >= new Date(filterStartDate + "T00:00:00");
          const matchesEndDate = !filterEndDate || dateObj <= new Date(filterEndDate + "T23:59:59");

          return matchesSupplier && matchesProduct && matchesStartDate && matchesEndDate;
        });

        // Sort items by Receiving Date in descending order
        const sortedGrnItems = [...filteredGrnItems].sort((a, b) => {
          const dateA = new Date(a.grn.receiving_date || a.grn.created_at).getTime();
          const dateB = new Date(b.grn.receiving_date || b.grn.created_at).getTime();
          return dateB - dateA;
        });

        // Export filtered items to CSV
        const exportGrnToCSV = () => {
          const csvHeaders = ["Invoice Ref", "Date Received", "Supplier", "Product SKU", "Product Name", "Ordered Qty", "Received Qty", "Unit Price (DP)", "Commission (%)", "Purchase Price", "Total Amount", "Total Purchase Price", "Warehouse", "Batch No."];
          const csvRows = sortedGrnItems.map(item => {
            const productObj = products.find(p => p.id === item.product_id);
            const whName = branches.find(b => b.id === item.grn.branch_id)?.name || "Warehouse";
            const dateStr = new Date(item.grn.receiving_date || item.grn.created_at).toLocaleDateString();
            const unitPriceVal = item.unit_price || item.cost_price;
            return [
              item.grn.invoice_reference || "—",
              dateStr,
              item.grn.supplier_name,
              productObj?.sku || "—",
              productObj?.name || "Unknown Product",
              item.ordered_quantity || item.quantity_received,
              item.quantity_received,
              unitPriceVal,
              item.commission || 0,
              item.cost_price,
              item.quantity_received * unitPriceVal,
              item.subtotal,
              whName,
              item.batch_number || "—"
            ];
          });
          const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");
          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.setAttribute("href", url);
          link.setAttribute("download", `GRN_Log_History_${new Date().toISOString().split('T')[0]}.csv`);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        return (
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col space-y-6">
            {/* Header row with buttons */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Receiving Log History ({sortedGrnItems.length} items)</h3>
                <p className="text-xs text-gray-500 mt-1">Track incoming supplier deliveries and generate invoices</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`px-3 py-2 text-xs font-bold border rounded-xl transition ${showAdvancedFilters ? "bg-blue-600 text-white border-blue-600" : "bg-gray-50 hover:bg-gray-100 text-gray-700"}`}
                >
                  ⚙️ Filters {showAdvancedFilters ? "▲" : "▼"}
                </button>
                <button
                  type="button"
                  onClick={exportGrnToCSV}
                  className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 rounded-xl transition-all"
                  disabled={sortedGrnItems.length === 0}
                >
                  ⬇️ Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => setShowGRNModal(true)}
                  className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                  Receive Supplier Delivery (GRN)
                </button>
              </div>
            </div>

            {/* Expandable Filter Fields */}
            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 rounded-xl border grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier Name</label>
                  <input
                    type="text"
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    placeholder="Search supplier..."
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Catalog Product</label>
                  <select
                    className="w-full p-2 border rounded-lg bg-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterMovementProduct}
                    onChange={(e) => setFilterMovementProduct(e.target.value)}
                  >
                    <option value="">All Products</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Received From</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Received To</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white font-medium"
                  />
                </div>
              </div>
            )}

            {/* List */}
            {sortedGrnItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-12 bg-gray-50 rounded-xl border">
                No deliveries found matching the filters.
              </p>
            ) : (
              <div className="overflow-x-auto max-h-[60vh] border rounded-xl">
                <table className="w-full text-left text-xs text-gray-650 border-collapse">
                  <thead className="bg-gray-55 uppercase text-gray-700 font-bold border-b sticky top-0">
                    <tr>
                      <th className="p-3">Date / Ref</th>
                      <th className="p-3">Supplier</th>
                      <th className="p-3">Product Details</th>
                      <th className="p-3 text-right">Ordered</th>
                      <th className="p-3 text-right">Received</th>
                      <th className="p-3 text-right">Unit Price (DP)</th>
                      <th className="p-3 text-center">Commission</th>
                      <th className="p-3 text-right">Purchase Price</th>
                      <th className="p-3 text-right">Total Amount</th>
                      <th className="p-3 text-right">Total Purchase Price</th>
                      <th className="p-3">Warehouse</th>
                      <th className="p-3 text-center">Batch No.</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedGrnItems.map(item => {
                      const dateObj = new Date(item.grn.created_at || item.grn.receiving_date);
                      const whName = branches.find(b => b.id === item.grn.branch_id)?.name || "Warehouse";
                      const productObj = products.find(p => p.id === item.product_id);
                      const unitPriceVal = item.unit_price || item.cost_price;

                      return (
                        <tr key={`${item.grn.id}-${item.id}`} className="hover:bg-gray-50/50 transition">
                          <td className="p-3 whitespace-nowrap">
                            <span className="font-semibold text-gray-900 block">{item.grn.invoice_reference || "—"}</span>
                            <span className="text-[10px] text-gray-400 block">
                              {dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-gray-800 whitespace-nowrap">{item.grn.supplier_name}</td>
                          <td className="p-3">
                            <span className="font-bold text-gray-800 block">{productObj?.name || "Unknown Product"}</span>
                            <span className="text-[10px] text-gray-400 block">SKU: {productObj?.sku || item.product_id}</span>
                          </td>
                          <td className="p-3 text-right font-medium text-gray-600">{item.ordered_quantity || item.quantity_received}</td>
                          <td className="p-3 text-right font-bold text-green-700">{item.quantity_received}</td>
                          <td className="p-3 text-right font-semibold text-gray-700">{formatPrice(unitPriceVal)}</td>
                          <td className="p-3 text-center font-semibold text-orange-600">{item.commission || 0}%</td>
                          <td className="p-3 text-right font-semibold text-emerald-800">{formatPrice(item.cost_price)}</td>
                          <td className="p-3 text-right font-semibold text-gray-800">{formatPrice(item.quantity_received * unitPriceVal)}</td>
                          <td className="p-3 text-right font-bold text-blue-900">{formatPrice(item.subtotal)}</td>
                          <td className="p-3 font-semibold text-gray-600 whitespace-nowrap">{whName}</td>
                          <td className="p-3 text-center">
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">
                              {item.batch_number || "—"}
                            </span>
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveGRN(item.grn);
                                const grossVal = (item.grn.items || []).reduce((sum: number, it: any) => sum + (it.quantity_received * (it.unit_price || it.cost_price)), 0);
                                const diffVal = grossVal - item.grn.total_amount;
                                setInvoiceDiscount(diffVal > 0.01 ? diffVal.toFixed(2) : "0");
                                setShowInvoiceModal(true);
                              }}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs transition"
                            >
                              🖨 View Invoice
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === "warehouses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create Factory Warehouse</h3>
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Warehouse Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={warehouseName}
                  onChange={(e) => setWarehouseName(e.target.value)}
                  placeholder="e.g. Raw Material Storage A"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Location Address</label>
                <textarea
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                  placeholder="Factory Zone A, Block C..."
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Create Warehouse
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Active Warehouses ({activeWarehouses.length})</h3>
            {activeWarehouses.length === 0 ? (
              <p className="text-sm text-gray-500">No factory warehouses registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeWarehouses.map(b => (
                  <div key={b.id} className="p-4 bg-gray-50 border rounded-xl flex flex-col justify-between hover:shadow-sm">
                    <div>
                      <h4 className="font-bold text-blue-900">{b.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{b.address || "No address listed"}</p>
                    </div>
                    <span className="mt-3 text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full w-fit">
                      {b.branch_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingSupplier ? "✏️ Edit Supplier" : "Register Supplier"}</h3>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier Company Name</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Timberwood Ltd"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contact Person</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                  <input
                    type="email"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={supplierEmail}
                    onChange={(e) => setSupplierEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Office Address</label>
                <textarea
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-16"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-600 uppercase cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={supplierActive}
                    onChange={(e) => setSupplierActive(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span>Supplier Status (Active)</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                {editingSupplier ? "Save Changes" : "Register Supplier"}
              </button>
              {editingSupplier && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupplierName("");
                    setSupplierContact("");
                    setSupplierPhone("");
                    setSupplierEmail("");
                    setSupplierAddress("");
                    setSupplierActive(true);
                  }}
                  className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel Edit
                </button>
              )}
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Registered Suppliers ({suppliers.length})</h3>
            {suppliers.length === 0 ? (
              <p className="text-sm text-gray-500">No suppliers registered.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                    <tr>
                      <th className="p-3">Company</th>
                      <th className="p-3">Contact</th>
                      <th className="p-3">Phone</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Office Address</th>
                      <th className="p-3 text-center">Status</th>
                      {userRole && ["owner", "manager"].includes(userRole) && <th className="p-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id} className="border-b hover:bg-gray-55">
                        <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                        <td className="p-3 text-xs">{s.contact_person || "-"}</td>
                        <td className="p-3 text-xs">{s.phone || "-"}</td>
                        <td className="p-3 text-xs">{s.email || "-"}</td>
                        <td className="p-3 text-[11px] text-gray-500 max-w-xs truncate">{s.address || "-"}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.is_active !== false ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {s.is_active !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        {userRole && ["owner", "manager"].includes(userRole) && (
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSupplier(s);
                                setSupplierName(s.name);
                                setSupplierContact(s.contact_person || "");
                                setSupplierPhone(s.phone || "");
                                setSupplierEmail(s.email || "");
                                setSupplierAddress(s.address || "");
                                setSupplierActive(s.is_active !== false);
                              }}
                              className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-xs font-bold mr-1.5 transition"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const updated = await api.updateSupplier(s.id, { is_active: s.is_active === false });
                                  setSuppliers(prev => prev.map(item => item.id === updated.id ? updated : item));
                                  alert(`Status updated for ${s.name}`);
                                } catch (err) {
                                  alert("Failed to toggle supplier status");
                                }
                              }}
                              className={`px-2.5 py-1 rounded text-xs font-bold transition ${s.is_active !== false ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                            >
                              {s.is_active !== false ? "Deactivate" : "Activate"}
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "transfers" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Transfer</h3>
            {products.length === 0 && (
              <div className="mb-4 text-xs bg-yellow-50 text-yellow-700 p-3 rounded border">
                ⚠️ Register products before transfers.
              </div>
            )}
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Product</label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={txProduct}
                  onChange={(e) => setTxProduct(e.target.value)}
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Origin</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={txFrom}
                    onChange={(e) => setTxFrom(e.target.value)}
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destination</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    value={txTo}
                    onChange={(e) => setTxTo(e.target.value)}
                  >
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transfer Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={txQty}
                    onChange={(e) => setTxQty(e.target.value)}
                    placeholder="10.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reference</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="e.g. TR-204"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Execute Transfer
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Transfers Log</h3>
            {transfers.length === 0 ? (
              <p className="text-sm text-gray-500">No transfers executed yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                    <tr>
                      <th className="p-3">Product SKU</th>
                      <th className="p-3">From</th>
                      <th className="p-3">To</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Ref</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map(t => {
                      const pName = products.find(p => p.id === t.product_id)?.sku || "Unknown";
                      const fBranch = branches.find(b => b.id === t.from_branch_id)?.name || "Unknown";
                      const tBranch = branches.find(b => b.id === t.to_branch_id)?.name || "Unknown";
                      return (
                        <tr key={t.id} className="border-b hover:bg-gray-55">
                          <td className="p-3 font-semibold text-gray-900">{pName}</td>
                          <td className="p-3">{fBranch}</td>
                          <td className="p-3">{tBranch}</td>
                          <td className="p-3 font-bold text-blue-600">{t.quantity}</td>
                          <td className="p-3">{t.reference || "-"}</td>
                          <td className="p-3 text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "adjustments" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl border h-fit shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Inventory Adjustment</h3>
            <form onSubmit={handleAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Product</label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adjProduct}
                  onChange={(e) => setAdjProduct(e.target.value)}
                >
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warehouse Location</label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adjBranch}
                  onChange={(e) => setAdjBranch(e.target.value)}
                >
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Qty</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjCurrent}
                    onChange={(e) => setAdjCurrent(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity Change</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    value={adjChange}
                    onChange={(e) => setAdjChange(e.target.value)}
                    placeholder="e.g. -5.0 or 15.0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reason for Adjustment</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="e.g. Stock audit variance, Damaged core"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Internal Notes</label>
                <textarea
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-16"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Register Correction
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Adjustments Audit Log</h3>
            {adjustments.length === 0 ? (
              <p className="text-sm text-gray-500">No stock corrections logged yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                    <tr>
                      <th className="p-3">Product SKU</th>
                      <th className="p-3">Warehouse</th>
                      <th className="p-3">Delta</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Approved By</th>
                      <th className="p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adjustments.map(a => {
                      const pName = products.find(p => p.id === a.product_id)?.sku || "Unknown";
                      const fBranch = branches.find(b => b.id === a.branch_id)?.name || "Unknown";
                      return (
                        <tr key={a.id} className="border-b hover:bg-gray-55">
                          <td className="p-3 font-semibold text-gray-900">{pName}</td>
                          <td className="p-3">{fBranch}</td>
                          <td className={`p-3 font-bold ${a.adjusted_quantity < 0 ? "text-red-600" : "text-green-600"}`}>
                            {a.adjusted_quantity > 0 ? `+${a.adjusted_quantity}` : a.adjusted_quantity}
                          </td>
                          <td className="p-3">{a.reason}</td>
                          <td className="p-3 text-xs">{a.approved_by}</td>
                          <td className="p-3 text-xs text-gray-400">{new Date(a.created_at).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="space-y-8">
          {/* Nested Report Tabs */}
          <div className="flex space-x-1 border-b pb-px mb-6 bg-white p-1 rounded-lg border max-w-fit shadow-sm">
            {([
              { id: "valuation", label: "Valuation & Alerts" },
              { id: "movement", label: "Stock Movement History" },
              { id: "dead_stock", label: "Dead Stock Report" },
              { id: "consumption", label: "Consumption Report" }
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setReportsNestedTab(tab.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${reportsNestedTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm font-bold"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-105"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {reportsNestedTab === "valuation" && (
            <div className="space-y-8">
              {/* Valuation Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 p-6 rounded-xl text-white shadow-md">
                  <h4 className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">Total Inventory Value</h4>
                  <p className="text-4xl font-extrabold">৳{(valuation?.total_valuation || 0).toLocaleString()}</p>
                </div>
                <div className="bg-emerald-600 p-6 rounded-xl text-white shadow-md">
                  <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">Total Storage Items</h4>
                  <p className="text-4xl font-extrabold">{(valuation?.total_items || 0).toLocaleString()}</p>
                </div>
                <div className="bg-orange-600 p-6 rounded-xl text-white shadow-md">
                  <h4 className="text-orange-200 text-xs font-bold uppercase tracking-wider mb-2">Low Stock Alerts</h4>
                  <p className="text-4xl font-extrabold">{lowStock.length}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Valuation details list */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Valuation Breakdown</h3>
                  {!valuation || valuation.valuation_details.length === 0 ? (
                    <p className="text-sm text-gray-500">No valuation logs available.</p>
                  ) : (
                    <div className="max-h-96 overflow-y-auto pr-2">
                      <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3 text-right">Stock</th>
                            <th className="p-3 text-right">Unit Cost</th>
                            <th className="p-3 text-right">Valuation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {valuation.valuation_details.map(d => (
                            <tr key={d.product_id} className="border-b hover:bg-gray-50">
                              <td className="p-3">
                                <div className="font-semibold text-gray-900">{d.name}</div>
                                <div className="text-xs text-gray-400">{d.sku} | {d.product_type}</div>
                              </td>
                              <td className="p-3 text-right font-semibold text-gray-800">{d.current_stock}</td>
                              <td className="p-3 text-right">৳{d.unit_cost.toLocaleString()}</td>
                              <td className="p-3 text-right font-bold text-blue-600">৳{d.total_value.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Low stock alerts list */}
                <div className="bg-white p-6 rounded-xl border shadow-sm">
                  <h3 className="text-lg font-bold text-orange-850 mb-4">🚨 Critical Low Stock Alerts</h3>
                  {lowStock.length === 0 ? (
                    <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
                      ✓ All products are currently above their safety thresholds.
                    </div>
                  ) : (
                    <div className="max-h-96 overflow-y-auto pr-2">
                      <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                          <tr>
                            <th className="p-3">Product</th>
                            <th className="p-3 text-right">Stock</th>
                            <th className="p-3 text-right">Min Threshold</th>
                            <th className="p-3 text-right">Reorder Qty</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lowStock.map(l => (
                            <tr key={l.product_id} className="border-b hover:bg-red-55/30">
                              <td className="p-3">
                                <div className="font-semibold text-red-900">{l.name}</div>
                                <div className="text-xs text-gray-400">{l.sku} | {l.product_type}</div>
                              </td>
                              <td className="p-3 text-right font-bold text-red-650">{l.current_stock}</td>
                              <td className="p-3 text-right font-medium text-gray-650">{l.min_stock_level}</td>
                              <td className="p-3 text-right font-semibold text-blue-600">{l.reorder_quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {reportsNestedTab === "movement" && (
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="flex flex-wrap items-center gap-4 justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-gray-805">Stock Movement Log</h3>
                <div className="flex flex-wrap gap-2">
                  <select
                    className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterMovementBranch}
                    onChange={(e) => setFilterMovementBranch(e.target.value)}
                  >
                    <option value="">All Warehouses</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  <select
                    className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterMovementProduct}
                    onChange={(e) => setFilterMovementProduct(e.target.value)}
                  >
                    <option value="">All Products</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>
                    ))}
                  </select>
                  <select
                    className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterMovementType}
                    onChange={(e) => setFilterMovementType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    <option value="purchase_receive">Purchase Receive</option>
                    <option value="stock_transfer">Stock Transfer</option>
                    <option value="production_consumption">Production Consumption</option>
                    <option value="production_completion">Production Completion</option>
                    <option value="sales_delivery">Sales Delivery</option>
                    <option value="return">Return</option>
                    <option value="damage">Damage</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
              </div>

              {movements.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No movement logs found.</p>
              ) : (
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                      <tr>
                        <th className="p-3">Date</th>
                        <th className="p-3">Product</th>
                        <th className="p-3">Warehouse Location</th>
                        <th className="p-3">Movement Type</th>
                        <th className="p-3 text-right">Delta Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {movements.map(m => (
                        <tr key={m.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</td>
                          <td className="p-3">
                            <span className="font-semibold text-gray-900">{m.product_name}</span>
                            <span className="text-xs text-gray-400 block">{m.product_sku}</span>
                          </td>
                          <td className="p-3">{m.branch_name}</td>
                          <td className="p-3">
                            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full capitalize">
                              {m.movement_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className={`p-3 text-right font-bold ${m.quantity_change < 0 ? 'text-red-650' : 'text-green-650'}`}>
                            {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {reportsNestedTab === "dead_stock" && (
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="flex flex-wrap items-center gap-4 justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-gray-805">Dead Stock Report</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase">Days of Inactivity:</span>
                    <input
                      type="number"
                      value={deadStockDays}
                      onChange={(e) => setDeadStockDays(parseInt(e.target.value) || 30)}
                      className="p-1.5 border rounded-lg text-sm w-20 outline-none"
                    />
                  </div>
                  <select
                    className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterDeadStockBranch}
                    onChange={(e) => setFilterDeadStockBranch(e.target.value)}
                  >
                    <option value="">All Warehouses</option>
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {deadStock.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No inactive stock matches found for this period.</p>
              ) : (
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                      <tr>
                        <th className="p-3">Product SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">Current Stock</th>
                        <th className="p-3 text-right">Last Movement Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deadStock.map(d => (
                        <tr key={d.product_id} className="border-b hover:bg-gray-55">
                          <td className="p-3 font-semibold text-gray-900">{d.sku}</td>
                          <td className="p-3 font-medium text-gray-850">{d.name}</td>
                          <td className="p-3 text-right font-extrabold text-blue-600">{d.current_stock}</td>
                          <td className="p-3 text-right text-xs text-gray-400">
                            {d.last_movement_date ? new Date(d.last_movement_date).toLocaleString() : "Never moved"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {reportsNestedTab === "consumption" && (
            <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
              <div className="flex flex-wrap items-center gap-4 justify-between border-b pb-4">
                <h3 className="text-lg font-bold text-gray-805">Production Consumption Summary</h3>
                <select
                  className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
                  value={filterConsumptionBranch}
                  onChange={(e) => setFilterConsumptionBranch(e.target.value)}
                >
                  <option value="">All Warehouses</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {consumption.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No consumption records found.</p>
              ) : (
                <div className="overflow-x-auto max-h-[50vh]">
                  <table className="w-full text-left text-sm text-gray-500">
                    <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                      <tr>
                        <th className="p-3">Product SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3 text-right">Total Consumed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consumption.map(c => (
                        <tr key={c.product_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">{c.sku}</td>
                          <td className="p-3 font-medium text-gray-800">{c.name}</td>
                          <td className="p-3 text-right font-extrabold text-orange-650">
                            {c.total_consumed} {c.unit || 'pcs'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between bg-slate-55">
              <h3 className="text-xl font-bold text-gray-900">Edit Product: {editingProduct.name}</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-650 text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU Reference</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editSku} onChange={(e) => setEditSku(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Unit</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={editUnit} onChange={(e) => setEditUnit(e.target.value)}>
                    <option value="Pieces">Pieces</option>
                    <option value="Cubic Feet">Cubic Feet (cft)</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Square Feet">Square Feet (sqft)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Type</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={editType} onChange={(e) => setEditType(e.target.value)}>
                    <option value="finished_product">Finished Furniture Product</option>
                    <option value="raw_material">Raw Material (Wood/Board)</option>
                    <option value="semi_finished_product">Semi Finished component</option>
                    <option value="consumable">Consumable Item</option>
                    <option value="spare_parts">Spare Parts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent Template (For Variations)</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={editParentId} onChange={(e) => setEditParentId(e.target.value)}>
                    <option value="">-- No Parent --</option>
                    {products.filter(p => !p.parent_id && p.id !== editingProduct.id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                    <option value="">-- No Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default Supplier</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={editSupplier} onChange={(e) => setEditSupplier(e.target.value)}>
                    <option value="">-- No Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selling Price ({currency === "USD" ? "$" : "৳"}) *</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estimated Purchase Cost / Unit Price ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editCost} onChange={(e) => setEditCost(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Commission (%)</label>
                  <input type="number" step="any" min="0" max="100" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-750" value={editCommission} onChange={(e) => setEditCommission(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Additional Cost ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="any" min="0" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-750" value={editAdditionalCost} onChange={(e) => setEditAdditionalCost(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax/VAT rate (%)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editTaxRate} onChange={(e) => setEditTaxRate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Color Variation</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Material Type</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editMaterialType} onChange={(e) => setEditMaterialType(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Wood Type</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editWoodType} onChange={(e) => setEditWoodType(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Board Type</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editBoardType} onChange={(e) => setEditBoardType(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weight (kg)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editWeight} onChange={(e) => setEditWeight(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thickness (mm)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editThickness} onChange={(e) => setEditThickness(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Length (inch)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editLength} onChange={(e) => setEditLength(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Width (inch)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editWidth} onChange={(e) => setEditWidth(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Height (inch)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editHeight} onChange={(e) => setEditHeight(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Min Stock</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editMinStock} onChange={(e) => setEditMinStock(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Stock</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editMaxStock} onChange={(e) => setEditMaxStock(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reorder Qty</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editReorderQty} onChange={(e) => setEditReorderQty(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Image Link</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editImage} onChange={(e) => setEditImage(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2">
                <input type="checkbox" id="editActive" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500" />
                <label htmlFor="editActive" className="text-sm font-semibold text-gray-700">Product is active and purchasable</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setEditingProduct(null)} className="px-5 py-2.5 border rounded-lg hover:bg-gray-100 transition font-medium">Cancel</button>
                <button type="submit" disabled={isUpdatingProduct} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold disabled:bg-gray-400">
                  {isUpdatingProduct ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {viewingProductDetail && (
        <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{viewingProductDetail.product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">SKU: {viewingProductDetail.product.sku} | Type: <span className="capitalize">{viewingProductDetail.product.product_type?.replace('_', ' ')}</span></p>
              </div>
              <button onClick={() => setViewingProductDetail(null)} className="text-gray-400 hover:text-gray-655 text-2xl font-bold">×</button>
            </div>

            {/* Tabs inside details */}
            <div className="flex border-b bg-gray-50 px-6">
              {(["overview", "inventory", "transactions"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setDetailActiveTab(tab)}
                  className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all capitalize ${detailActiveTab === tab
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {detailActiveTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Current Stock</span>
                      <span className="text-2xl font-bold text-blue-900">{viewingProductDetail.current_stock} {viewingProductDetail.product.unit || 'pcs'}</span>
                    </div>
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Selling Price</span>
                      <span className="text-2xl font-bold text-emerald-955">{formatPrice(viewingProductDetail.product.selling_price)}</span>
                    </div>
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Unit Price (DP)</span>
                      <span className="text-2xl font-bold text-purple-950">{formatPrice(viewingProductDetail.product.purchase_cost || 0)}</span>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Commission</span>
                      <span className="text-2xl font-bold text-orange-955">{viewingProductDetail.product.commission || 0}%</span>
                    </div>
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Purchased Price</span>
                      <span className="text-2xl font-bold text-teal-955">
                        {formatPrice((viewingProductDetail.product.purchase_cost || 0) * (1 - (viewingProductDetail.product.commission || 0) / 100))}
                      </span>
                    </div>
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Additional Cost</span>
                      <span className="text-2xl font-bold text-amber-955">{formatPrice(viewingProductDetail.product.additional_cost || 0)}</span>
                    </div>
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-0.5">Average Cost</span>
                      <span className="text-2xl font-bold text-indigo-900">
                        {viewingProductDetail.product.average_cost != null && viewingProductDetail.product.average_cost > 0
                          ? formatPrice(viewingProductDetail.product.average_cost)
                          : formatPrice(viewingProductDetail.product.purchase_cost || 0)}
                      </span>
                      <span className="text-[10px] text-indigo-500 block mt-0.5">Weighted average of all GRNs</span>
                    </div>
                    <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Min Stock Limit</span>
                      <span className="text-2xl font-bold text-red-955">{viewingProductDetail.product.min_stock_level || 0}</span>
                    </div>
                  </div>

                  {/* Historical Stock lookup card */}
                  <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                      <h4 className="font-bold text-sm text-blue-900 mb-1">📅 Historical Stock Lookup</h4>
                      <p className="text-xs text-blue-700">Compute cumulative stock level up to a specific historical date.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <input
                        type="date"
                        value={historicalDate}
                        onChange={(e) => setHistoricalDate(e.target.value)}
                        className="flex-1 p-2 border rounded-lg text-sm bg-white outline-none"
                      />
                      <div className="bg-blue-600 text-white font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap shadow-sm text-center">
                        Stock: {(() => {
                          if (!viewingProductDetail || !viewingProductDetail.transactions) return 0;
                          const target = new Date(historicalDate + "T23:59:59");
                          const sum = viewingProductDetail.transactions
                            .filter((tx: any) => new Date(tx.created_at) <= target)
                            .reduce((s: number, tx: any) => s + tx.quantity_change, 0);
                          return `${sum} ${viewingProductDetail.product.unit || 'pcs'}`;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Time based velocity calculations */}
                  <div className="bg-slate-50 p-4 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                    <div className="p-3 bg-white border rounded-lg shadow-sm">
                      <span className="text-gray-400 block mb-1 uppercase tracking-wider text-[10px] font-bold">Avg Daily Consumption (30d)</span>
                      <span className="text-lg font-bold text-gray-800">
                        {(() => {
                          if (!viewingProductDetail || !viewingProductDetail.transactions) return "0.00";
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          const negativeTx = viewingProductDetail.transactions.filter((tx: any) => {
                            const txDate = new Date(tx.created_at);
                            return txDate >= thirtyDaysAgo && tx.quantity_change < 0;
                          });
                          const totalUsage = negativeTx.reduce((s: number, tx: any) => s + Math.abs(tx.quantity_change), 0);
                          return (totalUsage / 30).toFixed(2);
                        })()}{" "}
                        {viewingProductDetail.product.unit || "pcs"} / day
                      </span>
                    </div>

                    <div className="p-3 bg-white border rounded-lg shadow-sm">
                      <span className="text-gray-400 block mb-1 uppercase tracking-wider text-[10px] font-bold">Stock Runway (Supply Days)</span>
                      <span className="text-lg font-bold text-gray-800">
                        {(() => {
                          if (!viewingProductDetail || !viewingProductDetail.transactions) return "Infinite";
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          const negativeTx = viewingProductDetail.transactions.filter((tx: any) => {
                            const txDate = new Date(tx.created_at);
                            return txDate >= thirtyDaysAgo && tx.quantity_change < 0;
                          });
                          const totalUsage = negativeTx.reduce((s: number, tx: any) => s + Math.abs(tx.quantity_change), 0);
                          const dailyUsage = totalUsage / 30;
                          if (dailyUsage <= 0) return "∞ (No usage)";
                          const runway = viewingProductDetail.current_stock / dailyUsage;
                          return `${Math.ceil(runway)} Days`;
                        })()}
                      </span>
                    </div>

                    <div className="p-3 bg-white border rounded-lg shadow-sm">
                      <span className="text-gray-400 block mb-1 uppercase tracking-wider text-[10px] font-bold">Estimated Reorder Point</span>
                      <span className="text-lg font-bold text-gray-800">
                        {(() => {
                          if (!viewingProductDetail || !viewingProductDetail.transactions) return "0.00";
                          const thirtyDaysAgo = new Date();
                          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                          const negativeTx = viewingProductDetail.transactions.filter((tx: any) => {
                            const txDate = new Date(tx.created_at);
                            return txDate >= thirtyDaysAgo && tx.quantity_change < 0;
                          });
                          const totalUsage = negativeTx.reduce((s: number, tx: any) => s + Math.abs(tx.quantity_change), 0);
                          const dailyUsage = totalUsage / 30;
                          const leadTimeDemand = dailyUsage * 7; // Assuming 7 days lead time
                          const safetyStock = viewingProductDetail.product.min_stock_level || 0;
                          return `${Math.ceil(leadTimeDemand + safetyStock)} ${viewingProductDetail.product.unit || 'pcs'}`;
                        })()}
                      </span>
                    </div>
                  </div>

                  {viewingProductDetail.product.product_image && (
                    <div className="mb-4">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Product Image</span>
                      <img
                        src={viewingProductDetail.product.product_image}
                        alt={viewingProductDetail.product.name}
                        className="w-full max-w-xs h-40 object-cover rounded-xl border bg-gray-100"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Product Specifications & Parameters</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><span className="text-gray-400">Barcode:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.barcode || "-"}</span></div>
                      <div>
                        <span className="text-gray-400">Category:</span>{" "}
                        <span className="font-semibold text-gray-800">
                          {viewingProductDetail.product.category_id
                            ? (categories.find(c => c.id === viewingProductDetail.product.category_id)?.name || "Uncategorized")
                            : "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Default Supplier:</span>{" "}
                        <span className="font-semibold text-gray-800">
                          {viewingProductDetail.product.supplier_id
                            ? (suppliers.find(s => s.id === viewingProductDetail.product.supplier_id)?.name || "None")
                            : "None"}
                        </span>
                      </div>
                      <div><span className="text-gray-400">Tax/VAT Rate:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.tax_rate || 0}%</span></div>
                      <div><span className="text-gray-400">Material Type:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.material_type || "-"}</span></div>
                      <div><span className="text-gray-400">Wood Type:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.wood_type || "-"}</span></div>
                      <div><span className="text-gray-400">Board Type:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.board_type || "-"}</span></div>
                      <div><span className="text-gray-400">Color Spec:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.color || "-"}</span></div>
                      <div><span className="text-gray-400">Size Spec:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.size || "-"}</span></div>
                      <div><span className="text-gray-400">Length:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.length ? `${viewingProductDetail.product.length} in` : "-"}</span></div>
                      <div><span className="text-gray-400">Width:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.width ? `${viewingProductDetail.product.width} in` : "-"}</span></div>
                      <div><span className="text-gray-400">Height:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.height ? `${viewingProductDetail.product.height} in` : "-"}</span></div>
                      <div><span className="text-gray-400">Thickness:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.thickness ? `${viewingProductDetail.product.thickness} mm` : "-"}</span></div>
                      <div><span className="text-gray-400">Weight:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.weight ? `${viewingProductDetail.product.weight} kg` : "-"}</span></div>
                      <div><span className="text-gray-400">Max Stock Limit:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.max_stock_level || "-"}</span></div>
                      <div><span className="text-gray-400">Reorder Qty:</span> <span className="font-semibold text-gray-800">{viewingProductDetail.product.reorder_quantity || "-"}</span></div>
                    </div>
                  </div>

                  {viewingProductDetail.variants && viewingProductDetail.variants.length > 0 && (
                    <div>
                      <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Variants Available ({viewingProductDetail.variants.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {viewingProductDetail.variants.map((v: any) => (
                          <div key={v.id} className="p-3 bg-white border rounded-xl flex justify-between items-center text-sm">
                            <div>
                              <span className="font-bold text-slate-800">{v.name}</span>
                              <span className="text-xs text-gray-450 block">SKU: {v.sku} | Spec: {v.color || ''} {v.size || ''}</span>
                            </div>
                            <span className="font-bold text-emerald-600">{formatPrice(v.selling_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {detailActiveTab === "inventory" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Warehouse Breakdown</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                      <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                        <tr>
                          <th className="p-3">Warehouse Location</th>
                          <th className="p-3">Type</th>
                          <th className="p-3 text-right">Available Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingProductDetail.warehouse_stock && viewingProductDetail.warehouse_stock.map((ws: any) => (
                          <tr key={ws.branch_id} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-semibold text-gray-900">{ws.branch_name}</td>
                            <td className="p-3 capitalize">{ws.branch_type}</td>
                            <td className="p-3 text-right font-bold text-blue-600">{ws.stock} {viewingProductDetail.product.unit || 'pcs'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {detailActiveTab === "transactions" && (
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Recent Stock Transactions (Last 50)</h4>
                  {viewingProductDetail.transactions && viewingProductDetail.transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No transaction history found.</p>
                  ) : (
                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-left text-sm text-gray-500">
                        <thead className="text-xs text-gray-700 bg-gray-100 uppercase font-bold">
                          <tr>
                            <th className="p-3">Date</th>
                            <th className="p-3">Type</th>
                            <th className="p-3 text-right">Quantity Delta</th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewingProductDetail.transactions && viewingProductDetail.transactions.map((tx: any) => {
                            return (
                              <tr key={tx.id} className="border-b hover:bg-gray-55">
                                <td className="p-3 text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
                                <td className="p-3"><span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full capitalize">{tx.movement_type.replace('_', ' ')}</span></td>
                                <td className={`p-3 text-right font-bold ${tx.quantity_change < 0 ? 'text-red-600' : 'text-green-650'}`}>
                                  {tx.quantity_change > 0 ? `+${tx.quantity_change}` : tx.quantity_change}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button onClick={() => setViewingProductDetail(null)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ======================= MODALS ========================= */}
      {/* ======================================================== */}

      {/* 1. Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto my-4 animate-scaleUp">
            <div className="p-6 border-b flex items-center justify-between bg-gray-50 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Add New Product to Catalog</h3>
                <p className="text-xs text-gray-500 mt-1">Create a new product template or component</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddProductModal(false);
                  setProductSuccessMessage("");
                }}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {productSuccessMessage && (
              <div className="m-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-semibold">
                {productSuccessMessage}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Code (SKU) *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                    placeholder="e.g. WD-CH-01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Unit *</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                  >
                    <option value="Pieces">Pieces</option>
                    <option value="Cubic Feet">Cubic Feet (cft)</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Square Feet">Square Feet (sqft)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Name *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="e.g. Oak Wood Dining Chair"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Type *</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={newProductType}
                    onChange={(e) => setNewProductType(e.target.value)}
                  >
                    {productTypes.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Parent Template (For Variations)</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={newProductParentId}
                    onChange={(e) => setNewProductParentId(e.target.value)}
                  >
                    <option value="">-- No Parent Template --</option>
                    {products.filter(p => !p.parent_id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Category</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                  >
                    <option value="">-- No Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Color Variation</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductColor}
                    onChange={(e) => setNewProductColor(e.target.value)}
                    placeholder="e.g. Natural Varnish"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Material Type</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={newProductMaterialType}
                    onChange={(e) => setNewProductMaterialType(e.target.value)}
                  >
                    <option value="">-- Select Material Type --</option>
                    {materialTypes.map((mat, i) => (
                      <option key={i} value={mat}>{mat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wood Type</label>
                  <select
                    className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={newProductWoodType}
                    onChange={(e) => setNewProductWoodType(e.target.value)}
                  >
                    <option value="">-- Select Wood Type --</option>
                    {woodTypes.map((wood, i) => (
                      <option key={i} value={wood}>{wood}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Board Type</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductBoardType}
                    onChange={(e) => setNewProductBoardType(e.target.value)}
                    placeholder="e.g. MDF"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductWeight}
                    onChange={(e) => setNewProductWeight(e.target.value)}
                    placeholder="e.g. 12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Thickness (mm)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductThickness}
                    onChange={(e) => setNewProductThickness(e.target.value)}
                    placeholder="e.g. 18"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Length (inch)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductLength}
                    onChange={(e) => setNewProductLength(e.target.value)}
                    placeholder="e.g. 36"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Width (inch)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductWidth}
                    onChange={(e) => setNewProductWidth(e.target.value)}
                    placeholder="e.g. 24"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Height (inch)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={newProductHeight}
                    onChange={(e) => setNewProductHeight(e.target.value)}
                    placeholder="e.g. 30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Product Image Link</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                  value={newProductImage}
                  onChange={(e) => setNewProductImage(e.target.value)}
                  placeholder="e.g. /images/chair.jpg"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddProductModal(false);
                    setProductSuccessMessage("");
                  }}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
                >
                  {isSubmittingProduct ? "Creating..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Manage Product Types Modal */}
      {showProductTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-purple-50">
              <h3 className="text-base font-bold text-purple-900">⚙️ Manage Product Types</h3>
              <button
                type="button"
                onClick={() => setShowProductTypesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {productTypes.map((type, i) => (
                <div key={type.key} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">{type.label}</span>
                    <span className="text-[10px] text-gray-400 font-mono block">Key: {type.key}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete product type "${type.label}"?`)) {
                        updateProductTypes(productTypes.filter((_, idx) => idx !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Add New Product Type</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-type-label"
                  placeholder="e.g. Fabrics"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const labelInput = document.getElementById("new-type-label") as HTMLInputElement;
                    const val = labelInput?.value.trim();
                    if (!val) return;
                    const key = val.toLowerCase().replace(/[^a-z0-9_]/g, "_");
                    if (productTypes.some(t => t.key === key)) {
                      alert("Product type key already exists!");
                      return;
                    }
                    updateProductTypes([...productTypes, { key, label: val }]);
                    labelInput.value = "";
                  }}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Manage Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-indigo-50">
              <h3 className="text-base font-bold text-indigo-900">⚙️ Manage Categories</h3>
              <button
                type="button"
                onClick={() => setShowCategoriesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {categories.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-800 text-sm">{c.name}</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Are you sure you want to delete category "${c.name}"?`)) {
                        try {
                          await api.deleteCategory(c.id);
                          setCategories(categories.filter(cat => cat.id !== c.id));
                          alert("Category deleted successfully!");
                        } catch (err: any) {
                          alert(err.message || "Failed to delete category (Ensure no products belong to it)");
                        }
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Create New Category</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-category-name"
                  placeholder="e.g. Sofa Beds"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const nameInput = document.getElementById("new-category-name") as HTMLInputElement;
                    const val = nameInput?.value.trim();
                    if (!val) return;
                    try {
                      const newCat = await api.createCategory({ name: val });
                      setCategories([...categories, newCat]);
                      nameInput.value = "";
                      alert("Category created successfully!");
                    } catch (err: any) {
                      alert(err.message || "Failed to create category");
                    }
                  }}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Manage Material Types Modal */}
      {showMaterialTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-amber-50">
              <h3 className="text-base font-bold text-amber-900">⚙️ Manage Material Types</h3>
              <button
                type="button"
                onClick={() => setShowMaterialTypesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {materialTypes.map((mat, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-800 text-sm">{mat}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete material type "${mat}"?`)) {
                        updateMaterialTypes(materialTypes.filter((_, idx) => idx !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Add Material Option</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-material-name"
                  placeholder="e.g. Leatherette"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const matInput = document.getElementById("new-material-name") as HTMLInputElement;
                    const val = matInput?.value.trim();
                    if (!val) return;
                    if (materialTypes.includes(val)) {
                      alert("Material Type already exists!");
                      return;
                    }
                    updateMaterialTypes([...materialTypes, val]);
                    matInput.value = "";
                  }}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Manage Wood Types Modal */}
      {showWoodTypesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-emerald-50">
              <h3 className="text-base font-bold text-emerald-900">⚙️ Manage Wood Types</h3>
              <button
                type="button"
                onClick={() => setShowWoodTypesModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {woodTypes.map((wood, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-200">
                  <span className="font-semibold text-gray-800 text-sm">{wood}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete wood type "${wood}"?`)) {
                        updateWoodTypesState(woodTypes.filter((_, idx) => idx !== i));
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 border-t bg-gray-50">
              <h4 className="text-xs font-bold text-gray-600 uppercase mb-2">Add Wood Type Option</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="new-wood-name"
                  placeholder="e.g. Acacia"
                  className="flex-1 p-2 border rounded-lg text-xs outline-none bg-white font-medium"
                />
                <button
                  type="button"
                  onClick={() => {
                    const woodInput = document.getElementById("new-wood-name") as HTMLInputElement;
                    const val = woodInput?.value.trim();
                    if (!val) return;
                    if (woodTypes.includes(val)) {
                      alert("Wood Type already exists!");
                      return;
                    }
                    updateWoodTypesState([...woodTypes, val]);
                    woodInput.value = "";
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Receive supplier delivery modal */}
      {showGRNModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto my-4 animate-scaleUp">
            <div className="p-6 border-b flex items-center justify-between bg-blue-50 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-blue-900">Receive Supplier Delivery (GRN)</h3>
                <p className="text-xs text-blue-600 mt-1">Logs a physical stock delivery and adjusts costs/selling prices</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGRNModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            {branches.length === 0 && <div className="m-6 p-4 bg-yellow-50 text-yellow-750 border border-yellow-200 rounded-xl text-xs font-medium">⚠️ No warehouse locations registered yet. Please configure a warehouse first.</div>}
            {products.length === 0 && <div className="m-6 p-4 bg-yellow-50 text-yellow-750 border border-yellow-200 rounded-xl text-xs font-medium">⚠️ No products registered in catalog. Please add catalog products first.</div>}

            <form onSubmit={handleGRNSubmit} className="p-6 space-y-4">
              {/* Destination Warehouse */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Destination Warehouse *</label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select destination warehouse --</option>
                  {branches.filter(b => b.branch_type === "warehouse").map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Selector */}
              <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                    Registered Supplier Profile
                  </label>
                  <select
                    className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                    value={grnSupplierId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setGrnSupplierId(val);
                      if (val === "custom" || val === "") {
                        setGrnSupplierName("");
                        setGrnSupplierContact("");
                        setGrnSupplierPhone("");
                        setGrnSupplierEmail("");
                        setGrnSupplierAddress("");
                      } else {
                        const found = suppliers.find(s => s.id === val);
                        if (found) {
                          setGrnSupplierName(found.name);
                          setGrnSupplierContact(found.contact_person || "");
                          setGrnSupplierPhone(found.phone || "");
                          setGrnSupplierEmail(found.email || "");
                          setGrnSupplierAddress(found.address || "");
                        }
                      }
                    }}
                  >
                    <option value="">-- Choose registered supplier profile --</option>
                    {suppliers.filter(s => s.is_active !== false).map(s => (
                      <option key={s.id} value={s.id}>
                        🏢 {s.name}{s.contact_person ? ` (Contact: ${s.contact_person})` : ""}
                      </option>
                    ))}
                    <option value="custom">✍️ -- Enter Custom Supplier Name --</option>
                  </select>
                </div>

                {/* Custom Supplier Name input (only if custom is selected) */}
                {grnSupplierId === "custom" && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white font-semibold text-gray-700"
                      value={grnSupplierName}
                      onChange={(e) => setGrnSupplierName(e.target.value)}
                      placeholder="e.g. Timberwood Ltd"
                      required
                    />
                  </div>
                )}

                {/* Cute read-only Supplier details card */}
                {grnSupplierName ? (
                  <div className="bg-white border border-blue-100 rounded-xl p-3.5 shadow-sm space-y-2 mt-2">
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <span>📋</span> Supplier Details
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <span className="text-base">🏢</span>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">Company Name</div>
                          <div className="font-semibold text-gray-800">{grnSupplierName}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <span className="text-base">👤</span>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">Contact Person</div>
                          <div className="font-semibold text-gray-800">{grnSupplierContact || "—"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <span className="text-base">📞</span>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">Phone Number</div>
                          <div className="font-semibold text-gray-800">{grnSupplierPhone || "—"}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                        <span className="text-base">✉️</span>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">Email Address</div>
                          <div className="font-semibold text-gray-800 truncate max-w-[180px]" title={grnSupplierEmail}>{grnSupplierEmail || "—"}</div>
                        </div>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg">
                        <span className="text-base mt-0.5">📍</span>
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase">Office Address</div>
                          <div className="font-semibold text-gray-800 text-[11px] leading-relaxed">{grnSupplierAddress || "—"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-white border border-dashed rounded-xl text-xs text-gray-400">
                    💡 Choose a supplier profile above to display contact information.
                  </div>
                )}
              </div>

              {/* Invoice Reference & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Reference *</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-700 bg-white"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="INV-GRN-XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Receiving Date *</label>
                  <input
                    type="date"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white font-medium"
                    value={grnReceivingDate}
                    onChange={(e) => setGrnReceivingDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Products receiving table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-sm">📦 Received Product Items</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setGrnItemsList(prev => [...prev, {
                        product_id: "",
                        quantity_received: "",
                        cost_price: "",
                        selling_price: "",
                        commission: "0",
                        ordered_quantity: "",
                        damaged_quantity: "0",
                        batch_number: ""
                      }]);
                    }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    ➕ Add Product Item
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100/80 font-bold text-gray-700 uppercase border-b">
                      <tr>
                        <th className="p-2.5 w-60">Catalog Product *</th>
                        <th className="p-2.5 w-24 text-right">Received Qty *</th>
                        <th className="p-2.5 w-24 text-right">Unit Price (DP) *</th>
                        <th className="p-2.5 w-20 text-center">Comm (%)</th>
                        <th className="p-2.5 w-24 text-right">Net Cost</th>
                        <th className="p-2.5 w-24 text-right">Selling Price</th>
                        <th className="p-2.5 w-24 text-right">Ordered Qty</th>
                        <th className="p-2.5 w-20 text-right">Damaged</th>
                        <th className="p-2.5 w-24">Batch No.</th>
                        <th className="p-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {grnItemsList.map((item, idx) => {
                        const rawCost = parseFloat(item.cost_price || "0");
                        const commPct = parseFloat(item.commission || "0");
                        const netPrice = rawCost * (1 - commPct / 100);
                        
                        const handleItemChange = (field: string, value: string) => {
                          setGrnItemsList(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
                        };

                        return (
                          <tr key={idx} className="hover:bg-gray-55">
                            {/* Product selection */}
                            <td className="p-2">
                              <select
                                className="w-full p-1.5 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                value={item.product_id}
                                onChange={(e) => handleItemChange("product_id", e.target.value)}
                                required
                              >
                                <option value="" disabled>-- Select product --</option>
                                {products.map(p => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                                ))}
                              </select>
                            </td>

                             {/* Qty Received */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="w-full p-1.5 border rounded-lg text-right font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                                value={item.quantity_received}
                                onChange={(e) => handleItemChange("quantity_received", e.target.value)}
                                placeholder="0"
                                required
                              />
                            </td>

                            {/* Unit Cost / Cost Price */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="w-full p-1.5 border rounded-lg text-right font-semibold outline-none focus:ring-1 focus:ring-blue-500"
                                value={item.cost_price}
                                onChange={(e) => handleItemChange("cost_price", e.target.value)}
                                placeholder="0"
                                required
                              />
                            </td>

                            {/* Commission */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                max="100"
                                className="w-full p-1.5 border rounded-lg text-center outline-none focus:ring-1 focus:ring-orange-400 font-medium"
                                value={item.commission}
                                onChange={(e) => handleItemChange("commission", e.target.value)}
                                placeholder="0"
                              />
                            </td>

                            {/* Calculated Net Cost */}
                            <td className="p-2 text-right font-bold text-emerald-700 pr-3">
                              {item.cost_price ? formatPrice(netPrice) : "—"}
                            </td>

                            {/* Selling Price */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="w-full p-1.5 border rounded-lg text-right font-medium outline-none focus:ring-1 focus:ring-emerald-450"
                                value={item.selling_price}
                                onChange={(e) => handleItemChange("selling_price", e.target.value)}
                                placeholder="Optional"
                              />
                            </td>

                            {/* Ordered Qty */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="w-full p-1.5 border rounded-lg text-right outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                                value={item.ordered_quantity}
                                onChange={(e) => handleItemChange("ordered_quantity", e.target.value)}
                                placeholder="Auto"
                              />
                            </td>

                            {/* Damaged Qty */}
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                className="w-full p-1.5 border rounded-lg text-right outline-none focus:ring-1 focus:ring-red-400 font-medium"
                                value={item.damaged_quantity}
                                onChange={(e) => handleItemChange("damaged_quantity", e.target.value)}
                                placeholder="0"
                              />
                            </td>

                            {/* Batch Number */}
                            <td className="p-2">
                              <input
                                type="text"
                                className="w-full p-1.5 border rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700"
                                value={item.batch_number}
                                onChange={(e) => handleItemChange("batch_number", e.target.value)}
                                placeholder="Batch"
                              />
                            </td>

                            {/* Remove row */}
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  if (grnItemsList.length === 1) {
                                    alert("You must keep at least one product item row.");
                                    return;
                                  }
                                  setGrnItemsList(prev => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-red-500 hover:text-red-700 font-black text-lg px-2 py-0.5 hover:bg-red-50 rounded transition"
                                title="Remove item"
                              >
                                &times;
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Grand Order value summary */}
                {(() => {
                  const grossTotal = grnItemsList.reduce((sum, item) => sum + (parseFloat(item.quantity_received || "0") * parseFloat(item.cost_price || "0")), 0);
                  const totalOrderValue = grnItemsList.reduce((sum, item) => {
                    const raw = parseFloat(item.cost_price || "0");
                    const comm = parseFloat(item.commission || "0");
                    const qty = parseFloat(item.quantity_received || "0");
                    return sum + (qty * raw * (1 - comm / 100));
                  }, 0);
                  const totalItems = grnItemsList.reduce((sum, item) => sum + parseFloat(item.quantity_received || "0"), 0);

                  if (grossTotal > 0) {
                    return (
                      <div className="p-4 bg-blue-50 border-t border-blue-200 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold text-blue-900">
                        <div>
                          Received items total qty: <span className="font-bold text-gray-850">{totalItems}</span>
                        </div>
                        <div className="flex gap-4">
                          <div>
                            Gross Subtotal: <span className="font-bold text-gray-850">{formatPrice(grossTotal)}</span>
                          </div>
                          <div>
                            Total Order Value (Net): <span className="font-black text-emerald-800 text-sm">{formatPrice(totalOrderValue)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowGRNModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingGRN || products.length === 0 || branches.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
                >
                  {isSubmittingGRN ? "Confirming..." : "Confirm & Update Stock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Purchase Invoice Preview Modal */}
      {showInvoiceModal && activeGRN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto my-4 animate-scaleUp">
            <div className="p-5 border-b flex items-center justify-between bg-blue-900 sticky top-0 z-10">
              <div className="text-white">
                <h3 className="text-lg font-bold">Purchase Invoice Preview</h3>
                <p className="text-xs text-blue-200 mt-1">Reference: {activeGRN.invoice_reference || "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="px-3.5 py-2 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-sm"
                >
                  🖨 Print / Save PDF
                </button>
                <button
                  type="button"
                  onClick={handleEmailInvoice}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
                >
                  ✉️ Email Supplier
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold ml-2 transition-colors"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Standard Invoice Template */}
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h1 className="text-2xl font-extrabold text-blue-900">{companyName || "Manor Furniture"}</h1>
                  <p className="text-xs text-gray-500 mt-1">{companyAddress || "Bozlur Mor, Kushita"}</p>
                  <p className="text-xs text-gray-500">Contact: {companyContact ? `${companyContact} (${companyEmail || companyPhone})` : (companyEmail || "accounts@manorfurniture.com")}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-black text-gray-800 tracking-wider">PURCHASE INVOICE</h2>
                  <div className="text-xs text-gray-500 mt-1.5">
                    <p><strong>Ref:</strong> {activeGRN.invoice_reference || "—"}</p>
                    <p><strong>Date Received:</strong> {(() => {
                      const dateObj = new Date(activeGRN.created_at || activeGRN.receiving_date);
                      return dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    })()}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Supplier Profile</span>
                  <span className="font-bold text-gray-800 text-sm block">{activeGRN.supplier_name}</span>
                  {activeGRN.supplier_contact && <span className="text-xs text-gray-600 block mt-1">Contact: {activeGRN.supplier_contact}</span>}
                  {(activeGRN.supplier_phone || activeGRN.supplier_email) && (
                    <span className="text-xs text-gray-500 block">
                      {activeGRN.supplier_phone || ""} {activeGRN.supplier_email ? `| ${activeGRN.supplier_email}` : ""}
                    </span>
                  )}
                  {activeGRN.supplier_address && <span className="text-xs text-gray-500 block italic">{activeGRN.supplier_address}</span>}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Delivery Destination</span>
                  <span className="font-bold text-gray-800 text-sm">
                    {branches.find(b => b.id === activeGRN.branch_id)?.name || "Warehouse"}
                  </span>
                </div>
              </div>

              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-100 font-bold border-b text-gray-700">
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-left">SKU</th>
                      <th className="p-3 text-center">Ordered</th>
                      <th className="p-3 text-center">Received</th>
                      <th className="p-3 text-right">Unit Price (DP)</th>
                      <th className="p-3 text-right">Total Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(activeGRN.items || []).map((item: any) => {
                      const p = products.find(prod => prod.id === item.product_id);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-semibold text-gray-800">{p?.name || "Unknown Product"}</td>
                          <td className="p-3 font-mono text-xs text-gray-500">{p?.sku || "—"}</td>
                          <td className="p-3 text-center font-medium">{item.ordered_quantity || item.quantity_received}</td>
                          <td className="p-3 text-center font-bold text-green-700">{item.quantity_received}</td>
                          <td className="p-3 text-right font-semibold text-gray-700">{formatPrice(item.unit_price || item.cost_price)}</td>
                          <td className="p-3 text-right font-bold text-gray-800">{formatPrice(item.quantity_received * (item.unit_price || item.cost_price))}</td>
                        </tr>
                      );
                    })}
                    {(() => {
                      const grossTotal = (activeGRN.items || []).reduce((sum: number, item: any) => sum + (item.quantity_received * (item.unit_price || item.cost_price)), 0);
                      const currentDiscount = parseFloat(invoiceDiscount || "0");
                      const netPayable = Math.max(0, grossTotal - currentDiscount);
                      return (
                        <>
                          <tr className="bg-gray-50 text-gray-700 font-medium border-t">
                            <td colSpan={5} className="p-3 text-right text-xs uppercase tracking-wider">Gross Subtotal:</td>
                            <td colSpan={1} className="p-3 text-right text-sm font-bold text-gray-800">{formatPrice(grossTotal)}</td>
                          </tr>
                          <tr className="bg-gray-50 text-gray-750 font-medium">
                            <td colSpan={5} className="p-3 text-right text-xs uppercase tracking-wider">
                              <div className="flex items-center justify-end gap-2 text-orange-850">
                                <span>Discount Amount manually edit ({currency === "USD" ? "$" : "৳"}):</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={grossTotal}
                                  className="w-28 p-1.5 border rounded-lg text-right bg-white text-xs font-bold text-orange-700 outline-none focus:ring-2 focus:ring-orange-400"
                                  value={invoiceDiscount}
                                  onChange={(e) => setInvoiceDiscount(e.target.value)}
                                  placeholder="0.00"
                                />
                              </div>
                            </td>
                            <td colSpan={1} className="p-3 text-right text-sm font-bold text-orange-700">
                              − {formatPrice(currentDiscount)}
                            </td>
                          </tr>
                          <tr className="bg-blue-50 font-bold text-gray-900 border-t">
                            <td colSpan={5} className="p-4 text-right text-sm uppercase tracking-wider">Grand Total (Net Payable):</td>
                            <td colSpan={1} className="p-4 text-right text-lg text-blue-900 font-black">{formatPrice(netPayable)}</td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }} className="pt-6">
                <div style={{ textAlign: "center", width: "180px", borderTop: "1px solid #cbd5e1", paddingTop: "8px", fontSize: "11px", color: "#64748b" }}>
                  Authorized Signature
                </div>
                <div style={{ textAlign: "center", width: "180px", borderTop: "1px solid #cbd5e1", paddingTop: "8px", fontSize: "11px", color: "#64748b" }}>
                  Supplier Acknowledgment
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
              System generated invoice &bull; Manor Furniture ERP
            </div>
          </div>
        </div>
      )}
      {/* 8. Company Profile Edit Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="p-6 border-b flex items-center justify-between bg-blue-50 sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-blue-900">🏢 Update Company Profile</h3>
                <p className="text-xs text-blue-600 mt-1">This information is shown on GRN forms and invoices</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCompanyModal(false)}
                className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateCompanyProfile} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Company Name *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm font-semibold text-gray-800"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Manor Furniture"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Address *</label>
                <textarea
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-gray-700 h-20"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="e.g. Bozlur Mor, Kushita"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Number</label>
                  <input
                    type="text"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    placeholder="e.g. 01700000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email Address</label>
                  <input
                    type="email"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    placeholder="e.g. accounts@manor.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Authorized Signatory / Contact Person</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                  value={companyContact}
                  onChange={(e) => setCompanyContact(e.target.value)}
                  placeholder="e.g. Manager"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
