"use client";

import { useState, useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { BarChart2, Table as TableIcon } from "lucide-react";
import type { SymbolStats as SymbolStatsType } from "@/lib/types";

interface SymbolStatsProps {
  data: SymbolStatsType[];
}

const PROFIT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#14b8a6",
];

const LOSS_COLOR = "#ef4444";

const VOLUME_CORRECTION: Record<string, number> = {
  "XAUUSD.b": 10,
};

type ViewMode = "chart" | "table";
type ChartDataType = "trades" | "profit" | "volume";

export default function SymbolStats({ data }: SymbolStatsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("chart");
  const [chartDataType, setChartDataType] = useState<ChartDataType>("trades");
  const [normalizeVolume, setNormalizeVolume] = useState(true);

  if (data.length === 0) return null;

  const getCorrectedVolume = (symbol: string, volume: number) => {
    if (!normalizeVolume) return volume;
    return volume * (VOLUME_CORRECTION[symbol] || 1);
  };

  const chartData = useMemo(() => {
    let profitColorIndex = 0;
    return data.map((item) => {
      let value: number;
      let originalValue: number;
      let fill: string;
      let isNegative = false;

      if (chartDataType === "trades") {
        value = item.tradeCount;
        originalValue = item.tradeCount;
        fill = PROFIT_COLORS[profitColorIndex % PROFIT_COLORS.length];
        profitColorIndex++;
      } else if (chartDataType === "profit") {
        value = Math.abs(item.totalProfit);
        originalValue = item.totalProfit;
        isNegative = item.totalProfit < 0;
        fill = isNegative ? LOSS_COLOR : PROFIT_COLORS[profitColorIndex % PROFIT_COLORS.length];
        if (!isNegative) profitColorIndex++;
      } else {
        const correctedVolume = getCorrectedVolume(item.symbol, item.totalVolume);
        value = correctedVolume;
        originalValue = correctedVolume;
        fill = PROFIT_COLORS[profitColorIndex % PROFIT_COLORS.length];
        profitColorIndex++;
      }

      return {
        name: item.symbol,
        value,
        originalValue,
        fill,
        isNegative,
      };
    });
  }, [data, chartDataType, normalizeVolume]);

  const totalTrades = data.reduce((sum, item) => sum + item.tradeCount, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.totalProfit, 0);
  const totalVolume = useMemo(() => {
    return data.reduce((sum, item) => sum + getCorrectedVolume(item.symbol, item.totalVolume), 0);
  }, [data, normalizeVolume]);

  const formatValue = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (value >= 0) return `$${formatted}`;
    return `-$${formatted}`;
  };

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          {viewMode === "chart" && (
            <>
              <div className="flex rounded-md overflow-hidden border border-[var(--border)]">
                <button
                  onClick={() => setChartDataType("trades")}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    chartDataType === "trades"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-[var(--muted)] hover:bg-white/5"
                  }`}
                >
                  거래 비중
                </button>
                <button
                  onClick={() => setChartDataType("profit")}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    chartDataType === "profit"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-[var(--muted)] hover:bg-white/5"
                  }`}
                >
                  수익 비중
                </button>
                <button
                  onClick={() => setChartDataType("volume")}
                  className={`px-3 py-1.5 text-xs transition-colors ${
                    chartDataType === "volume"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-[var(--muted)] hover:bg-white/5"
                  }`}
                >
                  거래량
                </button>
              </div>
              {chartDataType === "volume" && (
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={normalizeVolume}
                    onChange={(e) => setNormalizeVolume(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-[var(--border)] bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                  />
                  <span className="text-[var(--muted)]">단위 보정 (XAUUSD 10배)</span>
                </label>
              )}
            </>
          )}
        </div>
        <div className="flex rounded-md overflow-hidden border border-[var(--border)]">
          <button
            onClick={() => setViewMode("chart")}
            className={`p-2 transition-colors ${
              viewMode === "chart"
                ? "bg-blue-500/20 text-blue-400"
                : "text-[var(--muted)] hover:bg-white/5"
            }`}
            title="차트 보기"
          >
            <BarChart2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-2 transition-colors ${
              viewMode === "table"
                ? "bg-blue-500/20 text-blue-400"
                : "text-[var(--muted)] hover:bg-white/5"
            }`}
            title="테이블 보기"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {viewMode === "chart" ? (
        <div className="flex flex-col">
          <div className="h-[480px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent, cx, cy, midAngle, outerRadius, payload }) => {
                  const RADIAN = Math.PI / 180;
                  const safeOuterRadius = outerRadius ?? 80;
                  const safeMidAngle = midAngle ?? 0;
                  const safeCx = cx ?? 0;
                  const safeCy = cy ?? 0;
                  const radius = safeOuterRadius + 25;
                  const x = safeCx + radius * Math.cos(-safeMidAngle * RADIAN);
                  const y = safeCy + radius * Math.sin(-safeMidAngle * RADIAN);
                  const isNegative = payload?.isNegative;
                  const prefix = chartDataType === "profit" && isNegative ? "-" : "";
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={isNegative ? LOSS_COLOR : "var(--foreground)"}
                      textAnchor={x > safeCx ? "start" : "end"}
                      dominantBaseline="central"
                      fontSize={11}
                    >
                      {`${prefix}${name} (${((percent ?? 0) * 100).toFixed(1)}%)`}
                    </text>
                  );
                }}
                labelLine={{ stroke: "var(--muted)", strokeWidth: 1 }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  color: "#1f2937",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ color: "#1f2937" }}
                labelStyle={{ color: "#1f2937", fontWeight: "bold" }}
                formatter={(value, name, props) => {
                  const numValue = typeof value === "number" ? value : 0;
                  if (chartDataType === "trades") {
                    return [`${numValue}건`, "거래 수"];
                  } else if (chartDataType === "volume") {
                    return [`${numValue.toFixed(2)} 랏`, "거래량"];
                  }
                  const originalValue = props.payload?.originalValue ?? 0;
                  return [formatValue(originalValue), "수익"];
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-sm text-[var(--muted)] py-3">
            {chartDataType === "trades"
              ? `거래 총 ${totalTrades.toLocaleString()}건`
              : chartDataType === "profit"
              ? `수익 총 ${formatValue(totalProfit)}`
              : `거래량 총 ${totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 랏`}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="text-left py-2 px-3 font-medium text-[var(--muted)]">
                  종목
                </th>
                <th className="text-right py-2 px-3 font-medium text-[var(--muted)]">
                  거래 수
                </th>
                <th className="text-right py-2 px-3 font-medium text-[var(--muted)]">
                  거래량
                </th>
                <th className="text-right py-2 px-3 font-medium text-[var(--muted)]">
                  총 수익
                </th>
                <th className="text-right py-2 px-3 font-medium text-[var(--muted)]">
                  승률
                </th>
                <th className="text-right py-2 px-3 font-medium text-[var(--muted)]">
                  평균 수익
                </th>
                <th className="text-right py-2 px-3 font-medium text-[var(--muted)]">
                  평균 손실
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr
                  key={item.symbol}
                  className="border-b border-[var(--border)]/50 hover:bg-white/[0.02]"
                >
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: PROFIT_COLORS[index % PROFIT_COLORS.length] }}
                      />
                      {item.symbol}
                    </div>
                  </td>
                  <td className="text-right py-2 px-3">
                    {item.tradeCount}건
                  </td>
                  <td className="text-right py-2 px-3">
                    {item.totalVolume.toFixed(2)}
                  </td>
                  <td
                    className={`text-right py-2 px-3 ${
                      item.totalProfit >= 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {formatValue(item.totalProfit)}
                  </td>
                  <td className="text-right py-2 px-3">
                    {item.winRate.toFixed(1)}%
                  </td>
                  <td className="text-right py-2 px-3 text-green-400">
                    {formatValue(item.avgWin)}
                  </td>
                  <td className="text-right py-2 px-3 text-red-400">
                    {formatValue(item.avgLoss)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-white/[0.02] font-medium">
                <td className="py-2 px-3">합계</td>
                <td className="text-right py-2 px-3">{totalTrades}건</td>
                <td className="text-right py-2 px-3">
                  {data.reduce((sum, item) => sum + item.totalVolume, 0).toFixed(2)}
                </td>
                <td
                  className={`text-right py-2 px-3 ${
                    totalProfit >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {formatValue(totalProfit)}
                </td>
                <td className="py-2 px-3" colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
