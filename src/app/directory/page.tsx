import Link from "next/link";
import { CodeCard } from "@/components/CodeCard";
import { FilterBar } from "@/components/FilterBar";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Code } from "@/lib/types";

const PAGE_SIZE = 20;

interface SearchParams {
  q?: string;
  ai?: string;
  target?: string;
  page?: string;
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await getSupabaseServer();

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const aiFilters = (params.ai ?? "").split(",").filter(Boolean);
  const targetFilters = (params.target ?? "").split(",").filter(Boolean);
  const q = (params.q ?? "").trim();

  let codes: Code[] = [];
  let total = 0;
  let error: string | null = null;

  if (!supabase) {
    error =
      "Supabase isn't configured yet — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to load the directory.";
  } else {
    let query = supabase
      .from("codes")
      .select("*", { count: "exact" })
      .eq("approved", true)
      .order("stars", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (aiFilters.length) query = query.overlaps("ai_platforms", aiFilters);
    if (targetFilters.length) query = query.overlaps("delivery_targets", targetFilters);
    if (q) {
      // ilike on title or description
      query = query.or(
        `title.ilike.%${q.replace(/[%_]/g, "")}%,description.ilike.%${q.replace(/[%_]/g, "")}%`,
      );
    }

    const { data, count, error: qErr } = await query;
    if (qErr) error = qErr.message;
    else {
      codes = (data ?? []) as Code[];
      total = count ?? 0;
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Directory</h1>
        <p className="text-[var(--color-ink-muted)] text-sm">
          {total > 0
            ? `${total} curated integrations across the AI-platform / chat-app matrix.`
            : "Curated integrations across the AI-platform / chat-app matrix."}
        </p>
      </header>

      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        <aside className="md:sticky md:top-20 md:self-start">
          <FilterBar />
        </aside>

        <section>
          {error && (
            <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm mb-6">
              <div className="font-semibold mb-1">Directory is offline</div>
              <p>{error}</p>
            </div>
          )}

          {!error && codes.length === 0 && (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">🪺</div>
              <p className="font-semibold mb-1">No entries yet</p>
              <p className="text-sm text-[var(--color-ink-muted)]">
                Either no entries match your filters, or the scraper hasn&apos;t run yet.
                <br />
                Try{" "}
                <Link href="/directory" className="underline">
                  clearing filters
                </Link>{" "}
                or come back tomorrow — the scraper runs daily.
              </p>
            </div>
          )}

          {codes.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {codes.map((c) => (
                <CodeCard key={c.id} code={c} />
              ))}
            </div>
          )}

          {pageCount > 1 && (
            <nav className="flex items-center justify-between mt-8 text-sm">
              {page > 1 ? (
                <Link
                  href={`/directory?${buildQs({ ...params, page: String(page - 1) })}`}
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
                  href={`/directory?${buildQs({ ...params, page: String(page + 1) })}`}
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
  if (p.target) out.set("target", p.target);
  if (p.page) out.set("page", p.page);
  return out.toString();
}
