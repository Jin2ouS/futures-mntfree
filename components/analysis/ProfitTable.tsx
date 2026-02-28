"use client";

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import type { DailyProfit, WeeklyProfit, MonthlyProfit } from "@/lib/types";

type TableData = DailyProfit[] | WeeklyProfit[] | MonthlyProfit[];
type SortOrder = "asc" | "desc";

interface ProfitTableProps {
  data: TableData;
  type: "daily" | "weekly" | "monthly";
}

export default function ProfitTable({ data, type }: ProfitTableProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--muted)]">
        데이터가 없습니다.
      </div>
    );
  }

  const sortedData = useMemo(() => {
    return sortOrder === "desc" ? [...data].reverse() : data;
  }, [data, sortOrder]);

  const total = data.reduce((sum, item) => sum + item.profit, 0);

  const getLabel = (item: DailyProfit | WeeklyProfit | MonthlyProfit) => {
    if (type === "daily") return (item as DailyProfit).date;
    if (type === "weekly") return (item as WeeklyProfit).label;
    return (item as MonthlyProfit).month;
  };

  const headers = {
    daily: "일자",
    weekly: "주간",
    monthly: "월",
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)]">
            <th 
              className="text-left py-3 px-4 text-[var(--muted)] font-medium cursor-pointer hover:text-[var(--foreground)] transition-colors select-none"
              onClick={toggleSort}
            >
              <span className="inline-flex items-center gap-1">
                {headers[type]}
                {sortOrder === "asc" ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
              </span>
            </th>
            <th className="text-right py-3 px-4 text-[var(--muted)] font-medium">
              실수익
            </th>
            <th className="text-right py-3 px-4 text-[var(--muted)] font-medium">
              누적
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, idx) => (
            <tr
              key={idx}
              className="border-b border-[var(--border)] hover:bg-white/[0.02]"
            >
              <td className="py-3 px-4 text-[var(--foreground)]">
                {getLabel(item)}
              </td>
              <td
                className={`text-right py-3 px-4 font-medium ${
                  item.profit >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {item.profit >= 0 ? "+" : ""}
                {item.profit.toFixed(2)}
              </td>
              <td
                className={`text-right py-3 px-4 ${
                  item.cumulative >= 0 ? "text-green-400/70" : "text-red-400/70"
                }`}
              >
                {item.cumulative >= 0 ? "+" : ""}
                {item.cumulative.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-white/[0.02]">
            <td className="py-3 px-4 text-[var(--foreground)] font-medium">
              합계
            </td>
            <td
              className={`text-right py-3 px-4 font-semibold ${
                total >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {total >= 0 ? "+" : ""}
              {total.toFixed(2)}
            </td>
            <td className="py-3 px-4"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
