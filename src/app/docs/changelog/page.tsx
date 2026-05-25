import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What's new in Vault — release notes and updates.",
  alternates: { canonical: "/docs/changelog" },
};

export default function ChangelogPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose-vault">
      <Link
        href="/docs"
        className="text-sm text-[var(--color-ink-muted)] hover:underline"
      >
        &larr; Docs
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Changelog</h1>

      <Entry date="May 25, 2026" title="Launch">
        <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
          <li>
            <strong>Directory</strong> &mdash; 105+ curated AI-to-chat-platform
            integrations across 8 AI platforms and 6 delivery targets.
          </li>
          <li>
            <strong>AI Search</strong> &mdash; Describe what you want in plain
            English. Vault embeds your query, matches it against the directory
            with vector similarity, then re-ranks with Claude and explains why
            each result fits.
          </li>
          <li>
            <strong>Sources</strong> &mdash; Daily scraping from GitHub
            awesome-lists, GitHub topics, Hugging Face, n8n, Pipedream, and
            Make.
          </li>
          <li>
            <strong>Subscriptions</strong> &mdash; $9.99/mo or $99/yr via
            LemonSqueezy. Free tier returns a one-result teaser. Subscribers
            get full ranked matches with reasoning and install commands.
          </li>
          <li>
            <strong>Saved list</strong> &mdash; Bookmark integrations to your
            personal list.
          </li>
          <li>
            <strong>Verified entries</strong> &mdash; Some entries are
            install-verified and marked as &ldquo;verified working.&rdquo;
          </li>
        </ul>
      </Entry>
    </article>
  );
}

function Entry({
  date,
  title,
  children,
}: {
  date: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-sm font-mono text-[var(--color-ink-muted)]">
          {date}
        </span>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="space-y-2 text-[var(--color-ink)]">{children}</div>
    </section>
  );
}
