"use client";

import { useState, useMemo } from "react";
import { Eye, EyeOff, Calendar, Table } from "lucide-react";
import ProfitTable from "./ProfitTable";
import ProfitChart from "./ProfitChart";
import ProfitCalendar from "./ProfitCalendar";
import type { DailyProfit, WeeklyProfit, MonthlyProfit, TradeRecord } from "@/lib/types";

interface AnalysisTabsProps {
  daily: DailyProfit[];
  weekly: WeeklyProfit[];
  monthly: MonthlyProfit[];
  trades: TradeRecord[];
}

type TabType = "daily" | "weekly" | "monthly";
type TableViewMode = "table" | "calendar";
type ChartData = DailyProfit[] | WeeklyProfit[] | MonthlyProfit[];

export default function AnalysisTabs({ daily, weekly, monthly, trades }: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("daily");
  const [tableViewMode, setTableViewMode] = useState<TableViewMode>("calendar");
  const [showLabels, setShowLabels] = useState(false);
  const [showBySymbol, setShowBySymbol] = useState(false);

  const tabs = [
    { id: "daily" as const, label: "일별", count: daily.length },
    { id: "weekly" as const, label: "주별", count: weekly.length },
    { id: "monthly" as const, label: "월별", count: monthly.length },
  ];

  const getData = useMemo((): ChartData => {
    switch (activeTab) {
      case "daily":
        return daily;
      case "weekly":
        return weekly;
      case "monthly":
        return monthly;
    }
  }, [activeTab, daily, weekly, monthly]);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] overflow-hidden">
      {/* Header with tabs and chart controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-[var(--border)]">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-white/10 text-[var(--foreground)]"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
              <span className="text-xs opacity-60">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {activeTab === "daily" && (
            <label className="flex items-center gap-2 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={showBySymbol}
                onChange={(e) => setShowBySymbol(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-[var(--border)] bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
              />
              <span className="text-[var(--muted)]">종목별 구분</span>
            </label>
          )}

          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              showLabels
                ? "bg-blue-500/20 text-blue-400"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            값 라벨
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Chart Section - Always visible */}
        <div>
          <h3 className="text-sm font-medium text-[var(--muted)] mb-3">차트</h3>
          <ProfitChart 
            data={getData} 
            type={activeTab} 
            showLabels={showLabels} 
            showBySymbol={showBySymbol && activeTab === "daily"}
          />
        </div>

        {/* Table Section - With optional calendar view for daily */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-[var(--muted)]">테이블</h3>
            {activeTab === "daily" && (
              <div className="flex items-center gap-1 bg-white/5 rounded-md p-0.5">
                <button
                  onClick={() => setTableViewMode("calendar")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    tableViewMode === "calendar"
                      ? "bg-white/10 text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  달력
                </button>
                <button
                  onClick={() => setTableViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    tableViewMode === "table"
                      ? "bg-white/10 text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <Table className="h-3 w-3" />
                  테이블
                </button>
              </div>
            )}
          </div>
          
          {activeTab === "daily" && tableViewMode === "calendar" ? (
            <ProfitCalendar data={daily} trades={trades} />
          ) : (
            <ProfitTable data={getData} type={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}
