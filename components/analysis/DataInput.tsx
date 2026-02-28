"use client";

import { useState, useCallback } from "react";
import { Upload, Link, FileSpreadsheet, Loader2 } from "lucide-react";
import { parseExcelFile, parseGoogleSheetUrl, getGoogleSheetExportUrl } from "@/lib/parseExcel";
import type { TradeRecord } from "@/lib/types";

interface DataInputProps {
  onDataLoaded: (records: TradeRecord[]) => void;
}

export default function DataInput({ onDataLoaded }: DataInputProps) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [googleUrl, setGoogleUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      setFileName(file.name);

      try {
        const buffer = await file.arrayBuffer();
        const records = parseExcelFile(buffer);

        if (records.length === 0) {
          throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
        }

        onDataLoaded(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : "파일 파싱 실패");
        setFileName(null);
      } finally {
        setLoading(false);
      }
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))) {
        handleFileUpload(file);
      } else {
        setError("엑셀 파일(.xlsx, .xls)만 지원합니다.");
      }
    },
    [handleFileUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleGoogleLink = useCallback(async () => {
    if (!googleUrl.trim()) {
      setError("구글 시트 URL을 입력하세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const parsed = parseGoogleSheetUrl(googleUrl);
      if (!parsed) {
        throw new Error("올바른 구글 시트 URL이 아닙니다.");
      }

      const exportUrl = getGoogleSheetExportUrl(parsed.spreadsheetId, parsed.gid);

      const response = await fetch(exportUrl);
      if (!response.ok) {
        throw new Error("파일을 가져올 수 없습니다. 공개 설정을 확인하세요.");
      }

      const buffer = await response.arrayBuffer();
      const records = parseExcelFile(buffer);

      if (records.length === 0) {
        throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
      }

      setFileName("Google Sheet");
      onDataLoaded(records);
    } catch (err) {
      setError(err instanceof Error ? err.message : "데이터 로드 실패");
    } finally {
      setLoading(false);
    }
  }, [googleUrl, onDataLoaded]);

  return (
    <div className="rounded-lg border border-[var(--border)] bg-white/[0.02] p-6">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "upload"
              ? "bg-white/10 text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Upload className="h-4 w-4" />
          파일 업로드
        </button>
        <button
          onClick={() => setMode("link")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "link"
              ? "bg-white/10 text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Link className="h-4 w-4" />
          구글 시트 링크
        </button>
      </div>

      {mode === "upload" ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-[var(--border)] rounded-lg p-8 text-center cursor-pointer hover:border-[var(--muted)] transition-colors"
        >
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {loading ? (
              <Loader2 className="h-10 w-10 mx-auto text-[var(--muted)] animate-spin" />
            ) : fileName ? (
              <FileSpreadsheet className="h-10 w-10 mx-auto text-green-500" />
            ) : (
              <Upload className="h-10 w-10 mx-auto text-[var(--muted)]" />
            )}
            <p className="mt-4 text-sm text-[var(--muted)]">
              {fileName ? (
                <span className="text-[var(--foreground)]">{fileName}</span>
              ) : (
                <>
                  클릭하여 파일 선택 또는 드래그 앤 드롭
                  <br />
                  <span className="text-xs">.xlsx, .xls 파일 지원</span>
                </>
              )}
            </p>
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <input
              type="text"
              value={googleUrl}
              onChange={(e) => setGoogleUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-4 py-2 rounded-md bg-white/5 border border-[var(--border)] text-[var(--foreground)] placeholder-[var(--muted)] text-sm focus:outline-none focus:border-[var(--muted)]"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">
              구글 드라이브에서 파일을 구글 시트로 열고, 공유 설정을 &quot;링크가 있는 모든 사용자&quot;로 변경하세요.
            </p>
          </div>
          <button
            onClick={handleGoogleLink}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-white/10 text-[var(--foreground)] text-sm font-medium hover:bg-white/15 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link className="h-4 w-4" />
            )}
            데이터 불러오기
          </button>
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
