"use client";

import React, { useState, useEffect } from "react";
import { api, Branch, formatPriceHelper, getLocalDateString, Product, Supplier, USD_EXCHANGE_RATE } from "../../types";

export const generateInvoiceRef = (existingGrns: any[] = []) => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const prefix = `GRN-${dateStr}-`;

  let count = 0;
  if (Array.isArray(existingGrns)) {
    for (const g of existingGrns) {
      if (g?.invoice_reference && typeof g.invoice_reference === "string" && g.invoice_reference.startsWith(prefix)) {
        const parts = g.invoice_reference.split("-");
        const lastPart = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastPart) && lastPart > count) {
          count = lastPart;
        }
      }
    }
  }
  const nextNum = String(count + 1).padStart(3, "0");
  return `${prefix}${nextNum}`;
};

interface GRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  products: Product[];
  suppliers: Supplier[];
  grns: any[];
  userRole: string;
  currency: "BDT" | "USD";
  onGRNSuccess: (
    newGRN: any,
    updatedData: {
      products: Product[];
      valuation: any;
      lowStock: any;
      stockList: any[];
      stockSummary: any;
    }
  ) => void;
}

export const GRNModal: React.FC<GRNModalProps> = ({
  isOpen,
  onClose,
  branches,
  products,
  suppliers,
  grns,
  userRole,
  currency,
  onGRNSuccess,
}) => {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [grnSupplierId, setGrnSupplierId] = useState("");
  const [grnSupplierName, setGrnSupplierName] = useState("");
  const [grnSupplierContact, setGrnSupplierContact] = useState("");
  const [grnSupplierPhone, setGrnSupplierPhone] = useState("");
  const [grnSupplierEmail, setGrnSupplierEmail] = useState("");
  const [grnSupplierAddress, setGrnSupplierAddress] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [grnReceivingDate, setGrnReceivingDate] = useState(getLocalDateString());
  const [grnAdditionalCost, setGrnAdditionalCost] = useState("");
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);
  const [grnSuccessMessage, setGrnSuccessMessage] = useState("");

  const [grnItemsList, setGrnItemsList] = useState<
    {
      product_id: string;
      quantity_received: string;
      cost_price: string;
      commission: string;
      ordered_quantity: string;
      damaged_quantity: string;
      batch_number: string;
    }[]
  >([
    {
      product_id: "",
      quantity_received: "",
      cost_price: "",
      commission: "0",
      ordered_quantity: "",
      damaged_quantity: "0",
      batch_number: "",
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      if (!selectedBranchId && branches.length > 0) {
        const defaultWh = branches.find((b) => b.branch_type === "warehouse") || branches[0];
        if (defaultWh) setSelectedBranchId(defaultWh.id);
      }
      setGrnReceivingDate(getLocalDateString());
      setInvoiceRef(generateInvoiceRef(grns));
    }
  }, [isOpen, branches, grns]);

  if (!isOpen) return null;

  const formatPrice = (amount: number) => formatPriceHelper(amount, currency);

  const resetForm = () => {
    setGrnSupplierId("");
    setGrnSupplierName("");
    setGrnSupplierContact("");
    setGrnSupplierPhone("");
    setGrnSupplierEmail("");
    setGrnSupplierAddress("");
    setGrnAdditionalCost("");
    setGrnReceivingDate(getLocalDateString());
    setInvoiceRef(generateInvoiceRef(grns));
    setGrnItemsList([
      {
        product_id: "",
        quantity_received: "",
        cost_price: "",
        commission: "0",
        ordered_quantity: "",
        damaged_quantity: "0",
        batch_number: "",
      },
    ]);
    setGrnSuccessMessage("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleGRNSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBranchId) {
      alert("Please select a destination warehouse.");
      return;
    }
    if (!grnSupplierName || grnSupplierName.trim().length < 2) {
      alert("Please select a supplier company or enter a Supplier Name (at least 2 characters).");
      return;
    }

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
      const addCost = parseFloat(grnAdditionalCost || "0");
      const baseSubtotals = grnItemsList.map((item) => {
        const raw = parseFloat(item.cost_price || "0");
        const comm = parseFloat(item.commission || "0");
        const qty = parseFloat(item.quantity_received || "0");
        return qty * raw * (1 - comm / 100);
      });
      const totalBaseNet = baseSubtotals.reduce((a, b) => a + b, 0);

      const payloadItems = grnItemsList.map((item, idx) => {
        const rawPrice = parseFloat(item.cost_price);
        const commissionPct = parseFloat(item.commission || "0");
        const baseNetUnit = rawPrice * (1 - commissionPct / 100);
        const qty = parseFloat(item.quantity_received);

        const itemAdditionalShare =
          addCost > 0 && totalBaseNet > 0 ? (baseSubtotals[idx] / totalBaseNet) * addCost : 0;
        const addCostPerUnit = qty > 0 ? itemAdditionalShare / qty : 0;
        const netCostWithAdditional = baseNetUnit + addCostPerUnit;

        const finalCost = currency === "USD" ? netCostWithAdditional * USD_EXCHANGE_RATE : netCostWithAdditional;

        return {
          product_id: item.product_id,
          quantity_received: qty,
          cost_price: finalCost,
          ordered_quantity: item.ordered_quantity ? parseFloat(item.ordered_quantity) : qty,
          damaged_quantity: item.damaged_quantity ? parseFloat(item.damaged_quantity) : 0.0,
          batch_number: item.batch_number || undefined,
          selling_price: undefined,
          unit_price: currency === "USD" ? rawPrice * USD_EXCHANGE_RATE : rawPrice,
          commission: commissionPct,
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
        items: payloadItems,
      };

      const newGRN = await api.submitGRN(payload);

      const [updatedProducts, val, low, updatedStockList, updatedSummary] = await Promise.all([
        api.getProducts(),
        api.getValuationReport(),
        api.getLowStockReport(),
        api.getStockList(),
        api.getStockListSummary(),
      ]);

      onGRNSuccess(newGRN, {
        products: updatedProducts,
        valuation: val,
        lowStock: low,
        stockList: updatedStockList,
        stockSummary: updatedSummary,
      });

      resetForm();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to submit GRN. Please check all fields and try again.");
    } finally {
      setIsSubmittingGRN(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-border shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto my-4 animate-scaleUp">
        <div className="p-5 border-b border-border flex items-center justify-between bg-slate-50/80 backdrop-blur sticky top-0 z-10">
          <div>
            <h3 className="text-base font-bold text-slate-900">Receive Supplier Delivery (GRN)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Logs a physical stock delivery and adjusts costs/selling prices</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        {branches.length === 0 && (
          <div className="m-5 p-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-medium">
            ⚠️ No warehouse locations registered yet. Please configure a warehouse first.
          </div>
        )}
        {products.length === 0 && (
          <div className="m-5 p-3.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-medium">
            ⚠️ No products registered in catalog. Please add catalog products first.
          </div>
        )}

        <form onSubmit={handleGRNSubmit} className="p-5 space-y-4">
          {/* Destination Warehouse */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Destination Warehouse *</label>
            <select
              className={`w-full p-2.5 border border-border rounded-md bg-white text-xs font-medium text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition ${
                userRole !== "owner" ? "bg-slate-100 cursor-not-allowed text-slate-400" : ""
              }`}
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              disabled={userRole !== "owner"}
              required
            >
              <option value="" disabled>
                -- Select destination warehouse --
              </option>
              {branches
                .filter((b) => b.branch_type === "warehouse")
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Supplier Selector */}
          <div className="space-y-3 bg-slate-50/60 p-4 rounded-md border border-border">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Registered Supplier Profile
              </label>
              <select
                className="w-full p-2.5 border border-border rounded-md bg-white text-xs font-medium text-slate-800 focus:ring-1 focus:ring-brand focus:border-brand outline-none transition"
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
                    const found = suppliers.find((s) => s.id === val);
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
                {suppliers
                  .filter((s) => s.is_active !== false)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      🏢 {s.name}
                      {s.contact_person ? ` (Contact: ${s.contact_person})` : ""}
                    </option>
                  ))}
                <option value="custom">✍️ -- Enter Custom Supplier Name --</option>
              </select>
            </div>

            {grnSupplierId === "custom" && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Supplier Name *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs bg-white font-medium text-slate-800 transition"
                  value={grnSupplierName}
                  onChange={(e) => setGrnSupplierName(e.target.value)}
                  placeholder="e.g. Timberwood Ltd"
                  required
                />
              </div>
            )}

            {grnSupplierName ? (
              <div className="bg-white border border-border rounded-md p-4 shadow-sm space-y-3 mt-2">
                <div className="text-[10px] font-bold text-brand uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>📋</span> Supplier Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-border/60 p-2.5 rounded-md">
                    <span className="text-base">🏢</span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Company Name</div>
                      <div className="font-semibold text-slate-800 text-xs">{grnSupplierName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-border/60 p-2.5 rounded-md">
                    <span className="text-base">👤</span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</div>
                      <div className="font-semibold text-slate-800 text-xs">{grnSupplierContact || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-border/60 p-2.5 rounded-md">
                    <span className="text-base">📞</span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</div>
                      <div className="font-semibold text-slate-800 text-xs font-mono">{grnSupplierPhone || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 bg-slate-50 border border-border/60 p-2.5 rounded-md">
                    <span className="text-base">✉️</span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</div>
                      <div
                        className="font-semibold text-slate-800 truncate max-w-[180px] text-xs font-mono"
                        title={grnSupplierEmail}
                      >
                        {grnSupplierEmail || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-start gap-2.5 bg-slate-50 border border-border/60 p-2.5 rounded-md">
                    <span className="text-base mt-0.5">📍</span>
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Office Address</div>
                      <div className="font-semibold text-slate-800 text-xs leading-relaxed">
                        {grnSupplierAddress || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-white border border-dashed border-border rounded-md text-xs text-slate-400">
                💡 Choose a supplier profile above to display contact information.
              </div>
            )}
          </div>

          {/* Invoice Reference & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Invoice Reference *</label>
              <input
                type="text"
                className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs font-mono font-medium text-slate-800 bg-white transition"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="INV-GRN-XXXX"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Receiving Date *</label>
              <input
                type="date"
                className="w-full p-2.5 border border-border rounded-md focus:ring-1 focus:ring-brand focus:border-brand outline-none text-xs bg-white font-mono font-medium text-slate-800 transition"
                value={grnReceivingDate}
                onChange={(e) => setGrnReceivingDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Products receiving table */}
          <div className="border border-border rounded-md overflow-hidden mt-4 bg-white">
            <div className="p-3.5 bg-slate-50/80 border-b border-border flex justify-between items-center">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5"><span>📦</span> Received Product Items</h4>
              <button
                type="button"
                onClick={() => {
                  setGrnItemsList((prev) => [
                    ...prev,
                    {
                      product_id: "",
                      quantity_received: "",
                      cost_price: "",
                      commission: "0",
                      ordered_quantity: "",
                      damaged_quantity: "0",
                      batch_number: "",
                    },
                  ]);
                }}
                className="px-3 py-1.5 bg-brand-light text-brand hover:bg-emerald-100/70 border border-emerald-200 rounded-md text-xs font-bold transition flex items-center gap-1"
              >
                ➕ Add Product Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider text-[11px] border-b border-border">
                  <tr>
                    <th className="p-2.5 w-60">Catalog Product *</th>
                    <th className="p-2.5 w-24 text-right">Received Qty *</th>
                    <th className="p-2.5 w-24 text-right">Unit Price (DP) *</th>
                    <th className="p-2.5 w-20 text-center">Comm (%)</th>
                    <th className="p-2.5 w-24 text-right">Net Cost</th>
                    <th className="p-2.5 w-24 text-right">Ordered Qty</th>
                    <th className="p-2.5 w-20 text-right">Damaged</th>
                    <th className="p-2.5 w-24">Batch No.</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {grnItemsList.map((item, idx) => {
                    const rawCost = parseFloat(item.cost_price || "0");
                    const commPct = parseFloat(item.commission || "0");
                    const netPrice = rawCost * (1 - commPct / 100);

                    const handleItemChange = (field: string, value: string) => {
                      setGrnItemsList((prev) =>
                        prev.map((it, i) => {
                          if (i === idx) {
                            const updatedItem = { ...it, [field]: value };
                            if (field === "product_id") {
                              const selectedProd = products.find((p) => p.id === value);
                              if (selectedProd) {
                                updatedItem.cost_price = (
                                  selectedProd.purchase_cost ||
                                  selectedProd.average_cost ||
                                  0
                                ).toString();
                              }
                            }
                            return updatedItem;
                          }
                          return it;
                        })
                      );
                    };

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-2">
                          <select
                            className="w-full p-2 border border-border rounded-md bg-white outline-none focus:ring-1 focus:ring-brand focus:border-brand text-xs font-medium text-slate-800 transition"
                            value={item.product_id}
                            onChange={(e) => handleItemChange("product_id", e.target.value)}
                            required
                          >
                            <option value="" disabled>
                              -- Select product --
                            </option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.sku})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full p-2 border border-border rounded-md text-right font-mono font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                            value={item.quantity_received}
                            onChange={(e) => handleItemChange("quantity_received", e.target.value)}
                            placeholder="0"
                            required
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full p-2 border border-border rounded-md text-right font-mono font-semibold text-xs text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                            value={item.cost_price}
                            onChange={(e) => handleItemChange("cost_price", e.target.value)}
                            placeholder="0"
                            required
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            className="w-full p-2 border border-border rounded-md text-center font-mono font-medium text-xs text-slate-800 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                            value={item.commission}
                            onChange={(e) => handleItemChange("commission", e.target.value)}
                            placeholder="0"
                          />
                        </td>

                        <td className="p-2 text-right font-mono font-bold text-slate-900 pr-3 tabular-nums">
                          {item.cost_price ? formatPrice(netPrice) : "—"}
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full p-2 border border-border rounded-md text-right font-mono font-medium text-xs text-slate-800 outline-none focus:ring-1 focus:ring-brand focus:border-brand"
                            value={item.ordered_quantity}
                            onChange={(e) => handleItemChange("ordered_quantity", e.target.value)}
                            placeholder="Auto"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full p-2 border border-border rounded-md text-right font-mono font-medium text-xs text-rose-700 outline-none focus:ring-1 focus:ring-rose-400 focus:border-rose-400"
                            value={item.damaged_quantity}
                            onChange={(e) => handleItemChange("damaged_quantity", e.target.value)}
                            placeholder="0"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full p-2 border border-border rounded-md outline-none focus:ring-1 focus:ring-brand focus:border-brand font-mono text-xs text-slate-700"
                            value={item.batch_number}
                            onChange={(e) => handleItemChange("batch_number", e.target.value)}
                            placeholder="Batch"
                          />
                        </td>

                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (grnItemsList.length === 1) {
                                alert("You must keep at least one product item row.");
                                return;
                              }
                              setGrnItemsList((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="text-slate-400 hover:text-rose-600 font-bold text-base px-2 py-0.5 hover:bg-rose-50 rounded transition"
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

            {/* Additional Cost */}
            <div className="p-3.5 bg-amber-50/60 border-t border-amber-200/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-amber-900 font-bold text-xs flex items-center gap-1.5">
                  🚚 Additional Cost (Customs / Freight / Transport):
                </span>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0.00"
                    className="p-1.5 border border-amber-300 rounded-md text-right font-mono font-bold text-amber-950 bg-white text-xs w-36 outline-none focus:ring-1 focus:ring-amber-500 shadow-sm"
                    value={grnAdditionalCost}
                    onChange={(e) => setGrnAdditionalCost(e.target.value)}
                  />
                </div>
                <span className="text-[11px] text-amber-700 italic">
                  * Rationally added to each product's cost proportional to item value
                </span>
              </div>
              {(() => {
                const addCostNum = parseFloat(grnAdditionalCost || "0");
                if (addCostNum > 0) {
                  return (
                    <div className="text-xs font-semibold text-amber-900">
                      Total Added: <span className="font-mono font-bold text-amber-950 text-xs tabular-nums">+{formatPrice(addCostNum)}</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Grand Order value summary */}
            {(() => {
              const grossTotal = grnItemsList.reduce(
                (sum, item) =>
                  sum + parseFloat(item.quantity_received || "0") * parseFloat(item.cost_price || "0"),
                0
              );
              const totalBaseNet = grnItemsList.reduce((sum, item) => {
                const raw = parseFloat(item.cost_price || "0");
                const comm = parseFloat(item.commission || "0");
                const qty = parseFloat(item.quantity_received || "0");
                return sum + qty * raw * (1 - comm / 100);
              }, 0);
              const addCostNum = parseFloat(grnAdditionalCost || "0");
              const grandTotalWithAdd = totalBaseNet + addCostNum;
              const totalItems = grnItemsList.reduce(
                (sum, item) => sum + parseFloat(item.quantity_received || "0"),
                0
              );

              if (grossTotal > 0 || addCostNum > 0) {
                return (
                  <div className="p-4 bg-emerald-50/60 border-t border-emerald-200/80 flex flex-wrap justify-between items-center gap-4 text-xs font-medium text-emerald-950">
                    <div>
                      Received items total qty: <span className="font-mono font-bold text-slate-900 tabular-nums">{totalItems}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        Gross Subtotal: <span className="font-mono font-bold text-slate-900 tabular-nums">{formatPrice(grossTotal)}</span>
                      </div>
                      {addCostNum > 0 && (
                        <div>
                          Additional Cost:{" "}
                          <span className="font-mono font-bold text-amber-900 tabular-nums">+{formatPrice(addCostNum)}</span>
                        </div>
                      )}
                      <div>
                        Total Landed Cost (Net):{" "}
                        <span className="font-mono font-bold text-emerald-900 text-sm tabular-nums">{formatPrice(grandTotalWithAdd)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-border">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingGRN || products.length === 0 || branches.length === 0}
              className="btn-primary text-xs"
            >
              {isSubmittingGRN ? "Confirming..." : "Confirm & Update Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

