"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, BarChart3, Percent, Eye, EyeOff } from "lucide-react";
import type { AnalysisSummary } from "@/lib/types";

interface SummaryCardsProps {
  summary: AnalysisSummary;
}

function formatCurrency(value: number, showSign = false): string {
  const absValue = Math.abs(value);
  const formatted = `$${absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (showSign) {
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  }
  return value < 0 ? `-${formatted}` : formatted;
}

const BLUR_TEXT = "***";

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const [showAmount, setShowAmount] = useState(false);

  const displayCurrency = (value: number, showSign = false) => {
    return showAmount ? formatCurrency(value, showSign) : BLUR_TEXT;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          수익 요약
        </h2>
        <button
          onClick={() => setShowAmount(!showAmount)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            showAmount
              ? "bg-blue-500/20 text-blue-400"
              : "text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
          }`}
        >
          {showAmount ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          금액 표시
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              총 거래
            </span>
            <BarChart3 className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--foreground)]">
            {summary.totalTrades.toLocaleString()} 건
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            일평균 {summary.tradingDays > 0 ? (summary.totalTrades / summary.tradingDays).toFixed(1) : 0}건 / 승 {summary.winCount}건 / 패 {summary.lossCount}건
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              승률
            </span>
            <Percent className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className="text-2xl font-semibold text-[var(--foreground)]">
            {summary.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            {summary.totalTrades}건 중 {summary.winCount}건
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              총 실수익
            </span>
            {summary.totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-[var(--muted)]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[var(--muted)]" />
            )}
          </div>
          <p className={`text-2xl font-semibold ${showAmount ? (summary.totalProfit >= 0 ? "text-green-400" : "text-red-400") : "text-[var(--muted)]"}`}>
            {displayCurrency(summary.totalProfit)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            수익 {displayCurrency(summary.totalGrossProfit)} / 커미션 {displayCurrency(summary.totalCommission)} / 스왑 {displayCurrency(summary.totalSwap)}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--muted)]">
              평균 수익
            </span>
            <TrendingUp className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className={`text-2xl font-semibold ${showAmount ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
            {displayCurrency(summary.avgWin, true)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">
            평균 손실 {displayCurrency(summary.avgLoss)} / 손익비 {summary.profitLossRatio.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
