"use server";

import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getLemonSqueezyEnv } from "@/lib/env";

// Server actions for LemonSqueezy checkout with user_id injection.
// These get called from <form action={...}> in both the landing page
// pricing card and the /account upgrade section.
//
// Flow:
// 1. If LS env isn't configured → redirect to /#pricing with an error param.
// 2. If user isn't logged in → redirect to /login?next=/account&intent=subscribe-{plan}.
// 3. If user IS logged in → build LS checkout URL with checkout[custom][user_id]
//    and redirect to LemonSqueezy.

async function doCheckout(plan: "monthly" | "annual") {
  const ls = getLemonSqueezyEnv();
  if (!ls) redirect("/#pricing?error=checkout-not-ready");

  const supabase = await getSupabaseServer();
  if (!supabase) redirect(`/login?next=/account&intent=subscribe-${plan}`);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/account&intent=subscribe-${plan}`);

  const baseUrl = plan === "monthly" ? ls.monthly : ls.annual;
  const url = new URL(baseUrl);
  url.searchParams.set("checkout[custom][user_id]", user.id);
  url.searchParams.set("checkout[email]", user.email ?? "");
  redirect(url.toString());
}

export async function checkoutMonthly() {
  await doCheckout("monthly");
}

export async function checkoutAnnual() {
  await doCheckout("annual");
}
