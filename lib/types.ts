export interface TradeRecord {
  진입시간: Date | null;
  포지션: string;
  통화: string;
  종류: string;
  거래량: number;
  전입가격: number;
  "S / L": number | null;
  "T / P": number | null;
  청산시간: Date | null;
  청산가격: number;
  커미션: number;
  스왑: number;
  수익: number;
  계좌번호: string | null;
  실수익: number;
  진입기준: string | null;
  비고: string | null;
}

export interface DailyProfit {
  date: string;
  profit: number;
  cumulative: number;
  bySymbol?: Record<string, number>;
}

export interface WeeklyProfit {
  weekStart: string;
  weekEnd: string;
  label: string;
  profit: number;
  cumulative: number;
}

export interface MonthlyProfit {
  month: string;
  profit: number;
  cumulative: number;
}

export interface AnalysisSummary {
  totalTrades: number;
  totalProfit: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}

export interface DateRange {
  startDate: string | null;
  endDate: string | null;
  isFullRange: boolean;
}

export interface SymbolStats {
  symbol: string;
  tradeCount: number;
  totalProfit: number;
  totalVolume: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
}
