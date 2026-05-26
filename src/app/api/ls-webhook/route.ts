import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getSupabaseService } from "@/lib/supabase/server";
import { getLemonSqueezyServerEnv } from "@/lib/env";

export const runtime = "nodejs";

interface LSWebhookBody {
  meta: {
    event_name:
      | "subscription_created"
      | "subscription_updated"
      | "subscription_cancelled"
      | "subscription_resumed"
      | "subscription_expired"
      | "subscription_paused"
      | "subscription_payment_success"
      | "subscription_payment_failed"
      | string;
    webhook_id?: string;
    custom_data?: { user_id?: string };
  };
  data: {
    id: string;
    attributes: {
      customer_id: number | string;
      product_id: number | string;
      variant_id: number | string;
      status: string;
      renews_at?: string | null;
      ends_at?: string | null;
      user_email?: string;
    };
  };
}

function genericError(status: number) {
  return NextResponse.json({ ok: false, reason: "internal-error" }, { status });
}

export async function POST(req: Request) {
  const env = getLemonSqueezyServerEnv();
  if (!env) return genericError(503);

  const signature = req.headers.get("x-signature");
  const raw = await req.text();
  if (!signature) return genericError(401);

  const expected = crypto
    .createHmac("sha256", env.webhookSecret)
    .update(raw)
    .digest("hex");
  const ok =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!ok) return genericError(401);

  let body: LSWebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return genericError(400);
  }

  const supabase = getSupabaseService();
  if (!supabase) return genericError(503);

  const event = body.meta.event_name;
  const eventId = body.meta.webhook_id ?? `${body.data.id}-${event}-${Date.now()}`;

  // Idempotency: skip already-processed events
  const { data: existing } = await supabase
    .from("processed_webhooks")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const userId = body.meta.custom_data?.user_id;
  if (!userId) {
    console.error("[ls-webhook] no user_id in custom_data", { event, eventId });
    return genericError(400);
  }

  const { data: userLookup, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !userLookup?.user) {
    console.error("[ls-webhook] unknown user_id", { userId, event });
    return genericError(400);
  }

  const attrs = body.data.attributes;
  const subscriptionId = String(body.data.id);
  const customerId = String(attrs.customer_id);

  const status = (() => {
    if (event === "subscription_cancelled" || event === "subscription_expired") return "cancelled";
    if (event === "subscription_paused") return "past_due";
    if (event === "subscription_payment_failed") return "past_due";
    if (attrs.status === "active" || attrs.status === "on_trial") return "active";
    return "inactive";
  })();

  // Plan detection: fail loudly if variants aren't configured
  const monthlyVariant = process.env.LS_VARIANT_MONTHLY;
  const annualVariant = process.env.LS_VARIANT_ANNUAL;
  const variantId = String(attrs.variant_id);

  let plan: "monthly" | "annual" | null = null;
  if (variantId === annualVariant) {
    plan = "annual";
  } else if (variantId === monthlyVariant) {
    plan = "monthly";
  } else if (!monthlyVariant && !annualVariant) {
    console.error("[ls-webhook] LS_VARIANT_MONTHLY and LS_VARIANT_ANNUAL not configured", { variantId, event });
    return genericError(500);
  } else {
    console.error("[ls-webhook] unknown variant_id, does not match configured variants", { variantId, monthlyVariant, annualVariant, event });
    return genericError(500);
  }

  const periodEnd = attrs.renews_at ?? attrs.ends_at ?? null;

  const { error } = await supabase
    .from("subscribers")
    .upsert(
      {
        user_id: userId,
        ls_subscription_id: subscriptionId,
        ls_customer_id: customerId,
        status,
        plan,
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("[ls-webhook] db upsert failed", { userId, event });
    return genericError(500);
  }

  // Record event as processed (best-effort)
  await supabase.from("processed_webhooks").insert({ id: eventId });

  return NextResponse.json({ ok: true });
}
