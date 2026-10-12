"use client";

import React, { useState } from "react";
import { getExpiryStatus, Product } from "../../types";

interface StockListTabProps {
  stockListData: any[];
  stockListSummary: any;
  stockListLoading: boolean;
  userRole: string;
  products: Product[];
  handleOpenProductDetail: (prod: Product) => void;
}

export const StockListTab: React.FC<StockListTabProps> = ({
  stockListData,
  stockListSummary,
  stockListLoading,
  userRole,
  products,
  handleOpenProductDetail,
}) => {
  const [stockListSearch, setStockListSearch] = useState("");
  const [stockListSupplierFilter, setStockListSupplierFilter] = useState("");
  const [stockListCategoryFilter, setStockListCategoryFilter] = useState("");
  const [stockListWarehouseFilter, setStockListWarehouseFilter] = useState("");
  const [stockListStatusFilter, setStockListStatusFilter] = useState("");

  const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
    available: { label: "Available", color: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-600" },
    low_stock: { label: "Low Stock", color: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-600" },
    out_of_stock: { label: "Out of Stock", color: "bg-rose-50 text-rose-800 border-rose-200", dot: "bg-rose-600" },
  };

  if (stockListLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-md h-24 border border-border shadow-sm" />
          ))}
        </div>
        <div className="bg-white rounded-md h-14 border border-border shadow-sm" />
        <div className="bg-white rounded-md h-48 border border-border shadow-sm" />
      </div>
    );
  }

  const filteredRows = stockListData.filter((row) => {
    const q = stockListSearch.toLowerCase();
    const matchSearch =
      !q ||
      row.product_name.toLowerCase().includes(q) ||
      row.sku.toLowerCase().includes(q) ||
      (row.supplier || "").toLowerCase().includes(q);
    const matchSupplier = !stockListSupplierFilter || row.supplier === stockListSupplierFilter;
    const matchCategory = !stockListCategoryFilter || row.category === stockListCategoryFilter;
    const matchWarehouse = !stockListWarehouseFilter || row.warehouse === stockListWarehouseFilter;
    const matchStatus = !stockListStatusFilter || row.status === stockListStatusFilter;
    return matchSearch && matchSupplier && matchCategory && matchWarehouse && matchStatus;
  });

  const uniqueSuppliers = Array.from(new Set(stockListData.map((r) => r.supplier).filter(Boolean))).sort() as string[];
  const uniqueCategories = Array.from(new Set(stockListData.map((r) => r.category).filter(Boolean))).sort() as string[];
  const uniqueWarehouses = Array.from(new Set(stockListData.map((r) => r.warehouse).filter(Boolean))).sort() as string[];

  const grouped: Record<string, any[]> = {};
  for (const row of filteredRows) {
    const key = row.supplier || "— No Supplier";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  }
  const supplierGroups = Object.keys(grouped).sort();

  const formatStockValue = (val: number) =>
    val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const isOwner = userRole === "owner";
  const summary = isOwner
    ? stockListSummary
    : {
        total_products: new Set(filteredRows.map((r: any) => r.product_id)).size,
        stock_value: filteredRows.reduce(
          (sum: number, r: any) => sum + r.available_qty * (r.average_cost || 0),
          0
        ),
        low_and_out_of_stock_count: filteredRows.filter((r: any) => r.status !== "available").length,
      };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="erp-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-md bg-emerald-50 text-brand flex items-center justify-center flex-shrink-0 border border-emerald-100/60">
            <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
              {!isOwner ||
              stockListSearch ||
              stockListSupplierFilter ||
              stockListCategoryFilter ||
              stockListWarehouseFilter ||
              stockListStatusFilter
                ? new Set(filteredRows.map((r: any) => r.product_id)).size
                : summary?.total_products ?? 0}
            </div>
          </div>
        </div>

        <div className="erp-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-md bg-emerald-50 text-brand flex items-center justify-center flex-shrink-0 border border-emerald-100/60">
            <svg className="w-5 h-5 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock Value</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-0.5 truncate">
              ৳ {formatStockValue(
                !isOwner ||
                  stockListSearch ||
                  stockListSupplierFilter ||
                  stockListCategoryFilter ||
                  stockListWarehouseFilter ||
                  stockListStatusFilter
                  ? filteredRows.reduce((sum: number, r: any) => sum + r.available_qty * (r.average_cost || 0), 0)
                  : summary?.stock_value ?? 0
              )}
            </div>
          </div>
        </div>

        <div className="erp-card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100/60">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low / Out of Stock</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-rose-700 mt-0.5">
              {!isOwner ||
              stockListSearch ||
              stockListSupplierFilter ||
              stockListCategoryFilter ||
              stockListWarehouseFilter ||
              stockListStatusFilter
                ? filteredRows.filter((r: any) => r.status !== "available").length
                : summary?.low_and_out_of_stock_count ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="erp-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by product name, SKU or supplier..."
              className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-xs bg-slate-50/50 text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
              value={stockListSearch}
              onChange={(e) => setStockListSearch(e.target.value)}
            />
          </div>

          <select
            className="p-2 border border-border rounded-md bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
            value={stockListSupplierFilter}
            onChange={(e) => setStockListSupplierFilter(e.target.value)}
          >
            <option value="">All Suppliers</option>
            {uniqueSuppliers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            className="p-2 border border-border rounded-md bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
            value={stockListCategoryFilter}
            onChange={(e) => setStockListCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            className="p-2 border border-border rounded-md bg-slate-50/50 text-slate-800 text-xs focus:bg-white focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
            value={stockListStatusFilter}
            onChange={(e) => setStockListStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="available">✅ Available</option>
            <option value="low_stock">⚠️ Low Stock</option>
            <option value="out_of_stock">🔴 Out of Stock</option>
          </select>
        </div>

        {userRole === "owner" && uniqueWarehouses.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Warehouse:</span>
            <button
              onClick={() => setStockListWarehouseFilter("")}
              className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                !stockListWarehouseFilter
                  ? "bg-brand text-white border-brand"
                  : "bg-white text-slate-600 border-border hover:border-slate-300"
              }`}
            >
              All
            </button>
            {uniqueWarehouses.map((w) => (
              <button
                key={w}
                onClick={() => setStockListWarehouseFilter(w)}
                className={`px-3 py-1 rounded text-xs font-semibold border transition ${
                  stockListWarehouseFilter === w
                    ? "bg-brand text-white border-brand"
                    : "bg-white text-slate-600 border-border hover:border-slate-300"
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Supplier-Grouped Stock Table */}
      <div className="space-y-4">
        {filteredRows.length === 0 ? (
          <div className="erp-card py-16 flex flex-col items-center justify-center gap-3">
            <svg className="w-12 h-12 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-slate-400 font-semibold text-sm">No stock records match your filters.</p>
            <button
              onClick={() => {
                setStockListSearch("");
                setStockListSupplierFilter("");
                setStockListCategoryFilter("");
                setStockListWarehouseFilter("");
                setStockListStatusFilter("");
              }}
              className="text-brand hover:text-brand-dark text-xs font-semibold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          supplierGroups.map((supplierKey) => (
            <div key={supplierKey} className="erp-card overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50/70 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-brand-50 text-brand flex items-center justify-center border border-emerald-100/60">
                    <svg className="w-4 h-4 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800 text-sm">{supplierKey}</span>
                    <span className="ml-2 text-xs text-slate-400">
                      {grouped[supplierKey].length} product{grouped[supplierKey].length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  {(["available", "low_stock", "out_of_stock"] as const).map((st) => {
                    const count = grouped[supplierKey].filter((r) => r.status === st).length;
                    if (!count) return null;
                    const conf = statusConfig[st];
                    return (
                      <span key={st} className={`px-2.5 py-0.5 rounded text-[10px] font-semibold border ${conf.color}`}>
                        {count} {conf.label}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/40">
                      {[
                        "Product Name",
                        "SKU (Product Code)",
                        "Category",
                        "Available Qty",
                        "Unit",
                        "Warehouse",
                        "Status",
                        "Last Updated",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {grouped[supplierKey].map((row: any, idx: number) => {
                      const conf =
                        statusConfig[row.status as keyof typeof statusConfig] ?? statusConfig["out_of_stock"];
                      const lastUpdated = row.last_updated
                        ? new Date(row.last_updated).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—";
                      return (
                        <tr
                          key={`${row.product_id}-${supplierKey}-${idx}`}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => {
                            const prod = products.find((p) => p.id === row.product_id);
                            if (prod) handleOpenProductDetail(prod);
                          }}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-800 text-sm">{row.product_name}</span>
                              {(() => {
                                const prod = products.find((p) => p.id === row.product_id);
                                if (!prod?.expiry_date) return null;
                                const exp = getExpiryStatus(prod.expiry_date);
                                return (
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${exp.badgeColor}`}
                                    title={`Expiry Date: ${prod.expiry_date}`}
                                  >
                                    {exp.label}
                                  </span>
                                );
                              })()}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-border">
                              {row.sku}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600">
                              {row.category || <span className="text-slate-300 italic">—</span>}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-sm font-semibold font-mono tabular-nums ${
                                row.status === "out_of_stock"
                                  ? "text-rose-600"
                                  : row.status === "low_stock"
                                  ? "text-amber-600"
                                  : "text-emerald-700"
                              }`}
                            >
                              {Number.isInteger(row.available_qty)
                                ? row.available_qty.toLocaleString("en-US")
                                : Number(row.available_qty).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600">{row.unit || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-600">{row.warehouse || "—"}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border ${conf.color}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
                              {conf.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs text-slate-400 font-mono tabular-nums">{lastUpdated}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredRows.length > 0 && (
        <div className="bg-slate-900 text-white rounded-md px-5 py-3.5 flex items-center justify-between shadow-sm">
          <span className="text-sm font-medium text-slate-300">
            Showing {filteredRows.length} stock record{filteredRows.length !== 1 ? "s" : ""} across{" "}
            {supplierGroups.length} supplier{supplierGroups.length !== 1 ? "s" : ""}
          </span>
          <div className="text-right">
            <div className="text-xs text-slate-400 uppercase tracking-wider">Total Stock Value</div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-400">৳ {formatStockValue(summary?.stock_value ?? 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

