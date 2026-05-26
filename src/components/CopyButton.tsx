"use client";

import { useState } from "react";

export function CopyButton({ text, label = "Copy", onCopy }: { text: string; label?: string; onCopy?: () => void }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          onCopy?.();
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="btn-primary text-sm py-1.5 px-3"
    >
      {copied ? "Copied!" : label}
    </button>
  );
}
