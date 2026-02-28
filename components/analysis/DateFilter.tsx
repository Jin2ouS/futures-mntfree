"use client";

import { useState, useEffect, useMemo } from "react";
import { startOfWeek, endOfWeek, format } from "date-fns";
import type { DateRange } from "@/lib/types";

interface DateFilterProps {
  onChange: (range: DateRange) => void;
  minDate?: string;
  maxDate?: string;
}

function getRecentWeekRange() {
  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const sunday = endOfWeek(today, { weekStartsOn: 1 });
  return {
    start: format(monday, "yyyy-MM-dd"),
    end: format(sunday, "yyyy-MM-dd"),
  };
}

export default function DateFilter({ onChange, minDate, maxDate }: DateFilterProps) {
  const weekRange = useMemo(() => getRecentWeekRange(), []);
  const [isFullRange, setIsFullRange] = useState(true);
  const [startDate, setStartDate] = useState(weekRange.start);
  const [endDate, setEndDate] = useState(weekRange.end);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (minDate && maxDate && !initialized) {
      const weekStart = new Date(weekRange.start);
      const weekEnd = new Date(weekRange.end);
      const dataMin = new Date(minDate);
      const dataMax = new Date(maxDate);
      
      const adjustedStart = weekStart < dataMin ? minDate : weekRange.start;
      const adjustedEnd = weekEnd > dataMax ? maxDate : weekRange.end;
      
      setStartDate(adjustedStart);
      setEndDate(adjustedEnd);
      setInitialized(true);
    }
  }, [minDate, maxDate, weekRange, initialized]);

  useEffect(() => {
    onChange({
      startDate: isFullRange ? null : startDate || null,
      endDate: isFullRange ? null : endDate || null,
      isFullRange,
    });
  }, [isFullRange, startDate, endDate, onChange]);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-4 space-y-3">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="dateRange"
          checked={isFullRange}
          onChange={() => setIsFullRange(true)}
          className="w-4 h-4 border-[var(--border)] bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
        />
        <span className="text-sm text-[var(--foreground)]">전체 기간</span>
      </label>

      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="dateRange"
            checked={!isFullRange}
            onChange={() => setIsFullRange(false)}
            className="w-4 h-4 border-[var(--border)] bg-white/5 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
          />
          <span className="text-sm text-[var(--foreground)]">기간 설정</span>
        </label>

        <div className="flex items-center gap-2 pl-6">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={minDate}
            max={endDate || maxDate}
            disabled={isFullRange}
            className="px-3 py-1.5 rounded-md bg-white/5 border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <span className="text-[var(--muted)]">~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || minDate}
            max={maxDate}
            disabled={isFullRange}
            className="px-3 py-1.5 rounded-md bg-white/5 border border-[var(--border)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--muted)] disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
