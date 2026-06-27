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
  }
};

export default function InventoryControlPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"products" | "warehouses" | "suppliers" | "transfers" | "adjustments" | "reports">("products");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const USD_EXCHANGE_RATE = 117.0;
  const formatPrice = (priceInBDT: number) => currency === "USD" ? "$" + (priceInBDT / USD_EXCHANGE_RATE).toFixed(2) : "৳" + priceInBDT.toFixed(2);

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
  const [invoiceRef, setInvoiceRef] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [grnQty, setGrnQty] = useState("");
  const [grnCostPrice, setGrnCostPrice] = useState("");
  const [grnCommission, setGrnCommission] = useState("");
  const [grnReceivingDate, setGrnReceivingDate] = useState(new Date().toISOString().split("T")[0]);
  const [grnOrderedQty, setGrnOrderedQty] = useState("");
  const [grnDamagedQty, setGrnDamagedQty] = useState("");
  const [grnBatchNumber, setGrnBatchNumber] = useState("");
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);
  const [grnSuccessMessage, setGrnSuccessMessage] = useState("");

  // Additional catalog filters
  const [filterSupplier, setFilterSupplier] = useState("");
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

    if (role && !["owner", "manager", "stock_handler"].includes(role)) {
      router.push("/");
      return;
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
    if (!newProductSku || !newProductName || !newProductPrice) return;
    
    setIsSubmittingProduct(true);
    setProductSuccessMessage("");
    
    try {
      const finalPrice = currency === "USD" 
        ? parseFloat(newProductPrice) * USD_EXCHANGE_RATE 
        : parseFloat(newProductPrice);
        
      const costValue = newProductCost ? (currency === "USD" ? parseFloat(newProductCost) * USD_EXCHANGE_RATE : parseFloat(newProductCost)) : 0.0;

      const payload = { 
          sku: newProductSku, 
          name: newProductName,
          unit: newProductUnit,
          selling_price: finalPrice,
          parent_id: newProductParentId || null,
          product_type: newProductType,
          color: newProductColor || null,
          size: newProductSize || null,
          purchase_cost: costValue,
          min_stock_level: newProductMinStock ? parseFloat(newProductMinStock) : 0.0,
          max_stock_level: newProductMaxStock ? parseFloat(newProductMaxStock) : 0.0,
          reorder_quantity: newProductReorderQty ? parseFloat(newProductReorderQty) : 0.0,
          category_id: newProductCategory || null,
          supplier_id: newProductSupplier || null,
          tax_rate: newProductTaxRate ? parseFloat(newProductTaxRate) : 0.0,
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
      setNewProductPrice("");
      setNewProductCost("");
      setNewProductColor("");
      setNewProductSize("");
      setNewProductMinStock("");
      setNewProductMaxStock("");
      setNewProductReorderQty("");
      setNewProductCategory("");
      setNewProductSupplier("");
      setNewProductTaxRate("");
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
    if (!editingProduct || !editSku || !editName || !editPrice) return;
    setIsUpdatingProduct(true);
    try {
      const finalPrice = currency === "USD" ? parseFloat(editPrice) * USD_EXCHANGE_RATE : parseFloat(editPrice);
      const costValue = editCost ? (currency === "USD" ? parseFloat(editCost) * USD_EXCHANGE_RATE : parseFloat(editCost)) : 0.0;
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
        min_stock_level: editMinStock ? parseFloat(editMinStock) : 0.0,
        max_stock_level: editMaxStock ? parseFloat(editMaxStock) : 0.0,
        reorder_quantity: editReorderQty ? parseFloat(editReorderQty) : 0.0,
        category_id: editCategory || null,
        supplier_id: editSupplier || null,
        tax_rate: editTaxRate ? parseFloat(editTaxRate) : 0.0,
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
    if (!selectedProductId || !grnQty || !grnCostPrice || !grnSupplierId || !selectedBranchId) return;

    setIsSubmittingGRN(true);
    setGrnSuccessMessage("");

    try {
      const rawPrice = parseFloat(grnCostPrice);
      const commissionPct = parseFloat(grnCommission || "0");
      // Purchase price = Unit Cost - Commission %
      const netCost = rawPrice * (1 - commissionPct / 100);
      const finalCost = currency === "USD" ? netCost * USD_EXCHANGE_RATE : netCost;

      const selectedSupplier = suppliers.find(s => s.id === grnSupplierId);
      const resolvedSupplierName = selectedSupplier?.name || "";

      const payload = {
        branch_id: selectedBranchId,
        supplier_name: resolvedSupplierName,
        invoice_reference: invoiceRef,
        receiving_date: grnReceivingDate || new Date().toISOString().split("T")[0],
        items: [{
          product_id: selectedProductId,
          quantity_received: parseFloat(grnQty),
          cost_price: finalCost,
          ordered_quantity: grnOrderedQty ? parseFloat(grnOrderedQty) : parseFloat(grnQty),
          damaged_quantity: grnDamagedQty ? parseFloat(grnDamagedQty) : 0.0,
          batch_number: grnBatchNumber || undefined
        }]
      };

      const newGRN = await api.submitGRN(payload);
      setGrns(prev => [newGRN, ...prev]);
      
      setGrnSuccessMessage(`✅ Successfully received ${grnQty} units from ${resolvedSupplierName}! Purchase Price: ${currency === "USD" ? "$" : "৳"}${netCost.toFixed(2)} per unit.`);
      setGrnSupplierId("");
      setGrnSupplierName("");
      setGrnQty("");
      setGrnCostPrice("");
      setGrnCommission("");
      setGrnReceivingDate(new Date().toISOString().split("T")[0]);
      setSelectedProductId(products.length > 0 ? products[0].id : "");
      setGrnOrderedQty("");
      setGrnDamagedQty("");
      setGrnBatchNumber("");
      setInvoiceRef(generateInvoiceRef());
      
      // Reload products, valuation & reports to show latest stocks & values
      const [updatedProducts, val, low] = await Promise.all([
        api.getProducts(),
        api.getValuationReport(),
        api.getLowStockReport()
      ]);
      setProducts(updatedProducts);
      setValuation(val);
      setLowStock(low);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to submit GRN. Check details.");
    } finally {
      setIsSubmittingGRN(false);
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
      const payload = {
        name: supplierName,
        contact_person: supplierContact,
        phone: supplierPhone,
        email: supplierEmail,
        address: supplierAddress,
      };
      const newS = await api.createSupplier(payload);
      setSuppliers(prev => [...prev, newS]);
      setSupplierName("");
      setSupplierContact("");
      setSupplierPhone("");
      setSupplierEmail("");
      setSupplierAddress("");
      alert("✅ Supplier registered successfully!");
    } catch (err) {
      alert("Failed to create supplier");
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

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Tabs */}
      <div className="flex space-x-2 mb-8 border-b pb-px">
        {([
          { id: "products", label: "Manage Products" },
          { id: "receiving", label: "Stock Receiving" },
          { id: "warehouses", label: "Warehouses" },
          { id: "suppliers", label: "Suppliers" },
          { id: "transfers", label: "Stock Transfers" },
          { id: "adjustments", label: "Adjustments Log" },
          { id: "reports", label: "Valuation & Reports" }
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mb-8">
          {/* Left Column: Form to create product */}
          <div className="bg-white p-6 rounded-xl border h-fit shadow-sm lg:col-span-1">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Add New Product to Catalog</h2>
            {productSuccessMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{productSuccessMessage}</div>}
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">SKU Reference</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductSku} onChange={(e) => setNewProductSku(e.target.value)} placeholder="SKU (e.g., WD-CH-01)" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Unit</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white" value={newProductUnit} onChange={(e) => setNewProductUnit(e.target.value)}>
                    <option value="Pieces">Pieces</option>
                    <option value="Cubic Feet">Cubic Feet (cft)</option>
                    <option value="Kg">Kilograms (kg)</option>
                    <option value="Square Feet">Square Feet (sqft)</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Name</label>
                <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductName} onChange={(e) => setNewProductName(e.target.value)} placeholder="Product Name (e.g., Oak Wood Dining Chair)" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Type</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white" value={newProductType} onChange={(e) => setNewProductType(e.target.value)}>
                    <option value="finished_product">Finished Furniture Product</option>
                    <option value="raw_material">Raw Material (Wood/Board)</option>
                    <option value="semi_finished_product">Semi Finished component</option>
                    <option value="consumable">Consumable Item</option>
                    <option value="spare_parts">Spare Parts</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Parent Template (For Variations)</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white" value={newProductParentId} onChange={(e) => setNewProductParentId(e.target.value)}>
                    <option value="">-- No Parent (Simple or Master Template) --</option>
                    {products.filter(p => !p.parent_id).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Category</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white" value={newProductCategory} onChange={(e) => setNewProductCategory(e.target.value)}>
                    <option value="">-- No Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Default Supplier</label>
                  <select className="w-full p-2.5 border rounded-lg bg-white" value={newProductSupplier} onChange={(e) => setNewProductSupplier(e.target.value)}>
                    <option value="">-- No Supplier --</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Selling Price ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg" value={newProductPrice} onChange={(e) => setNewProductPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Estimated Purchase Cost ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg" value={newProductCost} onChange={(e) => setNewProductCost(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tax/VAT rate (%)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductTaxRate} onChange={(e) => setNewProductTaxRate(e.target.value)} placeholder="e.g. 5.0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Color Variation</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductColor} onChange={(e) => setNewProductColor(e.target.value)} placeholder="e.g. Cherry Red" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Material Type</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductMaterialType} onChange={(e) => setNewProductMaterialType(e.target.value)} placeholder="e.g. Solid Wood" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Wood Type</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductWoodType} onChange={(e) => setNewProductWoodType(e.target.value)} placeholder="e.g. Oak, Teak" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Board Type</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductBoardType} onChange={(e) => setNewProductBoardType(e.target.value)} placeholder="e.g. MDF" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Weight (kg)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductWeight} onChange={(e) => setNewProductWeight(e.target.value)} placeholder="e.g. 15.0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Thickness (mm)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductThickness} onChange={(e) => setNewProductThickness(e.target.value)} placeholder="e.g. 18.0" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Length (inch)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductLength} onChange={(e) => setNewProductLength(e.target.value)} placeholder="36" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Width (inch)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductWidth} onChange={(e) => setNewProductWidth(e.target.value)} placeholder="24" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Height (inch)</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductHeight} onChange={(e) => setNewProductHeight(e.target.value)} placeholder="30" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Min Stock</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductMinStock} onChange={(e) => setNewProductMinStock(e.target.value)} placeholder="5.0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Max Stock</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductMaxStock} onChange={(e) => setNewProductMaxStock(e.target.value)} placeholder="50.0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Reorder Qty</label>
                  <input type="number" step="0.1" className="w-full p-2.5 border rounded-lg" value={newProductReorderQty} onChange={(e) => setNewProductReorderQty(e.target.value)} placeholder="20.0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Product Image Link</label>
                <input type="text" className="w-full p-2.5 border rounded-lg" value={newProductImage} onChange={(e) => setNewProductImage(e.target.value)} placeholder="e.g. /images/chair.jpg" />
              </div>

              <button type="submit" disabled={isSubmittingProduct} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition">Add Product to Catalog</button>
            </form>

            {/* Create Category inline */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Create Category</h3>
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input type="text" className="flex-1 p-2 border rounded-lg text-sm outline-none" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="e.g. Dining Chairs" required />
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition">Create</button>
              </form>
            </div>
          </div>

          {/* Right Column: Catalog List with Filters */}
          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Current Catalog ({products.filter(p => {
                const matchesSearch = searchQuery === "" || 
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
                  
                const matchesType = filterType === "" || p.product_type === filterType;
                const matchesParent = filterParent === "" || 
                  (filterParent === "templates" ? !p.parent_id : p.parent_id === filterParent);
                const matchesCategory = filterCategory === "" || p.category_id === filterCategory;
                const matchesSupplier = filterSupplier === "" || p.supplier_id === filterSupplier;
                const matchesStockStatus = (() => {
                  if (filterStockStatus === "") return true;
                  const stock = p.current_stock;
                  const min = p.min_stock_level || 0;
                  const max = p.max_stock_level || 0;
                  if (filterStockStatus === "out_of_stock") return stock === 0;
                  if (filterStockStatus === "low_stock") return stock > 0 && stock <= min;
                  if (filterStockStatus === "overstock") return max > 0 && stock >= max;
                  if (filterStockStatus === "available") return stock > min && (max === 0 || stock < max);
                  return true;
                })();
                const matchesDateRange = (() => {
                  const date = new Date(p.updated_at || p.created_at || Date.now());
                  if (filterStartDate) {
                    const start = new Date(filterStartDate);
                    start.setHours(0, 0, 0, 0);
                    if (date < start) return false;
                  }
                  if (filterEndDate) {
                    const end = new Date(filterEndDate);
                    end.setHours(23, 59, 59, 999);
                    if (date > end) return false;
                  }
                  return true;
                })();
                  
                return matchesSearch && matchesType && matchesParent && matchesCategory && matchesSupplier && matchesStockStatus && matchesDateRange;
              }).length})</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 mr-2 bg-gray-150 p-1 rounded-lg border">
                  <button type="button" onClick={() => setCurrency("BDT")} className={`px-2 py-1 text-xs font-bold rounded ${currency === "BDT" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"}`}>BDT</button>
                  <button type="button" onClick={() => setCurrency("USD")} className={`px-2 py-1 text-xs font-bold rounded ${currency === "USD" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"}`}>USD</button>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search SKU, name, barcode..."
                  className="p-2 border rounded-lg text-sm w-48 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`p-2 rounded-lg text-sm font-bold border transition ${showAdvancedFilters ? "bg-blue-600 text-white border-blue-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                >
                  ⚙️ Filters {showAdvancedFilters ? "▲" : "▼"}
                </button>
              </div>
            </div>

            {/* Collapsible Advanced Filters Section */}
            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 rounded-xl border mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Type</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="finished_product">Finished Product</option>
                    <option value="raw_material">Raw Material</option>
                    <option value="semi_finished_product">Semi Finished</option>
                    <option value="consumable">Consumable</option>
                    <option value="spare_parts">Spare Parts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Default Supplier</label>
                  <select
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">All Suppliers</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Warehouse Stock Location</label>
                  <select
                    value={filterWarehouse}
                    onChange={(e) => setFilterWarehouse(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">All Warehouses</option>
                    {branches.filter(b => b.branch_type === "warehouse").map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Status</label>
                  <select
                    value={filterStockStatus}
                    onChange={(e) => setFilterStockStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="available">Available Stock</option>
                    <option value="low_stock">Low Stock Alerts</option>
                    <option value="out_of_stock">Out Of Stock</option>
                    <option value="overstock">Overstock Alerts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Parent/Variant Relation</label>
                  <select
                    value={filterParent}
                    onChange={(e) => setFilterParent(e.target.value)}
                    className="w-full p-2 border rounded-lg text-xs bg-white outline-none"
                  >
                    <option value="">All Parents/Variants</option>
                    <option value="templates">Templates (No Parent)</option>
                    {products.filter(p => !p.parent_id).map(p => (
                      <option key={p.id} value={p.id}>Variants of {p.sku}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Updated Start Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Updated End Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full p-1.5 border rounded-lg text-xs outline-none bg-white"
                  />
                </div>
              </div>
            )}

            {products.filter(p => {
              const matchesSearch = searchQuery === "" || 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
                
              const matchesType = filterType === "" || p.product_type === filterType;
              const matchesParent = filterParent === "" || 
                (filterParent === "templates" ? !p.parent_id : p.parent_id === filterParent);
              const matchesCategory = filterCategory === "" || p.category_id === filterCategory;
              const matchesSupplier = filterSupplier === "" || p.supplier_id === filterSupplier;
              const matchesStockStatus = (() => {
                if (filterStockStatus === "") return true;
                const stock = p.current_stock;
                const min = p.min_stock_level || 0;
                const max = p.max_stock_level || 0;
                if (filterStockStatus === "out_of_stock") return stock === 0;
                if (filterStockStatus === "low_stock") return stock > 0 && stock <= min;
                if (filterStockStatus === "overstock") return max > 0 && stock >= max;
                if (filterStockStatus === "available") return stock > min && (max === 0 || stock < max);
                return true;
              })();
              const matchesDateRange = (() => {
                const date = new Date(p.updated_at || p.created_at || Date.now());
                if (filterStartDate) {
                  const start = new Date(filterStartDate);
                  start.setHours(0, 0, 0, 0);
                  if (date < start) return false;
                }
                if (filterEndDate) {
                  const end = new Date(filterEndDate);
                  end.setHours(23, 59, 59, 999);
                  if (date > end) return false;
                }
                return true;
              })();
                
              return matchesSearch && matchesType && matchesParent && matchesCategory && matchesSupplier && matchesStockStatus && matchesDateRange;
            }).length === 0 ? (
              <p className="text-sm text-gray-500">No products match search criteria.</p>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-3">
                {products.filter(p => {
                  const matchesSearch = searchQuery === "" || 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));
                    
                  const matchesType = filterType === "" || p.product_type === filterType;
                  const matchesParent = filterParent === "" || 
                    (filterParent === "templates" ? !p.parent_id : p.parent_id === filterParent);
                  const matchesCategory = filterCategory === "" || p.category_id === filterCategory;
                  const matchesSupplier = filterSupplier === "" || p.supplier_id === filterSupplier;
                  const matchesStockStatus = (() => {
                    if (filterStockStatus === "") return true;
                    const stock = p.current_stock;
                    const min = p.min_stock_level || 0;
                    const max = p.max_stock_level || 0;
                    if (filterStockStatus === "out_of_stock") return stock === 0;
                    if (filterStockStatus === "low_stock") return stock > 0 && stock <= min;
                    if (filterStockStatus === "overstock") return max > 0 && stock >= max;
                    if (filterStockStatus === "available") return stock > min && (max === 0 || stock < max);
                    return true;
                  })();
                  const matchesDateRange = (() => {
                    const date = new Date(p.updated_at || p.created_at || Date.now());
                    if (filterStartDate) {
                      const start = new Date(filterStartDate);
                      start.setHours(0, 0, 0, 0);
                      if (date < start) return false;
                    }
                    if (filterEndDate) {
                      const end = new Date(filterEndDate);
                      end.setHours(23, 59, 59, 999);
                      if (date > end) return false;
                    }
                    return true;
                  })();
                    
                  return matchesSearch && matchesType && matchesParent && matchesCategory && matchesSupplier && matchesStockStatus && matchesDateRange;
                }).map(p => (
                  <div key={p.id} className="p-4 bg-gray-50 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition">
                    <div>
                      <div className="font-bold text-gray-900 flex items-center gap-2">
                        {p.name}
                        {!p.is_active && (
                          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                        {(() => {
                          const stock = p.current_stock;
                          const min = p.min_stock_level || 0;
                          const max = p.max_stock_level || 0;
                          let badgeColor = "bg-green-150 text-green-800";
                          let text = "Available";
                          if (stock === 0) {
                            badgeColor = "bg-gray-200 text-gray-800";
                            text = "Out of Stock";
                          } else if (stock <= min) {
                            badgeColor = "bg-red-100 text-red-800";
                            text = "Low Stock";
                          } else if (max > 0 && stock >= max) {
                            badgeColor = "bg-purple-100 text-purple-855";
                            text = "Overstock";
                          }
                          return (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
                              {text}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="text-xs text-gray-505 mt-1">
                        SKU: {p.sku} | Type: <span className="capitalize">{p.product_type?.replace('_', ' ')}</span>
                        {p.category_id && (() => {
                          const catName = categories.find(c => c.id === p.category_id)?.name;
                          return catName ? ` | Category: ${catName}` : "";
                        })()}
                      </div>
                      {p.color || p.size ? (
                        <div className="text-[10px] bg-white border border-gray-250 px-2 py-0.5 rounded text-gray-655 font-semibold w-fit mt-1">
                          Spec: {p.color || "-"} | {p.size || "-"}
                        </div>
                      ) : null}
                      <div className="text-[10px] text-gray-400 mt-1">
                        Last Updated: {p.updated_at ? new Date(p.updated_at).toLocaleString() : new Date(p.created_at || Date.now()).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                      <div className="text-right">
                        <div className="font-extrabold text-emerald-700">{formatPrice(p.selling_price)}</div>
                        <div className="text-xs text-gray-400 font-medium">Stock: {p.current_stock} {p.unit || 'pcs'}</div>
                        <div className="text-[10px] text-gray-405 font-bold mt-0.5">Value: {formatPrice(p.current_stock * (p.purchase_cost || p.selling_price))}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenProductDetail(p)}
                          className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 font-bold rounded-lg text-xs transition"
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditProduct(p)}
                          className="px-3 py-1.5 bg-gray-200 text-gray-800 hover:bg-gray-300 font-bold rounded-lg text-xs transition"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "receiving" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form to receive delivery (GRN) */}
          <div className="bg-white p-6 rounded-xl border h-fit shadow-sm lg:col-span-1">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Receive Supplier Delivery (GRN)</h3>
            {grnSuccessMessage && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg">{grnSuccessMessage}</div>}
            
            {branches.length === 0 && <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-250">⚠️ No warehouse locations registered yet.</div>}
            {products.length === 0 && <div className="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-250">⚠️ No products registered in catalog.</div>}
            
            <form onSubmit={handleGRNSubmit} className="space-y-4">
              {/* Destination Warehouse */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Destination Warehouse</label>
                <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={selectedBranchId} onChange={(e) => setSelectedBranchId(e.target.value)} required>
                  <option value="" disabled>-- Select destination warehouse --</option>
                  {branches.filter(b => b.branch_type === "warehouse").map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Supplier Dropdown (registered suppliers only) */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Select Supplier
                  {suppliers.length === 0 && <span className="ml-2 text-red-500 normal-case font-normal">(No suppliers registered yet)</span>}
                </label>
                <select
                  className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  value={grnSupplierId}
                  onChange={(e) => setGrnSupplierId(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Select registered supplier --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}{s.contact_person ? ` — ${s.contact_person}` : ""}
                    </option>
                  ))}
                </select>
                {grnSupplierId && (() => {
                  const sup = suppliers.find(s => s.id === grnSupplierId);
                  return sup ? (
                    <div className="mt-1 text-[10px] text-gray-500 flex gap-3">
                      {sup.phone && <span>📞 {sup.phone}</span>}
                      {sup.email && <span>✉️ {sup.email}</span>}
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Invoice Reference & Receiving Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Reference</label>
                  <input type="text" className="w-full p-2.5 border rounded-lg bg-gray-100 outline-none font-semibold text-gray-600 text-sm" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="INV-GRN-XXXX" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Receiving Date</label>
                  <input type="date" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={grnReceivingDate} onChange={(e) => setGrnReceivingDate(e.target.value)} required />
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Select Catalog Product</label>
                <select className="w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required>
                  <option value="" disabled>-- Select product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              {/* Qty & Unit Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Quantity Received</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={grnQty} onChange={(e) => setGrnQty(e.target.value)} placeholder="e.g. 50" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Unit Cost ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={grnCostPrice} onChange={(e) => setGrnCostPrice(e.target.value)} placeholder="e.g. 1500" required />
                </div>
              </div>

              {/* Commission & Auto Purchase Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Commission (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                    value={grnCommission}
                    onChange={(e) => setGrnCommission(e.target.value)}
                    placeholder="e.g. 5"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Commission deducted from unit cost</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Purchase Price ({currency === "USD" ? "$" : "৳"})</label>
                  <div className={`w-full p-2.5 rounded-lg border-2 font-bold text-lg ${
                    grnCostPrice
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-gray-50 border-gray-200 text-gray-400"
                  }`}>
                    {grnCostPrice
                      ? (() => {
                          const raw = parseFloat(grnCostPrice || "0");
                          const comm = parseFloat(grnCommission || "0");
                          const net = raw * (1 - comm / 100);
                          return `${currency === "USD" ? "$" : "৳"}${net.toFixed(2)}`;
                        })()
                      : "—"}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {grnCommission ? `Unit Cost × (1 − ${grnCommission}%)` : "Unit Cost (no commission)"}
                  </p>
                </div>
              </div>

              {/* Ordered / Damaged / Batch */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ordered Qty</label>
                  <input type="number" step="0.01" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={grnOrderedQty} onChange={(e) => setGrnOrderedQty(e.target.value)} placeholder="50" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Damaged Qty</label>
                  <input type="number" step="0.01" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={grnDamagedQty} onChange={(e) => setGrnDamagedQty(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batch No.</label>
                  <input type="text" className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={grnBatchNumber} onChange={(e) => setGrnBatchNumber(e.target.value)} placeholder="B-88" />
                </div>
              </div>

              {/* Summary before submit */}
              {grnCostPrice && grnQty && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 space-y-1">
                  <div className="font-bold text-sm mb-1">📦 Order Summary</div>
                  <div className="flex justify-between"><span>Unit Cost:</span><span className="font-semibold">{currency === "USD" ? "$" : "৳"}{parseFloat(grnCostPrice).toFixed(2)}</span></div>
                  {grnCommission && parseFloat(grnCommission) > 0 && (
                    <div className="flex justify-between text-orange-700"><span>Commission ({grnCommission}%):</span><span>− {currency === "USD" ? "$" : "৳"}{(parseFloat(grnCostPrice) * parseFloat(grnCommission) / 100).toFixed(2)}</span></div>
                  )}
                  <div className="flex justify-between font-bold border-t border-blue-200 pt-1"><span>Purchase Price / unit:</span><span className="text-emerald-700">{currency === "USD" ? "$" : "৳"}{(parseFloat(grnCostPrice) * (1 - parseFloat(grnCommission || "0") / 100)).toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold"><span>Total Order Value:</span><span className="text-blue-900">{currency === "USD" ? "$" : "৳"}{(parseFloat(grnQty) * parseFloat(grnCostPrice) * (1 - parseFloat(grnCommission || "0") / 100)).toFixed(2)}</span></div>
                </div>
              )}

              <button type="submit" disabled={isSubmittingGRN || products.length === 0 || branches.length === 0 || suppliers.length === 0} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg transition hover:bg-blue-700 disabled:bg-gray-400">
                {isSubmittingGRN ? "Processing..." : "Confirm Delivery & Update Stock"}
              </button>
            </form>
          </div>

          {/* Right Column: Receiving History Table */}
          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm flex flex-col">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Receiving Log History ({
                grns.flatMap(g => (g.items || []).map(i => ({ ...i, grn: g }))).length
              } line items)</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-505 font-bold">Show Currency:</span>
                <div className="flex items-center gap-2 bg-gray-150 p-1 rounded-lg border">
                  <button type="button" onClick={() => setCurrency("BDT")} className={`px-2 py-1 text-xs font-bold rounded ${currency === "BDT" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"}`}>BDT</button>
                  <button type="button" onClick={() => setCurrency("USD")} className={`px-2 py-1 text-xs font-bold rounded ${currency === "USD" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"}`}>USD</button>
                </div>
              </div>
            </div>

            {grns.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No supplier deliveries received yet.</p>
            ) : (
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="w-full text-left text-xs text-gray-550 border-collapse">
                  <thead className="bg-gray-100 uppercase text-gray-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-3 border-b">Date / Ref</th>
                      <th className="p-3 border-b">Product Details</th>
                      <th className="p-3 border-b text-right">Ordered Qty</th>
                      <th className="p-3 border-b text-right">Received Qty</th>
                      <th className="p-3 border-b text-right">Damaged Qty</th>
                      <th className="p-3 border-b text-right">Unit Cost</th>
                      <th className="p-3 border-b text-right">Total Cost</th>
                      <th className="p-3 border-b">Destination WH</th>
                      <th className="p-3 border-b text-center">Batch No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grns.flatMap(grn => {
                      const dateStr = new Date(grn.created_at).toLocaleString();
                      const whName = branches.find(b => b.id === grn.branch_id)?.name || "Warehouse";
                      
                      return (grn.items || []).map((item: any) => {
                        const productObj = products.find(p => p.id === item.product_id);
                        
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                            <td className="p-3 whitespace-nowrap">
                              <span className="font-semibold text-gray-900 block">{grn.invoice_reference}</span>
                              <span className="text-[10px] text-gray-400 block">{dateStr}</span>
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-gray-800 block">{productObj?.name || "Unknown Product"}</span>
                              <span className="text-[10px] text-gray-400 block">SKU: {productObj?.sku || item.product_id}</span>
                            </td>
                            <td className="p-3 text-right font-semibold">{item.ordered_quantity || item.quantity_received}</td>
                            <td className="p-3 text-right font-bold text-green-700">{item.quantity_received}</td>
                            <td className="p-3 text-right font-bold text-red-600">{item.damaged_quantity || 0}</td>
                            <td className="p-3 text-right font-semibold text-emerald-800">{formatPrice(item.cost_price)}</td>
                            <td className="p-3 text-right font-bold text-blue-900">{formatPrice(item.subtotal)}</td>
                            <td className="p-3 font-semibold text-gray-700">{whName}</td>
                            <td className="p-3 text-center"><span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px]">{item.batch_number || "-"}</span></td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

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
            <h3 className="text-lg font-bold text-gray-800 mb-4">Register Supplier</h3>
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
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
              >
                Register Supplier
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-xl border lg:col-span-2 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Active Suppliers ({suppliers.length})</h3>
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
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map(s => (
                      <tr key={s.id} className="border-b hover:bg-gray-55">
                        <td className="p-3 font-semibold text-gray-900">{s.name}</td>
                        <td className="p-3">{s.contact_person || "-"}</td>
                        <td className="p-3">{s.phone || "-"}</td>
                        <td className="p-3">{s.email || "-"}</td>
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
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
                  reportsNestedTab === tab.id
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
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Selling Price ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estimated Purchase Cost ({currency === "USD" ? "$" : "৳"})</label>
                  <input type="number" step="0.01" className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={editCost} onChange={(e) => setEditCost(e.target.value)} />
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
                  className={`px-4 py-3 font-semibold text-sm border-b-2 transition-all capitalize ${
                    detailActiveTab === tab
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
                      <span className="text-2xl font-bold text-emerald-950">{formatPrice(viewingProductDetail.product.selling_price)}</span>
                    </div>
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Purchase Cost</span>
                      <span className="text-2xl font-bold text-purple-950">{formatPrice(viewingProductDetail.product.purchase_cost || 0)}</span>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Min Stock Limit</span>
                      <span className="text-2xl font-bold text-orange-955">{viewingProductDetail.product.min_stock_level || 0}</span>
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
    </div>
  );
}
