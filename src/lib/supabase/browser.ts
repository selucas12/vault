"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/lib/env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowser() {
  if (cached) return cached;
  const env = getSupabaseEnv();
  if (!env) return null;
  cached = createBrowserClient(env.url, env.anonKey);
  return cached;
}
