"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";

const LOCAL_STORAGE_KEY = "futures-uploaded-files";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Analysis Error]", error);
  }, [error]);

  const handleClearStorage = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      console.log("[Analysis Error] Cleared localStorage");
    } catch (e) {
      console.error("[Analysis Error] Failed to clear localStorage", e);
    }
    reset();
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-400" />
            <h1 className="text-xl font-bold text-red-400">오류 발생</h1>
          </div>
          
          <p className="text-[var(--foreground)] mb-2">
            페이지 로드 중 오류가 발생했습니다.
          </p>
          
          <div className="bg-black/30 rounded p-3 mb-4 overflow-auto max-h-32">
            <code className="text-xs text-red-300 whitespace-pre-wrap">
              {error.message || "알 수 없는 오류"}
            </code>
          </div>
          
          <p className="text-sm text-[var(--muted)] mb-4">
            브라우저에 저장된 파일 데이터가 손상되었을 수 있습니다.
            아래 버튼을 클릭하여 저장된 데이터를 삭제하고 다시 시도하세요.
          </p>
          
          <div className="space-y-2">
            <button
              onClick={handleClearStorage}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              저장 데이터 삭제 후 다시 시도
            </button>
            
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md bg-white/10 text-[var(--foreground)] hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </div>
          
          <p className="text-xs text-[var(--muted)] mt-4 text-center">
            문제가 지속되면 브라우저 콘솔(F12)에서 상세 로그를 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
