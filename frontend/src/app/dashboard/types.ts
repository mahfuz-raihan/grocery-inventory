export interface SaleInvoiceItem {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal?: number;
  supplier_name?: string | null;
}

export interface SaleInvoice {
  id: string;
  receipt_number: string;
  branch_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_amount: number;
  discount: number;
  status: "Paid" | "Due";
  created_at: string;
  items: SaleInvoiceItem[];
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  address: string;
  total_invoices: number;
  total_spent: number;
  last_order_date: string;
  invoices: SaleInvoice[];
}

export interface CustomerLedgerEntry {
  id: string;
  date: string;
  receipt_number: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  cumulative_total: number;
  status: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  sku?: string;
  unit?: string;
  average_cost?: number;
  purchase_cost?: number;
}

export const getInvoiceCost = (inv: SaleInvoice, catalogProducts: CatalogProduct[]): number => {
  return inv.items.reduce((sum, item) => {
    const prod = catalogProducts.find((p) => p.id === item.product_id);
    const unitCost =
      prod?.average_cost && prod.average_cost > 0
        ? prod.average_cost
        : prod?.purchase_cost || 0;
    return sum + item.quantity * unitCost;
  }, 0);
};

export const getInvoiceNetProfit = (
  inv: SaleInvoice,
  catalogProducts: CatalogProduct[]
): { netProfit: number; marginPercent: number } => {
  const cost = getInvoiceCost(inv, catalogProducts);
  const netProfit = inv.total_amount - cost;
  const marginPercent = inv.total_amount > 0 ? (netProfit / inv.total_amount) * 100 : 0;
  return { netProfit, marginPercent };
};

export interface Branch {
  id: string;
  name: string;
  branch_type: string;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
}

export interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
}

export const formatPrice = (priceInBDT: number): string => {
  return `৳${(priceInBDT || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, "0");

  return `${year}-${month}-${day} ${strHours}:${minutes} ${ampm}`;
};

export const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

