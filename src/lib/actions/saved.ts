"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { requireSubscription } from "@/lib/subscription";

export async function toggleSaved(
  codeId: string,
): Promise<{ ok: true; saved: boolean } | { ok: false; reason: "logged-out" | "subscription_required" | "error" }> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, reason: "error" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "logged-out" };

  const sub = await requireSubscription();
  if (!sub.ok) return { ok: false, reason: "subscription_required" };

  // Check if already saved.
  const { data: existing } = await supabase
    .from("saved_codes")
    .select("code_id")
    .eq("user_id", user.id)
    .eq("code_id", codeId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("saved_codes")
      .delete()
      .eq("user_id", user.id)
      .eq("code_id", codeId);
    if (error) return { ok: false, reason: "error" };
    revalidatePath("/my-list");
    return { ok: true, saved: false };
  }

  const { error } = await supabase
    .from("saved_codes")
    .insert({ user_id: user.id, code_id: codeId });
  if (error) return { ok: false, reason: "error" };
  revalidatePath("/my-list");
  return { ok: true, saved: true };
}
