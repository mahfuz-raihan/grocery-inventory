"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  api,
  Branch,
  LowStockItem,
  Product,
  Supplier,
  Transfer,
  Adjustment,
  ValuationReport,
} from "./types";

import { StockListTab } from "./components/tabs/StockListTab";
import { ProductsTab } from "./components/tabs/ProductsTab";
import { ReceivingTab } from "./components/tabs/ReceivingTab";
import { WarehousesTab } from "./components/tabs/WarehousesTab";
import { SuppliersTab } from "./components/tabs/SuppliersTab";
import { TransfersTab } from "./components/tabs/TransfersTab";
import { AdjustmentsTab } from "./components/tabs/AdjustmentsTab";
import { ReportsTab } from "./components/tabs/ReportsTab";

// Lazy-load all modals so they are only fetched when opened
const ProductDetailModal = dynamic(
  () => import("./components/modals/ProductDetailModal").then((mod) => mod.ProductDetailModal),
  { ssr: false }
);
const AddProductModal = dynamic(
  () => import("./components/modals/AddProductModal").then((mod) => mod.AddProductModal),
  { ssr: false }
);
const EditProductModal = dynamic(
  () => import("./components/modals/EditProductModal").then((mod) => mod.EditProductModal),
  { ssr: false }
);
const GRNModal = dynamic(() => import("./components/modals/GRNModal").then((mod) => mod.GRNModal), {
  ssr: false,
});
const InvoicePreviewModal = dynamic(
  () => import("./components/modals/InvoicePreviewModal").then((mod) => mod.InvoicePreviewModal),
  { ssr: false }
);
const CompanyProfileModal = dynamic(
  () => import("./components/modals/CompanyProfileModal").then((mod) => mod.CompanyProfileModal),
  { ssr: false }
);
const ManageAttributesModals = dynamic(
  () => import("./components/modals/ManageAttributesModals"),
  { ssr: false }
);

export default function InventoryControlPage() {
  const router = useRouter();

  // Navigation & User State
  const [activeTab, setActiveTab] = useState<string>("products");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [rbacRules, setRbacRules] = useState<any>(null);
  const [currency, setCurrency] = useState<"BDT" | "USD">("BDT");
  const [loading, setLoading] = useState(true);

  // Core Data State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<{ key: string; label: string }[]>([]);
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [woodTypes, setWoodTypes] = useState<string[]>([]);

  // Tab-Specific Data State
  const [stockListData, setStockListData] = useState<any[]>([]);
  const [stockListSummary, setStockListSummary] = useState<any>(null);
  const [stockListLoading, setStockListLoading] = useState(true);
  const [grns, setGrns] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [valuation, setValuation] = useState<ValuationReport | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>(null);

  // Alert & Notification State
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationsDismissed, setNotificationsDismissed] = useState(false);

  // Modal Visibility State
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewingProductDetail, setViewingProductDetail] = useState<any>(null);
  const [showGRNModal, setShowGRNModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeGRN, setActiveGRN] = useState<any>(null);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showProductTypesModal, setShowProductTypesModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showMaterialTypesModal, setShowMaterialTypesModal] = useState(false);
  const [showWoodTypesModal, setShowWoodTypesModal] = useState(false);

  // Load custom attributes from localStorage
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

  useEffect(() => {
    const role = localStorage.getItem("erp_role");
    const email = localStorage.getItem("erp_email") || "";
    setUserRole(role);
    setUserEmail(email);

    if (
      role &&
      !["owner", "manager", "stock_handler", "purchase_user", "production_user", "sales_user"].includes(role)
    ) {
      router.push("/");
      return;
    }

    // Role-default tab
    if (role === "sales_user") {
      setActiveTab("stock_list");
    } else if (role === "purchase_user") {
      setActiveTab("receiving");
    } else if (role === "production_user") {
      setActiveTab("transfers");
    }

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
          { key: "spare_parts", label: "Spare Parts" },
        ];
        setProductTypes(defaults);
        localStorage.setItem("product_types", JSON.stringify(defaults));
      }

      const storedMats = localStorage.getItem("material_types");
      if (storedMats) {
        setMaterialTypes(JSON.parse(storedMats));
      } else {
        const defaults = [
          "Solid Wood",
          "Plywood",
          "MDF",
          "HDF",
          "Particle Board",
          "Veneer",
          "Metal",
          "Glass",
          "Plastic",
        ];
        setMaterialTypes(defaults);
        localStorage.setItem("material_types", JSON.stringify(defaults));
      }

      const storedWoods = localStorage.getItem("wood_types");
      if (storedWoods) {
        setWoodTypes(JSON.parse(storedWoods));
      } else {
        const defaults = [
          "Teak",
          "Oak",
          "Mahogany",
          "Pine",
          "Maple",
          "Walnut",
          "Cherry",
          "Rosewood",
          "Garjan",
          "Gamari",
        ];
        setWoodTypes(defaults);
        localStorage.setItem("wood_types", JSON.stringify(defaults));
      }
    }

    const loadInitialData = async () => {
      try {
        const userBranchId = localStorage.getItem("erp_branch_id") || "";

        let rulesData = null;
        try {
          rulesData = await api.getSetting("rbac_rules");
          setRbacRules(rulesData);
        } catch (rulesErr) {
          rulesData = {
            visible_inventory_tabs: {
              owner: [
                "stock_list",
                "products",
                "receiving",
                "warehouses",
                "suppliers",
                "transfers",
                "adjustments",
                "reports",
              ],
              manager: ["stock_list", "products", "receiving", "reports"],
              cashier: ["stock_list", "products"],
              stock_handler: ["stock_list", "products"],
            },
            pos_warehouse_select: ["owner"],
            product_price_edit: ["owner"],
            company_profile_edit: ["owner"],
          };
          setRbacRules(rulesData);
        }

        const [
          branchesData,
          suppliersData,
          productsData,
          valData,
          lowData,
          categoriesData,
          stockListDataRes,
          stockSummaryRes,
        ] = await Promise.all([
          api.getBranches(),
          api.getSuppliers(),
          api.getProducts(),
          api.getValuationReport(),
          api.getLowStockReport(),
          api.getCategories(),
          api.getStockList(role !== "owner" && userBranchId ? { branch_id: userBranchId } : undefined),
          api.getStockListSummary(),
        ]);

        setBranches(branchesData);
        setSuppliers(suppliersData);
        setProducts(productsData);
        setValuation(valData);
        setLowStock(lowData);
        setCategories(categoriesData);
        setStockListData(stockListDataRes);
        setStockListSummary(stockSummaryRes);
        setStockListLoading(false);

        // Fetch company profile in background
        api
          .getCompanyProfile()
          .then((profile) => setCompanyProfile(profile))
          .catch((err) => console.error("Could not fetch company profile", err));
      } catch (err) {
        console.error("Failed to load inventory control data", err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [router]);

  // On-demand fetching when tab is switched
  useEffect(() => {
    if (activeTab === "receiving" && grns.length === 0) {
      api.getGRNs().then((data) => setGrns(data)).catch((e) => console.error(e));
    } else if (activeTab === "transfers" && transfers.length === 0) {
      api.getTransfers().then((data) => setTransfers(data)).catch((e) => console.error(e));
    } else if (activeTab === "adjustments" && adjustments.length === 0) {
      api.getAdjustments().then((data) => setAdjustments(data)).catch((e) => console.error(e));
    }
  }, [activeTab, grns.length, transfers.length, adjustments.length]);

  const handleOpenProductDetail = async (p: Product) => {
    try {
      const details = await api.getProductDetail(p.id);
      setViewingProductDetail(details);
    } catch (err) {
      console.error("Failed to load product details", err);
    }
  };

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
  };

  const handleViewInvoice = (grn: any) => {
    setActiveGRN(grn);
    setShowInvoiceModal(true);
  };

  const reloadSummaryAndReports = async () => {
    try {
      const [val, low, updatedStockList, updatedSummary] = await Promise.all([
        api.getValuationReport(),
        api.getLowStockReport(),
        api.getStockList(),
        api.getStockListSummary(),
      ]);
      setValuation(val);
      setLowStock(low);
      setStockListData(updatedStockList);
      setStockListSummary(updatedSummary);
    } catch (err) {
      console.error("Failed to reload summary and reports", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-slate-400 font-semibold animate-pulse">Loading Inventory Control Panel...</div>
      </div>
    );
  }

  // Role-based tab visibility
  const allTabs = [
    {
      id: "stock_list",
      label: "📋 Stock List",
      roles: ["owner", "manager", "stock_handler", "purchase_user", "production_user", "sales_user"],
    },
    { id: "products", label: "Manage Products", roles: ["owner", "manager", "stock_handler"] },
    { id: "receiving", label: "Stock Receiving", roles: ["owner", "manager", "stock_handler", "purchase_user"] },
    { id: "warehouses", label: "Warehouses", roles: ["owner", "manager"] },
    { id: "suppliers", label: "Suppliers", roles: ["owner", "manager", "purchase_user"] },
    { id: "transfers", label: "Stock Transfers", roles: ["owner", "manager", "stock_handler", "production_user"] },
    { id: "adjustments", label: "Adjustments Log", roles: ["owner", "manager"] },
    { id: "reports", label: "Valuation & Reports", roles: ["owner", "manager", "stock_handler"] },
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (rbacRules && userRole) {
      const allowedTabs = rbacRules.visible_inventory_tabs[userRole] || [];
      return allowedTabs.includes(tab.id);
    }
    if (userRole && !tab.roles.includes(userRole)) return false;
    if (userRole && userRole !== "owner" && ["warehouses", "suppliers", "transfers", "adjustments"].includes(tab.id)) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      {/* Low Stock Notification Banner */}
      {lowStock.length > 0 && !notificationsDismissed && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-4 animate-pulse-once">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-lg">🚨</span>
            <div>
              <span className="font-bold text-red-800 text-sm">
                {lowStock.length} product{lowStock.length > 1 ? "s" : ""} below minimum stock level!
              </span>
              <span className="ml-2 text-red-600 text-xs">
                {lowStock
                  .slice(0, 3)
                  .map((l) => l.name)
                  .join(", ")}
                {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ""}
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
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold border-b-2 transition-all whitespace-nowrap text-sm ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification Bell & Profile Controls */}
        <div className="flex items-center gap-2 ml-4 flex-shrink-0 relative">
          {(rbacRules ? rbacRules.company_profile_edit?.includes(userRole) : userRole === "owner") && (
            <button
              onClick={() => setShowCompanyModal(true)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1.5 text-xs font-bold border border-gray-200 shadow-sm"
              title="Update Company Profile"
            >
              🏢 Company Profile
            </button>
          )}

          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setNotificationsDismissed(true);
            }}
            className={`relative p-2.5 rounded-xl transition ${
              lowStock.length > 0
                ? "bg-red-50 hover:bg-red-100 text-red-600"
                : "bg-gray-100 hover:bg-gray-200 text-gray-500"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
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
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {lowStock.length} items
                </span>
              </div>
              {lowStock.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">✓ All items above safety thresholds</div>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y">
                  {lowStock.map((l) => (
                    <div key={l.product_id} className="p-3 hover:bg-red-50 transition">
                      <div className="font-semibold text-gray-800 text-xs">{l.name}</div>
                      <div className="flex justify-between mt-1 text-[10px] text-gray-500">
                        <span>SKU: {l.sku}</span>
                        <span className="text-red-600 font-bold">
                          Stock: {l.current_stock} (Min: {l.min_stock_level})
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-blue-600">Reorder: {l.reorder_quantity} units needed</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setActiveTab("reports");
                    setShowNotifications(false);
                  }}
                  className="w-full text-xs text-blue-600 font-bold hover:underline"
                >
                  View Full Low Stock Report →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "stock_list" && (
        <StockListTab
          stockListData={stockListData}
          stockListSummary={stockListSummary}
          stockListLoading={stockListLoading}
          userRole={userRole || ""}
          products={products}
          handleOpenProductDetail={handleOpenProductDetail}
        />
      )}

      {activeTab === "products" && (
        <ProductsTab
          products={products}
          setProducts={setProducts}
          categories={categories}
          suppliers={suppliers}
          productTypes={productTypes}
          currency={currency}
          setCurrency={setCurrency}
          userRole={userRole || ""}
          rbacRules={rbacRules}
          onOpenAddProduct={() => setShowAddProductModal(true)}
          onOpenEditProduct={handleOpenEditProduct}
          onOpenProductDetail={handleOpenProductDetail}
          onOpenProductTypes={() => setShowProductTypesModal(true)}
          onOpenCategories={() => setShowCategoriesModal(true)}
          onOpenMaterialTypes={() => setShowMaterialTypesModal(true)}
          onOpenWoodTypes={() => setShowWoodTypesModal(true)}
        />
      )}

      {activeTab === "receiving" && (
        <ReceivingTab
          grns={grns}
          products={products}
          branches={branches}
          currency={currency}
          onOpenGRNModal={() => setShowGRNModal(true)}
          onViewInvoice={handleViewInvoice}
        />
      )}

      {activeTab === "warehouses" && (
        <WarehousesTab
          branches={branches}
          onWarehouseCreated={(newB) => setBranches((prev) => [...prev, newB])}
        />
      )}

      {activeTab === "suppliers" && (
        <SuppliersTab suppliers={suppliers} setSuppliers={setSuppliers} userRole={userRole || ""} />
      )}

      {activeTab === "transfers" && (
        <TransfersTab
          transfers={transfers}
          setTransfers={setTransfers}
          products={products}
          branches={branches}
          onTransferCompleted={reloadSummaryAndReports}
        />
      )}

      {activeTab === "adjustments" && (
        <AdjustmentsTab
          adjustments={adjustments}
          setAdjustments={setAdjustments}
          products={products}
          branches={branches}
          userEmail={userEmail}
          onAdjustmentCompleted={reloadSummaryAndReports}
        />
      )}

      {activeTab === "reports" && (
        <ReportsTab
          userRole={userRole || ""}
          valuation={valuation}
          lowStock={lowStock}
          stockListData={stockListData}
          products={products}
          branches={branches}
        />
      )}

      {/* Lazy Modals */}
      {showAddProductModal && (
        <AddProductModal
          isOpen={showAddProductModal}
          onClose={() => setShowAddProductModal(false)}
          products={products}
          categories={categories}
          productTypes={productTypes}
          materialTypes={materialTypes}
          woodTypes={woodTypes}
          onProductCreated={(newProd) => setProducts((prev) => [...prev, newProd])}
        />
      )}

      {editingProduct && (
        <EditProductModal
          editingProduct={editingProduct}
          onClose={() => setEditingProduct(null)}
          products={products}
          categories={categories}
          suppliers={suppliers}
          materialTypes={materialTypes}
          woodTypes={woodTypes}
          currency={currency}
          rbacRules={rbacRules}
          userRole={userRole || ""}
          onProductUpdated={(updated) =>
            setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)))
          }
        />
      )}

      {viewingProductDetail && (
        <ProductDetailModal
          key={viewingProductDetail.product?.id || "detail-modal"}
          viewingProductDetail={viewingProductDetail}
          setViewingProductDetail={setViewingProductDetail}
          currency={currency}
          categories={categories}
          suppliers={suppliers}
        />
      )}

      {showGRNModal && (
        <GRNModal
          isOpen={showGRNModal}
          onClose={() => setShowGRNModal(false)}
          branches={branches}
          products={products}
          suppliers={suppliers}
          grns={grns}
          userRole={userRole || ""}
          currency={currency}
          onGRNSuccess={(newGRN, updatedData) => {
            setGrns((prev) => [newGRN, ...prev]);
            setProducts(updatedData.products);
            setValuation(updatedData.valuation);
            setLowStock(updatedData.lowStock);
            setStockListData(updatedData.stockList);
            setStockListSummary(updatedData.stockSummary);
            setActiveGRN(newGRN);
            setShowInvoiceModal(true);
          }}
        />
      )}

      {showInvoiceModal && activeGRN && (
        <InvoicePreviewModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          activeGRN={activeGRN}
          products={products}
          branches={branches}
          currency={currency}
          companyProfile={companyProfile}
        />
      )}

      {showCompanyModal && (
        <CompanyProfileModal
          isOpen={showCompanyModal}
          onClose={() => setShowCompanyModal(false)}
          companyProfile={companyProfile}
          onProfileUpdated={(updated) => setCompanyProfile(updated)}
          rbacRules={rbacRules}
        />
      )}

      {(showProductTypesModal || showCategoriesModal || showMaterialTypesModal || showWoodTypesModal) && (
        <ManageAttributesModals
          showProductTypesModal={showProductTypesModal}
          setShowProductTypesModal={setShowProductTypesModal}
          productTypes={productTypes}
          updateProductTypes={updateProductTypes}
          showCategoriesModal={showCategoriesModal}
          setShowCategoriesModal={setShowCategoriesModal}
          categories={categories}
          setCategories={setCategories}
          showMaterialTypesModal={showMaterialTypesModal}
          setShowMaterialTypesModal={setShowMaterialTypesModal}
          materialTypes={materialTypes}
          updateMaterialTypes={updateMaterialTypes}
          showWoodTypesModal={showWoodTypesModal}
          setShowWoodTypesModal={setShowWoodTypesModal}
          woodTypes={woodTypes}
          updateWoodTypesState={updateWoodTypesState}
        />
      )}
    </div>
  );
}
