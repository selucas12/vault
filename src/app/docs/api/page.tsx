import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API",
  description:
    "Vault is a UI, not an API. Considering changing that — email if you'd pay for it.",
  alternates: { canonical: "/docs/api" },
};

export default function ApiDocsPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose-vault">
      <Link
        href="/docs"
        className="text-sm text-[var(--color-ink-muted)] hover:underline"
      >
        &larr; Docs
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">API</h1>

      <p>
        Vault doesn&apos;t have a public API right now. The directory and search
        are UI-only.
      </p>

      <p>
        We&apos;re considering exposing an API for programmatic access to the
        directory &mdash; listing entries, searching by platform/target, and
        pulling install commands into CI pipelines or toolchains.
      </p>

      <p>
        If that&apos;s something you&apos;d use (and pay for), we want to hear
        from you. What you&apos;d build with it matters more than how many
        people ask.
      </p>

      <div className="card mt-8">
        <h2 className="font-semibold text-lg mb-2">
          Interested in an API?
        </h2>
        <p className="text-sm text-[var(--color-ink-muted)] mb-3">
          Tell us what you&apos;d build. One email is enough to move the
          needle.
        </p>
        <a
          href="mailto:meow@cheesyboy.dev?subject=Vault%20API%20interest"
          className="btn-primary text-sm"
        >
          Email us &rarr;
        </a>
      </div>
    </article>
  );
}
