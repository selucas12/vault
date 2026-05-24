"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { AI_PLATFORMS, DELIVERY_TARGETS } from "@/lib/types";

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const platforms = new Set((searchParams.get("ai")?.split(",") ?? []).filter(Boolean));
  const targets = new Set((searchParams.get("target")?.split(",") ?? []).filter(Boolean));
  const q = searchParams.get("q") ?? "";

  const push = useCallback(
    (next: URLSearchParams) => {
      startTransition(() => {
        router.replace(`/directory?${next.toString()}`);
      });
    },
    [router],
  );

  const toggle = (key: "ai" | "target", id: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const current = new Set((next.get(key)?.split(",") ?? []).filter(Boolean));
    if (current.has(id)) current.delete(id);
    else current.add(id);
    if (current.size === 0) next.delete(key);
    else next.set(key, Array.from(current).join(","));
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
        placeholder="Filter by name or description…"
        defaultValue={q}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
      />
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">AI platform</div>
        <div className="flex flex-wrap gap-2">
          {AI_PLATFORMS.map((p) => {
            const active = platforms.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle("ai", p.id)}
                className={
                  "badge cursor-pointer transition-colors " +
                  (active ? "badge-ai !border-[var(--color-orange-primary)]" : "")
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">Delivery target</div>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_TARGETS.map((t) => {
            const active = targets.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle("target", t.id)}
                className={
                  "badge cursor-pointer transition-colors " +
                  (active ? "badge-target !border-blue-400" : "")
                }
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
