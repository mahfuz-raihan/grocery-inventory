"use client";

import React, { useState } from "react";
import { Branch, formatPriceHelper, Product } from "../../types";

interface ReceivingTabProps {
  grns: any[];
  products: Product[];
  branches: Branch[];
  currency: "BDT" | "USD";
  onOpenGRNModal: () => void;
  onViewInvoice: (grn: any) => void;
}

export const ReceivingTab: React.FC<ReceivingTabProps> = ({
  grns,
  products,
  branches,
  currency,
  onOpenGRNModal,
  onViewInvoice,
}) => {
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterMovementProduct, setFilterMovementProduct] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const formatPrice = (amount: number) => formatPriceHelper(amount, currency);

  const role = typeof window !== "undefined" ? localStorage.getItem("erp_role") : null;
  const userBranchId = typeof window !== "undefined" ? localStorage.getItem("erp_branch_id") : null;
  const isOwner = role === "owner";

  // Filter and Sort GRN Log entries
  const rawItems = grns.flatMap((grn) => (grn.items || []).map((item: any) => ({ ...item, grn })));

  const filteredGrnItems = rawItems.filter((item) => {
    if (!isOwner && userBranchId && item.grn.branch_id !== userBranchId) {
      return false;
    }

    const matchesSupplier =
      filterSupplier === "" || item.grn.supplier_name.toLowerCase().includes(filterSupplier.toLowerCase());

    const matchesProduct = filterMovementProduct === "" || item.product_id === filterMovementProduct;

    const dateObj = new Date(item.grn.receiving_date || item.grn.created_at);

    const matchesStartDate = !filterStartDate || dateObj >= new Date(filterStartDate + "T00:00:00");
    const matchesEndDate = !filterEndDate || dateObj <= new Date(filterEndDate + "T23:59:59");

    return matchesSupplier && matchesProduct && matchesStartDate && matchesEndDate;
  });

  const sortedGrnItems = [...filteredGrnItems].sort((a, b) => {
    const dateA = new Date(a.grn.receiving_date || a.grn.created_at).getTime();
    const dateB = new Date(b.grn.receiving_date || b.grn.created_at).getTime();
    return dateB - dateA;
  });

  const exportGrnToCSV = () => {
    const csvHeaders = [
      "Invoice Ref",
      "Date Received",
      "Supplier",
      "Product SKU",
      "Product Name",
      "Ordered Qty",
      "Received Qty",
      "Unit Price (DP)",
      "Commission (%)",
      "Purchase Price",
      "Total Amount",
      "Total Purchase Price",
      "Warehouse",
      "Batch No.",
    ];
    const csvRows = sortedGrnItems.map((item) => {
      const productObj = products.find((p) => p.id === item.product_id);
      const whName = branches.find((b) => b.id === item.grn.branch_id)?.name || "Warehouse";
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
        item.batch_number || "—",
      ];
    });
    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GRN_Log_History_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="erp-card p-6 flex flex-col space-y-6">
      {/* Header row with buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="text-base font-bold text-slate-900">Receiving Log History ({sortedGrnItems.length} items)</h3>
          <p className="text-xs text-slate-500 mt-1">Track incoming supplier deliveries and generate invoices</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`btn-secondary text-xs ${
              showAdvancedFilters ? "bg-brand text-white border-brand hover:bg-brand-dark hover:text-white" : ""
            }`}
          >
            ⚙️ Filters {showAdvancedFilters ? "▲" : "▼"}
          </button>
          <button
            type="button"
            onClick={exportGrnToCSV}
            className="btn-secondary text-xs border-emerald-200 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
            disabled={sortedGrnItems.length === 0}
          >
            ⬇️ Export CSV
          </button>
          <button
            type="button"
            onClick={onOpenGRNModal}
            className="btn-primary text-xs"
          >
            Receive Supplier Delivery (GRN)
          </button>
        </div>
      </div>

      {/* Expandable Filter Fields */}
      {showAdvancedFilters && (
        <div className="p-4 bg-slate-50/70 rounded-md border border-border grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Supplier Name</label>
            <input
              type="text"
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              placeholder="Search supplier..."
              className="w-full p-2 border border-border rounded-md text-xs bg-white text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Catalog Product</label>
            <select
              className="w-full p-2 border border-border rounded-md bg-white text-slate-800 text-xs outline-none focus:ring-1 focus:ring-brand focus:border-brand transition"
              value={filterMovementProduct}
              onChange={(e) => setFilterMovementProduct(e.target.value)}
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Received From</label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full p-1.5 border border-border rounded-md text-xs outline-none bg-white font-medium text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Received To</label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full p-1.5 border border-border rounded-md text-xs outline-none bg-white font-medium text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand"
            />
          </div>
        </div>
      )}

      {/* List */}
      {sortedGrnItems.length === 0 ? (
        <p className="text-xs text-slate-500 italic text-center py-12 bg-slate-50/50 rounded-md border border-border">
          No deliveries found matching the filters.
        </p>
      ) : (
        <div className="overflow-x-auto max-h-[60vh] border border-border rounded-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 uppercase text-slate-500 font-semibold text-[11px] tracking-wider border-b border-border sticky top-0 z-10">
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
            <tbody className="divide-y divide-border/60">
              {sortedGrnItems.map((item) => {
                const dateObj = new Date(item.grn.created_at || item.grn.receiving_date);
                const whName = branches.find((b) => b.id === item.grn.branch_id)?.name || "Warehouse";
                const productObj = products.find((p) => p.id === item.product_id);
                const unitPriceVal = item.unit_price || item.cost_price;

                return (
                  <tr key={`${item.grn.id}-${item.id}`} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 whitespace-nowrap">
                      <span className="font-semibold font-mono text-slate-900 block">{item.grn.invoice_reference || "—"}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {dateObj.toLocaleDateString() +
                          " " +
                          dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800 whitespace-nowrap">{item.grn.supplier_name}</td>
                    <td className="p-3">
                      <span className="font-medium text-slate-800 block">{productObj?.name || "Unknown Product"}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        SKU: {productObj?.sku || item.product_id}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-600">
                      {item.ordered_quantity || item.quantity_received}
                    </td>
                    <td className="p-3 text-right font-bold font-mono tabular-nums text-emerald-700">{item.quantity_received}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-700">{formatPrice(unitPriceVal)}</td>
                    <td className="p-3 text-center font-mono tabular-nums font-medium text-amber-700">{item.commission || 0}%</td>
                    <td className="p-3 text-right font-semibold font-mono tabular-nums text-slate-900">{formatPrice(item.cost_price)}</td>
                    <td className="p-3 text-right font-mono tabular-nums text-slate-700">
                      {formatPrice(item.quantity_received * unitPriceVal)}
                    </td>
                    <td className="p-3 text-right font-bold font-mono tabular-nums text-brand">{formatPrice(item.subtotal)}</td>
                    <td className="p-3 font-medium text-slate-600 whitespace-nowrap">{whName}</td>
                    <td className="p-3 text-center">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] border border-border">
                        {item.batch_number || "—"}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewInvoice(item.grn)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md text-xs transition border border-border"
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
};

