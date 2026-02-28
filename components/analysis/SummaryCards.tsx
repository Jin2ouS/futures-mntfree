import { TrendingUp, TrendingDown, BarChart3, Percent } from "lucide-react";
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

export default function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
            총 거래
          </span>
          <BarChart3 className="h-4 w-4 text-[var(--muted)]" />
        </div>
        <p className="text-2xl font-semibold text-[var(--foreground)]">
          {summary.totalTrades.toLocaleString()}
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          승 {summary.winCount} / 패 {summary.lossCount}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
            총 실수익
          </span>
          {summary.totalProfit >= 0 ? (
            <TrendingUp className="h-4 w-4 text-[var(--muted)]" />
          ) : (
            <TrendingDown className="h-4 w-4 text-[var(--muted)]" />
          )}
        </div>
        <p className={`text-2xl font-semibold ${summary.totalProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
          {formatCurrency(summary.totalProfit)}
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          수익 {formatCurrency(summary.totalGrossProfit)} / 커미션 {formatCurrency(summary.totalCommission)} / 스왑 {formatCurrency(summary.totalSwap)}
        </p>
      </div>

      <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
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
          <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
            평균 수익/손실
          </span>
          <TrendingUp className="h-4 w-4 text-[var(--muted)]" />
        </div>
        <p className="text-2xl font-semibold text-[var(--foreground)]">
          {formatCurrency(summary.avgWin, true)}
        </p>
        <p className="text-xs text-[var(--muted)] mt-1">
          {formatCurrency(summary.avgLoss)} / 손익비 {summary.profitLossRatio.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
