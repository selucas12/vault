"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { getAdminEmail } from "@/lib/env";

// Verifies the current request is from the admin account. Throws if not.
async function assertAdmin(): Promise<void> {
  const supabase = await getSupabaseServer();
  if (!supabase) throw new Error("Supabase isn't configured.");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  if (user.email !== getAdminEmail()) throw new Error("Not authorized.");
}

export async function approveCode(id: string) {
  await assertAdmin();
  const service = getSupabaseService();
  if (!service) throw new Error("Service-role client unavailable.");
  const { error } = await service
    .from("codes")
    .update({ approved: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

export async function approveMany(ids: string[]) {
  await assertAdmin();
  if (ids.length === 0) return;
  const service = getSupabaseService();
  if (!service) throw new Error("Service-role client unavailable.");
  const { error } = await service
    .from("codes")
    .update({ approved: true, updated_at: new Date().toISOString() })
    .in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
}

export async function rejectCode(id: string) {
  await assertAdmin();
  const service = getSupabaseService();
  if (!service) throw new Error("Service-role client unavailable.");
  const { error } = await service.from("codes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function toggleFeatured(id: string, featured: boolean) {
  await assertAdmin();
  const service = getSupabaseService();
  if (!service) throw new Error("Service-role client unavailable.");
  const { error } = await service
    .from("codes")
    .update({ featured, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
  revalidatePath("/directory");
  revalidatePath("/");
}
