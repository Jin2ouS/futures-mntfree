import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
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

export async function uploadFile(file: File): Promise<{ path: string; originalName: string } | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'xlsx';
    const randomId = Math.random().toString(36).substring(2, 8);
    const filePath = `${timestamp}_${randomId}.${ext}`;

    const { data, error } = await client.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          originalName: file.name,
        },
      });

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    return { path: data.path, originalName: file.name };
  } catch (err) {
    console.error("Upload failed:", err);
    return null;
  }
}

export async function listFiles(): Promise<StorageFile[]> {
  const client = getSupabaseClient();
  if (!client) return [];

  try {
    const { data, error } = await client.storage.from(STORAGE_BUCKET).list("", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      console.error("List files error:", error);
      return [];
    }

    return (data || [])
      .filter((file) => file.name.endsWith(".xlsx") || file.name.endsWith(".xls"))
      .map((file) => ({
        name: file.name,
        originalName: file.metadata?.originalName || file.name,
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

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}
