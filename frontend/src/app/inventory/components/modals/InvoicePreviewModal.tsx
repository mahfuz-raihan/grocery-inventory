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
      .map((item: any, idx: number) => {
        const p = products.find((prod) => prod.id === item.product_id);
        const netCostVal = item.cost_price;
        return `
        <tr style="background: ${idx % 2 === 1 ? "#f8fafc" : "#ffffff"};">
          <td style="padding: 8px 10px; text-align: left; font-size: 12px; font-weight: 800; color: #000000; border: 1px solid #94a3b8;">${p?.name || "Unknown Product"}</td>
          <td style="padding: 8px 10px; text-align: left; font-size: 11px; font-family: monospace; font-weight: 700; color: #1e40af; border: 1px solid #94a3b8;">${p?.sku || "—"}</td>
          <td style="padding: 8px 10px; text-align: center; font-size: 12px; font-weight: 700; color: #000000; border: 1px solid #94a3b8;">${item.ordered_quantity || item.quantity_received}</td>
          <td style="padding: 8px 10px; text-align: center; font-size: 12px; font-weight: 900; color: #047857; border: 1px solid #94a3b8;">${item.quantity_received}</td>
          <td style="padding: 8px 10px; text-align: right; font-size: 12px; font-weight: 700; color: #000000; border: 1px solid #94a3b8;">${formatPrice(netCostVal)}</td>
          <td style="padding: 8px 10px; text-align: right; font-size: 12px; font-weight: 900; color: #000000; border: 1px solid #94a3b8;">${formatPrice(item.quantity_received * netCostVal)}</td>
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
        <td colspan="4" style="padding: 12px 10px; text-align: right; font-size: 14px; font-weight: 900; color: #000000; border: 1.5px solid #000000; background: #e2e8f0; text-transform: uppercase;">Grand Total (Net Amount):</td>
        <td colspan="2" style="padding: 12px 10px; text-align: right; font-size: 16px; color: #000000; font-weight: 900; border: 1.5px solid #000000; background: #e2e8f0;">${formatPrice(invoiceGrandTotal)}</td>
      </tr>
    `;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Purchase Invoice - ${activeGRN.invoice_reference || "GRN"}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              color: #000000;
              margin: 0;
              padding: 6px;
              font-size: 12px;
              line-height: 1.45;
              -webkit-font-smoothing: antialiased;
              text-rendering: optimizeLegibility;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px solid #000000;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .company-info h1 {
              margin: 0;
              font-size: 22px;
              font-weight: 900;
              color: #000000;
              letter-spacing: -0.02em;
              text-transform: uppercase;
            }
            .company-info p {
              margin: 3px 0 0 0;
              font-size: 11px;
              color: #0f172a;
              font-weight: 600;
            }
            .invoice-details {
              text-align: right;
            }
            .invoice-details h2 {
              margin: 0;
              font-size: 18px;
              font-weight: 900;
              color: #1e40af;
              letter-spacing: 0.04em;
              text-transform: uppercase;
            }
            .invoice-details p {
              margin: 3px 0 0 0;
              font-size: 11.5px;
              color: #000000;
              font-weight: 700;
            }
            .bill-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-bottom: 20px;
            }
            .bill-box {
              background-color: #f8fafc;
              border: 1.5px solid #0f172a;
              padding: 12px 14px;
              border-radius: 6px;
            }
            .bill-box h3 {
              margin: 0 0 6px 0;
              font-size: 10px;
              text-transform: uppercase;
              color: #0f172a;
              font-weight: 800;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 4px;
            }
            .bill-box p {
              margin: 3px 0;
              font-size: 11.5px;
              font-weight: 700;
              color: #000000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th {
              background-color: #0f172a;
              color: #ffffff;
              font-weight: 800;
              font-size: 10px;
              text-transform: uppercase;
              padding: 8px 10px;
              text-align: left;
              border: 1.5px solid #0f172a;
              letter-spacing: 0.03em;
            }
            td {
              border: 1px solid #94a3b8;
            }
            .total-row td {
              border: 2px solid #000000;
              font-weight: 900;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              font-weight: 700;
              color: #475569;
              border-top: 1px dashed #94a3b8;
              padding-top: 10px;
              margin-top: 30px;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
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
              <p><strong>Invoice Ref:</strong> <span style="font-family: monospace; font-size: 12px; color: #1e40af;">${activeGRN.invoice_reference || "—"}</span></p>
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
              <p><strong>Status:</strong> <span style="color: #047857; font-weight: 900;">Completed / Received</span></p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Product</th>
                <th style="text-align: left; width: 100px;">SKU</th>
                <th style="text-align: center; width: 75px;">Ordered</th>
                <th style="text-align: center; width: 75px;">Received</th>
                <th style="text-align: right; width: 110px;">Unit Price (DP)</th>
                <th style="text-align: right; width: 120px;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              ${summaryRowsHtml}
            </tbody>
          </table>
          <div style="display: flex; justify-content: space-between; margin-top: 50px;">
            <div style="text-align: center; width: 200px; border-top: 2px solid #000000; padding-top: 6px; font-size: 11px; font-weight: 800; color: #000000;">
              Authorized Signature
            </div>
            <div style="text-align: center; width: 200px; border-top: 2px solid #000000; padding-top: 6px; font-size: 11px; font-weight: 800; color: #000000;">
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

