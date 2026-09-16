"use client";

import React from "react";
import { Branch, formatPriceHelper, Product } from "../../types";

interface InvoicePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeGRN: any;
  products: Product[];
  branches: Branch[];
  currency: "BDT" | "USD";
  companyProfile?: any;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  isOpen,
  onClose,
  activeGRN,
  products,
  branches,
  currency,
  companyProfile,
}) => {
  if (!isOpen || !activeGRN) return null;

  const formatPrice = (amount: number) => formatPriceHelper(amount, currency);

  const companyName = companyProfile?.name || "Manor Furniture";
  const companyAddress = companyProfile?.address || "Bozlur Mor, Kushita";
  const companyContact = companyProfile?.contact_person || "";
  const companyEmail = companyProfile?.email || "accounts@manorfurniture.com";
  const companyPhone = companyProfile?.phone || "";

  const handlePrintInvoice = () => {
    const printWindow = window.open("", "_blank", "width=800,height=900");
    if (!printWindow) return;
    const whName = branches.find((b) => b.id === activeGRN.branch_id)?.name || "Warehouse";
    const dateObj = new Date(activeGRN.created_at || activeGRN.receiving_date);
    const dateStr =
      dateObj.toLocaleDateString() +
      " " +
      dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const itemsHtml = (activeGRN.items || [])
      .map((item: any) => {
        const p = products.find((prod) => prod.id === item.product_id);
        const netCostVal = item.cost_price;
        return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; text-align: left; font-size: 13px;">${p?.name || "Unknown Product"}</td>
          <td style="padding: 12px; text-align: left; font-size: 13px; font-family: monospace;">${p?.sku || "—"}</td>
          <td style="padding: 12px; text-align: center; font-size: 13px;">${item.ordered_quantity || item.quantity_received}</td>
          <td style="padding: 12px; text-align: center; font-size: 13px; font-weight: bold; color: #16a34a;">${item.quantity_received}</td>
          <td style="padding: 12px; text-align: right; font-size: 13px;">${formatPrice(netCostVal)}</td>
          <td style="padding: 12px; text-align: right; font-size: 13px; font-weight: bold; color: #1e293b;">${formatPrice(item.quantity_received * netCostVal)}</td>
        </tr>
      `;
      })
      .join("");

    const netTotal = (activeGRN.items || []).reduce(
      (sum: number, item: any) => sum + item.quantity_received * item.cost_price,
      0
    );
    const invoiceGrandTotal = activeGRN.total_amount || netTotal;
    const summaryRowsHtml = `
      <tr class="total-row">
        <td colspan="4" style="padding: 16px 12px; text-align: right; font-size: 15px; font-weight: bold;">Grand Total (Net Amount):</td>
        <td colspan="2" style="padding: 16px 12px; text-align: right; font-size: 18px; color: #1e3a8a; font-weight: bold;">${formatPrice(invoiceGrandTotal)}</td>
      </tr>
    `;

    const html = `
      <html>
        <head>
          <title>Invoice - ${activeGRN.invoice_reference}</title>
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; margin: 0; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .company-info h1 { margin: 0; font-size: 24px; color: #1e3a8a; }
            .company-info p { margin: 4px 0 0 0; font-size: 14px; color: #64748b; }
            .invoice-details { text-align: right; }
            .invoice-details h2 { margin: 0; font-size: 20px; color: #334155; }
            .invoice-details p { margin: 4px 0 0 0; font-size: 13px; color: #64748b; }
            .bill-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
            .bill-box { background-color: #f8fafc; border: 1px solid #f1f5f9; padding: 16px; border-radius: 12px; }
            .bill-box h3 { margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; }
            .bill-box p { margin: 4px 0; font-size: 14px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { background-color: #f1f5f9; color: #475569; font-weight: 600; font-size: 11px; text-transform: uppercase; padding: 12px; text-align: left; }
            .total-row { border-top: 2px solid #cbd5e1; font-weight: bold; }
            .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 60px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-info">
              <h1>${companyName}</h1>
              <p>${companyAddress}</p>
              <p>Contact: ${companyContact ? `${companyContact} (${companyEmail || companyPhone})` : companyEmail}</p>
            </div>
            <div class="invoice-details">
              <h2>PURCHASE INVOICE</h2>
              <p><strong>Invoice Ref:</strong> ${activeGRN.invoice_reference || "—"}</p>
              <p><strong>Date Received:</strong> ${dateStr}</p>
            </div>
          </div>
          <div class="bill-grid">
            <div class="bill-box">
              <h3>Supplier Details</h3>
              <p><strong>Company:</strong> ${activeGRN.supplier_name}</p>
              ${activeGRN.supplier_contact ? `<p><strong>Contact Person:</strong> ${activeGRN.supplier_contact}</p>` : ""}
              ${
                activeGRN.supplier_phone || activeGRN.supplier_email
                  ? `<p><strong>Contact Info:</strong> ${activeGRN.supplier_phone || ""} ${
                      activeGRN.supplier_email ? `| ${activeGRN.supplier_email}` : ""
                    }</p>`
                  : ""
              }
              ${activeGRN.supplier_address ? `<p><strong>Address:</strong> ${activeGRN.supplier_address}</p>` : ""}
            </div>
            <div class="bill-box">
              <h3>Delivery Details</h3>
              <p><strong>Warehouse Destination:</strong> ${whName}</p>
              <p><strong>Status:</strong> Completed / Received</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Product</th>
                <th style="text-align: left;">SKU</th>
                <th style="text-align: center;">Ordered</th>
                <th style="text-align: center;">Received</th>
                <th style="text-align: right;">Unit Price (DP)</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${summaryRowsHtml}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 80px;">
            <div style="text-align: center; width: 200px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px; color: #64748b;">
              Authorized Signature
            </div>
            <div style="text-align: center; width: 200px; border-top: 1px solid #cbd5e1; padding-top: 8px; font-size: 12px; color: #64748b;">
              Supplier Acknowledgment
            </div>
          </div>
          <div class="footer">
            Generated by ${companyName} ERP System &bull; ${new Date().toLocaleString()}
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleEmailInvoice = () => {
    const netTotal = (activeGRN.items || []).reduce(
      (sum: number, item: any) => sum + item.quantity_received * item.cost_price,
      0
    );
    const invoiceGrandTotal = activeGRN.total_amount || netTotal;
    const subject = encodeURIComponent(`Purchase Invoice Reference: ${activeGRN.invoice_reference || "—"}`);
    const body = encodeURIComponent(
      `Dear Supplier,\n\nWe have successfully received the delivery for invoice reference ${
        activeGRN.invoice_reference || "—"
      } at Manor Furniture.\n\nTotal Received Amount: ${formatPrice(
        invoiceGrandTotal
      )}\nDate Received: ${new Date(
        activeGRN.receiving_date || activeGRN.created_at
      ).toLocaleDateString()}\n\nPlease find the detailed invoice in the system portal.\n\nBest regards,\nManor Furniture`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto my-4 animate-scaleUp">
        <div className="p-5 border-b flex items-center justify-between bg-blue-900 sticky top-0 z-10">
          <div className="text-white">
            <h3 className="text-lg font-bold">Purchase Invoice Preview</h3>
            <p className="text-xs text-blue-200 mt-1">Reference: {activeGRN.invoice_reference || "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="px-3.5 py-2 text-xs font-bold text-blue-900 bg-white hover:bg-blue-50 rounded-xl transition-all shadow-sm"
            >
              🖨 Print / Save PDF
            </button>
            <button
              type="button"
              onClick={handleEmailInvoice}
              className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm"
            >
              ✉️ Email Supplier
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold ml-2 transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Standard Invoice Template */}
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start border-b pb-6">
            <div>
              <h1 className="text-2xl font-extrabold text-blue-900">{companyName}</h1>
              <p className="text-xs text-gray-500 mt-1">{companyAddress}</p>
              <p className="text-xs text-gray-500">
                Contact: {companyContact ? `${companyContact} (${companyEmail || companyPhone})` : companyEmail}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black text-gray-800 tracking-wider">PURCHASE INVOICE</h2>
              <div className="text-xs text-gray-500 mt-1.5">
                <p>
                  <strong>Ref:</strong> {activeGRN.invoice_reference || "—"}
                </p>
                <p>
                  <strong>Date Received:</strong>{" "}
                  {(() => {
                    const dateObj = new Date(activeGRN.created_at || activeGRN.receiving_date);
                    return (
                      dateObj.toLocaleDateString() +
                      " " +
                      dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    );
                  })()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Supplier Profile
              </span>
              <span className="font-bold text-gray-800 text-sm block">{activeGRN.supplier_name}</span>
              {activeGRN.supplier_contact && (
                <span className="text-xs text-gray-600 block mt-1">Contact: {activeGRN.supplier_contact}</span>
              )}
              {(activeGRN.supplier_phone || activeGRN.supplier_email) && (
                <span className="text-xs text-gray-500 block">
                  {activeGRN.supplier_phone || ""} {activeGRN.supplier_email ? `| ${activeGRN.supplier_email}` : ""}
                </span>
              )}
              {activeGRN.supplier_address && (
                <span className="text-xs text-gray-500 block italic">{activeGRN.supplier_address}</span>
              )}
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Delivery Destination
              </span>
              <span className="font-bold text-gray-800 text-sm">
                {branches.find((b) => b.id === activeGRN.branch_id)?.name || "Warehouse"}
              </span>
            </div>
          </div>

          <div className="border rounded-xl overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 font-bold border-b text-gray-700">
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">SKU</th>
                  <th className="p-3 text-center">Ordered</th>
                  <th className="p-3 text-center">Received</th>
                  <th className="p-3 text-right">Net Unit Cost</th>
                  <th className="p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(activeGRN.items || []).map((item: any) => {
                  const p = products.find((prod) => prod.id === item.product_id);
                  return (
                    <tr key={item.id || item.product_id} className="hover:bg-gray-55">
                      <td className="p-3 font-semibold text-gray-800">{p?.name || "Unknown Product"}</td>
                      <td className="p-3 font-mono text-xs text-gray-500">{p?.sku || "—"}</td>
                      <td className="p-3 text-center font-medium">
                        {item.ordered_quantity || item.quantity_received}
                      </td>
                      <td className="p-3 text-center font-bold text-green-700">{item.quantity_received}</td>
                      <td className="p-3 text-right font-semibold text-gray-700">{formatPrice(item.cost_price)}</td>
                      <td className="p-3 text-right font-bold text-gray-800">
                        {formatPrice(item.quantity_received * item.cost_price)}
                      </td>
                    </tr>
                  );
                })}
                {(() => {
                  const netTotal = (activeGRN.items || []).reduce(
                    (sum: number, item: any) => sum + item.quantity_received * item.cost_price,
                    0
                  );
                  const invoiceGrandTotal = activeGRN.total_amount || netTotal;
                  return (
                    <tr className="bg-blue-50 font-bold text-gray-900 border-t">
                      <td colSpan={5} className="p-4 text-right text-sm uppercase tracking-wider">
                        Grand Total (Net Amount):
                      </td>
                      <td colSpan={1} className="p-4 text-right text-lg text-blue-900 font-black">
                        {formatPrice(invoiceGrandTotal)}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "40px" }} className="pt-6">
            <div
              style={{
                textAlign: "center",
                width: "180px",
                borderTop: "1px solid #cbd5e1",
                paddingTop: "8px",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              Authorized Signature
            </div>
            <div
              style={{
                textAlign: "center",
                width: "180px",
                borderTop: "1px solid #cbd5e1",
                paddingTop: "8px",
                fontSize: "11px",
                color: "#64748b",
              }}
            >
              Supplier Acknowledgment
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-gray-50 text-center text-xs text-gray-400">
          System generated invoice &bull; Manor Furniture ERP
        </div>
      </div>
    </div>
  );
};

