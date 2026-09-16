"use client";

import React, { useState, useMemo } from "react";
import { CustomerSummary, SaleInvoice, formatPrice, formatDateOnly } from "../types";

interface CustomersTabProps {
  invoices: SaleInvoice[];
  onOpenCustomerInvoices: (c: CustomerSummary) => void;
  onOpenCustomerLedger: (c: CustomerSummary) => void;
  onOpenCustomerProfile: (c: CustomerSummary) => void;
}

interface ColumnOption {
  key: string;
  label: string;
  visible: boolean;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  invoices,
  onOpenCustomerInvoices,
  onOpenCustomerLedger,
  onOpenCustomerProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"spent_desc" | "orders_desc" | "name_asc" | "date_desc">("spent_desc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Column Visibility State
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [columns, setColumns] = useState<ColumnOption[]>([
    { key: "customer", label: "Customer", visible: true },
    { key: "phone", label: "Phone", visible: true },
    { key: "total_invoices", label: "Total Invoices", visible: true },
    { key: "total_spent", label: "Total Spent", visible: true },
    { key: "last_active", label: "Last Active", visible: true },
    { key: "actions", label: "Actions", visible: true },
  ]);

  const toggleColumn = (key: string) => {
    setColumns((prev) =>
      prev.map((col) => (col.key === key ? { ...col, visible: !col.visible } : col))
    );
  };

  const isVisible = (key: string) => {
    return columns.find((c) => c.key === key)?.visible ?? true;
  };

  // Aggregate Unique Customers from Invoices
  const uniqueCustomers = useMemo(() => {
    const map = new Map<string, CustomerSummary>();

    for (const inv of invoices) {
      const phone = (inv.customer_phone || "").trim();
      const name = (inv.customer_name || "Walk-in Customer").trim();
      // Unique key: phone if provided, else name
      const key = phone && phone !== "—" && phone !== "N/A" ? phone : `name_${name.toLowerCase()}`;

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: name,
          phone: phone || "—",
          address: inv.customer_address || "—",
          total_invoices: 0,
          total_spent: 0,
          last_order_date: inv.created_at,
          invoices: [],
        });
      }

      const entry = map.get(key)!;
      entry.total_invoices += 1;
      entry.total_spent += inv.total_amount;
      entry.invoices.push(inv);

      // Keep latest address and date
      if (new Date(inv.created_at) > new Date(entry.last_order_date)) {
        entry.last_order_date = inv.created_at;
        if (inv.customer_address && inv.customer_address !== "—") {
          entry.address = inv.customer_address;
        }
      }
    }

    return Array.from(map.values());
  }, [invoices]);

  // Filter & Sort
  const filteredCustomers = useMemo(() => {
    return uniqueCustomers
      .filter((c) => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          c.name.toLowerCase().includes(term) ||
          c.phone.toLowerCase().includes(term) ||
          c.address.toLowerCase().includes(term)
        );
      })
      .sort((a, b) => {
        if (sortBy === "spent_desc") {
          return b.total_spent - a.total_spent;
        }
        if (sortBy === "orders_desc") {
          return b.total_invoices - a.total_invoices;
        }
        if (sortBy === "name_asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "date_desc") {
          return new Date(b.last_order_date).getTime() - new Date(a.last_order_date).getTime();
        }
        return 0;
      });
  }, [uniqueCustomers, searchTerm, sortBy]);

  // Total metrics
  const totalCustomerCount = uniqueCustomers.length;
  const grandTotalSpent = uniqueCustomers.reduce((s, c) => s + c.total_spent, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Unique Customers
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalCustomerCount}</p>
          <div className="mt-2 text-[11px] text-slate-500">
            Registered buyers & walk-in clients
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Customer Spend
          </span>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">
            {formatPrice(grandTotalSpent)}
          </p>
          <div className="mt-2 text-[11px] text-slate-500">
            Total revenue generated from customers
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Avg Customer Value
          </span>
          <p className="text-2xl font-extrabold text-blue-600 mt-2">
            {formatPrice(totalCustomerCount > 0 ? grandTotalSpent / totalCustomerCount : 0)}
          </p>
          <div className="mt-2 text-[11px] text-slate-500">
            Average revenue per unique customer
          </div>
        </div>
      </div>

      {/* 2. Controls Toolbar: Search, Sort & Column Toggle */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Customer Name or Phone Number..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort & Column Toggles */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition"
            >
              <option value="spent_desc">💰 Total Spent: High to Low</option>
              <option value="orders_desc">📦 Total Orders: High to Low</option>
              <option value="name_asc">👤 Customer Name: A-Z</option>
              <option value="date_desc">📅 Last Active: Recent First</option>
            </select>

            {/* Column Active/Deactive Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumnMenu(!showColumnMenu)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <span>Columns 👁️</span>
              </button>

              {showColumnMenu && (
                <div className="absolute right-0 top-11 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 text-xs space-y-2 animate-fadeIn">
                  <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1 border-b">
                    Toggle Table Columns
                  </div>
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumn(col.key)}
                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                      />
                      <span>{col.label}</span>
                    </label>
                  ))}
                  <div className="pt-2 border-t flex justify-end">
                    <button
                      onClick={() => setShowColumnMenu(false)}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Customers Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <span className="text-4xl block mb-2">👥</span>
            <p className="font-bold text-slate-600 text-sm">No customers found</p>
            <p className="text-xs mt-1">Try another search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                  {isVisible("customer") && <th className="p-3">Customer</th>}
                  {isVisible("phone") && <th className="p-3">Phone</th>}
                  {isVisible("total_invoices") && <th className="p-3 text-center">Total Invoices</th>}
                  {isVisible("total_spent") && <th className="p-3 text-right">Total Spent</th>}
                  {isVisible("last_active") && <th className="p-3 text-center">Last Active</th>}
                  {isVisible("actions") && <th className="p-3 text-center w-16">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/60 transition duration-150">
                    {/* Customer */}
                    {isVisible("customer") && (
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                            {cust.name ? cust.name[0].toUpperCase() : "C"}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{cust.name}</span>
                            <span className="text-[11px] text-slate-400 block truncate max-w-xs font-normal">
                              {cust.address}
                            </span>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Phone */}
                    {isVisible("phone") && (
                      <td className="p-3 text-slate-600 font-semibold whitespace-nowrap">
                        {cust.phone}
                      </td>
                    )}

                    {/* Total Invoices Count */}
                    {isVisible("total_invoices") && (
                      <td className="p-3 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {cust.total_invoices} {cust.total_invoices === 1 ? "Order" : "Orders"}
                        </span>
                      </td>
                    )}

                    {/* Total Spent */}
                    {isVisible("total_spent") && (
                      <td className="p-3 text-right font-extrabold text-slate-900 whitespace-nowrap text-sm">
                        {formatPrice(cust.total_spent)}
                      </td>
                    )}

                    {/* Last Active */}
                    {isVisible("last_active") && (
                      <td className="p-3 text-center text-slate-500 whitespace-nowrap font-medium">
                        {formatDateOnly(cust.last_order_date)}
                      </td>
                    )}

                    {/* Three-Dot Actions Dropdown */}
                    {isVisible("actions") && (
                      <td className="p-3 text-center relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenuId(openMenuId === cust.id ? null : cust.id)
                          }
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 font-black text-sm transition"
                          title="Options"
                        >
                          ⋮
                        </button>

                        {openMenuId === cust.id && (
                          <div className="absolute right-3 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-20 py-1 text-left text-xs animate-fadeIn">
                            <button
                              onClick={() => {
                                onOpenCustomerInvoices(cust);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                            >
                              <span>🧾</span>
                              <span>Invoices ({cust.total_invoices})</span>
                            </button>
                            <button
                              onClick={() => {
                                onOpenCustomerLedger(cust);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-semibold"
                            >
                              <span>📊</span>
                              <span>Purchased Ledger</span>
                            </button>
                            <div className="border-t border-slate-100 my-0.5"></div>
                            <button
                              onClick={() => {
                                onOpenCustomerProfile(cust);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-blue-600 font-semibold"
                            >
                              <span>👤</span>
                              <span>Customer Profile</span>
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

