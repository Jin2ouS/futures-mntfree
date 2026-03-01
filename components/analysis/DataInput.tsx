"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Link, FileSpreadsheet, Loader2, Server, Trash2 } from "lucide-react";
import { parseExcelFile, parseGoogleSheetUrl, getGoogleSheetExportUrl } from "@/lib/parseExcel";
import type { TradeRecord } from "@/lib/types";

interface DataInputProps {
  onDataLoaded: (records: TradeRecord[]) => void;
}

interface ServerFile {
  name: string;
  size: number;
  modified: string;
}

interface LocalFile {
  name: string;
  data: string;
  savedAt: string;
}

const LOCAL_STORAGE_KEY = "futures-uploaded-files";
const BASE_PATH = "";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLocalFiles(): LocalFile[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function generateUniqueFileName(name: string, existingFiles: LocalFile[]): string {
  const existingNames = new Set(existingFiles.map((f) => f.name));
  if (!existingNames.has(name)) {
    return name;
  }
  
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  
  const lastDotIndex = name.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return `${name}_${timestamp}`;
  }
  
  const baseName = name.substring(0, lastDotIndex);
  const extension = name.substring(lastDotIndex);
  return `${baseName}_${timestamp}${extension}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  const chunks: string[] = [];
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    chunks.push(String.fromCharCode.apply(null, Array.from(chunk)));
  }
  
  return btoa(chunks.join(""));
}

function saveLocalFile(name: string, data: ArrayBuffer): string | null {
  try {
    const base64 = arrayBufferToBase64(data);
    const estimatedSize = base64.length * 2;
    
    if (estimatedSize > 4 * 1024 * 1024) {
      console.warn("File too large for localStorage, skipping save");
      return null;
    }
    
    const files = getLocalFiles();
    const uniqueName = generateUniqueFileName(name, files);
    const newFile: LocalFile = { name: uniqueName, data: base64, savedAt: new Date().toISOString() };
    
    files.unshift(newFile);
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files.slice(0, 10)));
    } catch (quotaError) {
      const reducedFiles = files.slice(0, 5);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reducedFiles));
    }
    
    return uniqueName;
  } catch (err) {
    console.error("Failed to save file to localStorage:", err);
    return null;
  }
}

function deleteLocalFile(name: string): void {
  try {
    const files = getLocalFiles().filter((f) => f.name !== name);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(files));
  } catch {
    // ignore
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch (err) {
    console.error("Failed to decode base64:", err);
    throw new Error("저장된 파일 데이터가 손상되었습니다.");
  }
}

export default function DataInput({ onDataLoaded }: DataInputProps) {
  const [mode, setMode] = useState<"upload" | "link" | "server">("upload");
  const [googleUrl, setGoogleUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [serverLoading, setServerLoading] = useState(false);

  useEffect(() => {
    setLocalFiles(getLocalFiles());
  }, []);

  useEffect(() => {
    if (mode === "server") {
      setServerLoading(true);
      fetch(`${BASE_PATH}/data/files.json`)
        .then((res) => res.json())
        .then((data) => setServerFiles(data))
        .catch(() => setServerFiles([]))
        .finally(() => setServerLoading(false));
    }
  }, [mode]);

  const handleFileUpload = useCallback(
    async (file: File, saveToLocal = true) => {
      setLoading(true);
      setError(null);
      setFileName(file.name);

      try {
        const buffer = await file.arrayBuffer();
        const records = parseExcelFile(buffer);

        if (records.length === 0) {
          throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
        }

        if (saveToLocal) {
          const savedName = saveLocalFile(file.name, buffer);
          if (savedName) {
            setFileName(savedName);
          }
          setLocalFiles(getLocalFiles());
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

  const handleServerFileSelect = useCallback(
    async (file: ServerFile) => {
      setLoading(true);
      setError(null);
      setFileName(file.name);

      try {
        const response = await fetch(`${BASE_PATH}/data/${encodeURIComponent(file.name)}`);
        if (!response.ok) {
          throw new Error("파일을 가져올 수 없습니다.");
        }

        const buffer = await response.arrayBuffer();
        const records = parseExcelFile(buffer);

        if (records.length === 0) {
          throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
        }

        onDataLoaded(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : "파일 로드 실패");
        setFileName(null);
      } finally {
        setLoading(false);
      }
    },
    [onDataLoaded]
  );

  const handleLocalFileSelect = useCallback(
    async (file: LocalFile) => {
      setLoading(true);
      setError(null);
      setFileName(file.name);

      try {
        const buffer = base64ToArrayBuffer(file.data);
        const records = parseExcelFile(buffer);

        if (records.length === 0) {
          throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
        }

        onDataLoaded(records);
      } catch (err) {
        setError(err instanceof Error ? err.message : "파일 로드 실패");
        setFileName(null);
      } finally {
        setLoading(false);
      }
    },
    [onDataLoaded]
  );

  const handleDeleteLocalFile = useCallback((name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteLocalFile(name);
    setLocalFiles(getLocalFiles());
  }, []);

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
          구글시트 URL
        </button>
        <button
          onClick={() => setMode("server")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "server"
              ? "bg-white/10 text-[var(--foreground)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          <Server className="h-4 w-4" />
          서버파일 선택
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
          <p className="mt-3 text-xs text-[var(--muted)]">
            업로드 된 파일은 서버에 저장되어, &quot;서버파일 선택&quot; 메뉴에서 확인할 수 있습니다.
          </p>
        </div>
      ) : mode === "link" ? (
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
      ) : (
        <div className="space-y-4">
          {serverLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 text-[var(--muted)] animate-spin" />
            </div>
          ) : (
            <>
              {serverFiles.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">서버 파일</p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {serverFiles.map((file) => (
                      <button
                        key={file.name}
                        onClick={() => handleServerFileSelect(file)}
                        disabled={loading}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50 ${
                          fileName === file.name ? "bg-white/10 border border-blue-500/50" : "bg-white/5"
                        }`}
                      >
                        <FileSpreadsheet className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="flex-1 truncate text-[var(--foreground)]">{file.name}</span>
                        <span className="text-xs text-[var(--muted)]">{formatFileSize(file.size)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {localFiles.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">최근 업로드 (브라우저 저장)</p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {localFiles.map((file) => (
                      <button
                        key={file.name}
                        onClick={() => handleLocalFileSelect(file)}
                        disabled={loading}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50 ${
                          fileName === file.name ? "bg-white/10 border border-blue-500/50" : "bg-white/5"
                        }`}
                      >
                        <FileSpreadsheet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <span className="flex-1 truncate text-[var(--foreground)]">{file.name}</span>
                        <button
                          onClick={(e) => handleDeleteLocalFile(file.name, e)}
                          className="p-1 rounded hover:bg-red-500/20 text-[var(--muted)] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {serverFiles.length === 0 && localFiles.length === 0 && (
                <div className="text-center py-8 text-[var(--muted)] text-sm">
                  서버에 파일이 없습니다. 파일을 업로드하세요.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
