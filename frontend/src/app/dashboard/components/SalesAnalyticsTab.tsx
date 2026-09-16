"use client";

import React, { useState } from "react";
import {
  CatalogProduct,
  Branch,
  formatPrice,
  formatDateTime,
} from "../types";

interface ChartDataPoint {
  label: string;
  amount: number;
  count: number;
}

interface SalesAnalyticsTabProps {
  loading: boolean;
  analytics: any;
  chartData: ChartDataPoint[];
  chartGroup: "daily" | "weekly" | "monthly" | "yearly";
  setChartGroup: (g: "daily" | "weekly" | "monthly" | "yearly") => void;
  recentSalesList: any[];
  displayedSales: any[];
  showAllSales: boolean;
  setShowAllSales: (v: boolean) => void;
  catalogProducts: CatalogProduct[];
  branches: Branch[];
  onViewInvoice: (sale: any) => void;
}

export const SalesAnalyticsTab: React.FC<SalesAnalyticsTabProps> = ({
  loading,
  analytics,
  chartData,
  chartGroup,
  setChartGroup,
  recentSalesList,
  displayedSales,
  showAllSales,
  setShowAllSales,
  catalogProducts,
  branches,
  onViewInvoice,
}) => {
  const getWarehouseName = (branchId: string) => {
    const match = branches.find((b) => b.id === branchId);
    return match ? match.name : `Warehouse (${branchId.slice(0, 8)})`;
  };

  const getProductNamesString = (items: any[]) => {
    if (!items || items.length === 0) return "No products";
    const names = items.map((item) => {
      const match = catalogProducts.find((p) => p.id === item.product_id);
      return match ? match.name : `Product (${item.product_id.slice(0, 8)})`;
    });
    if (names.length === 1) return names[0];
    return `${names[0]} (+${names.length - 1} items)`;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-white border border-slate-200 rounded-2xl" />
          <div className="h-32 bg-white border border-slate-200 rounded-2xl" />
        </div>
        <div className="h-64 bg-white border border-slate-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Revenue
            </span>
            <p className="text-3xl font-extrabold text-slate-900">
              {formatPrice(analytics?.total_revenue || 0)}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                Settled Sales
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between transition-all duration-300 hover:shadow-md hover:border-slate-300">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </span>
            <p className="text-3xl font-extrabold text-slate-900">
              {analytics?.total_orders || 0}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                Paid Orders
              </span>
            </div>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Unified Sales & Orders Line Chart */}
      <LineChart
        title="Unified Sales & Orders Performance"
        data={chartData}
        activeGroup={chartGroup}
        setActiveGroup={setChartGroup}
        formatPrice={formatPrice}
      />

      {/* Recent Sales Table Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-base tracking-tight">Recent Sales Details</h3>
            <p className="text-xs text-slate-400 font-medium">
              Latest transactions recorded in the selected period
            </p>
          </div>
          <button
            onClick={() => setShowAllSales(!showAllSales)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition duration-150 sm:self-center"
          >
            {showAllSales ? "Show Less" : "View All"}
          </button>
        </div>

        {recentSalesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <span className="text-sm font-semibold">No recent transactions in this range</span>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3 text-left first:rounded-l-xl">Order ID</th>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Warehouse</th>
                  <th className="p-3 text-left">Customer Name</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Discount</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left last:rounded-r-xl">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition duration-150">
                    <td className="p-3 font-bold text-slate-800">{sale.receipt_number}</td>
                    <td className="p-3 text-slate-500 font-semibold">{formatDateTime(sale.created_at)}</td>
                    <td className="p-3 text-slate-700 font-semibold">{getWarehouseName(sale.branch_id)}</td>
                    <td className="p-3 text-slate-600 font-semibold">{sale.customer_name}</td>
                    <td
                      className="p-3 text-slate-500 italic max-w-xs truncate"
                      title={sale.items
                        .map(
                          (item: any) =>
                            catalogProducts.find((p) => p.id === item.product_id)?.name || "Product"
                        )
                        .join(", ")}
                    >
                      {getProductNamesString(sale.items)}
                    </td>
                    <td className="p-3 text-slate-500 font-bold">{formatPrice(sale.discount)}</td>
                    <td className="p-3 font-extrabold text-slate-900">{formatPrice(sale.total_amount)}</td>
                    <td className="p-3">
                      <button
                        onClick={() => onViewInvoice(sale)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-lg font-bold shadow-sm transition duration-150"
                      >
                        View Invoice
                      </button>
                    </td>
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

// LineChart Component
function LineChart({
  title,
  data,
  activeGroup,
  setActiveGroup,
  formatPrice,
}: {
  title: string;
  data: ChartDataPoint[];
  activeGroup: "daily" | "weekly" | "monthly" | "yearly";
  setActiveGroup: (g: "daily" | "weekly" | "monthly" | "yearly") => void;
  formatPrice: (v: number) => string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxAmount = data.reduce((max, p) => (p.amount > max ? p.amount : max), 0) || 1;
  const maxCount = data.reduce((max, p) => (p.count > max ? p.count : max), 0) || 1;

  const steps = 4;
  const leftAxisLabels = Array.from({ length: steps + 1 }, (_, i) => {
    const value = maxAmount * ((steps - i) / steps);
    return formatPrice(value);
  });

  const rightAxisLabels = Array.from({ length: steps + 1 }, (_, i) => {
    const value = maxCount * ((steps - i) / steps);
    return Math.ceil(value).toString();
  });

  const n = data.length;

  const getX = (index: number) => {
    if (n <= 1) return 500;
    return (index / (n - 1)) * 940 + 30;
  };

  const getYAmount = (amount: number) => {
    return 180 - (amount / maxAmount) * 150 + 10;
  };

  const getYCount = (count: number) => {
    return 180 - (count / maxCount) * 150 + 10;
  };

  const getBezierCurvePath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];

      const cp1x = curr.x + (next.x - curr.x) / 3;
      const cp1y = curr.y;
      const cp2x = curr.x + (2 * (next.x - curr.x)) / 3;
      const cp2y = next.y;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return path;
  };

  const amountPoints = data.map((p, i) => ({ x: getX(i), y: getYAmount(p.amount) }));
  const amountLinePath = getBezierCurvePath(amountPoints);
  const amountAreaPath = n > 0 ? `${amountLinePath} L ${getX(n - 1)} 190 L ${getX(0)} 190 Z` : "";

  const ordersPoints = data.map((p, i) => ({ x: getX(i), y: getYCount(p.count) }));
  const ordersLinePath = getBezierCurvePath(ordersPoints);
  const ordersAreaPath = n > 0 ? `${ordersLinePath} L ${getX(n - 1)} 190 L ${getX(0)} 190 Z` : "";

  const formatLabel = (label: string, group: string) => {
    if (group === "daily") {
      try {
        const parts = label.split("-");
        if (parts.length === 3) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          return dateObj.toLocaleDateString("en-US", { day: "numeric", month: "short" });
        }
      } catch (e) {}
    }
    if (group === "monthly") {
      try {
        const parts = label.split("-");
        if (parts.length === 2) {
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
          return dateObj.toLocaleDateString("en-US", { month: "short" });
        }
      } catch (e) {}
    }
    return label.split("-").slice(-2).join("-") || label;
  };

  const labelStep = n > 30 ? 5 : n > 15 ? 3 : 1;
  const isFarRight = hoveredIndex !== null && hoveredIndex / (n - 1 || 1) > 0.8;
  const tooltipLeftOffset =
    hoveredIndex !== null
      ? isFarRight
        ? `calc(${getX(hoveredIndex) / 10}% - 12px)`
        : `calc(${getX(hoveredIndex) / 10}% + 12px)`
      : "0%";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 transition-all duration-300 hover:shadow-md flex flex-col h-[320px] overflow-hidden w-full select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4 flex-shrink-0">
        <div>
          <h3 className="font-bold text-slate-800 text-sm tracking-tight">{title}</h3>
          <div className="flex items-center gap-3.5 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-[10px] font-bold text-slate-500">Sales (৳)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[10px] font-bold text-slate-500">Order</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            Group By
          </span>
          <select
            value={activeGroup}
            onChange={(e) => setActiveGroup(e.target.value as any)}
            className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all cursor-pointer"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
          <svg className="w-10 h-10 mb-1 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"
            />
          </svg>
          <span className="text-xs font-semibold">No transactions for this interval</span>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
          <div className="flex-1 flex items-stretch h-44 overflow-hidden relative">
            <div className="w-20 pr-2 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-right border-r border-slate-100 flex-shrink-0 pointer-events-none">
              {leftAxisLabels.map((lbl, idx) => (
                <span key={idx} className="truncate">
                  {lbl}
                </span>
              ))}
            </div>

            <div className="flex-1 relative pl-1 pr-1">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-1">
                {Array.from({ length: steps }).map((_, idx) => (
                  <div key={idx} className="w-full border-t border-dashed border-slate-100 flex-1"></div>
                ))}
                <div className="w-full border-t border-slate-200"></div>
              </div>

              {hoveredIndex !== null && (
                <div
                  className={`absolute top-2 z-30 pointer-events-none transition-all duration-150 ${
                    isFarRight ? "-translate-x-full" : "translate-x-0"
                  }`}
                  style={{ left: tooltipLeftOffset }}
                >
                  <div className="bg-white border border-slate-200 rounded-xl p-2.5 shadow-md space-y-0.5 min-w-[120px]">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                      {data[hoveredIndex].label}
                    </div>
                    <div className="text-[10px] text-slate-600 flex justify-between gap-3">
                      <span>Sale:</span>
                      <span className="font-extrabold text-blue-600">
                        {formatPrice(data[hoveredIndex].amount)}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 flex justify-between gap-3">
                      <span>Order:</span>
                      <span className="font-extrabold text-emerald-600">
                        {data[hoveredIndex].count}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {hoveredIndex !== null && (
                <div
                  style={{ left: `${getX(hoveredIndex) / 10}%` }}
                  className="absolute bottom-[-8px] transform -translate-x-1/2 bg-white border border-slate-200 rounded px-1.5 py-0.5 text-[8px] font-extrabold text-slate-800 shadow-sm z-20"
                >
                  {formatLabel(data[hoveredIndex].label, activeGroup)}
                </div>
              )}

              <svg className="w-full h-full overflow-visible z-10 relative" viewBox="0 0 1000 200" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="amountGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={amountAreaPath} fill="url(#amountGrad)" className="transition-all duration-300" />
                <path d={amountLinePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />
                <path d={ordersAreaPath} fill="url(#ordersGrad)" className="transition-all duration-300" />
                <path d={ordersLinePath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-300" />

                {hoveredIndex !== null && (
                  <line
                    x1={getX(hoveredIndex)}
                    y1={0}
                    x2={getX(hoveredIndex)}
                    y2={190}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    strokeWidth={1.5}
                  />
                )}

                {hoveredIndex !== null && (
                  <>
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getYAmount(data[hoveredIndex].amount)}
                      r={5}
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={getX(hoveredIndex)}
                      cy={getYCount(data[hoveredIndex].count)}
                      r={5}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={1.5}
                    />
                  </>
                )}

                {data.map((p, i) => {
                  const xStart = n > 1 ? (getX(i) + getX(i - 1)) / 2 : 0;
                  const xEnd = n > 1 ? (getX(i + 1) + getX(i)) / 2 : 1000;
                  const x = i === 0 ? 0 : xStart;
                  const w = i === 0 ? xEnd : i === n - 1 ? 1000 - xStart : xEnd - xStart;

                  return (
                    <rect
                      key={i}
                      x={x}
                      y={0}
                      width={w}
                      height={200}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="w-12 pl-2 flex flex-col justify-between text-[9px] font-bold text-slate-400 text-left border-l border-slate-100 flex-shrink-0 pointer-events-none">
              {rightAxisLabels.map((lbl, idx) => (
                <span key={idx}>{lbl}</span>
              ))}
            </div>
          </div>

          <div className="h-5 relative mt-1 border-t border-slate-100 flex-shrink-0 w-full pl-20 pr-12">
            <div className="relative w-full h-full">
              {data.map((p, i) => {
                if (i % labelStep !== 0 && i !== n - 1) return null;
                return (
                  <span
                    key={i}
                    style={{ left: `${getX(i) / 10}%` }}
                    className="absolute top-0.5 transform -translate-x-1/2 text-[8px] font-bold text-slate-400 whitespace-nowrap"
                  >
                    {formatLabel(p.label, activeGroup)}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

