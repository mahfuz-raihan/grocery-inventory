"use client";

import React, { useState, useEffect } from "react";
import { api, Branch, LowStockItem, Product, ValuationReport } from "../../types";

interface ReportsTabProps {
  userRole: string;
  valuation: ValuationReport | null;
  lowStock: LowStockItem[];
  stockListData: any[];
  products: Product[];
  branches: Branch[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  userRole,
  valuation,
  lowStock,
  stockListData,
  products,
  branches,
}) => {
  const [reportsNestedTab, setReportsNestedTab] = useState<
    "valuation" | "movement" | "dead_stock" | "consumption"
  >("valuation");

  // Movement filter states
  const [movements, setMovements] = useState<any[]>([]);
  const [filterMovementBranch, setFilterMovementBranch] = useState("");
  const [filterMovementProduct, setFilterMovementProduct] = useState("");
  const [filterMovementType, setFilterMovementType] = useState("");

  // Dead stock filter states
  const [deadStock, setDeadStock] = useState<any[]>([]);
  const [deadStockDays, setDeadStockDays] = useState(30);
  const [filterDeadStockBranch, setFilterDeadStockBranch] = useState("");

  // Consumption filter states
  const [consumption, setConsumption] = useState<any[]>([]);
  const [filterConsumptionBranch, setFilterConsumptionBranch] = useState("");

  // Fetch movement
  const fetchMovements = async () => {
    try {
      const data = await api.getMovementReport(
        filterMovementBranch || undefined,
        filterMovementProduct || undefined,
        filterMovementType || undefined
      );
      setMovements(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch dead stock
  const fetchDeadStock = async () => {
    try {
      const data = await api.getDeadStockReport(deadStockDays, filterDeadStockBranch || undefined);
      setDeadStock(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch consumption
  const fetchConsumption = async () => {
    try {
      const data = await api.getConsumptionReport(filterConsumptionBranch || undefined);
      setConsumption(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (reportsNestedTab === "movement") {
      fetchMovements();
    } else if (reportsNestedTab === "dead_stock") {
      fetchDeadStock();
    } else if (reportsNestedTab === "consumption") {
      fetchConsumption();
    }
  }, [
    reportsNestedTab,
    filterMovementBranch,
    filterMovementProduct,
    filterMovementType,
    deadStockDays,
    filterDeadStockBranch,
    filterConsumptionBranch,
  ]);

  const isOwner = userRole === "owner";
  const valuationDetails = isOwner
    ? valuation?.valuation_details || []
    : stockListData
        .map((r) => ({
          product_id: r.product_id,
          sku: r.sku,
          name: r.product_name,
          product_type: r.category || "General",
          current_stock: r.available_qty,
          unit_cost: r.average_cost || 0,
          total_value: r.available_qty * (r.average_cost || 0),
        }))
        .filter((item) => item.current_stock > 0);

  const lowStockList = isOwner
    ? lowStock
    : stockListData
        .filter((r) => r.status !== "available")
        .map((r) => ({
          product_id: r.product_id,
          sku: r.sku,
          name: r.product_name,
          product_type: r.category || "General",
          current_stock: r.available_qty,
          min_stock_level: r.min_stock_level || 5.0,
          reorder_quantity: (r.min_stock_level || 5.0) * 2,
        }));

  const computedValuationSum = valuationDetails.reduce((sum, d) => sum + d.total_value, 0);
  const computedItemsSum = valuationDetails.reduce((sum, d) => sum + d.current_stock, 0);

  return (
    <div className="space-y-6">
      {/* Nested Report Tabs */}
      <div className="flex space-x-1 border border-border p-1 rounded-xl bg-white max-w-fit shadow-sm">
        {(
          [
            { id: "valuation", label: "Valuation & Alerts" },
            { id: "movement", label: "Stock Movement History" },
            { id: "dead_stock", label: "Dead Stock Report" },
            { id: "consumption", label: "Consumption Report" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportsNestedTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              reportsNestedTab === tab.id
                ? "bg-brand text-white shadow-sm font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reportsNestedTab === "valuation" && (
        <div className="space-y-6">
          {/* Valuation Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="erp-card p-5 border-l-4 border-l-emerald-600">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Inventory Value
              </h4>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                ৳
                {computedValuationSum.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="erp-card p-5 border-l-4 border-l-brand">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Total Storage Items
              </h4>
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-900">{computedItemsSum.toLocaleString()}</p>
            </div>
            <div className="erp-card p-5 border-l-4 border-l-rose-500">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Low Stock Alerts
              </h4>
              <p className="text-2xl font-bold font-mono tabular-nums text-rose-700">{lowStockList.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Valuation details list */}
            <div className="erp-card p-6">
              <h3 className="text-base font-bold text-slate-900 mb-4">Stock Valuation Breakdown</h3>
              {valuationDetails.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-xl border border-border">No valuation logs available.</p>
              ) : (
                <div className="max-h-96 overflow-y-auto pr-2 border border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Stock</th>
                        <th className="p-3 text-right">Unit Cost</th>
                        <th className="p-3 text-right">Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {valuationDetails.map((d) => (
                        <tr key={d.product_id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{d.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {d.sku} | {d.product_type}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-semibold text-slate-800">{d.current_stock}</td>
                          <td className="p-3 text-right font-mono tabular-nums text-slate-600">
                            ৳
                            {d.unit_cost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-bold text-brand">
                            ৳
                            {d.total_value.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Low stock alerts list */}
            <div className="erp-card p-6">
              <h3 className="text-base font-bold text-rose-800 mb-4 flex items-center gap-1.5">
                <span>🚨</span> Critical Low Stock Alerts
              </h3>
              {lowStockList.length === 0 ? (
                <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-medium">
                  ✓ All products are currently above their safety thresholds.
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto pr-2 border border-border rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border sticky top-0 z-10">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-right">Stock</th>
                        <th className="p-3 text-right">Min Threshold</th>
                        <th className="p-3 text-right">Reorder Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {lowStockList.map((l) => (
                        <tr key={l.product_id} className="hover:bg-rose-50/40 transition">
                          <td className="p-3">
                            <div className="font-semibold text-rose-900">{l.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {l.sku} | {l.product_type}
                            </div>
                          </td>
                          <td className="p-3 text-right font-mono tabular-nums font-bold text-rose-700">{l.current_stock}</td>
                          <td className="p-3 text-right font-mono tabular-nums text-slate-600">{l.min_stock_level}</td>
                          <td className="p-3 text-right font-mono tabular-nums font-semibold text-brand">{l.reorder_quantity}</td>
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
        <div className="erp-card p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4 justify-between border-b border-border pb-4">
            <h3 className="text-base font-bold text-slate-900">Stock Movement Log</h3>
            <div className="flex flex-wrap gap-2">
              <select
                className={`p-2 border border-border rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand transition ${
                  userRole !== "owner" ? "bg-slate-100 cursor-not-allowed text-slate-500 font-medium" : ""
                }`}
                value={filterMovementBranch}
                onChange={(e) => setFilterMovementBranch(e.target.value)}
                disabled={userRole !== "owner"}
              >
                {userRole === "owner" && <option value="">All Warehouses</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border border-border rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand transition"
                value={filterMovementProduct}
                onChange={(e) => setFilterMovementProduct(e.target.value)}
              >
                <option value="">All Products</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name}
                  </option>
                ))}
              </select>
              <select
                className="p-2 border border-border rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand transition"
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
            <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-xl border border-border">No movement logs found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Warehouse Location</th>
                    <th className="p-3">Movement Type</th>
                    <th className="p-3 text-right">Delta Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {movements.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-xs text-slate-400 font-mono tabular-nums">{new Date(m.created_at).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="font-semibold text-slate-900">{m.product_name}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{m.product_sku}</span>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">{m.branch_name}</td>
                      <td className="p-3">
                        <span className="text-[10px] bg-slate-100 text-slate-700 border border-border font-medium px-2 py-0.5 rounded-full capitalize">
                          {m.movement_type.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold tabular-nums ${
                          m.quantity_change < 0 ? "text-rose-700" : "text-emerald-700"
                        }`}
                      >
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
        <div className="erp-card p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4 justify-between border-b border-border pb-4">
            <h3 className="text-base font-bold text-slate-900">Dead Stock Report</h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Days of Inactivity:</span>
                <input
                  type="number"
                  value={deadStockDays}
                  onChange={(e) => setDeadStockDays(parseInt(e.target.value) || 30)}
                  className="p-1.5 border border-border rounded-lg text-xs font-mono w-20 outline-none text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand transition"
                />
              </div>
              <select
                className={`p-2 border border-border rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand transition ${
                  userRole !== "owner" ? "bg-slate-100 cursor-not-allowed text-slate-500 font-medium" : ""
                }`}
                value={filterDeadStockBranch}
                onChange={(e) => setFilterDeadStockBranch(e.target.value)}
                disabled={userRole !== "owner"}
              >
                {userRole === "owner" && <option value="">All Warehouses</option>}
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {deadStock.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-xl border border-border">No inactive stock matches found for this period.</p>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Product SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">Current Stock</th>
                    <th className="p-3 text-right">Last Movement Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {deadStock.map((d) => (
                    <tr key={d.product_id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-semibold text-slate-900">{d.sku}</td>
                      <td className="p-3 font-medium text-slate-800">{d.name}</td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-brand">{d.current_stock}</td>
                      <td className="p-3 text-right text-xs text-slate-400 font-mono tabular-nums">
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
        <div className="erp-card p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4 justify-between border-b border-border pb-4">
            <h3 className="text-base font-bold text-slate-900">Production Consumption Summary</h3>
            <select
              className={`p-2 border border-border rounded-lg text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand transition ${
                userRole !== "owner" ? "bg-slate-100 cursor-not-allowed text-slate-500 font-medium" : ""
              }`}
              value={filterConsumptionBranch}
              onChange={(e) => setFilterConsumptionBranch(e.target.value)}
              disabled={userRole !== "owner"}
            >
              {userRole === "owner" && <option value="">All Warehouses</option>}
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {consumption.length === 0 ? (
            <p className="text-xs text-slate-500 italic py-8 text-center bg-slate-50/50 rounded-xl border border-border">No consumption records found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[50vh] border border-border rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold border-b border-border sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Product SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3 text-right">Total Consumed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {consumption.map((c) => (
                    <tr key={c.product_id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-mono font-semibold text-slate-900">{c.sku}</td>
                      <td className="p-3 font-medium text-slate-800">{c.name}</td>
                      <td className="p-3 text-right font-mono tabular-nums font-bold text-amber-800">
                        {c.total_consumed} {c.unit || "pcs"}
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
  );
};

