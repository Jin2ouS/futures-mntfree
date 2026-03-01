import * as XLSX from "xlsx";
import type { TradeRecord } from "./types";

const DEBUG = true;

function log(level: "info" | "warn" | "error", message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[parseExcel ${timestamp}]`;
  
  if (level === "error") {
    console.error(prefix, message, data !== undefined ? data : "");
  } else if (level === "warn") {
    console.warn(prefix, message, data !== undefined ? data : "");
  } else if (DEBUG) {
    console.log(prefix, message, data !== undefined ? data : "");
  }
}

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

export interface ParseResult {
  records: TradeRecord[];
  error?: string;
  fileName?: string;
}

export function parseExcelFile(buffer: ArrayBuffer, fileName?: string): TradeRecord[] {
  const fileLabel = fileName ? `[${fileName}] ` : "";
  log("info", `${fileLabel}Parsing Excel file, buffer size: ${buffer.byteLength} bytes`);
  
  try {
    const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
    log("info", `${fileLabel}Workbook loaded, sheets: ${workbook.SheetNames.join(", ")}`);
    
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const jsonData = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
    }) as unknown[][];

    log("info", `${fileLabel}Sheet "${sheetName}" has ${jsonData.length} rows`);

    if (jsonData.length < 2) {
      log("warn", `${fileLabel}Sheet has less than 2 rows`);
      throw new Error(`${fileLabel}시트에 데이터가 부족합니다 (2행 미만).`);
    }

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

  if (headerRowIndex === -1) {
    const sampleHeaders = jsonData.slice(0, 5).map((row, idx) => {
      const cells = (row || []).slice(0, 10).map(c => String(c || "").trim()).filter(Boolean);
      return `  행 ${idx + 1}: ${cells.join(", ") || "(빈 행)"}`;
    }).join("\n");
    
    log("warn", `${fileLabel}Header row not found`, { sampleHeaders });
    
    throw new Error(
      `${fileLabel}컬럼 헤더를 인식할 수 없습니다.\n\n` +
      `지원하는 형식:\n` +
      `• MT5 형식: 시간, 포지션, 통화, 종류, 거래량, 가격, S/L, T/P, 커미션, 스왑, 수익\n` +
      `• 일반 형식: 진입시간, 청산시간, 포지션, 통화, 종류, 거래량, 진입가격, 청산가격, 커미션, 스왑, 수익\n\n` +
      `파일 상단 5행의 내용:\n${sampleHeaders}`
    );
  }

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

  const foundHeaders = headers.filter(h => h).join(", ");
  log("info", `Found headers: ${foundHeaders}`);
  log("info", `Format detected: ${isMT5Format ? "MT5" : "일반"}`);

  const missingColumns: string[] = [];
  
  if (isMT5Format) {
    const requiredMT5 = ["시간", "가격", "포지션", "수익"];
    for (const col of requiredMT5) {
      if (!headerIndices[col] || headerIndices[col].length === 0) {
        missingColumns.push(col);
      }
    }
    if (headerIndices["시간"]?.length !== 2) {
      missingColumns.push("시간 (2개 필요: 진입/청산)");
    }
    if (headerIndices["가격"]?.length !== 2) {
      missingColumns.push("가격 (2개 필요: 진입/청산)");
    }
  } else {
    const requiredGeneral = ["진입시간", "청산시간", "포지션", "수익"];
    for (const col of requiredGeneral) {
      if (!headerIndices[col] || headerIndices[col].length === 0) {
        missingColumns.push(col);
      }
    }
  }

  if (missingColumns.length > 0) {
    const formatName = isMT5Format ? "MT5" : "일반";
    log("warn", `${fileLabel}Missing required columns for ${formatName} format`, { missingColumns, foundHeaders });
    
    throw new Error(
      `${fileLabel}필수 컬럼이 누락되었습니다.\n\n` +
      `누락된 컬럼: ${missingColumns.join(", ")}\n\n` +
      `파일에서 찾은 컬럼:\n${foundHeaders || "(컬럼 없음)"}\n\n` +
      `${isMT5Format ? "MT5" : "일반"} 형식 필수 컬럼:\n` +
      (isMT5Format 
        ? `• 시간 (2개), 가격 (2개), 포지션, 수익`
        : `• 진입시간, 청산시간, 포지션, 수익`)
    );
  }

  const has실수익Column = headers.includes("실수익");
  const records: TradeRecord[] = [];
  let skippedRows = 0;

  for (const row of dataRows) {
    if (!row || row.every((cell) => cell === null || cell === "")) continue;

    let 진입시간: Date | null = null;
    let 청산시간: Date | null = null;
    let 진입가격 = 0;
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
      진입가격 = Number(row[가격Indices[0]]) || 0;
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
      진입가격 = Number(record["진입가격"] ?? record["전입가격"]) || 0;

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

    if (실수익 === 0 && 수익 === 0) {
      skippedRows++;
      continue;
    }

    const tradeRecord: TradeRecord = {
      진입시간,
      포지션,
      통화,
      종류,
      거래량,
      진입가격,
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

  log("info", `${fileLabel}Parsed ${records.length} valid trade records, skipped ${skippedRows} rows (수익=0)`);
  
  if (records.length === 0) {
    const totalDataRows = dataRows.filter(row => row && !row.every(cell => cell === null || cell === "")).length;
    
    throw new Error(
      `${fileLabel}유효한 거래 데이터를 찾을 수 없습니다.\n\n` +
      `총 데이터 행: ${totalDataRows}개\n` +
      `건너뛴 행 (수익=0): ${skippedRows}개\n\n` +
      `확인사항:\n` +
      `• "수익" 컬럼에 0이 아닌 값이 있는지 확인하세요\n` +
      `• 날짜 형식이 올바른지 확인하세요 (예: 2024.01.01 12:00:00)`
    );
  }
  
  return records;
  } catch (err) {
    log("error", `${fileLabel}Failed to parse Excel file`, err);
    throw err;
  }
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

export interface ExcelPreviewData {
  sheetName: string;
  headers: string[];
  rows: string[][];
  totalRows: number;
}

export function getExcelPreview(buffer: ArrayBuffer, maxRows: number = 10): ExcelPreviewData {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
  
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
  
  const startIndex = headerRowIndex >= 0 ? headerRowIndex : 0;
  const headers = (jsonData[startIndex] || []).map(cell => String(cell || "").trim());
  const dataRows = jsonData.slice(startIndex + 1);
  
  const previewRows = dataRows.slice(0, maxRows).map(row => 
    (row || []).map(cell => String(cell ?? ""))
  );
  
  return {
    sheetName,
    headers,
    rows: previewRows,
    totalRows: dataRows.length,
  };
}
