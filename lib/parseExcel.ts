import * as XLSX from "xlsx";
import type { TradeRecord } from "./types";

function parseExcelDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0);
    }
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/\n/g, " ").trim();
    const formats = [
      /^(\d{4})\.(\d{2})\.(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    ];

    for (const fmt of formats) {
      const match = cleaned.match(fmt);
      if (match) {
        const [, y, m, d, h, min, s] = match.map(Number);
        return new Date(y, m - 1, d, h, min, s);
      }
    }

    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  if (value instanceof Date) return value;

  return null;
}

export function parseExcelFile(buffer: ArrayBuffer): TradeRecord[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][];

  if (jsonData.length < 2) return [];

  const headerRowIndex = jsonData.findIndex(
    (row) => row && row.some((cell) => String(cell).includes("진입시간") || String(cell).includes("청산시간"))
  );

  if (headerRowIndex === -1) return [];

  const headers = jsonData[headerRowIndex] as string[];
  const dataRows = jsonData.slice(headerRowIndex + 1);

  const records: TradeRecord[] = [];
  const has실수익Column = headers.includes("실수익");

  for (const row of dataRows) {
    if (!row || row.every((cell) => cell === null || cell === "")) continue;

    const record: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      if (header) {
        record[header] = row[idx];
      }
    });

    const 커미션 = Number(record["커미션"]) || 0;
    const 스왑 = Number(record["스왑"]) || 0;
    const 수익 = Number(record["수익"]) || 0;

    let 실수익: number;
    if (has실수익Column && (record["실수익"] !== null && record["실수익"] !== undefined && record["실수익"] !== "")) {
      실수익 = Number(record["실수익"]) || 0;
    } else {
      실수익 = 커미션 + 스왑 + 수익;
    }

    if (실수익 === 0 && 수익 === 0) continue;

    const tradeRecord: TradeRecord = {
      진입시간: parseExcelDate(record["진입시간"]),
      포지션: String(record["포지션"] || ""),
      통화: String(record["통화"] || ""),
      종류: String(record["종류"] || ""),
      거래량: Number(record["거래량"]) || 0,
      전입가격: Number(record["전입가격"]) || 0,
      "S / L": record["S / L"] != null ? Number(record["S / L"]) : null,
      "T / P": record["T / P"] != null ? Number(record["T / P"]) : null,
      청산시간: parseExcelDate(record["청산시간"]),
      청산가격: Number(record["청산가격"]) || 0,
      커미션,
      스왑,
      수익,
      계좌번호: record["계좌번호"] ? String(record["계좌번호"]) : null,
      실수익,
      진입기준: record["진입기준"] ? String(record["진입기준"]) : null,
      비고: record["비고"] ? String(record["비고"]) : null,
    };

    records.push(tradeRecord);
  }

  return records;
}

export function parseGoogleSheetUrl(url: string): { spreadsheetId: string; gid: string } | null {
  try {
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) return null;

    const spreadsheetId = idMatch[1];

    let gid = "0";
    const gidMatch = url.match(/gid=(\d+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    return { spreadsheetId, gid };
  } catch {
    return null;
  }
}

export function getGoogleSheetExportUrl(spreadsheetId: string, gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=xlsx&gid=${gid}`;
}
