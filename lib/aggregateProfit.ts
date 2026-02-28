import {
  format,
  startOfWeek,
  endOfWeek,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay,
  getDay,
} from "date-fns";
import { ko } from "date-fns/locale";
import type {
  TradeRecord,
  DailyProfit,
  WeeklyProfit,
  MonthlyProfit,
  AnalysisSummary,
  DateRange,
  SymbolStats,
} from "./types";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getDayName(date: Date): string {
  return DAY_NAMES[getDay(date)];
}

export function filterByDateRange(
  records: TradeRecord[],
  dateRange: DateRange
): TradeRecord[] {
  if (dateRange.isFullRange) return records;

  const start = dateRange.startDate
    ? startOfDay(parseISO(dateRange.startDate))
    : null;
  const end = dateRange.endDate ? endOfDay(parseISO(dateRange.endDate)) : null;

  return records.filter((r) => {
    if (!r.청산시간) return false;
    const closeTime = r.청산시간;

    if (start && end) {
      return isWithinInterval(closeTime, { start, end });
    }
    if (start) return closeTime >= start;
    if (end) return closeTime <= end;
    return true;
  });
}

export function calculateSummary(records: TradeRecord[]): AnalysisSummary {
  const validRecords = records.filter((r) => r.청산시간 && r.실수익 !== null);
  const totalTrades = validRecords.length;
  const totalProfit = validRecords.reduce((sum, r) => sum + r.실수익, 0);

  const wins = validRecords.filter((r) => r.실수익 > 0);
  const losses = validRecords.filter((r) => r.실수익 < 0);

  const winCount = wins.length;
  const lossCount = losses.length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;

  const avgWin = winCount > 0 ? wins.reduce((s, r) => s + r.실수익, 0) / winCount : 0;
  const avgLoss =
    lossCount > 0 ? losses.reduce((s, r) => s + r.실수익, 0) / lossCount : 0;

  return {
    totalTrades,
    totalProfit,
    winCount,
    lossCount,
    winRate,
    avgWin,
    avgLoss,
  };
}

export function aggregateDaily(records: TradeRecord[]): DailyProfit[] {
  const validRecords = records.filter((r) => r.청산시간 && r.실수익 !== null);

  const grouped = new Map<string, { profit: number; date: Date; bySymbol: Record<string, number> }>();

  for (const r of validRecords) {
    const dateKey = format(r.청산시간!, "yyyy-MM-dd");
    const symbol = r.통화 || "Unknown";
    const existing = grouped.get(dateKey);
    if (existing) {
      existing.profit += r.실수익;
      existing.bySymbol[symbol] = (existing.bySymbol[symbol] || 0) + r.실수익;
    } else {
      grouped.set(dateKey, { 
        profit: r.실수익, 
        date: r.청산시간!,
        bySymbol: { [symbol]: r.실수익 }
      });
    }
  }

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  let cumulative = 0;
  return sorted.map(([dateKey, data]) => {
    cumulative += data.profit;
    const dayName = getDayName(data.date);
    return {
      date: `${dateKey} (${dayName})`,
      profit: data.profit,
      cumulative,
      bySymbol: data.bySymbol,
    };
  });
}

export function aggregateWeekly(records: TradeRecord[]): WeeklyProfit[] {
  const validRecords = records.filter((r) => r.청산시간 && r.실수익 !== null);

  const grouped = new Map<string, { profit: number; weekStart: Date; weekEnd: Date }>();

  for (const r of validRecords) {
    const closeDate = r.청산시간!;
    const weekStart = startOfWeek(closeDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(closeDate, { weekStartsOn: 1 });
    const key = format(weekStart, "yyyy-MM-dd");

    const existing = grouped.get(key);
    if (existing) {
      existing.profit += r.실수익;
    } else {
      grouped.set(key, { profit: r.실수익, weekStart, weekEnd });
    }
  }

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  let cumulative = 0;
  return sorted.map(([, data]) => {
    cumulative += data.profit;
    const startDay = getDayName(data.weekStart);
    const endDay = getDayName(data.weekEnd);
    return {
      weekStart: format(data.weekStart, "yyyy-MM-dd"),
      weekEnd: format(data.weekEnd, "yyyy-MM-dd"),
      label: `${format(data.weekStart, "MM/dd")} (${startDay}) ~ ${format(data.weekEnd, "MM/dd")} (${endDay})`,
      profit: data.profit,
      cumulative,
    };
  });
}

export function aggregateMonthly(records: TradeRecord[]): MonthlyProfit[] {
  const validRecords = records.filter((r) => r.청산시간 && r.실수익 !== null);

  const grouped = new Map<string, number>();

  for (const r of validRecords) {
    const monthKey = format(r.청산시간!, "yyyy-MM");
    grouped.set(monthKey, (grouped.get(monthKey) || 0) + r.실수익);
  }

  const sorted = Array.from(grouped.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  let cumulative = 0;
  return sorted.map(([month, profit]) => {
    cumulative += profit;
    return { month, profit, cumulative };
  });
}

export function aggregateBySymbol(records: TradeRecord[]): SymbolStats[] {
  const validRecords = records.filter((r) => r.청산시간 && r.실수익 !== null && r.통화);

  const grouped = new Map<string, TradeRecord[]>();

  for (const r of validRecords) {
    const symbol = r.통화;
    const existing = grouped.get(symbol);
    if (existing) {
      existing.push(r);
    } else {
      grouped.set(symbol, [r]);
    }
  }

  const result: SymbolStats[] = [];

  for (const [symbol, trades] of grouped) {
    const tradeCount = trades.length;
    const totalProfit = trades.reduce((sum, r) => sum + r.실수익, 0);
    const totalVolume = trades.reduce((sum, r) => sum + (r.거래량 || 0), 0);

    const wins = trades.filter((r) => r.실수익 > 0);
    const losses = trades.filter((r) => r.실수익 < 0);

    const winCount = wins.length;
    const lossCount = losses.length;
    const winRate = tradeCount > 0 ? (winCount / tradeCount) * 100 : 0;

    const avgWin = winCount > 0 ? wins.reduce((s, r) => s + r.실수익, 0) / winCount : 0;
    const avgLoss = lossCount > 0 ? losses.reduce((s, r) => s + r.실수익, 0) / lossCount : 0;

    result.push({
      symbol,
      tradeCount,
      totalProfit,
      totalVolume,
      winCount,
      lossCount,
      winRate,
      avgWin,
      avgLoss,
    });
  }

  return result.sort((a, b) => b.tradeCount - a.tradeCount);
}
