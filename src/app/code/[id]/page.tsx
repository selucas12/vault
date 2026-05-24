import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyButton } from "@/components/CopyButton";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Code } from "@/lib/types";

export default async function CodeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const { data, error } = await supabase
    .from("codes")
    .select("*")
    .eq("id", id)
    .eq("approved", true)
    .maybeSingle();

  if (error || !data) notFound();
  const code = data as Code;

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/directory" className="text-sm text-[var(--color-ink-muted)] hover:underline">
        ← Back to directory
      </Link>
      <header className="mt-4 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            {code.featured && (
              <span className="badge badge-ai shrink-0">★ featured</span>
            )}
            <h1 className="text-3xl font-bold">{code.title}</h1>
          </div>
          {code.last_verified_status === "working" ? (
            <span className="badge badge-verified shrink-0">✓ verified working</span>
          ) : code.last_verified_status === "broken" ? (
            <span className="badge badge-unverified shrink-0">⚠ reported broken</span>
          ) : (
            <span className="badge badge-unverified shrink-0">unverified</span>
          )}
        </div>
        {code.editor_note && (
          <div className="mt-4 card bg-orange-50 border-[var(--color-orange-light)]">
            <div className="text-xs uppercase tracking-wider text-[var(--color-orange-dark)] font-semibold mb-1">
              Why we picked it
            </div>
            <p className="text-sm text-[var(--color-ink)] italic">
              &ldquo;{code.editor_note}&rdquo;
            </p>
          </div>
        )}
        <p className="text-[var(--color-ink-muted)] mt-3">{code.description}</p>
      </header>

      <div className="flex flex-wrap gap-1 mb-6">
        {code.ai_platforms.map((p) => (
          <span key={p} className="badge badge-ai">
            {p}
          </span>
        ))}
        {code.delivery_targets.map((t) => (
          <span key={t} className="badge badge-target">
            {t}
          </span>
        ))}
        {code.category && <span className="badge">{code.category}</span>}
      </div>

      {code.install_command && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Install</h2>
            <CopyButton text={code.install_command} />
          </div>
          <pre className="bg-[var(--color-ink)] text-[var(--color-cream)] p-4 rounded text-sm font-mono overflow-x-auto">
            {code.install_command}
          </pre>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-3 text-sm mb-8">
        {code.github_url && (
          <Field label="GitHub">
            <a
              href={code.github_url}
              className="text-[var(--color-orange-dark)] underline break-all"
              target="_blank"
              rel="noreferrer"
            >
              {code.github_url}
            </a>
          </Field>
        )}
        {code.language && <Field label="Language">{code.language}</Field>}
        {code.license && <Field label="License">{code.license}</Field>}
        {code.author && <Field label="Author">{code.author}</Field>}
        <Field label="Stars">★ {code.stars}</Field>
        <Field label="Source">{code.source_type}</Field>
        {code.last_verified_at && (
          <Field label="Last verified">{new Date(code.last_verified_at).toLocaleDateString()}</Field>
        )}
        <Field label="Added">{new Date(code.added_at).toLocaleDateString()}</Field>
      </section>

      <section className="card bg-[var(--color-cream)]">
        <div className="text-sm">
          <strong>Found something off?</strong> Email{" "}
          <a href="mailto:meow@cheesyboy.dev" className="underline">
            meow@cheesyboy.dev
          </a>{" "}
          and we&apos;ll update the entry.
        </div>
      </section>
    </article>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
