"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  if (pathname === "/login") return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--muted)] transition-colors">
          MnTfree Futures
        </Link>
        <div className="flex items-center gap-4">
          {loading ? (
            <span className="text-sm text-[var(--muted)]">...</span>
          ) : user ? (
            <>
              <span className="text-sm text-[var(--muted)]">{user.username}</span>
              <button
                type="button"
                onClick={() => logout().then(() => router.push("/"))}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
