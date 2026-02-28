"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DataInput from "@/components/analysis/DataInput";
import DateFilter from "@/components/analysis/DateFilter";
import SummaryCards from "@/components/analysis/SummaryCards";
import AnalysisTabs from "@/components/analysis/AnalysisTabs";
import type { TradeRecord, DateRange } from "@/lib/types";
import {
  filterByDateRange,
  calculateSummary,
  aggregateDaily,
  aggregateWeekly,
  aggregateMonthly,
  aggregateBySymbol,
} from "@/lib/aggregateProfit";
import SymbolStats from "@/components/analysis/SymbolStats";
import { format } from "date-fns";

export default function AnalysisPage() {
  const [rawData, setRawData] = useState<TradeRecord[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
    isFullRange: true,
  });

  const handleDataLoaded = useCallback((records: TradeRecord[]) => {
    setRawData(records);
  }, []);

  const handleDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  const { minDate, maxDate } = useMemo(() => {
    const validDates = rawData
      .filter((r) => r.청산시간)
      .map((r) => r.청산시간!.getTime());

    if (validDates.length === 0) return { minDate: undefined, maxDate: undefined };

    return {
      minDate: format(new Date(Math.min(...validDates)), "yyyy-MM-dd"),
      maxDate: format(new Date(Math.max(...validDates)), "yyyy-MM-dd"),
    };
  }, [rawData]);

  const filteredData = useMemo(() => {
    return filterByDateRange(rawData, dateRange);
  }, [rawData, dateRange]);

  const summary = useMemo(() => {
    return calculateSummary(filteredData);
  }, [filteredData]);

  const daily = useMemo(() => aggregateDaily(filteredData), [filteredData]);
  const weekly = useMemo(() => aggregateWeekly(filteredData), [filteredData]);
  const monthly = useMemo(() => aggregateMonthly(filteredData), [filteredData]);
  const symbolStats = useMemo(() => aggregateBySymbol(filteredData), [filteredData]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-semibold">Trade Analysis</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <section>
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            거래 내역 불러오기
          </h2>
          <DataInput onDataLoaded={handleDataLoaded} />
        </section>

        {rawData.length > 0 && (
          <>
            <section>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                조회 기간
              </h2>
              <DateFilter
                onChange={handleDateRangeChange}
                minDate={minDate}
                maxDate={maxDate}
              />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                수익 요약
              </h2>
              <SummaryCards summary={summary} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                종목별 분포
              </h2>
              <SymbolStats data={symbolStats} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                기간별 수익 분석
              </h2>
              <AnalysisTabs daily={daily} weekly={weekly} monthly={monthly} />
            </section>
          </>
        )}

        {rawData.length === 0 && (
          <div className="text-center py-16 text-[var(--muted)]">
            <p className="text-lg">거래 내역 파일을 업로드하여 분석을 시작하세요.</p>
            <p className="text-sm mt-2">엑셀 파일(.xlsx) 또는 구글 시트 링크 지원</p>
          </div>
        )}
      </main>
    </div>
  );
}
