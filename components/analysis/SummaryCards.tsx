import { TrendingUp, TrendingDown, BarChart3, Percent } from "lucide-react";
import type { AnalysisSummary } from "@/lib/types";

interface SummaryCardsProps {
  summary: AnalysisSummary;
}

export default function SummaryCards({ summary }: SummaryCardsProps) {
  const cards = [
    {
      label: "총 거래",
      value: summary.totalTrades.toLocaleString(),
      subValue: `승 ${summary.winCount} / 패 ${summary.lossCount}`,
      icon: BarChart3,
    },
    {
      label: "총 실수익",
      value: `$${summary.totalProfit.toFixed(2)}`,
      subValue: summary.totalProfit >= 0 ? "수익" : "손실",
      icon: summary.totalProfit >= 0 ? TrendingUp : TrendingDown,
      valueColor: summary.totalProfit >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "승률",
      value: `${summary.winRate.toFixed(1)}%`,
      subValue: `${summary.totalTrades}건 중 ${summary.winCount}건`,
      icon: Percent,
    },
    {
      label: "평균 수익/손실",
      value: `+$${summary.avgWin.toFixed(2)}`,
      subValue: `-$${Math.abs(summary.avgLoss).toFixed(2)}`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wider text-[var(--muted)]">
              {card.label}
            </span>
            <card.icon className="h-4 w-4 text-[var(--muted)]" />
          </div>
          <p className={`text-2xl font-semibold ${card.valueColor || "text-[var(--foreground)]"}`}>
            {card.value}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">{card.subValue}</p>
        </div>
      ))}
    </div>
  );
}
