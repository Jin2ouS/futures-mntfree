"use client";

import { useState, useCallback, useEffect } from "react";
import { Upload, Link, FileSpreadsheet, Loader2, Server, Trash2, AlertTriangle, Check, Square, CheckSquare } from "lucide-react";
import { parseExcelFile, parseGoogleSheetUrl, getGoogleSheetExportUrl } from "@/lib/parseExcel";
import { uploadFile, listFiles, downloadFile, deleteFile as deleteStorageFile, isSupabaseConfigured, type StorageFile } from "@/lib/supabase";
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
const DEBUG = true;

function log(level: "info" | "warn" | "error", message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `[DataInput ${timestamp}]`;
  
  if (level === "error") {
    console.error(prefix, message, data !== undefined ? data : "");
  } else if (level === "warn") {
    console.warn(prefix, message, data !== undefined ? data : "");
  } else if (DEBUG) {
    console.log(prefix, message, data !== undefined ? data : "");
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidBase64(str: string): boolean {
  if (!str || typeof str !== "string") return false;
  try {
    const decoded = atob(str);
    return decoded.length > 0;
  } catch {
    return false;
  }
}

function validateLocalFile(file: unknown): file is LocalFile {
  if (!file || typeof file !== "object") return false;
  const f = file as Record<string, unknown>;
  return (
    typeof f.name === "string" &&
    typeof f.data === "string" &&
    typeof f.savedAt === "string" &&
    isValidBase64(f.data)
  );
}

function getLocalFiles(): LocalFile[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!stored) {
      log("info", "No local files in localStorage");
      return [];
    }
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      log("warn", "localStorage data is not an array, clearing");
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      return [];
    }
    
    const validFiles: LocalFile[] = [];
    const invalidCount = { total: 0 };
    
    for (const item of parsed) {
      if (validateLocalFile(item)) {
        validFiles.push(item);
      } else {
        invalidCount.total++;
        log("warn", "Invalid local file found", { name: item?.name || "unknown" });
      }
    }
    
    if (invalidCount.total > 0) {
      log("warn", `Removed ${invalidCount.total} invalid files from localStorage`);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validFiles));
    }
    
    log("info", `Loaded ${validFiles.length} valid local files`);
    return validFiles;
  } catch (err) {
    log("error", "Failed to parse localStorage", err);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      log("info", "Cleared corrupted localStorage");
    } catch {
      // ignore
    }
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

function base64ToArrayBuffer(base64: string, fileName?: string): ArrayBuffer {
  log("info", `Decoding base64 for file: ${fileName || "unknown"}`, { 
    dataLength: base64?.length || 0 
  });
  
  if (!base64 || typeof base64 !== "string") {
    log("error", "Invalid base64 data: empty or not a string");
    throw new Error("파일 데이터가 비어있습니다.");
  }
  
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    log("info", `Decoded binary length: ${len} bytes`);
    
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    log("info", `Successfully converted to ArrayBuffer: ${bytes.buffer.byteLength} bytes`);
    return bytes.buffer;
  } catch (err) {
    log("error", "Failed to decode base64", { error: err, fileName });
    throw new Error(`저장된 파일 데이터가 손상되었습니다: ${fileName || "unknown"}`);
  }
}

function getDisplayName(fileName: string): string {
  const timestampMatch = fileName.match(/^\d+_(.+)$/);
  if (timestampMatch) {
    return timestampMatch[1].replace(/_/g, " ");
  }
  return fileName;
}

export default function DataInput({ onDataLoaded }: DataInputProps) {
  const [mode, setMode] = useState<"upload" | "link" | "server">("upload");
  const [googleUrl, setGoogleUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  const [serverFiles, setServerFiles] = useState<ServerFile[]>([]);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [serverLoading, setServerLoading] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [mergeLoading, setMergeLoading] = useState(false);

  useEffect(() => {
    setLocalFiles(getLocalFiles());
  }, []);

  const loadServerFiles = useCallback(async () => {
    setServerLoading(true);
    
    try {
      const [staticFilesRes, supabaseFiles] = await Promise.all([
        fetch(`${BASE_PATH}/data/files.json`).then((res) => res.json()).catch(() => []),
        isSupabaseConfigured() ? listFiles() : Promise.resolve([]),
      ]);
      
      setServerFiles(staticFilesRes);
      setStorageFiles(supabaseFiles);
      log("info", `Loaded ${staticFilesRes.length} static files, ${supabaseFiles.length} storage files`);
    } catch (err) {
      log("error", "Failed to load server files", err);
      setServerFiles([]);
      setStorageFiles([]);
    } finally {
      setServerLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === "server") {
      loadServerFiles();
      setSelectedFiles(new Set());
      setIsMultiSelectMode(false);
    }
  }, [mode, loadServerFiles]);

  const handleFileUpload = useCallback(
    async (file: File) => {
      log("info", `Uploading file: ${file.name}`, { 
        size: file.size, 
        type: file.type
      });
      
      setLoading(true);
      setError(null);
      setFileName(file.name);
      setUploadProgress("파일 읽는 중...");

      try {
        const buffer = await file.arrayBuffer();
        log("info", `Read file buffer: ${buffer.byteLength} bytes`);
        
        setUploadProgress("데이터 파싱 중...");
        const records = parseExcelFile(buffer);
        log("info", `Parsed ${records.length} records`);

        if (records.length === 0) {
          throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
        }

        if (isSupabaseConfigured()) {
          setUploadProgress("서버에 업로드 중...");
          const result = await uploadFile(file);
          if (result) {
            log("info", `Uploaded to storage: ${result.path}`);
            setUploadProgress("업로드 완료!");
            await loadServerFiles();
          } else {
            log("warn", "Failed to upload to storage, saving locally");
            setUploadProgress("로컬에 저장 중...");
            const savedName = saveLocalFile(file.name, buffer);
            if (savedName) {
              setFileName(savedName);
            }
            setLocalFiles(getLocalFiles());
          }
        } else {
          setUploadProgress("로컬에 저장 중...");
          const savedName = saveLocalFile(file.name, buffer);
          if (savedName) {
            log("info", `Saved to localStorage as: ${savedName}`);
            setFileName(savedName);
          } else {
            log("warn", "Failed to save to localStorage (file may be too large)");
          }
          setLocalFiles(getLocalFiles());
        }

        onDataLoaded(records);
        log("info", `Successfully loaded ${records.length} records`);
      } catch (err) {
        log("error", `Failed to upload file: ${file.name}`, err);
        setError(err instanceof Error ? err.message : "파일 파싱 실패");
        setFileName(null);
      } finally {
        setLoading(false);
        setUploadProgress(null);
      }
    },
    [onDataLoaded, loadServerFiles]
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

  const handleStorageFileSelect = useCallback(
    async (file: StorageFile) => {
      setLoading(true);
      setError(null);
      setFileName(file.originalName);

      try {
        const buffer = await downloadFile(file.name);
        if (!buffer) {
          throw new Error("파일을 다운로드할 수 없습니다.");
        }

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
      log("info", `Loading local file: ${file.name}`, { 
        savedAt: file.savedAt,
        dataLength: file.data?.length || 0 
      });
      
      setLoading(true);
      setError(null);
      setFileName(file.name);

      try {
        if (!file.data) {
          throw new Error("파일 데이터가 없습니다.");
        }
        
        const buffer = base64ToArrayBuffer(file.data, file.name);
        log("info", `Parsing Excel file: ${file.name}`);
        
        const records = parseExcelFile(buffer);
        log("info", `Parsed ${records.length} records from ${file.name}`);

        if (records.length === 0) {
          throw new Error("유효한 거래 데이터를 찾을 수 없습니다.");
        }

        onDataLoaded(records);
        log("info", `Successfully loaded ${records.length} records`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "파일 로드 실패";
        log("error", `Failed to load local file: ${file.name}`, err);
        
        if (errorMessage.includes("손상") || errorMessage.includes("비어있")) {
          log("warn", `Removing corrupted file: ${file.name}`);
          deleteLocalFile(file.name);
          setLocalFiles(getLocalFiles());
          setError(`${errorMessage} (파일이 자동 삭제되었습니다)`);
        } else {
          setError(errorMessage);
        }
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

  const handleDeleteStorageFile = useCallback(async (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await deleteStorageFile(name);
    if (success) {
      await loadServerFiles();
    } else {
      setError("파일 삭제에 실패했습니다.");
    }
  }, [loadServerFiles]);

  const toggleFileSelection = useCallback((fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  const handleMergeAndLoad = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setError("선택된 파일이 없습니다.");
      return;
    }

    setMergeLoading(true);
    setError(null);
    
    const fileNames: string[] = [];
    const allRecords: TradeRecord[] = [];

    try {
      for (const fileId of selectedFiles) {
        const [type, name] = fileId.split(":", 2);
        
        if (type === "storage") {
          const storageFile = storageFiles.find(f => f.name === name);
          fileNames.push(storageFile?.originalName || name);
        } else {
          fileNames.push(name);
        }

        let buffer: ArrayBuffer | null = null;

        if (type === "static") {
          const response = await fetch(`${BASE_PATH}/data/${encodeURIComponent(name)}`);
          if (response.ok) {
            buffer = await response.arrayBuffer();
          }
        } else if (type === "storage") {
          buffer = await downloadFile(name);
        } else if (type === "local") {
          const localFile = localFiles.find(f => f.name === name);
          if (localFile) {
            buffer = base64ToArrayBuffer(localFile.data, localFile.name);
          }
        }

        if (buffer) {
          const records = parseExcelFile(buffer);
          allRecords.push(...records);
          log("info", `Loaded ${records.length} records from ${name}`);
        } else {
          log("warn", `Failed to load file: ${name}`);
        }
      }

      if (allRecords.length === 0) {
        throw new Error("선택한 파일들에서 유효한 거래 데이터를 찾을 수 없습니다.");
      }

      allRecords.sort((a, b) => {
        const timeA = a.진입시간?.getTime() || 0;
        const timeB = b.진입시간?.getTime() || 0;
        return timeA - timeB;
      });

      setFileName(`${fileNames.length}개 파일 병합`);
      onDataLoaded(allRecords);
      log("info", `Merged ${allRecords.length} records from ${fileNames.length} files`);
      
      setSelectedFiles(new Set());
      setIsMultiSelectMode(false);
    } catch (err) {
      log("error", "Failed to merge files", err);
      setError(err instanceof Error ? err.message : "파일 병합 실패");
    } finally {
      setMergeLoading(false);
    }
  }, [selectedFiles, localFiles, onDataLoaded]);

  const renderFileItem = (
    type: "static" | "storage" | "local",
    name: string,
    displayName: string,
    size: number | undefined,
    onSelect: () => void,
    onDelete?: (e: React.MouseEvent) => void,
    iconColor: string = "text-green-500"
  ) => {
    const fileId = `${type}:${name}`;
    const isSelected = selectedFiles.has(fileId);

    return (
      <button
        key={fileId}
        onClick={isMultiSelectMode ? (e) => toggleFileSelection(fileId, e) : onSelect}
        disabled={loading || mergeLoading}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm transition-colors hover:bg-white/10 disabled:opacity-50 ${
          isSelected ? "bg-blue-500/20 border border-blue-500/50" : 
          fileName === displayName ? "bg-white/10 border border-blue-500/50" : "bg-white/5"
        }`}
      >
        {isMultiSelectMode && (
          <span className="flex-shrink-0">
            {isSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-400" />
            ) : (
              <Square className="h-4 w-4 text-[var(--muted)]" />
            )}
          </span>
        )}
        <FileSpreadsheet className={`h-4 w-4 ${iconColor} flex-shrink-0`} />
        <span className="flex-1 truncate text-[var(--foreground)]">{displayName}</span>
        {size !== undefined && size > 0 && (
          <span className="text-xs text-[var(--muted)]">{formatFileSize(size)}</span>
        )}
        {onDelete && !isMultiSelectMode && (
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500/20 text-[var(--muted)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </button>
    );
  };

  const totalFiles = serverFiles.length + storageFiles.length + localFiles.length;

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
              {uploadProgress ? (
                <span className="text-blue-400">{uploadProgress}</span>
              ) : fileName ? (
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
            {isSupabaseConfigured() 
              ? "업로드 된 파일은 서버에 저장되어, \"서버파일 선택\" 메뉴에서 확인할 수 있습니다."
              : "Supabase가 설정되지 않아, 파일이 브라우저에만 저장됩니다."}
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
              {totalFiles > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => {
                      setIsMultiSelectMode(!isMultiSelectMode);
                      if (isMultiSelectMode) {
                        setSelectedFiles(new Set());
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isMultiSelectMode 
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50" 
                        : "bg-white/5 text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {isMultiSelectMode ? <CheckSquare className="h-3 w-3" /> : <Square className="h-3 w-3" />}
                    {isMultiSelectMode ? "선택 취소" : "여러 파일 선택"}
                  </button>
                  
                  {isMultiSelectMode && selectedFiles.size > 0 && (
                    <button
                      onClick={handleMergeAndLoad}
                      disabled={mergeLoading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {mergeLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                      {selectedFiles.size}개 파일 불러오기
                    </button>
                  )}
                </div>
              )}

              {serverFiles.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">서버 파일 (정적)</p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {serverFiles.map((file) => renderFileItem(
                      "static",
                      file.name,
                      file.name,
                      file.size,
                      () => handleServerFileSelect(file),
                      undefined,
                      "text-green-500"
                    ))}
                  </div>
                </div>
              )}

              {storageFiles.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">서버 파일 (업로드)</p>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {storageFiles.map((file) => renderFileItem(
                      "storage",
                      file.name,
                      file.originalName,
                      file.size,
                      () => handleStorageFileSelect(file),
                      (e) => handleDeleteStorageFile(file.name, e),
                      "text-emerald-500"
                    ))}
                  </div>
                </div>
              )}

              {localFiles.length > 0 && (
                <div>
                  <p className="text-xs text-[var(--muted)] mb-2">최근 업로드 (브라우저 저장)</p>
                  <div className="space-y-1 max-h-[150px] overflow-y-auto">
                    {localFiles.map((file) => renderFileItem(
                      "local",
                      file.name,
                      file.name,
                      undefined,
                      () => handleLocalFileSelect(file),
                      (e) => handleDeleteLocalFile(file.name, e),
                      "text-blue-500"
                    ))}
                  </div>
                </div>
              )}

              {totalFiles === 0 && (
                <div className="text-center py-8 text-[var(--muted)] text-sm">
                  서버에 파일이 없습니다. 파일을 업로드하세요.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-md bg-red-500/10 border border-red-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <pre className="text-sm text-red-400 whitespace-pre-wrap font-sans">{error}</pre>
              <p className="text-xs text-red-400/70 mt-2">
                브라우저 콘솔(F12)에서 상세 로그를 확인할 수 있습니다.
              </p>
            </div>
          </div>
          {localFiles.length > 0 && (
            <button
              onClick={() => {
                log("info", "Clearing all local files");
                localStorage.removeItem(LOCAL_STORAGE_KEY);
                setLocalFiles([]);
                setError(null);
              }}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              모든 브라우저 저장 파일 삭제
            </button>
          )}
        </div>
      )}
    </div>
  );
}
