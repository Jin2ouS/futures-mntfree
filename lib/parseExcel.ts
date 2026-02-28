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
    (row) =>
      row &&
      row.some(
        (cell) =>
          String(cell).includes("진입시간") ||
          String(cell).includes("청산시간") ||
          (String(cell) === "시간" && row.some((c) => String(c) === "포지션"))
      )
  );

  if (headerRowIndex === -1) return [];

  const rawHeaders = jsonData[headerRowIndex] as (string | null)[];
  const dataRows = jsonData.slice(headerRowIndex + 1);

  const headers: string[] = [];
  const headerIndices: Record<string, number[]> = {};

  rawHeaders.forEach((header, idx) => {
    const h = header ? String(header).trim() : "";
    headers.push(h);
    if (h) {
      if (!headerIndices[h]) headerIndices[h] = [];
      headerIndices[h].push(idx);
    }
  });

  const isMT5Format =
    headerIndices["시간"]?.length === 2 &&
    headerIndices["가격"]?.length === 2 &&
    !headers.includes("진입시간");

  const has실수익Column = headers.includes("실수익");
  const records: TradeRecord[] = [];

  for (const row of dataRows) {
    if (!row || row.every((cell) => cell === null || cell === "")) continue;

    let 진입시간: Date | null = null;
    let 청산시간: Date | null = null;
    let 전입가격 = 0;
    let 청산가격 = 0;
    let 포지션 = "";
    let 통화 = "";
    let 종류 = "";
    let 거래량 = 0;
    let SL: number | null = null;
    let TP: number | null = null;
    let 커미션 = 0;
    let 스왑 = 0;
    let 수익 = 0;
    let 계좌번호: string | null = null;
    let 진입기준: string | null = null;
    let 비고: string | null = null;
    let 실수익 = 0;

    if (isMT5Format) {
      const 시간Indices = headerIndices["시간"];
      const 가격Indices = headerIndices["가격"];

      진입시간 = parseExcelDate(row[시간Indices[0]]);
      청산시간 = parseExcelDate(row[시간Indices[1]]);
      전입가격 = Number(row[가격Indices[0]]) || 0;
      청산가격 = Number(row[가격Indices[1]]) || 0;

      const getVal = (name: string) => {
        const idx = headerIndices[name]?.[0];
        return idx !== undefined ? row[idx] : null;
      };

      포지션 = String(getVal("포지션") || "");
      통화 = String(getVal("통화") || "");
      종류 = String(getVal("종류") || "");
      거래량 = Number(getVal("거래량")) || 0;

      const slVal = getVal("S / L") ?? getVal("S/L");
      const tpVal = getVal("T / P") ?? getVal("T/P");
      SL = slVal != null && slVal !== "" ? Number(slVal) : null;
      TP = tpVal != null && tpVal !== "" ? Number(tpVal) : null;

      커미션 = Number(getVal("커미션")) || 0;
      스왑 = Number(getVal("스왑")) || 0;
      수익 = Number(getVal("수익")) || 0;
      계좌번호 = getVal("계좌번호") ? String(getVal("계좌번호")) : null;
      진입기준 = getVal("진입기준") ? String(getVal("진입기준")) : null;
      비고 = getVal("비고") ? String(getVal("비고")) : null;

      const raw실수익 = getVal("실수익");
      if (has실수익Column && raw실수익 !== null && raw실수익 !== undefined && raw실수익 !== "") {
        실수익 = Number(raw실수익) || 0;
      } else {
        실수익 = 커미션 + 스왑 + 수익;
      }
    } else {
      const record: Record<string, unknown> = {};
      headers.forEach((header, idx) => {
        if (header) {
          record[header] = row[idx];
        }
      });

      진입시간 = parseExcelDate(record["진입시간"]);
      청산시간 = parseExcelDate(record["청산시간"]);
      포지션 = String(record["포지션"] || "");
      통화 = String(record["통화"] || "");
      종류 = String(record["종류"] || "");
      거래량 = Number(record["거래량"]) || 0;
      전입가격 = Number(record["전입가격"]) || 0;

      const slVal = record["S / L"] ?? record["S/L"];
      const tpVal = record["T / P"] ?? record["T/P"];
      SL = slVal != null ? Number(slVal) : null;
      TP = tpVal != null ? Number(tpVal) : null;

      청산가격 = Number(record["청산가격"]) || 0;
      커미션 = Number(record["커미션"]) || 0;
      스왑 = Number(record["스왑"]) || 0;
      수익 = Number(record["수익"]) || 0;
      계좌번호 = record["계좌번호"] ? String(record["계좌번호"]) : null;
      진입기준 = record["진입기준"] ? String(record["진입기준"]) : null;
      비고 = record["비고"] ? String(record["비고"]) : null;

      if (has실수익Column && record["실수익"] !== null && record["실수익"] !== undefined && record["실수익"] !== "") {
        실수익 = Number(record["실수익"]) || 0;
      } else {
        실수익 = 커미션 + 스왑 + 수익;
      }
    }

    if (실수익 === 0 && 수익 === 0) continue;

    const tradeRecord: TradeRecord = {
      진입시간,
      포지션,
      통화,
      종류,
      거래량,
      전입가격,
      "S / L": SL,
      "T / P": TP,
      청산시간,
      청산가격,
      커미션,
      스왑,
      수익,
      계좌번호,
      실수익,
      진입기준,
      비고,
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
