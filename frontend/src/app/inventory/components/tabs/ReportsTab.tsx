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
    <div className="space-y-8">
      {/* Nested Report Tabs */}
      <div className="flex space-x-1 border-b pb-px mb-6 bg-white p-1 rounded-lg border max-w-fit shadow-sm">
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
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              reportsNestedTab === tab.id
                ? "bg-blue-600 text-white shadow-sm font-bold"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
              <h4 className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
                Total Inventory Value
              </h4>
              <p className="text-4xl font-extrabold">
                ৳
                {computedValuationSum.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="bg-emerald-600 p-6 rounded-xl text-white shadow-md">
              <h4 className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                Total Storage Items
              </h4>
              <p className="text-4xl font-extrabold">{computedItemsSum.toLocaleString()}</p>
            </div>
            <div className="bg-orange-600 p-6 rounded-xl text-white shadow-md">
              <h4 className="text-orange-200 text-xs font-bold uppercase tracking-wider mb-2">
                Low Stock Alerts
              </h4>
              <p className="text-4xl font-extrabold">{lowStockList.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Valuation details list */}
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Stock Valuation Breakdown</h3>
              {valuationDetails.length === 0 ? (
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
                      {valuationDetails.map((d) => (
                        <tr key={d.product_id} className="border-b hover:bg-gray-55">
                          <td className="p-3">
                            <div className="font-semibold text-gray-900">{d.name}</div>
                            <div className="text-xs text-gray-400">
                              {d.sku} | {d.product_type}
                            </div>
                          </td>
                          <td className="p-3 text-right font-semibold text-gray-800">{d.current_stock}</td>
                          <td className="p-3 text-right">
                            ৳
                            {d.unit_cost.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="p-3 text-right font-bold text-blue-600">
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
            <div className="bg-white p-6 rounded-xl border shadow-sm">
              <h3 className="text-lg font-bold text-orange-850 mb-4">🚨 Critical Low Stock Alerts</h3>
              {lowStockList.length === 0 ? (
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
                      {lowStockList.map((l) => (
                        <tr key={l.product_id} className="border-b hover:bg-red-55/30">
                          <td className="p-3">
                            <div className="font-semibold text-red-900">{l.name}</div>
                            <div className="text-xs text-gray-400">
                              {l.sku} | {l.product_type}
                            </div>
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
                className={`p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 ${
                  userRole !== "owner" ? "bg-gray-100 cursor-not-allowed text-gray-500 font-semibold" : ""
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
                className="p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
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
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-400">{new Date(m.created_at).toLocaleString()}</td>
                      <td className="p-3">
                        <span className="font-semibold text-gray-900">{m.product_name}</span>
                        <span className="text-xs text-gray-400 block">{m.product_sku}</span>
                      </td>
                      <td className="p-3">{m.branch_name}</td>
                      <td className="p-3">
                        <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full capitalize">
                          {m.movement_type.replace("_", " ")}
                        </span>
                      </td>
                      <td
                        className={`p-3 text-right font-bold ${
                          m.quantity_change < 0 ? "text-red-650" : "text-green-650"
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
                className={`p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 ${
                  userRole !== "owner" ? "bg-gray-100 cursor-not-allowed text-gray-500 font-semibold" : ""
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
                  {deadStock.map((d) => (
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
              className={`p-2 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500 ${
                userRole !== "owner" ? "bg-gray-100 cursor-not-allowed text-gray-500 font-semibold" : ""
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
                  {consumption.map((c) => (
                    <tr key={c.product_id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold text-gray-900">{c.sku}</td>
                      <td className="p-3 font-medium text-gray-800">{c.name}</td>
                      <td className="p-3 text-right font-extrabold text-orange-650">
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

