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
    custom_data?: { user_id?: string };
  };
  data: {
    id: string; // subscription id
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

export async function POST(req: Request) {
  const env = getLemonSqueezyServerEnv();
  if (!env) return NextResponse.json({ ok: false, reason: "no-env" }, { status: 503 });

  const signature = req.headers.get("x-signature");
  const raw = await req.text();
  if (!signature) return NextResponse.json({ ok: false, reason: "no-signature" }, { status: 401 });

  const expected = crypto
    .createHmac("sha256", env.webhookSecret)
    .update(raw)
    .digest("hex");
  const ok =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  if (!ok) return NextResponse.json({ ok: false, reason: "bad-signature" }, { status: 401 });

  let body: LSWebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }

  const supabase = getSupabaseService();
  if (!supabase) return NextResponse.json({ ok: false, reason: "no-supabase" }, { status: 503 });

  const event = body.meta.event_name;
  const userId = body.meta.custom_data?.user_id;
  if (!userId) {
    return NextResponse.json({ ok: false, reason: "no-user-id" }, { status: 400 });
  }

  const { data: userLookup, error: userError } = await supabase.auth.admin.getUserById(userId);
  if (userError || !userLookup?.user) {
    console.error("[ls-webhook] unknown user_id", { userId, event, error: userError?.message });
    return NextResponse.json({ ok: false, reason: "unknown-user" }, { status: 400 });
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

  // Variants encode the plan. Stephen will fill these in when the LS product exists.
  // For now we treat any active subscription as "monthly" by default.
  const monthlyVariant = process.env.LS_VARIANT_MONTHLY;
  const annualVariant = process.env.LS_VARIANT_ANNUAL;
  const variantId = String(attrs.variant_id);
  const plan: "monthly" | "annual" | null =
    variantId === annualVariant ? "annual" : variantId === monthlyVariant ? "monthly" : "monthly";

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
    console.error("[ls-webhook] db upsert failed", { userId, event, error: error.message });
    return NextResponse.json({ ok: false, reason: "db-error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
