"use client";

import React, { useState } from "react";
import { api, formatPriceHelper, getExpiryStatus, Product, Supplier, USD_EXCHANGE_RATE } from "../../types";
import { toast } from "@/components/ui/Toast";

interface ProductsTabProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: any[];
  suppliers: Supplier[];
  productTypes: { key: string; label: string }[];
  currency: "BDT" | "USD";
  setCurrency: (c: "BDT" | "USD") => void;
  userRole: string;
  rbacRules: any;
  onOpenAddProduct: () => void;
  onOpenEditProduct: (p: Product) => void;
  onOpenProductDetail: (p: Product) => void;
  onOpenProductTypes: () => void;
  onOpenCategories: () => void;
  onOpenMaterialTypes: () => void;
  onOpenWoodTypes: () => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  setProducts,
  categories,
  suppliers,
  productTypes,
  currency,
  setCurrency,
  userRole,
  rbacRules,
  onOpenAddProduct,
  onOpenEditProduct,
  onOpenProductDetail,
  onOpenProductTypes,
  onOpenCategories,
  onOpenMaterialTypes,
  onOpenWoodTypes,
}) => {
  const [catalogSubTab, setCatalogSubTab] = useState<"catalog" | "price_panel" | "by_product_type" | "by_category">(
    "catalog"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterCatalogSupplier, setFilterCatalogSupplier] = useState("");

  // Central Price Set Panel states
  const [pricePanelSearch, setPricePanelSearch] = useState("");
  const [pendingPrices, setPendingPrices] = useState<
    Record<string, { selling_price: string; min_selling_price: string }>
  >({});
  const [isSavingPrices, setIsSavingPrices] = useState(false);

  // Inline quick-edit state for Catalog table
  const [inlineEditPriceId, setInlineEditPriceId] = useState<string | null>(null);
  const [inlinePriceVal, setInlinePriceVal] = useState<string>("");
  const [isSavingInlinePrice, setIsSavingInlinePrice] = useState(false);

  const formatPrice = (amount: number) => formatPriceHelper(amount, currency);

  const canEditPrice = rbacRules ? rbacRules.product_price_edit?.includes(userRole) : userRole === "owner";

  const startInlinePriceEdit = (p: Product) => {
    if (!canEditPrice) {
      toast.warning("You do not have permission to edit product prices.");
      return;
    }
    setInlineEditPriceId(p.id);
    setInlinePriceVal(
      currency === "USD"
        ? (p.selling_price / USD_EXCHANGE_RATE).toFixed(2)
        : (p.selling_price || 0).toString()
    );
  };

  const cancelInlinePriceEdit = () => {
    setInlineEditPriceId(null);
    setInlinePriceVal("");
  };

  const handleSaveInlinePrice = async (prod: Product) => {
    if (!canEditPrice) {
      toast.warning("You do not have permission to edit product prices.");
      return;
    }
    const val = parseFloat(inlinePriceVal || "0");
    if (isNaN(val) || val < 0) {
      toast.warning("Price cannot be negative or invalid.");
      return;
    }
    const newSellingPrice = currency === "USD" ? val * USD_EXCHANGE_RATE : val;

    setIsSavingInlinePrice(true);
    try {
      const updated = await api.updateProduct(prod.id, {
        selling_price: newSellingPrice,
      });
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, ...updated } : p)));
      setInlineEditPriceId(null);
      toast.success(`Price updated for "${prod.name}" to ${formatPrice(newSellingPrice)}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update price");
    } finally {
      setIsSavingInlinePrice(false);
    }
  };

  const handlePriceChange = (prodId: string, field: "selling_price" | "min_selling_price", value: string) => {
    setPendingPrices((prev) => ({
      ...prev,
      [prodId]: {
        selling_price:
          field === "selling_price"
            ? value
            : prev[prodId]?.selling_price ?? (products.find((p) => p.id === prodId)?.selling_price?.toString() ?? "0"),
        min_selling_price:
          field === "min_selling_price"
            ? value
            : prev[prodId]?.min_selling_price ??
              (products.find((p) => p.id === prodId)?.min_selling_price?.toString() ?? "0"),
      },
    }));
  };

  const handleSaveSinglePrice = async (prod: Product) => {
    if (!canEditPrice) {
      toast.warning("You do not have permission to edit product prices.");
      return;
    }
    const pending = pendingPrices[prod.id];
    if (!pending) return;

    const newSellingPrice =
      currency === "USD"
        ? parseFloat(pending.selling_price || "0") * USD_EXCHANGE_RATE
        : parseFloat(pending.selling_price || "0");
    const newMinPrice =
      currency === "USD"
        ? parseFloat(pending.min_selling_price || "0") * USD_EXCHANGE_RATE
        : parseFloat(pending.min_selling_price || "0");

    if (newSellingPrice < 0 || newMinPrice < 0) {
      toast.warning("Prices cannot be negative.");
      return;
    }

    const avgCostFloor = prod.average_cost || 0;
    if (avgCostFloor > 0 && newMinPrice < avgCostFloor) {
      toast.warning(`Minimum selling price cannot be lower than the average cost (${formatPrice(avgCostFloor)}). Setting to average cost.`);
      return;
    }

    try {
      const updated = await api.updateProduct(prod.id, {
        selling_price: newSellingPrice,
        min_selling_price: newMinPrice,
      });
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, ...updated } : p)));
      setPendingPrices((prev) => {
        const copy = { ...prev };
        delete copy[prod.id];
        return copy;
      });
      toast.success(`Price updated for "${prod.name}"!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update price");
    }
  };

  const handleSaveAllPrices = async () => {
    if (!canEditPrice) {
      toast.warning("You do not have permission to edit product prices.");
      return;
    }
    const prodIdsToUpdate = Object.keys(pendingPrices);
    if (prodIdsToUpdate.length === 0) {
      toast.info("No pending price changes to save.");
      return;
    }
    setIsSavingPrices(true);
    try {
      let successCount = 0;
      for (const prodId of prodIdsToUpdate) {
        const pending = pendingPrices[prodId];
        const newSellingPrice =
          currency === "USD"
            ? parseFloat(pending.selling_price || "0") * USD_EXCHANGE_RATE
            : parseFloat(pending.selling_price || "0");
        const newMinPrice =
          currency === "USD"
            ? parseFloat(pending.min_selling_price || "0") * USD_EXCHANGE_RATE
            : parseFloat(pending.min_selling_price || "0");

        const updated = await api.updateProduct(prodId, {
          selling_price: newSellingPrice,
          min_selling_price: newMinPrice,
        });
        setProducts((prev) => prev.map((p) => (p.id === prodId ? { ...p, ...updated } : p)));
        successCount++;
      }
      setPendingPrices({});
      toast.success(
        `Successfully updated prices for ${successCount} products! All channels & POS will reflect this immediately.`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed during bulk price save");
    } finally {
      setIsSavingPrices(false);
    }
  };

  const pendingCount = Object.keys(pendingPrices).length;

  return (
    <div className="space-y-6">
      {/* Header Row with CRUD Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 erp-card p-6 border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Product Management Catalog</h2>
          <p className="text-xs text-slate-500 mt-1">Configure your templates, categories, and wood types</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenProductTypes}
            className="px-3.5 py-2 text-xs font-semibold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-all"
          >
            ⚙️ Manage Types
          </button>
          <button
            type="button"
            onClick={onOpenCategories}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-md transition-all shadow-sm"
          >
            ⚙️ Manage Categories
          </button>
          <button
            type="button"
            onClick={onOpenMaterialTypes}
            className="px-3.5 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-all"
          >
            ⚙️ Manage Material Types
          </button>
          <button
            type="button"
            onClick={onOpenWoodTypes}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-all"
          >
            ⚙️ Manage Wood Types
          </button>
          <button
            type="button"
            onClick={() => setCatalogSubTab("price_panel")}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-all shadow-sm flex items-center gap-1.5 ${
              catalogSubTab === "price_panel"
                ? "bg-brand text-white hover:bg-brand-hover"
                : "bg-emerald-50 text-brand border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            💲 Central Price Panel
          </button>
          <button
            type="button"
            onClick={onOpenAddProduct}
            className="btn-primary px-4 py-2 text-xs font-semibold rounded-md transition-all shadow-sm flex items-center gap-1.5"
          >
            <span className="text-sm">+</span> Add New Product
          </button>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex space-x-1 border border-slate-200 bg-white p-1 rounded-md max-w-fit shadow-sm">
        <button
          onClick={() => setCatalogSubTab("catalog")}
          className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
            catalogSubTab === "catalog"
              ? "bg-brand text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          📦 Current Catalog
        </button>
        <button
          onClick={() => setCatalogSubTab("price_panel")}
          className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
            catalogSubTab === "price_panel"
              ? "bg-brand text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          💲 Central Price Panel
        </button>
        <button
          onClick={() => setCatalogSubTab("by_product_type")}
          className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
            catalogSubTab === "by_product_type"
              ? "bg-brand text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          🏷 By Product Type
        </button>
        <button
          onClick={() => setCatalogSubTab("by_category")}
          className={`px-4 py-2 text-xs font-semibold rounded transition-all ${
            catalogSubTab === "by_category"
              ? "bg-brand text-white shadow-sm font-bold"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          📁 By Category
        </button>
      </div>

      {/* Central Price Set Panel View */}
      {catalogSubTab === "price_panel" && (
        <div className="erp-card p-5 border-slate-200 overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <span>🏷️</span> Central Product Price Setting Panel
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Set standard Selling Price &amp; Minimum Selling Price floor for every product. Updates reflect instantly
                across POS, Stock, and Quotations.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={pricePanelSearch}
                onChange={(e) => setPricePanelSearch(e.target.value)}
                placeholder="Search products..."
                className="p-2 border border-slate-200 rounded-md text-xs w-56 outline-none focus:ring-1 focus:ring-brand focus:border-brand bg-white font-medium"
              />
              <button
                type="button"
                onClick={handleSaveAllPrices}
                disabled={isSavingPrices || pendingCount === 0 || !canEditPrice}
                className="btn-primary px-4 py-2 disabled:opacity-50 text-white font-semibold rounded-md text-xs transition shadow-sm flex items-center gap-1.5"
              >
                {isSavingPrices ? "Saving All..." : `💾 Save All Changes (${pendingCount})`}
              </button>
            </div>
          </div>

          {!canEditPrice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800 font-medium">
              ⚠️ Your user role only has read-only access to product prices. Only owners/authorized managers can save
              price changes.
            </div>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/80 font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="p-3">Product Name &amp; SKU</th>
                  <th className="p-3 text-center">Current Stock</th>
                  <th className="p-3 text-right">Purchase Cost</th>
                  <th className="p-3 text-right">Average Cost</th>
                  <th className="p-3 text-right w-36">Min Selling Price ({currency === "USD" ? "$" : "৳"})</th>
                  <th className="p-3 text-right w-36">Selling Price ({currency === "USD" ? "$" : "৳"})</th>
                  <th className="p-3 text-center">Markup %</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products
                  .filter((p) => {
                    const query = pricePanelSearch.toLowerCase();
                    return (
                      !query ||
                      p.name.toLowerCase().includes(query) ||
                      p.sku.toLowerCase().includes(query) ||
                      (p.barcode && p.barcode.toLowerCase().includes(query))
                    );
                  })
                  .map((prod) => {
                    const pending = pendingPrices[prod.id];
                    const currentSelling =
                      pending?.selling_price !== undefined
                        ? pending.selling_price
                        : currency === "USD"
                        ? (prod.selling_price / USD_EXCHANGE_RATE).toFixed(2)
                        : (prod.selling_price || 0).toString();
                    const currentMin =
                      pending?.min_selling_price !== undefined
                        ? pending.min_selling_price
                        : prod.min_selling_price != null
                        ? currency === "USD"
                          ? (prod.min_selling_price / USD_EXCHANGE_RATE).toFixed(2)
                          : prod.min_selling_price.toString()
                        : "0";

                    const sellingNum = parseFloat(currentSelling || "0");
                    const minNum = parseFloat(currentMin || "0");
                    const costNum = prod.average_cost && prod.average_cost > 0 ? prod.average_cost : (prod.purchase_cost || 0);
                    const markup = costNum > 0 ? (((sellingNum - costNum) / costNum) * 100).toFixed(1) : "—";
                    const isModified = pending !== undefined;
                    const isBelowMin = sellingNum > 0 && minNum > 0 && sellingNum < minNum;
                    const avgFloor = currency === "USD" ? (prod.average_cost || 0) / USD_EXCHANGE_RATE : (prod.average_cost || 0);
                    const isBelowAvg = minNum > 0 && avgFloor > 0 && minNum < avgFloor;

                    return (
                      <tr key={prod.id} className={`hover:bg-slate-50/70 transition ${isModified ? "bg-amber-50/40" : ""}`}>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 block">{prod.name}</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            SKU: {prod.sku} {prod.barcode ? `| Barcode: ${prod.barcode}` : ""}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold font-mono text-slate-800">
                          {prod.current_stock}{" "}
                          <span className="text-[10px] text-slate-400 font-normal">{prod.unit || "pcs"}</span>
                        </td>
                        <td className="p-3 text-right text-slate-600 font-mono font-medium">
                          {formatPrice(prod.purchase_cost || 0)}
                        </td>
                        <td className="p-3 text-right text-slate-600 font-mono font-medium">
                          {formatPrice(prod.average_cost || 0)}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            disabled={!canEditPrice}
                            value={currentMin}
                            onChange={(e) => handlePriceChange(prod.id, "min_selling_price", e.target.value)}
                            className={`w-32 p-1.5 border rounded-md text-right font-bold font-mono text-xs outline-none focus:ring-1 focus:ring-brand focus:border-brand ${
                              isBelowAvg
                                ? "border-amber-400 bg-amber-50 text-amber-800"
                                : !canEditPrice
                                ? "bg-slate-100 cursor-not-allowed text-slate-400"
                                : "bg-white text-slate-900 border-slate-200"
                            }`}
                            placeholder="0.00"
                          />
                          {isBelowAvg && (
                            <span className="text-[9px] font-bold text-amber-600 block text-right mt-0.5">
                              ⚠️ Below Avg Cost
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            disabled={!canEditPrice}
                            value={currentSelling}
                            onChange={(e) => handlePriceChange(prod.id, "selling_price", e.target.value)}
                            className={`w-32 p-1.5 border rounded-md text-right font-bold font-mono text-xs outline-none focus:ring-1 focus:ring-brand focus:border-brand ${
                              isBelowMin
                                ? "border-rose-400 bg-rose-50 text-rose-700"
                                : !canEditPrice
                                ? "bg-slate-100 cursor-not-allowed text-slate-400"
                                : "bg-white text-slate-900 border-slate-200"
                            }`}
                            placeholder="0.00"
                          />
                          {isBelowMin && (
                            <span className="text-[9px] font-bold text-rose-600 block text-right mt-0.5">
                              ⚠️ Below Min Price
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-xs text-slate-600">
                          {markup !== "—" ? `${markup}%` : "—"}
                        </td>
                        <td className="p-3 text-center">
                          {isModified ? (
                            <button
                              type="button"
                              onClick={() => handleSaveSinglePrice(prod)}
                              disabled={!canEditPrice}
                              className="btn-primary px-2.5 py-1 text-white rounded-md text-xs font-semibold transition shadow-sm"
                            >
                              Save
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400">Up to date</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catalog Tab View */}
      {catalogSubTab === "catalog" && (() => {
        const filteredCatalog = products.filter((p) => {
          const matchesSearch =
            searchQuery === "" ||
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

          const matchesType = filterType === "" || p.product_type === filterType;
          const matchesCatalogSupplier = filterCatalogSupplier === "" || p.supplier_id === filterCatalogSupplier;

          return matchesSearch && matchesType && matchesCatalogSupplier;
        });

        return (
          <div className="erp-card border-slate-200 overflow-hidden shadow-sm">
            {/* Search & Filters */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by product name/code..."
                  className="p-2 border border-slate-200 rounded-md text-xs w-64 focus:ring-1 focus:ring-brand focus:border-brand outline-none bg-white font-medium"
                />
                <select
                  className="p-2 border border-slate-200 rounded-md bg-white text-xs focus:ring-1 focus:ring-brand focus:border-brand outline-none font-semibold text-slate-700"
                  value={filterCatalogSupplier}
                  onChange={(e) => setFilterCatalogSupplier(e.target.value)}
                >
                  <option value="">All Suppliers</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="p-2 border border-slate-200 rounded-md bg-white text-xs focus:ring-1 focus:ring-brand focus:border-brand outline-none font-semibold text-slate-700"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Product Types</option>
                  {productTypes.map((t) => (
                    <option key={t.key} value={t.key}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-bold">Currency:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCurrency("BDT")}
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      currency === "BDT" ? "bg-white text-brand shadow-sm" : "text-slate-500"
                    }`}
                  >
                    BDT
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      currency === "USD" ? "bg-white text-brand shadow-sm" : "text-slate-500"
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Product Name
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Supplier
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Product Code (SKU)
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Product Type
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Category
                    </th>
                    <th className="px-4 py-3.5 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Selling Price ({currency === "USD" ? "$" : "৳"})
                    </th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-slate-400">
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map((p) => {
                      const stock = p.current_stock ?? 0;
                      const min = p.min_stock_level && p.min_stock_level > 0 ? p.min_stock_level : 0;
                      const max = p.max_stock_level && p.max_stock_level > 0 ? p.max_stock_level : Infinity;

                      let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                      let statusText = "Available";
                      if (stock <= 0) {
                        badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
                        statusText = "Out of Stock";
                      } else if (min > 0 && stock <= min) {
                        badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
                        statusText = "Low Stock";
                      } else if (max !== Infinity && stock > max) {
                        badgeColor = "bg-purple-50 text-purple-800 border-purple-200";
                        statusText = "Overstock";
                      }

                      const typeLabel =
                        productTypes.find((t) => t.key === p.product_type)?.label || p.product_type || "—";
                      const supplierNameStr = suppliers.find((s) => s.id === p.supplier_id)?.name || "—";

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50/70 transition cursor-pointer"
                          onClick={() => onOpenProductDetail(p)}
                        >
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span>{p.name}</span>
                              {p.expiry_date && (() => {
                                const exp = getExpiryStatus(p.expiry_date);
                                return (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${exp.badgeColor}`}
                                    title={`Expiry Date: ${p.expiry_date}`}
                                  >
                                    {exp.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{supplierNameStr}</td>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-brand whitespace-nowrap">
                            {p.sku}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">{typeLabel}</td>
                          <td className="px-4 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                            {categories.find((c) => c.id === p.category_id)?.name || "—"}
                          </td>
                          <td
                            className="px-4 py-3.5 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {inlineEditPriceId === p.id ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  autoFocus
                                  value={inlinePriceVal}
                                  onChange={(e) => setInlinePriceVal(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleSaveInlinePrice(p);
                                    if (e.key === "Escape") cancelInlinePriceEdit();
                                  }}
                                  className="w-24 p-1 text-right font-mono font-bold text-xs border border-brand rounded-md bg-white text-slate-900 outline-none focus:ring-1 focus:ring-brand"
                                  placeholder="0.00"
                                />
                                <button
                                  type="button"
                                  disabled={isSavingInlinePrice}
                                  onClick={() => handleSaveInlinePrice(p)}
                                  title="Save price (Enter)"
                                  className="px-1.5 py-0.5 bg-brand text-white hover:bg-brand-dark rounded text-xs transition font-bold"
                                >
                                  ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelInlinePriceEdit}
                                  title="Cancel (Esc)"
                                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs transition font-bold"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startInlinePriceEdit(p)}
                                className="inline-flex items-center justify-end gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100/80 transition group text-right"
                                title={canEditPrice ? "Click to quick-edit selling price" : undefined}
                              >
                                <span className="font-mono font-bold text-slate-900 text-xs">
                                  {formatPrice(p.selling_price || 0)}
                                </span>
                                {canEditPrice && (
                                  <span className="opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-brand text-[10px] transition">
                                    ✏️
                                  </span>
                                )}
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeColor}`}>
                              {statusText}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3.5 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex gap-1.5 justify-center">
                              <button
                                type="button"
                                onClick={() => onOpenProductDetail(p)}
                                className="px-2.5 py-1 bg-emerald-50 text-brand hover:bg-emerald-100 font-semibold rounded-md text-xs transition border border-emerald-200"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenEditProduct(p)}
                                className="px-2.5 py-1 bg-white text-slate-700 hover:bg-slate-50 font-semibold rounded-md text-xs transition border border-slate-200 shadow-sm"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Product Type Summary View */}
      {catalogSubTab === "by_product_type" && (() => {
        const productTypeStats = productTypes.map((type) => {
          const typeProds = products.filter((p) => p.product_type === type.key);
          const totalStock = typeProds.reduce((sum, p) => sum + (p.current_stock || 0), 0);
          const totalValue = typeProds.reduce(
            (sum, p) => sum + (p.current_stock || 0) * (p.average_cost || p.purchase_cost || 0),
            0
          );
          return {
            key: type.key,
            label: type.label,
            count: typeProds.length,
            totalStock,
            totalValue,
          };
        });

        return (
          <div className="erp-card border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Summary By Product Type</h3>
              <span className="text-xs text-slate-500">Totals calculated from active catalog records</span>
            </div>
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Unique Products
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productTypeStats.map((stat) => (
                  <tr key={stat.key} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">{stat.label}</td>
                    <td className="px-6 py-4 text-center font-bold font-mono text-brand">{stat.count}</td>
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
          ...categories.map((cat) => {
            const catProds = products.filter((p) => p.category_id === cat.id);
            const totalStock = catProds.reduce((sum, p) => sum + (p.current_stock || 0), 0);
            const totalValue = catProds.reduce(
              (sum, p) => sum + (p.current_stock || 0) * (p.average_cost || p.purchase_cost || 0),
              0
            );
            return {
              name: cat.name,
              count: catProds.length,
              totalStock,
              totalValue,
            };
          }),
          (() => {
            const uncategorizedProds = products.filter((p) => !p.category_id);
            const totalStock = uncategorizedProds.reduce((sum, p) => sum + (p.current_stock || 0), 0);
            const totalValue = uncategorizedProds.reduce(
              (sum, p) => sum + (p.current_stock || 0) * (p.average_cost || p.purchase_cost || 0),
              0
            );
            return {
              name: "Uncategorized",
              count: uncategorizedProds.length,
              totalStock,
              totalValue,
            };
          })(),
        ];

        return (
          <div className="erp-card border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm">Summary By Category</h3>
              <span className="text-xs text-slate-500">Totals calculated from active catalog records</span>
            </div>
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Unique Products
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4 font-semibold text-slate-800">{stat.name}</td>
                    <td className="px-6 py-4 text-center font-bold font-mono text-brand">{stat.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
};

