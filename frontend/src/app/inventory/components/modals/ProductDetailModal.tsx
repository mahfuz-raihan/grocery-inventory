"use client";

import React, { useState } from "react";
import { formatPriceHelper, getLocalDateString, Supplier } from "../../types";

interface ProductDetailModalProps {
  viewingProductDetail: any;
  setViewingProductDetail: (val: any) => void;
  currency: "BDT" | "USD";
  categories: any[];
  suppliers: Supplier[];
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  viewingProductDetail,
  setViewingProductDetail,
  currency,
  categories,
  suppliers,
}) => {
  const [detailActiveTab, setDetailActiveTab] = useState<"overview" | "inventory" | "transactions">("overview");
  const [historicalDate, setHistoricalDate] = useState<string>(getLocalDateString());

  if (!viewingProductDetail) return null;

  const formatPrice = (amount: number) => formatPriceHelper(amount, currency);

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{viewingProductDetail.product.name}</h3>
            <p className="text-xs text-gray-500 mt-1">
              SKU: {viewingProductDetail.product.sku} | Type:{" "}
              <span className="capitalize">{viewingProductDetail.product.product_type?.replace("_", " ")}</span>
            </p>
          </div>
          <button
            onClick={() => setViewingProductDetail(null)}
            className="text-gray-400 hover:text-gray-655 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs inside details */}
        <div className="flex border-b bg-gray-50 px-6">
          {(["overview", "inventory", "transactions"] as const).map((tab) => (
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
                  <span className="text-2xl font-bold text-blue-900">
                    {viewingProductDetail.current_stock} {viewingProductDetail.product.unit || "pcs"}
                  </span>
                </div>
                <div className="p-4 bg-red-50/50 rounded-xl border border-red-100">
                  <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Min Stock Limit</span>
                  <span className="text-2xl font-bold text-red-955">{viewingProductDetail.product.min_stock_level || 0}</span>
                </div>

                {viewingProductDetail.has_been_received ? (
                  <>
                    <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Selling Price</span>
                      <span className="text-2xl font-bold text-emerald-955">
                        {formatPrice(viewingProductDetail.product.selling_price)}
                      </span>
                    </div>
                    <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Min Selling Price</span>
                      <span className="text-2xl font-bold text-sky-955">
                        {formatPrice(viewingProductDetail.product.min_selling_price || 0)}
                      </span>
                    </div>
                    <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Unit Price (DP)</span>
                      <span className="text-2xl font-bold text-purple-950">
                        {formatPrice(viewingProductDetail.product.purchase_cost || 0)}
                      </span>
                    </div>
                    <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Commission</span>
                      <span className="text-2xl font-bold text-orange-955">
                        {viewingProductDetail.product.commission || 0}%
                      </span>
                    </div>
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Purchased Price</span>
                      <span className="text-2xl font-bold text-teal-955">
                        {formatPrice(
                          (viewingProductDetail.product.purchase_cost || 0) *
                            (1 - (viewingProductDetail.product.commission || 0) / 100)
                        )}
                      </span>
                    </div>
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
                      <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Additional Cost</span>
                      <span className="text-2xl font-bold text-amber-955">
                        {formatPrice(viewingProductDetail.product.additional_cost || 0)}
                      </span>
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
                  </>
                ) : (
                  <div className="col-span-2 p-4 bg-gray-50 border border-dashed rounded-xl flex items-center justify-center text-center text-xs text-gray-500 font-semibold leading-relaxed">
                    ℹ️ This product has not been received from any supplier yet. Pricing & costing details will become available after stock receiving.
                  </div>
                )}
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
                    Stock:{" "}
                    {(() => {
                      if (!viewingProductDetail || !viewingProductDetail.transactions) return 0;
                      const target = new Date(historicalDate + "T23:59:59");
                      const sum = viewingProductDetail.transactions
                        .filter((tx: any) => new Date(tx.created_at) <= target)
                        .reduce((s: number, tx: any) => s + tx.quantity_change, 0);
                      return `${sum} ${viewingProductDetail.product.unit || "pcs"}`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Time based velocity calculations */}
              <div className="bg-slate-50 p-4 rounded-xl border grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
                <div className="p-3 bg-white border rounded-lg shadow-sm">
                  <span className="text-gray-400 block mb-1 uppercase tracking-wider text-[10px] font-bold">
                    Avg Daily Consumption (30d)
                  </span>
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
                  <span className="text-gray-400 block mb-1 uppercase tracking-wider text-[10px] font-bold">
                    Stock Runway (Supply Days)
                  </span>
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
                  <span className="text-gray-400 block mb-1 uppercase tracking-wider text-[10px] font-bold">
                    Estimated Reorder Point
                  </span>
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
                      return `${Math.ceil(leadTimeDemand + safetyStock)} ${viewingProductDetail.product.unit || "pcs"}`;
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
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=400&q=80";
                    }}
                  />
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-xl border">
                <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">
                  Product Specifications & Parameters
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Barcode:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.barcode || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Category:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.category_id
                        ? categories.find((c) => c.id === viewingProductDetail.product.category_id)?.name || "Uncategorized"
                        : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Default Supplier:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.supplier_id
                        ? suppliers.find((s) => s.id === viewingProductDetail.product.supplier_id)?.name || "None"
                        : "None"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tax/VAT Rate:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.tax_rate || 0}%</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Material Type:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.material_type || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Wood Type:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.wood_type || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Board Type:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.board_type || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Color Spec:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.color || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Size Spec:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.size || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Length:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.length ? `${viewingProductDetail.product.length} in` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Width:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.width ? `${viewingProductDetail.product.width} in` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Height:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.height ? `${viewingProductDetail.product.height} in` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Thickness:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.thickness ? `${viewingProductDetail.product.thickness} mm` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Weight:</span>{" "}
                    <span className="font-semibold text-gray-800">
                      {viewingProductDetail.product.weight ? `${viewingProductDetail.product.weight} kg` : "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Max Stock Limit:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.max_stock_level || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reorder Qty:</span>{" "}
                    <span className="font-semibold text-gray-800">{viewingProductDetail.product.reorder_quantity || "-"}</span>
                  </div>
                </div>
              </div>

              {viewingProductDetail.variants && viewingProductDetail.variants.length > 0 && (
                <div>
                  <h4 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">
                    Variants Available ({viewingProductDetail.variants.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {viewingProductDetail.variants.map((v: any) => (
                      <div key={v.id} className="p-3 bg-white border rounded-xl flex justify-between items-center text-sm">
                        <div>
                          <span className="font-bold text-slate-800">{v.name}</span>
                          <span className="text-xs text-gray-450 block">
                            SKU: {v.sku} | Spec: {v.color || ""} {v.size || ""}
                          </span>
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
                    {viewingProductDetail.warehouse_stock &&
                      viewingProductDetail.warehouse_stock.map((ws: any) => (
                        <tr key={ws.branch_id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-semibold text-gray-900">{ws.branch_name}</td>
                          <td className="p-3 capitalize">{ws.branch_type}</td>
                          <td className="p-3 text-right font-bold text-blue-600">
                            {ws.stock} {viewingProductDetail.product.unit || "pcs"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {detailActiveTab === "transactions" && (
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider">
                Recent Stock Transactions (Last 50)
              </h4>
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
                      {viewingProductDetail.transactions &&
                        viewingProductDetail.transactions.map((tx: any) => {
                          return (
                            <tr key={tx.id} className="border-b hover:bg-gray-55">
                              <td className="p-3 text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</td>
                              <td className="p-3">
                                <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full capitalize">
                                  {tx.movement_type.replace("_", " ")}
                                </span>
                              </td>
                              <td
                                className={`p-3 text-right font-bold ${
                                  tx.quantity_change < 0 ? "text-red-600" : "text-green-650"
                                }`}
                              >
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
          <button
            onClick={() => setViewingProductDetail(null)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

