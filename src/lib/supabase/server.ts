import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv, getSupabaseServiceEnv } from "@/lib/env";

// Server component / route handler client. Uses the user's session cookie.
export async function getSupabaseServer() {
  const env = getSupabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Read-only context (some RSC paths). Safe to ignore.
        }
      },
    },
  });
}

// Service-role client for trusted server-side jobs (webhooks, scraper).
// NEVER expose this to the browser.
export function getSupabaseService() {
  const env = getSupabaseServiceEnv();
  if (!env) return null;
  return createClient(env.url, env.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
