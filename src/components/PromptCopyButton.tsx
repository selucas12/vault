"use client";

import { CopyButton } from "@/components/CopyButton";
import { trackEvent } from "@/lib/analytics";

export function PromptCopyButton({ text, promptId }: { text: string; promptId: string }) {
  return (
    <CopyButton
      text={text}
      onCopy={() => trackEvent("Prompt copied", { prompt_id: promptId })}
    />
  );
}
