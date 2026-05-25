"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toggleSaved } from "@/lib/actions/saved";

export function SaveButton({
  codeId,
  initialSaved,
  variant = "default",
}: {
  codeId: string;
  initialSaved: boolean;
  variant?: "default" | "icon";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  function onClick() {
    setMessage(null);
    startTransition(async () => {
      const result = await toggleSaved(codeId);
      if (result.ok) {
        setSaved(result.saved);
      } else if (result.reason === "logged-out") {
        router.push(`/login?next=/code/${codeId}&intent=save`);
      } else if (result.reason === "subscription_required") {
        setMessage("Saving entries is a subscriber feature.");
      } else {
        setMessage("Something went wrong. Try again.");
      }
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        disabled={pending}
        className="p-1 hover:scale-110 transition-transform"
        title={saved ? "Remove from saved" : "Save this entry"}
        aria-label={saved ? "Remove from saved" : "Save this entry"}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={saved ? "var(--color-orange-primary)" : "none"}
          stroke={saved ? "var(--color-orange-primary)" : "var(--color-ink-muted)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className={saved ? "btn-primary text-sm py-2 px-4" : "btn-ghost text-sm py-2 px-4"}
      >
        {pending ? "…" : saved ? "★ Saved" : "☆ Save to my list"}
      </button>
      {message && (
        <p className="text-xs text-[var(--color-orange-dark)] mt-2">
          {message}{" "}
          <Link href="/#pricing" className="underline font-semibold">
            Subscribe →
          </Link>
        </p>
      )}
    </div>
  );
}
