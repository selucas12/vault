import Link from "next/link";
import type { Metadata } from "next";
import { PromptCard } from "@/components/PromptCard";
import { PromptsFilterBar } from "@/components/PromptsFilterBar";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSubscriptionState } from "@/lib/subscription";
import type { Prompt } from "@/lib/types";

export const metadata: Metadata = {
  title: "Prompts",
  description:
    "Browse the curated library of AI prompts. Filter by platform, category, and use case. Copy-paste ready for Claude, GPT, Gemini, and more.",
  alternates: { canonical: "/prompts" },
};

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  ai?: string;
  cat?: string;
  page?: string;
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await getSupabaseServer();
  const sub = await getSubscriptionState();

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const aiFilters = (params.ai ?? "").split(",").filter(Boolean);
  const catFilters = (params.cat ?? "").split(",").filter(Boolean);
  const q = (params.q ?? "").trim();

  let prompts: Prompt[] = [];
  let total = 0;
  let error: string | null = null;

  if (!supabase) {
    error = "Supabase isn't configured yet.";
  } else {
    let query = supabase
      .from("prompts")
      .select("*", { count: "exact" })
      .eq("hidden_from_directory", false)
      .order("quality_score", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (aiFilters.length) query = query.overlaps("ai_platforms", aiFilters);
    if (catFilters.length) query = query.in("category", catFilters);
    if (q) {
      query = query.or(
        `title.ilike.%${q.replace(/[%_]/g, "")}%,body.ilike.%${q.replace(/[%_]/g, "")}%`,
      );
    }

    const { data, count, error: qErr } = await query;
    if (qErr) error = qErr.message;
    else {
      prompts = (data ?? []) as Prompt[];
      total = count ?? 0;
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prompts</h1>
        <p className="text-[var(--color-ink-muted)] text-sm">
          {total > 0
            ? `${total} curated prompts for Claude, GPT, Gemini, and more.`
            : "Curated prompts for AI platforms."}
        </p>
        <div className="flex gap-3 mt-4">
          <Link href="/prompts/search" className="btn-primary text-sm py-2 px-4">
            AI Prompt Search
          </Link>
          <Link href="/prompts/request" className="btn-ghost text-sm py-2 px-4">
            Build a Prompt
          </Link>
        </div>
      </header>

      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        <aside className="md:sticky md:top-20 md:self-start">
          <PromptsFilterBar />
        </aside>

        <section>
          {error && (
            <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm mb-6">
              <div className="font-semibold mb-1">Prompts are offline</div>
              <p>{error}</p>
            </div>
          )}

          {!error && prompts.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📝</div>
              <p className="font-semibold mb-1">No prompts match</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Try{" "}
                <Link href="/prompts" className="underline">
                  clearing filters
                </Link>.
              </p>
            </div>
          )}

          {prompts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {prompts.map((p) => (
                <PromptCard
                  key={p.id}
                  prompt={p}
                  blurred={!sub.active && !p.is_free}
                />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="flex items-center justify-between mt-8 text-sm">
              {page > 1 ? (
                <Link
                  href={`/prompts?${buildQs({ ...params, page: String(page - 1) })}`}
                  className="btn-ghost text-sm py-2 px-4"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-[var(--color-ink-muted)]">
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Link
                  href={`/prompts?${buildQs({ ...params, page: String(page + 1) })}`}
                  className="btn-ghost text-sm py-2 px-4"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}

function buildQs(p: SearchParams): string {
  const out = new URLSearchParams();
  if (p.q) out.set("q", p.q);
  if (p.ai) out.set("ai", p.ai);
  if (p.cat) out.set("cat", p.cat);
  if (p.page) out.set("page", p.page);
  return out.toString();
}
