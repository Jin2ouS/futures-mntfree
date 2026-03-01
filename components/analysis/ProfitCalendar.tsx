"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  parseISO,
} from "date-fns";
import type { DailyProfit, TradeRecord } from "@/lib/types";

interface ProfitCalendarProps {
  data: DailyProfit[];
  trades: TradeRecord[];
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function ProfitCalendar({ data, trades }: ProfitCalendarProps) {
  const dataMonths = useMemo(() => {
    const months = new Set<string>();
    data.forEach((d) => {
      const dateStr = d.date.split(" ")[0];
      months.add(dateStr.slice(0, 7));
    });
    return Array.from(months).sort();
  }, [data]);

  const initialMonth = useMemo(() => {
    if (dataMonths.length > 0) {
      return parseISO(dataMonths[dataMonths.length - 1] + "-01");
    }
    return new Date();
  }, [dataMonths]);

  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState<number | null>(null);

  const profitMap = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((d) => {
      const dateStr = d.date.split(" ")[0];
      map.set(dateStr, d.profit);
    });
    return map;
  }, [data]);

  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weeks: { date: Date; profit: number | null; isCurrentMonth: boolean }[][] = [];
    let currentWeek: { date: Date; profit: number | null; isCurrentMonth: boolean }[] = [];

    days.forEach((day, index) => {
      const dateStr = format(day, "yyyy-MM-dd");
      const profit = profitMap.get(dateStr) ?? null;
      const isCurrentMonth = isSameMonth(day, currentMonth);

      currentWeek.push({ date: day, profit, isCurrentMonth });

      if ((index + 1) % 7 === 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    return weeks;
  }, [currentMonth, profitMap]);

  const weeklyTotals = useMemo(() => {
    return calendarData.map((week) => {
      const total = week.reduce((sum, day) => {
        if (day.isCurrentMonth && day.profit !== null) {
          return sum + day.profit;
        }
        return sum;
      }, 0);
      const hasData = week.some((day) => day.isCurrentMonth && day.profit !== null);
      return hasData ? total : null;
    });
  }, [calendarData]);

  const monthTotal = useMemo(() => {
    return weeklyTotals.reduce<number>((sum, total) => sum + (total ?? 0), 0);
  }, [weeklyTotals]);

  const handleDateClick = (dateStr: string, isCurrentMonth: boolean, hasProfit: boolean) => {
    if (!isCurrentMonth || !hasProfit) return;
    setSelectedWeekIdx(null);
    setSelectedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const handleWeekClick = (weekIdx: number, hasData: boolean) => {
    if (!hasData) return;
    setSelectedDate(null);
    setSelectedWeekIdx((prev) => (prev === weekIdx ? null : weekIdx));
  };

  const filteredTrades = useMemo(() => {
    if (selectedDate) {
      return trades.filter((t) => {
        if (!t.청산시간) return false;
        return format(t.청산시간, "yyyy-MM-dd") === selectedDate;
      });
    }
    if (selectedWeekIdx !== null && calendarData[selectedWeekIdx]) {
      const weekDates = new Set(
        calendarData[selectedWeekIdx]
          .filter((d) => d.isCurrentMonth)
          .map((d) => format(d.date, "yyyy-MM-dd"))
      );
      return trades.filter((t) => {
        if (!t.청산시간) return false;
        return weekDates.has(format(t.청산시간, "yyyy-MM-dd"));
      });
    }
    return [];
  }, [selectedDate, selectedWeekIdx, trades, calendarData]);

  const selectionLabel = useMemo(() => {
    if (selectedDate) {
      return format(parseISO(selectedDate), "yyyy년 M월 d일");
    }
    if (selectedWeekIdx !== null) {
      return `${format(currentMonth, "yyyy년 M월")} W${selectedWeekIdx + 1}`;
    }
    return null;
  }, [selectedDate, selectedWeekIdx, currentMonth]);

  const formatProfit = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return value >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const formatProfitFull = (value: number) => {
    const absValue = Math.abs(value);
    const formatted = absValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-md hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-[var(--foreground)] min-w-[120px] text-center">
          {format(currentMonth, "yyyy/MM")}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-md hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {WEEKDAYS.map((day, idx) => (
                <th
                  key={day}
                  className={`py-2 px-0.5 sm:px-1 text-center font-medium border-b border-[var(--border)] ${
                    idx === 5 ? "text-blue-400" : idx === 6 ? "text-red-400" : "text-[var(--muted)]"
                  }`}
                >
                  {day}
                </th>
              ))}
              <th className="py-2 px-1 text-center font-medium text-[var(--muted)] border-b border-[var(--border)]">
                주간 합계
              </th>
            </tr>
          </thead>
          <tbody>
            {calendarData.map((week, weekIdx) => (
              <tr key={weekIdx}>
                {week.map((day, dayIdx) => {
                  const dateStr = format(day.date, "yyyy-MM-dd");
                  const isSelected = selectedDate === dateStr;
                  const isWeekSelected = selectedWeekIdx === weekIdx;
                  const hasProfit = day.profit !== null && day.isCurrentMonth;
                  return (
                    <td
                      key={dayIdx}
                      onClick={() => handleDateClick(dateStr, day.isCurrentMonth, hasProfit)}
                      className={`py-2 sm:py-3 px-0.5 sm:px-1 text-center align-top border-b border-[var(--border)] min-w-[45px] sm:min-w-[70px] transition-colors ${
                        !day.isCurrentMonth ? "opacity-30" : ""
                      } ${hasProfit ? "cursor-pointer hover:bg-white/5" : ""} ${
                        isSelected ? "bg-blue-500/20 ring-1 ring-blue-500/50" : ""
                      } ${isWeekSelected && day.isCurrentMonth ? "bg-white/5" : ""}`}
                    >
                      <div
                        className={`text-xs mb-1 ${
                          dayIdx === 5 ? "text-blue-400" : dayIdx === 6 ? "text-red-400" : "text-[var(--muted)]"
                        }`}
                      >
                        {format(day.date, "d")}
                      </div>
                      {day.profit !== null && day.isCurrentMonth && (
                        <div
                          className={`text-xs font-medium ${
                            day.profit >= 0 ? "text-blue-400" : "text-red-400"
                          }`}
                        >
                          {formatProfit(day.profit)}
                        </div>
                      )}
                    </td>
                  );
                })}
                <td
                  onClick={() => handleWeekClick(weekIdx, weeklyTotals[weekIdx] !== null)}
                  className={`py-2 sm:py-3 px-0.5 sm:px-1 text-center align-middle border-b border-[var(--border)] min-w-[55px] sm:min-w-[80px] transition-colors ${
                    weeklyTotals[weekIdx] !== null ? "cursor-pointer hover:bg-white/10" : "bg-white/[0.02]"
                  } ${selectedWeekIdx === weekIdx ? "bg-blue-500/20 ring-1 ring-blue-500/50" : "bg-white/[0.02]"}`}
                >
                  <div className="text-xs text-[var(--muted)] mb-1">W{weekIdx + 1}</div>
                  {weeklyTotals[weekIdx] !== null && (
                    <div
                      className={`text-xs font-medium ${
                        weeklyTotals[weekIdx]! >= 0 ? "text-blue-400" : "text-red-400"
                      }`}
                    >
                      {formatProfit(weeklyTotals[weekIdx]!)}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            <tr>
              <td
                colSpan={7}
                className="py-3 px-2 text-right font-medium text-[var(--muted)] border-b border-[var(--border)]"
              >
                월 합계
              </td>
              <td className="py-3 px-1 text-center align-middle border-b border-[var(--border)] bg-white/[0.04]">
                <div
                  className={`text-sm font-semibold ${
                    monthTotal >= 0 ? "text-blue-400" : "text-red-400"
                  }`}
                >
                  {formatProfitFull(monthTotal)}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {filteredTrades.length > 0 && (
        <div className="mt-6 border-t border-[var(--border)] pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-[var(--foreground)]">
              {selectionLabel} 거래내역
              <span className="ml-2 text-xs text-[var(--muted)]">({filteredTrades.length}건)</span>
            </h4>
            <button
              onClick={() => {
                setSelectedDate(null);
                setSelectedWeekIdx(null);
              }}
              className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              닫기
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="py-2 px-3 text-[var(--muted)] font-medium border-b border-[var(--border)]">통화</th>
                  <th className="py-2 px-3 text-[var(--muted)] font-medium border-b border-[var(--border)]">종류</th>
                  <th className="py-2 px-3 text-[var(--muted)] font-medium border-b border-[var(--border)] text-right">거래량</th>
                  <th className="py-2 px-3 text-[var(--muted)] font-medium border-b border-[var(--border)]">진입시간</th>
                  <th className="py-2 px-3 text-[var(--muted)] font-medium border-b border-[var(--border)]">청산시간</th>
                  <th className="py-2 px-3 text-[var(--muted)] font-medium border-b border-[var(--border)] text-right">실수익</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrades.map((trade, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-2 px-3 border-b border-[var(--border)] text-[var(--foreground)]">{trade.통화}</td>
                    <td className="py-2 px-3 border-b border-[var(--border)] text-[var(--foreground)]">{trade.종류}</td>
                    <td className="py-2 px-3 border-b border-[var(--border)] text-[var(--foreground)] text-right">{trade.거래량}</td>
                    <td className="py-2 px-3 border-b border-[var(--border)] text-[var(--muted)] text-xs">
                      {trade.진입시간 ? format(trade.진입시간, "MM-dd HH:mm") : "-"}
                    </td>
                    <td className="py-2 px-3 border-b border-[var(--border)] text-[var(--muted)] text-xs">
                      {trade.청산시간 ? format(trade.청산시간, "MM-dd HH:mm") : "-"}
                    </td>
                    <td className={`py-2 px-3 border-b border-[var(--border)] text-right font-medium ${
                      trade.실수익 >= 0 ? "text-blue-400" : "text-red-400"
                    }`}>
                      {trade.실수익 >= 0 ? "+" : ""}{trade.실수익.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-white/[0.02]">
                  <td colSpan={5} className="py-2 px-3 text-right font-medium text-[var(--muted)]">합계</td>
                  <td className={`py-2 px-3 text-right font-semibold ${
                    filteredTrades.reduce((sum, t) => sum + t.실수익, 0) >= 0 ? "text-blue-400" : "text-red-400"
                  }`}>
                    {(() => {
                      const total = filteredTrades.reduce((sum, t) => sum + t.실수익, 0);
                      return `${total >= 0 ? "+" : ""}$${total.toFixed(2)}`;
                    })()}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
