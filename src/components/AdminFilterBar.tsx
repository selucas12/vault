"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { AI_PLATFORMS } from "@/lib/types";

const SOURCE_TYPES = [
  { id: "github-awesome", label: "awesome-list" },
  { id: "github-topic", label: "github-topic" },
  { id: "huggingface", label: "huggingface" },
  { id: "manual", label: "manual" },
];

export function AdminFilterBar() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const sourceFilter = sp.get("source") ?? "";
  const aiFilters = new Set((sp.get("ai")?.split(",") ?? []).filter(Boolean));

  function push(next: URLSearchParams) {
    startTransition(() => router.replace(`/admin?${next.toString()}`));
  }

  function setSource(id: string) {
    const next = new URLSearchParams(sp.toString());
    if (next.get("source") === id) next.delete("source");
    else next.set("source", id);
    next.delete("page");
    push(next);
  }

  function toggleAi(id: string) {
    const next = new URLSearchParams(sp.toString());
    const current = new Set((next.get("ai")?.split(",") ?? []).filter(Boolean));
    if (current.has(id)) current.delete(id);
    else current.add(id);
    if (current.size === 0) next.delete("ai");
    else next.set("ai", Array.from(current).join(","));
    next.delete("page");
    push(next);
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">
          Source
        </div>
        <div className="flex flex-wrap gap-2">
          {SOURCE_TYPES.map((s) => {
            const active = sourceFilter === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={
                  "badge cursor-pointer " +
                  (active ? "!border-[var(--color-orange-primary)] !bg-orange-50" : "")
                }
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">
          AI platform
        </div>
        <div className="flex flex-wrap gap-2">
          {AI_PLATFORMS.map((p) => {
            const active = aiFilters.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggleAi(p.id)}
                className={
                  "badge cursor-pointer " +
                  (active ? "badge-ai !border-[var(--color-orange-primary)]" : "")
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
