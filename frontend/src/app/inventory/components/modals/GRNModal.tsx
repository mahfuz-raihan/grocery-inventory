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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-6xl max-h-[92vh] overflow-y-auto my-4 animate-scaleUp">
        <div className="p-6 border-b flex items-center justify-between bg-blue-50 sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-blue-900">Receive Supplier Delivery (GRN)</h3>
            <p className="text-xs text-blue-600 mt-1">Logs a physical stock delivery and adjusts costs/selling prices</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold transition-colors"
          >
            &times;
          </button>
        </div>

        {branches.length === 0 && (
          <div className="m-6 p-4 bg-yellow-50 text-yellow-750 border border-yellow-200 rounded-xl text-xs font-medium">
            ⚠️ No warehouse locations registered yet. Please configure a warehouse first.
          </div>
        )}
        {products.length === 0 && (
          <div className="m-6 p-4 bg-yellow-50 text-yellow-750 border border-yellow-200 rounded-xl text-xs font-medium">
            ⚠️ No products registered in catalog. Please add catalog products first.
          </div>
        )}

        <form onSubmit={handleGRNSubmit} className="p-6 space-y-4">
          {/* Destination Warehouse */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Destination Warehouse *</label>
            <select
              className={`w-full p-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium ${
                userRole !== "owner" ? "bg-gray-100 cursor-not-allowed text-gray-500" : ""
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
          <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Registered Supplier Profile
              </label>
              <select
                className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs"
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
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Supplier Name *</label>
                <input
                  type="text"
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white font-semibold text-gray-700"
                  value={grnSupplierName}
                  onChange={(e) => setGrnSupplierName(e.target.value)}
                  placeholder="e.g. Timberwood Ltd"
                  required
                />
              </div>
            )}

            {grnSupplierName ? (
              <div className="bg-white border border-blue-100 rounded-xl p-3.5 shadow-sm space-y-2 mt-2">
                <div className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <span>📋</span> Supplier Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <span className="text-base">🏢</span>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Company Name</div>
                      <div className="font-semibold text-gray-800">{grnSupplierName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <span className="text-base">👤</span>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Contact Person</div>
                      <div className="font-semibold text-gray-800">{grnSupplierContact || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <span className="text-base">📞</span>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Phone Number</div>
                      <div className="font-semibold text-gray-800">{grnSupplierPhone || "—"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                    <span className="text-base">✉️</span>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Email Address</div>
                      <div
                        className="font-semibold text-gray-800 truncate max-w-[180px]"
                        title={grnSupplierEmail}
                      >
                        {grnSupplierEmail || "—"}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-base mt-0.5">📍</span>
                    <div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Office Address</div>
                      <div className="font-semibold text-gray-800 text-[11px] leading-relaxed">
                        {grnSupplierAddress || "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-4 bg-white border border-dashed rounded-xl text-xs text-gray-400">
                💡 Choose a supplier profile above to display contact information.
              </div>
            )}
          </div>

          {/* Invoice Reference & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Reference *</label>
              <input
                type="text"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-gray-700 bg-white"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                placeholder="INV-GRN-XXXX"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Receiving Date *</label>
              <input
                type="date"
                className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white font-medium"
                value={grnReceivingDate}
                onChange={(e) => setGrnReceivingDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Products receiving table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mt-4">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h4 className="font-bold text-gray-800 text-sm">📦 Received Product Items</h4>
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
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                ➕ Add Product Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-gray-100/80 font-bold text-gray-700 uppercase border-b">
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
                <tbody className="divide-y divide-gray-100">
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
                      <tr key={idx} className="hover:bg-gray-55">
                        <td className="p-2">
                          <select
                            className="w-full p-1.5 border rounded-lg bg-white outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
                            className="w-full p-1.5 border rounded-lg text-right font-semibold outline-none focus:ring-1 focus:ring-blue-500"
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
                            className="w-full p-1.5 border rounded-lg text-right font-semibold outline-none focus:ring-1 focus:ring-blue-500"
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
                            className="w-full p-1.5 border rounded-lg text-center outline-none focus:ring-1 focus:ring-orange-400 font-medium"
                            value={item.commission}
                            onChange={(e) => handleItemChange("commission", e.target.value)}
                            placeholder="0"
                          />
                        </td>

                        <td className="p-2 text-right font-bold text-emerald-700 pr-3">
                          {item.cost_price ? formatPrice(netPrice) : "—"}
                        </td>

                        <td className="p-2">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="w-full p-1.5 border rounded-lg text-right outline-none focus:ring-1 focus:ring-blue-500 font-medium"
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
                            className="w-full p-1.5 border rounded-lg text-right outline-none focus:ring-1 focus:ring-red-400 font-medium"
                            value={item.damaged_quantity}
                            onChange={(e) => handleItemChange("damaged_quantity", e.target.value)}
                            placeholder="0"
                          />
                        </td>

                        <td className="p-2">
                          <input
                            type="text"
                            className="w-full p-1.5 border rounded-lg outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-gray-700"
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
                            className="text-red-500 hover:text-red-700 font-black text-lg px-2 py-0.5 hover:bg-red-50 rounded transition"
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
            <div className="p-3.5 bg-amber-50/70 border-t border-amber-200 flex flex-wrap items-center justify-between gap-4">
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
                    className="p-1.5 border border-amber-300 rounded-lg text-right font-bold text-amber-900 bg-white text-xs w-36 outline-none focus:ring-2 focus:ring-amber-500 shadow-sm"
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
                      Total Added: <span className="font-black text-amber-950 text-sm">+{formatPrice(addCostNum)}</span>
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
                  <div className="p-4 bg-blue-50 border-t border-blue-200 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold text-blue-900">
                    <div>
                      Received items total qty: <span className="font-bold text-gray-850">{totalItems}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <div>
                        Gross Subtotal: <span className="font-bold text-gray-850">{formatPrice(grossTotal)}</span>
                      </div>
                      {addCostNum > 0 && (
                        <div>
                          Additional Cost:{" "}
                          <span className="font-bold text-amber-800">+{formatPrice(addCostNum)}</span>
                        </div>
                      )}
                      <div>
                        Total Landed Cost (Net):{" "}
                        <span className="font-black text-emerald-800 text-sm">{formatPrice(grandTotalWithAdd)}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingGRN || products.length === 0 || branches.length === 0}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-xl font-bold transition-all text-sm shadow-sm"
            >
              {isSubmittingGRN ? "Confirming..." : "Confirm & Update Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

