import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CodeCard } from "@/components/CodeCard";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Code } from "@/lib/types";

export const metadata: Metadata = {
  title: "My List",
  description: "Your saved integrations.",
  robots: { index: false, follow: false },
};

export default async function MyListPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
          Supabase isn&apos;t configured yet.
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-list");

  const { data: savedRows } = await supabase
    .from("saved_codes")
    .select("code_id, saved_at")
    .eq("user_id", user.id)
    .order("saved_at", { ascending: false });

  const codeIds = (savedRows ?? []).map((r) => r.code_id as string);
  let codes: Code[] = [];
  if (codeIds.length > 0) {
    const { data } = await supabase
      .from("codes")
      .select("*")
      .in("id", codeIds)
      .eq("approved", true);
    const codesMap = new Map((data ?? []).map((c) => [c.id, c as Code]));
    codes = codeIds.map((id) => codesMap.get(id)).filter((c): c is Code => c != null);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Your saved integrations{codes.length > 0 ? ` (${codes.length})` : ""}
        </h1>
      </header>

      {codes.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">📌</div>
          <p className="font-semibold mb-1">You haven&apos;t saved anything yet</p>
          <p className="text-sm text-[var(--color-ink-muted)] mb-4">
            Browse the directory and save the integrations you want to try.
          </p>
          <Link href="/directory" className="btn-ghost text-sm">
            Browse the directory →
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {codes.map((c) => (
            <CodeCard key={c.id} code={c} />
          ))}
        </div>
      )}
    </div>
  );
}
