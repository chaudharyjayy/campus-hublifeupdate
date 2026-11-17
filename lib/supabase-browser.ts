import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

export function isSupabaseConfigured(): boolean {
  return Boolean(url) && Boolean(key);
}

let cached: SupabaseClient | null = null;
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cached) cached = createClient(url, key);
  return cached;
}

export const supabaseConnection = { url, configured: isSupabaseConfigured() };
