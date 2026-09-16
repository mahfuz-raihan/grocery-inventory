"use client";

import React, { useState } from "react";
import { api, formatPriceHelper, Product, Supplier, USD_EXCHANGE_RATE } from "../../types";

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

  const formatPrice = (amount: number) => formatPriceHelper(amount, currency);

  const canEditPrice = rbacRules ? rbacRules.product_price_edit?.includes(userRole) : userRole === "owner";

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
      alert("You do not have permission to edit product prices.");
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
      alert("Prices cannot be negative.");
      return;
    }

    const avgCostFloor = prod.average_cost || 0;
    if (avgCostFloor > 0 && newMinPrice < avgCostFloor) {
      alert(`Minimum selling price cannot be lower than the average cost (${formatPrice(avgCostFloor)}). Setting to average cost.`);
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
      alert(`✅ Price updated for "${prod.name}"!`);
    } catch (err: any) {
      alert(err.message || "Failed to update price");
    }
  };

  const handleSaveAllPrices = async () => {
    if (!canEditPrice) {
      alert("You do not have permission to edit product prices.");
      return;
    }
    const prodIdsToUpdate = Object.keys(pendingPrices);
    if (prodIdsToUpdate.length === 0) {
      alert("No pending price changes to save.");
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
      alert(
        `✅ Successfully updated prices for ${successCount} products! All channels & POS will reflect this immediately.`
      );
    } catch (err: any) {
      alert(err.message || "Failed during bulk price save");
    } finally {
      setIsSavingPrices(false);
    }
  };

  const pendingCount = Object.keys(pendingPrices).length;

  return (
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
            onClick={onOpenProductTypes}
            className="px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition-all"
          >
            ⚙️ Manage Types
          </button>
          <button
            type="button"
            onClick={onOpenCategories}
            className="px-3.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
          >
            ⚙️ Manage Categories
          </button>
          <button
            type="button"
            onClick={onOpenMaterialTypes}
            className="px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
          >
            ⚙️ Manage Material Types
          </button>
          <button
            type="button"
            onClick={onOpenWoodTypes}
            className="px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all"
          >
            ⚙️ Manage Wood Types
          </button>
          <button
            type="button"
            onClick={() => setCatalogSubTab("price_panel")}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
              catalogSubTab === "price_panel"
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100"
            }`}
          >
            💲 Central Price Panel
          </button>
          <button
            type="button"
            onClick={onOpenAddProduct}
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
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            catalogSubTab === "catalog"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          📦 Current Catalog
        </button>
        <button
          onClick={() => setCatalogSubTab("price_panel")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            catalogSubTab === "price_panel"
              ? "bg-emerald-600 text-white shadow-sm font-bold"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          💲 Central Price Panel
        </button>
        <button
          onClick={() => setCatalogSubTab("by_product_type")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            catalogSubTab === "by_product_type"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          🏷 By Product Type
        </button>
        <button
          onClick={() => setCatalogSubTab("by_category")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
            catalogSubTab === "by_category"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          📁 By Category
        </button>
      </div>

      {/* Central Price Set Panel View */}
      {catalogSubTab === "price_panel" && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden space-y-4 p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>🏷️</span> Central Product Price Setting Panel
              </h3>
              <p className="text-xs text-gray-500 mt-1">
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
                className="p-2 border rounded-lg text-xs w-56 outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium"
              />
              <button
                type="button"
                onClick={handleSaveAllPrices}
                disabled={isSavingPrices || pendingCount === 0 || !canEditPrice}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5"
              >
                {isSavingPrices ? "Saving All..." : `💾 Save All Changes (${pendingCount})`}
              </button>
            </div>
          </div>

          {!canEditPrice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              ⚠️ Your user role only has read-only access to product prices. Only owners/authorized managers can save
              price changes.
            </div>
          )}

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-100 font-bold text-gray-700 uppercase border-b">
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
              <tbody className="divide-y divide-gray-100">
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
                      <tr key={prod.id} className={`hover:bg-gray-50/60 ${isModified ? "bg-amber-50/40" : ""}`}>
                        <td className="p-3">
                          <span className="font-bold text-gray-800 block">{prod.name}</span>
                          <span className="text-[11px] font-mono text-gray-400">
                            SKU: {prod.sku} {prod.barcode ? `| Barcode: ${prod.barcode}` : ""}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">
                          {prod.current_stock}{" "}
                          <span className="text-[10px] text-gray-400 font-normal">{prod.unit || "pcs"}</span>
                        </td>
                        <td className="p-3 text-right text-gray-600 font-medium">
                          {formatPrice(prod.purchase_cost || 0)}
                        </td>
                        <td className="p-3 text-right text-gray-600 font-medium">
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
                            className={`w-32 p-1.5 border rounded-lg text-right font-bold text-xs outline-none focus:ring-2 focus:ring-sky-400 ${
                              isBelowAvg
                                ? "border-amber-500 bg-amber-50 text-amber-800"
                                : !canEditPrice
                                ? "bg-gray-100 cursor-not-allowed text-gray-400"
                                : "bg-white text-sky-900 border-sky-200"
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
                            className={`w-32 p-1.5 border rounded-lg text-right font-bold text-xs outline-none focus:ring-2 focus:ring-emerald-400 ${
                              isBelowMin
                                ? "border-red-500 bg-red-50 text-red-700"
                                : !canEditPrice
                                ? "bg-gray-100 cursor-not-allowed text-gray-400"
                                : "bg-white text-emerald-900 border-emerald-200"
                            }`}
                            placeholder="0.00"
                          />
                          {isBelowMin && (
                            <span className="text-[9px] font-bold text-red-600 block text-right mt-0.5">
                              ⚠️ Below Min Price
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-xs text-gray-600">
                          {markup !== "—" ? `${markup}%` : "—"}
                        </td>
                        <td className="p-3 text-center">
                          {isModified ? (
                            <button
                              type="button"
                              onClick={() => handleSaveSinglePrice(prod)}
                              disabled={!canEditPrice}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-sm"
                            >
                              Save
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400">Up to date</span>
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
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="p-2.5 border rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700"
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
                <span className="text-xs text-gray-500 font-bold">Currency:</span>
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg border">
                  <button
                    type="button"
                    onClick={() => setCurrency("BDT")}
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      currency === "BDT" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"
                    }`}
                  >
                    BDT
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrency("USD")}
                    className={`px-2 py-1 text-xs font-bold rounded ${
                      currency === "USD" ? "bg-white text-blue-750 shadow-sm" : "text-gray-500"
                    }`}
                  >
                    USD
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Product Name
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Supplier
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Product Code (SKU)
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Product Type
                    </th>
                    <th className="px-4 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Category
                    </th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredCatalog.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400">
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredCatalog.map((p) => {
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

                      const typeLabel =
                        productTypes.find((t) => t.key === p.product_type)?.label || p.product_type || "—";
                      const supplierNameStr = suppliers.find((s) => s.id === p.supplier_id)?.name || "—";

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-blue-50/20 transition cursor-pointer"
                          onClick={() => onOpenProductDetail(p)}
                        >
                          <td className="px-4 py-3.5 font-semibold text-gray-900">{p.name}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{supplierNameStr}</td>
                          <td className="px-4 py-3.5 font-mono text-xs font-bold text-blue-750 whitespace-nowrap">
                            {p.sku}
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{typeLabel}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                            {categories.find((c) => c.id === p.category_id)?.name || "—"}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
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
                                className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-md text-xs transition"
                              >
                                Details
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenEditProduct(p)}
                                className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold rounded-md text-xs transition"
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
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Summary By Product Type</h3>
              <span className="text-xs text-gray-500">Totals calculated from active catalog records</span>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Product Type
                  </th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Unique Products
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productTypeStats.map((stat) => (
                  <tr key={stat.key} className="hover:bg-gray-55/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{stat.label}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">{stat.count}</td>
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
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">Summary By Category</h3>
              <span className="text-xs text-gray-500">Totals calculated from active catalog records</span>
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3.5 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Unique Products
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categoryStats.map((stat, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{stat.name}</td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">{stat.count}</td>
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

