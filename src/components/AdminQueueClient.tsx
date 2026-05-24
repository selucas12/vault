"use client";

import { useState, useTransition } from "react";
import { approveCode, approveMany, rejectCode } from "@/app/admin/actions";
import type { Code } from "@/lib/types";

export function AdminQueueClient({ codes }: { codes: Code[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function toggleAll() {
    setSelected((prev) =>
      prev.size === codes.length ? new Set() : new Set(codes.map((c) => c.id)),
    );
  }

  const allSelected = codes.length > 0 && selected.size === codes.length;

  function runBulkApprove() {
    if (selected.size === 0) return;
    startTransition(async () => {
      try {
        await approveMany(Array.from(selected));
        setSelected(new Set());
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk approve failed");
      }
    });
  }

  function runApprove(id: string) {
    startTransition(async () => {
      try {
        await approveCode(id);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approve failed");
      }
    });
  }

  function runReject(id: string) {
    if (!window.confirm("Delete this entry from the database? This can't be undone.")) return;
    startTransition(async () => {
      try {
        await rejectCode(id);
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Reject failed");
      }
    });
  }

  if (codes.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-3xl mb-2">✨</div>
        <p className="font-semibold mb-1">Inbox zero</p>
        <p className="text-sm text-[var(--color-ink-muted)]">
          No pending entries match the current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 sticky top-16 bg-[var(--color-cream)]/95 backdrop-blur z-10 py-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4" />
          <span>
            {selected.size > 0
              ? `${selected.size} selected`
              : `${codes.length} pending on this page`}
          </span>
        </label>
        <button
          type="button"
          onClick={runBulkApprove}
          disabled={pending || selected.size === 0}
          className="btn-primary text-sm py-1.5 px-3"
        >
          {pending ? "Working…" : `Approve ${selected.size || ""}`.trim()}
        </button>
      </div>
      {error && (
        <div className="card border-red-300 bg-red-50 text-red-900 text-sm">{error}</div>
      )}
      <ul className="space-y-3">
        {codes.map((c) => (
          <li key={c.id} className="card">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="mt-1 w-4 h-4"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold leading-snug break-words">{c.title}</h3>
                  <span className="badge shrink-0 text-[10px]">{c.source_type}</span>
                </div>
                {c.description && (
                  <p className="text-sm text-[var(--color-ink-muted)] mb-2 line-clamp-3">
                    {c.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-1 mb-2">
                  {c.ai_platforms.map((p) => (
                    <span key={p} className="badge badge-ai">
                      {p}
                    </span>
                  ))}
                  {c.delivery_targets.map((t) => (
                    <span key={t} className="badge badge-target">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)] mb-3 truncate">
                  ★ {c.stars}
                  {c.language ? ` · ${c.language}` : ""}
                  {" · "}
                  <a href={c.source_url} target="_blank" rel="noreferrer" className="underline">
                    {c.source_url}
                  </a>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => runApprove(c.id)}
                    disabled={pending}
                    className="btn-primary text-xs py-1 px-2"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => runReject(c.id)}
                    disabled={pending}
                    className="btn-ghost text-xs py-1 px-2 !border-red-300 !text-red-700 hover:!bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
