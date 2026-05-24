import { getSupabaseServer } from "@/lib/supabase/server";
import type { Subscriber } from "@/lib/types";

export interface SubscriptionState {
  loggedIn: boolean;
  active: boolean;
  subscriber: Subscriber | null;
}

// Read the current user's subscription state. Returns a graceful object
// even when Supabase is not configured — pages should treat missing config
// as "not subscribed" rather than crashing.
export async function getSubscriptionState(): Promise<SubscriptionState> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { loggedIn: false, active: false, subscriber: null };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { loggedIn: false, active: false, subscriber: null };

  const { data, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return { loggedIn: true, active: false, subscriber: null };

  const sub = data as Subscriber;
  const active =
    sub.status === "active" &&
    (sub.current_period_end === null ||
      new Date(sub.current_period_end) > new Date());

  return { loggedIn: true, active, subscriber: sub };
}

// Used inside server actions or route handlers to gate access.
export async function requireSubscription(): Promise<
  | { ok: true; subscriber: Subscriber }
  | { ok: false; reason: "no-supabase" | "logged-out" | "inactive" }
> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { ok: false, reason: "no-supabase" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "logged-out" };

  const { data } = await supabase
    .from("subscribers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return { ok: false, reason: "inactive" };

  const sub = data as Subscriber;
  const active =
    sub.status === "active" &&
    (sub.current_period_end === null ||
      new Date(sub.current_period_end) > new Date());
  if (!active) return { ok: false, reason: "inactive" };

  return { ok: true, subscriber: sub };
}
