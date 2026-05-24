import { getSupabaseServer } from "@/lib/supabase/server";
import type { Code } from "@/lib/types";

// Look up the Cheesyboy flagship entry. Returns null if Supabase isn't
// configured or the entry hasn't been seeded yet — callers should fall back
// to a static showcase.
export async function getFlagshipEntry(): Promise<Code | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;
  const { data } = await supabase
    .from("codes")
    .select("*")
    .eq("source_url", "https://cheesyboy.dev")
    .eq("approved", true)
    .maybeSingle();
  return (data as Code | null) ?? null;
}
