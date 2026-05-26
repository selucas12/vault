import Link from "next/link";
import type { Prompt } from "@/lib/types";

export function PromptCard({
  prompt,
  blurred = false,
}: {
  prompt: Prompt;
  blurred?: boolean;
}) {
  return (
    <Link href={`/prompts/${prompt.id}`} className="card block">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-base leading-snug">{prompt.title}</h3>
        {prompt.is_free && (
          <span className="badge badge-verified shrink-0">free</span>
        )}
      </div>
      <div className={`text-sm text-[var(--color-ink-muted)] mb-3 ${blurred ? "blur-sm select-none" : ""} line-clamp-3`}>
        {prompt.body}
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {prompt.ai_platforms.map((p) => (
          <span key={p} className="badge badge-ai">
            {p}
          </span>
        ))}
        {prompt.category && (
          <span className="badge badge-target">{prompt.category}</span>
        )}
      </div>
      <div className="text-xs text-[var(--color-ink-muted)]">
        {prompt.source.replace(/-/g, " ")}
      </div>
    </Link>
  );
}
