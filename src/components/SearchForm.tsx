"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

interface ResultMatch {
  id: string;
  title: string;
  description: string | null;
  ai_platforms: string[];
  delivery_targets: string[];
  install_command: string | null;
  github_url: string | null;
  stars: number;
  why?: string;
  install_summary?: string;
  confidence?: "high" | "medium" | "low";
}

type SearchResponse =
  | { ok: true; gated: boolean; matches: ResultMatch[]; reasoning?: string }
  | { ok: false; reason: string };

export function SearchForm() {
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
    trackEvent("Search Submitted", { query_length: query.trim().length });
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data: SearchResponse = await res.json();
      setResult(data);
      if (data.ok) {
        trackEvent("Search Completed", { result_count: data.matches.length });
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
        <label htmlFor="q" className="block text-sm font-semibold mb-2">
          Describe what you want in plain English
        </label>
        <textarea
          id="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={3}
          placeholder="I want Claude to message me on Slack when CI fails"
          className="w-full rounded border border-[var(--color-border)] bg-white p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-orange-primary)]"
        />
        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-[var(--color-ink-muted)]">
            Vault matches your request against the directory using AI reasoning.
          </p>
          <button type="submit" disabled={loading || !query.trim()} className="btn-primary">
            {loading ? "Matching…" : "Search →"}
          </button>
        </div>
      </form>

      {error && (
        <div className="card border-red-300 bg-red-50 text-red-900 text-sm mb-6">{error}</div>
      )}

      {result && !result.ok && (
        <ErrorPanel reason={result.reason} />
      )}

      {result && result.ok && result.matches.length === 0 && (
        <div className="card text-center py-10">
          <div className="text-3xl mb-2">🤔</div>
          <p className="font-semibold mb-1">No good matches yet</p>
          <p className="text-sm text-[var(--color-ink-muted)]">
            Try a less specific phrasing, or{" "}
            <Link href="/directory" className="underline">
              browse the directory
            </Link>
            .
          </p>
        </div>
      )}

      {result && result.ok && result.matches.length > 0 && (
        <div className="space-y-4">
          {result.gated && (
            <div className="card border-[var(--color-orange-primary)] bg-orange-50 text-sm">
              <strong>Preview mode.</strong> Subscribe to unlock the full ranked list with
              AI reasoning for each match.{" "}
              <Link href="/#pricing" className="underline font-semibold">
                See pricing →
              </Link>
            </div>
          )}
          {result.matches.map((m) => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Link href={`/code/${m.id}`} className="font-semibold text-lg hover:underline">
                  {m.title}
                </Link>
                {m.confidence && (
                  <span className="badge badge-ai">{m.confidence} match</span>
                )}
              </div>
              {m.why && (
                <p className="text-sm text-[var(--color-ink)] mb-3">
                  <strong className="text-[var(--color-orange-dark)]">Why this fits:</strong>{" "}
                  {m.why}
                </p>
              )}
              <p className="text-sm text-[var(--color-ink-muted)] mb-3">{m.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {m.ai_platforms.map((p) => (
                  <span key={p} className="badge badge-ai">
                    {p}
                  </span>
                ))}
                {m.delivery_targets.map((t) => (
                  <span key={t} className="badge badge-target">
                    {t}
                  </span>
                ))}
              </div>
              {m.install_summary && (
                <p className="text-xs text-[var(--color-ink-muted)] italic mb-2">
                  {m.install_summary}
                </p>
              )}
              {m.install_command && (
                <pre className="bg-[var(--color-ink)] text-[var(--color-cream)] p-3 rounded text-xs font-mono overflow-x-auto">
                  {m.install_command}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorPanel({ reason }: { reason: string }) {
  if (reason === "no-supabase" || reason === "no-openai" || reason === "no-anthropic") {
    return (
      <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
        <strong>Search is offline.</strong> Stephen still needs to wire up{" "}
        {reason === "no-supabase" ? "Supabase" : reason === "no-openai" ? "OpenAI" : "Anthropic"}.
      </div>
    );
  }
  return (
    <div className="card border-red-300 bg-red-50 text-red-900 text-sm">
      Search failed: {reason}
    </div>
  );
}
