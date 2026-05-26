"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { AI_PLATFORMS, PROMPT_CATEGORIES } from "@/lib/types";

export function PromptsFilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const platforms = new Set((searchParams.get("ai")?.split(",") ?? []).filter(Boolean));
  const categories = new Set((searchParams.get("cat")?.split(",") ?? []).filter(Boolean));
  const q = searchParams.get("q") ?? "";

  const push = useCallback(
    (next: URLSearchParams) => {
      startTransition(() => {
        router.replace(`/prompts?${next.toString()}`);
      });
    },
    [router],
  );

  const toggle = (key: string, paramKey: string, id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const current = new Set((next.get(paramKey)?.split(",") ?? []).filter(Boolean));
    if (current.has(id)) current.delete(id);
    else current.add(id);
    if (current.size === 0) next.delete(paramKey);
    else next.set(paramKey, Array.from(current).join(","));
    next.delete("page");
    push(next);
  };

  const setQuery = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("q", value);
    else next.delete("q");
    next.delete("page");
    push(next);
  };

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Filter by title or content..."
        defaultValue={q}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
      />
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">AI platform</div>
        <div className="flex flex-wrap gap-2">
          {AI_PLATFORMS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle("ai", "ai", p.id)}
              className={
                "badge cursor-pointer transition-colors " +
                (platforms.has(p.id) ? "badge-ai !border-[var(--color-orange-primary)]" : "")
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">Category</div>
        <div className="flex flex-wrap gap-2">
          {PROMPT_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggle("cat", "cat", c.id)}
              className={
                "badge cursor-pointer transition-colors " +
                (categories.has(c.id) ? "badge-target !border-blue-400" : "")
              }
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
