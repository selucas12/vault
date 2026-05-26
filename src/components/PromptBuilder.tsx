"use client";

import { useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/CopyButton";
import { AI_PLATFORMS } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

export function PromptBuilder({ isSubscribed }: { isSubscribed: boolean }) {
  const [description, setDescription] = useState("");
  const [platform, setPlatform] = useState("");
  const [format, setFormat] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/prompts-build", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ description, platform: platform || undefined, format: format || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data.prompt);
        trackEvent("Prompt Built");
      } else {
        if (data.reason === "subscription-required") {
          setError("This feature requires a Pro subscription.");
        } else if (data.reason === "logged-out") {
          setError("Please log in first.");
        } else {
          setError(data.reason || "Failed to generate prompt.");
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!isSubscribed) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="font-semibold text-lg mb-2">Pro feature</h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-4">
          Custom prompt building is available for Pro subscribers.
        </p>
        <Link href="/#pricing" className="btn-primary">Subscribe →</Link>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="card mb-8">
        <div className="space-y-4">
          <div>
            <label htmlFor="desc" className="block text-sm font-semibold mb-2">
              What do you want the AI to do?
            </label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Review my Python code for security vulnerabilities, suggest fixes, and explain each issue..."
              className="w-full rounded border border-[var(--color-border)] bg-white p-3 text-sm resize-none focus:outline-none focus:border-[var(--color-orange-primary)]"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="platform" className="block text-sm font-semibold mb-2">
                Target platform (optional)
              </label>
              <select
                id="platform"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              >
                <option value="">Any platform</option>
                {AI_PLATFORMS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="format" className="block text-sm font-semibold mb-2">
                Output format (optional)
              </label>
              <input
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                placeholder="e.g. JSON, markdown table, bullet points"
                className="w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-[var(--color-ink-muted)]">
            Claude generates a ready-to-use prompt tailored to your needs.
          </p>
          <button type="submit" disabled={loading || !description.trim()} className="btn-primary">
            {loading ? "Building..." : "Build Prompt →"}
          </button>
        </div>
      </form>

      {error && (
        <div className="card border-red-300 bg-red-50 text-red-900 text-sm mb-6">{error}</div>
      )}

      {result && (
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your custom prompt</h3>
            <CopyButton text={result} />
          </div>
          <pre className="bg-[var(--color-ink)] text-[var(--color-cream)] p-4 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
