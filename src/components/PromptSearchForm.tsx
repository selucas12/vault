"use client";

import { useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { trackEvent } from "@/lib/analytics";

interface PromptMatch {
  id: string;
  title: string;
  body: string;
  ai_platforms: string[];
  category: string | null;
  is_free: boolean;
  why?: string;
  confidence?: "high" | "medium" | "low";
}

type SearchResponse =
  | { ok: true; gated: boolean; matches: PromptMatch[] }
  | { ok: false; reason: string };

export function PromptSearchForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/prompts-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data: SearchResponse = await res.json();
      setResult(data);
      if (data.ok) {
        trackEvent("Prompt Search Completed", { result_count: data.matches.length });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="card mb-8">
        <label htmlFor="pq" className="block text-sm font-semibold mb-2">
          Describe the prompt you need
        </label>
        <textarea
          id="pq"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="I need a prompt that makes Claude act as a senior code reviewer for Python"
          className="w-full rounded border border-[var(--color-border)] bg-white p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-orange-primary)]"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[var(--color-ink-muted)]">
            AI matches your description to the best prompts in our library.
          </p>
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary">
            {loading ? "Searching..." : "Find Prompts →"}
          </button>
        </div>
      </form>

      {error && (
        <div className="card border-red-300 bg-red-50 text-red-900 text-sm mb-6">{error}</div>
      )}

      {result && !result.ok && (
        <div className="card border-red-300 bg-red-50 text-red-900 text-sm mb-6">
          Search failed: {result.reason}
        </div>
      )}

      {result && result.ok && result.matches.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-2">🤔</div>
          <p className="font-semibold mb-1">No matching prompts</p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Try a different description, or{" "}
            <Link href="/prompts" className="underline">browse all prompts</Link>.
          </p>
        </div>
      )}

      {result && result.ok && result.matches.length > 0 && (
        <div className="space-y-4">
          {result.gated && (
            <div className="card border-[var(--color-orange-primary)] bg-orange-50 text-sm">
              <strong>Preview mode.</strong> Subscribe to see all results with full prompt text.{" "}
              <Link href="/#pricing" className="underline font-semibold">See pricing →</Link>
            </div>
          )}
          {result.matches.map((m) => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link href={`/prompts/${m.id}`} className="font-semibold text-lg hover:underline">
                  {m.title}
                </Link>
                {m.confidence && <span className="badge badge-ai">{m.confidence}</span>}
              </div>
              {m.why && (
                <p className="text-sm text-[var(--color-ink)] mb-3">
                  <strong className="text-[var(--color-orange-dark)]">Why this fits:</strong> {m.why}
                </p>
              )}
              <div className="flex flex-wrap gap-1 mb-3">
                {m.ai_platforms.map((p) => <span key={p} className="badge badge-ai">{p}</span>)}
                {m.category && <span className="badge badge-target">{m.category}</span>}
              </div>
              {!result.gated && (
                <div className="relative">
                  <div className="absolute top-2 right-2">
                    <CopyButton text={m.body} />
                  </div>
                  <pre className="bg-[var(--color-ink)] text-[var(--color-cream)] p-4 rounded text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-48">
                    {m.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
