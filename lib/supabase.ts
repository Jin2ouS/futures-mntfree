import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase) return supabase;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window !== "undefined") {
      console.warn("Supabase credentials not configured");
    }
    return null;
  }
  
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

export const STORAGE_BUCKET = "futures-mntfree-files";

export interface StorageFile {
  name: string;
  originalName: string;
  size: number;
  created_at: string;
  updated_at: string;
}

function encodeOriginalName(name: string): string {
  try {
    return btoa(unescape(encodeURIComponent(name)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  } catch {
    return "file";
  }
}

function decodeOriginalName(encoded: string): string {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return encoded;
  }
}

export type UploadOptions = {
  /** 업로드 시 파일 목록에 표시할 이름. 중복 시 년월일시분초가 붙은 이름 전달 */
  displayName?: string;
};

export type UploadResult =
  | { ok: true; path: string; originalName: string }
  | { ok: false; message: string };

function uploadErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

export async function uploadFile(
  file: File,
  username: string,
  options?: UploadOptions
): Promise<UploadResult> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, message: "Supabase가 설정되지 않았거나 연결할 수 없습니다." };
  }
  if (!username) {
    return { ok: false, message: "사용자 정보가 없어 서버에 저장할 수 없습니다." };
  }

  const displayName = options?.displayName ?? file.name;

  try {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'xlsx';
    const encodedName = encodeOriginalName(displayName);
    const filePath = `${username}/${timestamp}_${encodedName}.${ext}`;

    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      const detail = error.message?.trim() || "";
      const message = detail
        ? `서버 저장 실패: ${detail}`
        : "서버 저장에 실패했습니다.";
      return { ok: false, message };
    }

    return { ok: true, path: data.path, originalName: displayName };
  } catch (err) {
    console.error("Upload failed:", err);
    return {
      ok: false,
      message: `서버 저장 중 오류: ${uploadErrorMessage(err)}`,
    };
  }
}

function extractOriginalName(fileName: string): string {
  const match = fileName.match(/^\d+_(.+)\.(xlsx?|xls)$/i);
  if (match) {
    const decoded = decodeOriginalName(match[1]);
    if (decoded !== match[1] && decoded.length > 0) {
      return decoded;
    }
  }
  return fileName;
}

export async function listFiles(username: string): Promise<StorageFile[]> {
  const client = getSupabaseClient();
  if (!client || !username) return [];

  try {
    const { data, error } = await client.storage.from(STORAGE_BUCKET).list(username, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      console.error("List files error:", error);
      return [];
    }

    return (data || [])
      .filter((file) => file.name && (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")))
      .map((file) => ({
        name: `${username}/${file.name}`,
        originalName: extractOriginalName(file.name),
        size: file.metadata?.size || 0,
        created_at: file.created_at || "",
        updated_at: file.updated_at || "",
      }));
  } catch (err) {
    console.error("List files failed:", err);
    return [];
  }
}

export async function downloadFile(fileName: string): Promise<ArrayBuffer | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .download(fileName);

    if (error) {
      console.error("Download error:", error);
      return null;
    }

    return await data.arrayBuffer();
  } catch (err) {
    console.error("Download failed:", err);
    return null;
  }
}

export async function deleteFile(fileName: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.storage
      .from(STORAGE_BUCKET)
      .remove([fileName]);

    if (error) {
      console.error("Delete error:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Delete failed:", err);
    return false;
  }
}

export async function renameFile(
  currentPath: string,
  newDisplayName: string
): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client || !newDisplayName?.trim()) return false;

  const ext = currentPath.split(".").pop() || "xlsx";
  const username = currentPath.split("/")[0];
  if (!username) return false;

  const timestamp = Date.now();
  const encodedName = encodeOriginalName(newDisplayName.trim());
  const newPath = `${username}/${timestamp}_${encodedName}.${ext}`;

  if (newPath === currentPath) return true;

  try {
    // move API가 Object not found 오류를 일으킬 수 있어, download → upload → delete로 구현
    const buffer = await downloadFile(currentPath);
    if (!buffer) {
      console.error("Rename error: Failed to download file");
      return false;
    }

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const file = new File([blob], newDisplayName.trim(), { type: blob.type });

    const uploadResult = await uploadFile(file, username, {
      displayName: newDisplayName.trim(),
    });
    if (!uploadResult.ok) {
      console.error("Rename error: Failed to upload with new name", uploadResult.message);
      return false;
    }

    const removed = await deleteFile(currentPath);
    if (!removed) {
      console.warn("Rename: New file created but old file delete failed", currentPath);
    }

    return true;
  } catch (err) {
    console.error("Rename failed:", err);
    return false;
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
