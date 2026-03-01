"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import { Loader2 } from "lucide-react";
import type { DailyProfit, WeeklyProfit, MonthlyProfit } from "@/lib/types";

type ChartData = DailyProfit[] | WeeklyProfit[] | MonthlyProfit[];

const SYMBOL_COLORS: Record<string, string> = {
  "XAUUSD.b": "#3b82f6",
  "US100.b": "#10b981",
  "USOIL+": "#f59e0b",
  "EURUSD.b": "#8b5cf6",
  "USDJPY.b": "#ec4899",
  "BTCUSD": "#06b6d4",
};

const DEFAULT_SYMBOL_COLOR = "#6b7280";

interface ProfitChartProps {
  data: ChartData;
  type: "daily" | "weekly" | "monthly";
  showLabels: boolean;
  showBySymbol?: boolean;
}

export default function ProfitChart({ data, type, showLabels, showBySymbol = false }: ProfitChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-[var(--muted)]">
        데이터가 없습니다.
      </div>
    );
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[400px] text-[var(--muted)]">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const allSymbols = useMemo(() => {
    if (!showBySymbol || type !== "daily") return [];
    const symbols = new Set<string>();
    (data as DailyProfit[]).forEach((item) => {
      if (item.bySymbol) {
        Object.keys(item.bySymbol).forEach((s) => symbols.add(s));
      }
    });
    return Array.from(symbols).sort();
  }, [data, showBySymbol, type]);

  const chartData = useMemo(() => {
    return data.map((item) => {
      const base = {
        ...item,
        xLabel:
          type === "daily"
            ? (item as DailyProfit).date.slice(5)
            : type === "weekly"
            ? (item as WeeklyProfit).label
            : (item as MonthlyProfit).month,
      };
      
      if (showBySymbol && type === "daily" && (item as DailyProfit).bySymbol) {
        const bySymbol = (item as DailyProfit).bySymbol!;
        allSymbols.forEach((symbol) => {
          (base as Record<string, unknown>)[symbol] = bySymbol[symbol] || 0;
        });
      }
      
      return base;
    });
  }, [data, type, showBySymbol, allSymbols]);

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const getSymbolColor = (symbol: string) => {
    return SYMBOL_COLORS[symbol] || DEFAULT_SYMBOL_COLOR;
  };

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          stackOffset={showBySymbol && type === "daily" ? "sign" : undefined}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
          <XAxis
            dataKey="xLabel"
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            angle={-45}
            textAnchor="end"
            height={80}
            interval={type === "daily" && data.length > 20 ? Math.floor(data.length / 15) : 0}
            orientation="bottom"
            xAxisId="bottom"
            tickMargin={10}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 11 }}
            tickLine={{ stroke: "var(--border)" }}
            axisLine={{ stroke: "var(--border)" }}
            tickFormatter={formatValue}
          />
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
            formatter={(value, name) => {
              const numValue = typeof value === "number" ? value : 0;
              if (name === "cumulative") {
                return [`$${numValue.toFixed(2)}`, "누적 실수익"];
              }
              if (name === "profit") {
                return [`$${numValue.toFixed(2)}`, "실수익"];
              }
              return [`$${numValue.toFixed(2)}`, name];
            }}
            labelFormatter={(label) => `${type === "daily" ? "일자" : type === "weekly" ? "주간" : "월"}: ${label}`}
          />
          <Legend
            wrapperStyle={{ color: "var(--foreground)" }}
            formatter={(value) => {
              if (value === "profit") return "실수익";
              if (value === "cumulative") return "누적 실수익";
              return value;
            }}
          />
          
          {showBySymbol && type === "daily" ? (
            allSymbols.map((symbol, idx) => (
              <Bar
                key={symbol}
                dataKey={symbol}
                name={symbol}
                stackId="symbols"
                fill={getSymbolColor(symbol)}
                xAxisId="bottom"
              >
                {showLabels && idx === allSymbols.length - 1 && (
                  <LabelList
                    dataKey="profit"
                    content={({ x, y, width, value }) => {
                      const numValue = typeof value === "number" ? value : 0;
                      if (numValue === 0) return null;
                      const isNegative = numValue < 0;
                      const labelX = Number(x ?? 0) + Number(width ?? 0) / 2;
                      const labelY = isNegative ? Number(y ?? 0) + 18 : Number(y ?? 0) - 8;
                      return (
                        <text
                          x={labelX}
                          y={labelY}
                          fill={isNegative ? "#ef4444" : "#d1d5db"}
                          fontSize={13}
                          fontWeight="500"
                          textAnchor="middle"
                        >
                          {formatValue(numValue)}
                        </text>
                      );
                    }}
                  />
                )}
              </Bar>
            ))
          ) : (
            <Bar dataKey="profit" name="profit" radius={[4, 4, 0, 0]} xAxisId="bottom">
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.profit >= 0 ? "#22c55e" : "#ef4444"}
                />
              ))}
              {showLabels && (
                <LabelList
                  dataKey="profit"
                  content={({ x, y, width, value }) => {
                    const numValue = typeof value === "number" ? value : 0;
                    if (numValue === 0) return null;
                    const isNegative = numValue < 0;
                    const labelX = Number(x ?? 0) + Number(width ?? 0) / 2;
                    const labelY = isNegative ? Number(y ?? 0) + 18 : Number(y ?? 0) - 8;
                    return (
                      <text
                        x={labelX}
                        y={labelY}
                        fill={isNegative ? "#ef4444" : "#d1d5db"}
                        fontSize={13}
                        fontWeight="500"
                        textAnchor="middle"
                      >
                        {formatValue(numValue)}
                      </text>
                    );
                  }}
                />
              )}
            </Bar>
          )}
          
          <Line
            type="monotone"
            dataKey="cumulative"
            name="cumulative"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#3b82f6" }}
            xAxisId="bottom"
          >
            {showLabels && (
              <LabelList
                dataKey="cumulative"
                content={({ x, y, value, index }) => {
                  const numValue = typeof value === "number" ? value : 0;
                  const showEvery = data.length > 10 ? Math.ceil(data.length / 8) : 1;
                  if ((index ?? 0) % showEvery !== 0 && index !== data.length - 1) return null;
                  return (
                    <text
                      x={Number(x ?? 0)}
                      y={Number(y ?? 0) - 12}
                      fill="#3b82f6"
                      fontSize={14}
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {formatValue(numValue)}
                    </text>
                  );
                }}
              />
            )}
          </Line>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
