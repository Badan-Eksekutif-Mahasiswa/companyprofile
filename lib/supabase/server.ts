import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** true bila env Supabase terisi. Kalau false, data layer memakai data dummy lokal. */
export const isSupabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Client untuk Server Component / route handler. Hanya membaca data publik (dibatasi RLS). */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

let admin: SupabaseClient | null = null;

/**
 * Client dengan service role key: MELEWATI RLS (bisa baca draft). Hanya untuk server (route pratinjau).
 * Key TIDAK boleh berawalan NEXT_PUBLIC_ dan tidak boleh diimpor ke komponen client.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY belum diisi (dibutuhkan untuk pratinjau draft).");
  if (!admin) {
    admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      // Draft tidak boleh masuk cache data Next.js: selalu ambil segar.
      global: { fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }) },
    });
  }
  return admin;
}
