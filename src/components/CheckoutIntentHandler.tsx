"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { checkoutMonthly, checkoutAnnual } from "@/lib/actions/checkout";

// Reads ?intent=subscribe-monthly or subscribe-annual from the URL and
// auto-fires the corresponding checkout server action. Used on /account
// after the login redirect flow.
export function CheckoutIntentHandler() {
  const sp = useSearchParams();
  const intent = sp.get("intent");
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    if (intent === "subscribe-monthly") {
      fired.current = true;
      checkoutMonthly();
    } else if (intent === "subscribe-annual") {
      fired.current = true;
      checkoutAnnual();
    }
  }, [intent]);

  if (intent?.startsWith("subscribe-")) {
    return (
      <div className="card border-[var(--color-orange-light)] bg-orange-50 text-sm mb-4">
        <div className="font-semibold">Redirecting to checkout…</div>
        <p className="text-[var(--color-ink-muted)]">
          Taking you to LemonSqueezy to complete your subscription.
        </p>
      </div>
    );
  }
  return null;
}
