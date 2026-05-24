"use client";

import { useFormStatus } from "react-dom";

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
}: {
  action: () => Promise<void>;
  label: string;
}) {
  return (
    <form action={action}>
      <SubmitInner label={label} />
    </form>
  );
}
