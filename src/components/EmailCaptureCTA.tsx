"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

// Lightweight email capture. Submits to a Tally form by redirecting with
// the email as a URL prefill parameter. No backend, no analytics.
//
// Gracefully renders nothing if NEXT_PUBLIC_TALLY_VAULT_FORM_ID is missing —
// keeps the form invisible across the site until Stephen creates the form.
export function EmailCaptureCTA({
  formId,
  variant = "wide",
}: {
  formId: string | null;
  variant?: "wide" | "compact";
}) {
  const [email, setEmail] = useState("");
  if (!formId) return null;

  const action = `https://tally.so/r/${formId}`;
  const className =
    variant === "compact"
      ? "card mt-8 bg-orange-50 border-[var(--color-orange-light)]"
      : "card max-w-2xl mx-auto bg-orange-50 border-[var(--color-orange-light)]";

  return (
    <section className={className}>
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold mb-1">Get new entries weekly.</h2>
        <p className="text-sm text-[var(--color-ink-muted)]">
          No spam, just curated picks.
        </p>
      </div>
      <form
        method="GET"
        action={action}
        target="_blank"
        rel="noopener noreferrer"
        onSubmit={() => trackEvent("Waitlist signup")}
        className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto"
      >
        <input
          type="email"
          name="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-orange-primary)]"
        />
        <button type="submit" className="btn-primary text-sm">
          Subscribe →
        </button>
      </form>
      <p className="text-xs text-[var(--color-ink-muted)] text-center mt-3">
        Opens Tally to confirm. Unsubscribe in one click.
      </p>
    </section>
  );
}
