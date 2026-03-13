/**
 * 사이트 전용 자체 로그인 (Supabase Auth와 별개)
 * 아이디(admin, jin2ous) + 비밀번호(7788)
 */

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "user";
};

const STORAGE_KEY = "futures-auth";
const SESSION_HOURS = 8;

const USERS: { username: string; password: string; role: "admin" | "user" }[] = [
  { username: "admin", password: "7788", role: "admin" },
  { username: "jin2ous", password: "7788", role: "user" },
];

export function verifyCredentials(username: string, password: string): AuthUser | null {
  const u = USERS.find((x) => x.username === username && x.password === password);
  if (!u) return null;
  return { id: u.username, username: u.username, role: u.role };
}

export function setSession(user: AuthUser): void {
  if (typeof window === "undefined") return;
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, exp }));
  window.dispatchEvent(new CustomEvent("futures-auth-change"));
}

export function getSession(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const { user, exp } = JSON.parse(raw);
    if (!user || exp < Date.now()) {
      clearSession();
      return null;
    }
    return user;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("futures-auth-change"));
}
