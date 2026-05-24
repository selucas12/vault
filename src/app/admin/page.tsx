import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminFilterBar } from "@/components/AdminFilterBar";
import { AdminQueueClient } from "@/components/AdminQueueClient";
import { getSupabaseServer, getSupabaseService } from "@/lib/supabase/server";
import { getAdminEmail } from "@/lib/env";
import type { Code } from "@/lib/types";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

interface SearchParams {
  source?: string;
  ai?: string;
  page?: string;
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
          Supabase isn&apos;t configured yet. Set the env vars and reload.
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const adminEmail = getAdminEmail();
  if (user.email !== adminEmail) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-2">Not authorized</h1>
        <p className="text-sm text-[var(--color-ink-muted)] mb-4">
          /admin is restricted to {adminEmail}. You&apos;re signed in as {user.email}.
        </p>
        <Link href="/" className="btn-ghost text-sm">
          ← Back home
        </Link>
      </div>
    );
  }

  // Service-role client needed because RLS would otherwise hide approved=false rows.
  const service = getSupabaseService();
  if (!service) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
          SUPABASE_SERVICE_ROLE_KEY isn&apos;t set — the moderation queue needs it to
          read pending entries.
        </div>
      </div>
    );
  }

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sourceFilter = params.source ?? null;
  const aiFilters = (params.ai ?? "").split(",").filter(Boolean);

  let query = service
    .from("codes")
    .select("*", { count: "exact" })
    .eq("approved", false)
    .order("added_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (sourceFilter) query = query.eq("source_type", sourceFilter);
  if (aiFilters.length) query = query.overlaps("ai_platforms", aiFilters);

  const { data, count, error } = await query;
  const codes = (data ?? []) as Code[];
  const total = count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">
            Admin <span className="text-[var(--color-ink-muted)]">·</span>{" "}
            <span className="text-[var(--color-orange-dark)]">
              {total} pending
            </span>
          </h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Signed in as {user.email}. Approve to publish, reject to delete.
          </p>
        </div>
        <Link href="/" className="text-sm hover:underline">
          ← Back to site
        </Link>
      </header>

      {error && (
        <div className="card border-red-300 bg-red-50 text-red-900 text-sm mb-6">
          {error.message}
        </div>
      )}

      <div className="grid md:grid-cols-[260px_1fr] gap-8">
        <aside className="md:sticky md:top-20 md:self-start">
          <AdminFilterBar />
        </aside>

        <section>
          <AdminQueueClient codes={codes} />

          {pageCount > 1 && (
            <nav className="flex items-center justify-between mt-8 text-sm">
              {page > 1 ? (
                <Link
                  href={`/admin?${buildQs({ ...params, page: String(page - 1) })}`}
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
                  href={`/admin?${buildQs({ ...params, page: String(page + 1) })}`}
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
  if (p.source) out.set("source", p.source);
  if (p.ai) out.set("ai", p.ai);
  if (p.page) out.set("page", p.page);
  return out.toString();
}
