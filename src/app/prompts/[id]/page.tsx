import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSubscriptionState } from "@/lib/subscription";
import { CopyButton } from "@/components/CopyButton";
import type { Prompt } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  if (!supabase) return { title: "Prompt" };
  const { data } = await supabase
    .from("prompts")
    .select("title, body")
    .eq("id", id)
    .eq("hidden_from_directory", false)
    .maybeSingle();
  if (!data) return { title: "Prompt not found" };
  return {
    title: data.title,
    description: (data.body as string).slice(0, 160),
    alternates: { canonical: `/prompts/${id}` },
  };
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await getSupabaseServer();
  if (!supabase) return notFound();

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .eq("hidden_from_directory", false)
    .maybeSingle();

  if (error || !data) return notFound();
  const prompt = data as Prompt;
  const sub = await getSubscriptionState();
  const canView = sub.active || prompt.is_free;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <Link href="/prompts" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-orange-primary)] mb-4 inline-block">
        ← Back to Prompts
      </Link>

      <h1 className="text-3xl font-bold mb-4">{prompt.title}</h1>

      <div className="flex flex-wrap gap-1 mb-6">
        {prompt.ai_platforms.map((p) => (
          <span key={p} className="badge badge-ai">{p}</span>
        ))}
        {prompt.category && (
          <span className="badge badge-target">{prompt.category}</span>
        )}
        {prompt.tags.map((t) => (
          <span key={t} className="badge">{t}</span>
        ))}
        {prompt.is_free && (
          <span className="badge badge-verified">free preview</span>
        )}
      </div>

      {canView ? (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)]">Prompt</div>
            <CopyButton text={prompt.body} />
          </div>
          <pre className="bg-[var(--color-ink)] text-[var(--color-cream)] p-4 rounded text-sm font-mono overflow-x-auto whitespace-pre-wrap">
            {prompt.body}
          </pre>
        </div>
      ) : (
        <div className="card mb-6">
          <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-3">Prompt</div>
          <div className="bg-gray-100 p-4 rounded text-sm blur-sm select-none whitespace-pre-wrap line-clamp-6">
            {prompt.body}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-[var(--color-ink-muted)] mb-3">
              Subscribe to view the full prompt and copy it.
            </p>
            <Link href="/#pricing" className="btn-primary text-sm">
              Subscribe →
            </Link>
          </div>
        </div>
      )}

      <div className="text-xs text-[var(--color-ink-muted)]">
        Source:{" "}
        <a href={prompt.source_url} target="_blank" rel="noreferrer" className="underline hover:text-[var(--color-orange-primary)]">
          {prompt.source.replace(/-/g, " ")}
        </a>
      </div>
    </div>
  );
}
