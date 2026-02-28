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
import type { DailyProfit } from "@/lib/types";

interface ProfitCalendarProps {
  data: DailyProfit[];
}

const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function ProfitCalendar({ data }: ProfitCalendarProps) {
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
                  className={`py-2 px-1 text-center font-medium border-b border-[var(--border)] ${
                    idx === 5 ? "text-blue-400" : idx === 6 ? "text-red-400" : "text-[var(--muted)]"
                  }`}
                >
                  {day}요일
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
                {week.map((day, dayIdx) => (
                  <td
                    key={dayIdx}
                    className={`py-3 px-1 text-center align-top border-b border-[var(--border)] min-w-[80px] ${
                      !day.isCurrentMonth ? "opacity-30" : ""
                    }`}
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
                ))}
                <td className="py-3 px-1 text-center align-middle border-b border-[var(--border)] bg-white/[0.02] min-w-[90px]">
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
    </div>
  );
}
