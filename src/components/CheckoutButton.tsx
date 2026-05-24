"use client";

import { useFormStatus } from "react-dom";
import { trackEvent } from "@/lib/analytics";

function SubmitInner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Redirecting…" : label}
    </button>
  );
}

export function CheckoutButton({
  action,
  label,
  plan,
}: {
  action: () => Promise<void>;
  label: string;
  plan?: "monthly" | "annual";
}) {
  return (
    <form
      action={async () => {
        trackEvent("Subscribe Clicked", { plan: plan ?? "unknown" });
        await action();
      }}
    >
      <SubmitInner label={label} />
    </form>
  );
}
