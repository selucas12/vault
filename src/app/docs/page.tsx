import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Docs",
  description: "Vault documentation — why it exists, API plans, and changelog.",
  alternates: { canonical: "/docs" },
};

const PAGES = [
  {
    href: "/docs/why-vault",
    title: "Why Vault",
    description: "The problem, who it's for, and what it isn't.",
  },
  {
    href: "/docs/api",
    title: "API",
    description: "No public API yet. Tell us if you'd use one.",
  },
  {
    href: "/docs/changelog",
    title: "Changelog",
    description: "What's new in each release.",
  },
];

export default function DocsIndexPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Docs</h1>
      <p className="text-[var(--color-ink-muted)] mb-8">
        Everything about Vault that isn&apos;t on the main site.
      </p>

      <div className="space-y-3">
        {PAGES.map((page) => (
          <Link key={page.href} href={page.href} className="card block">
            <h2 className="font-semibold text-lg mb-1">{page.title}</h2>
            <p className="text-sm text-[var(--color-ink-muted)]">
              {page.description}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
        Questions?{" "}
        <a
          href="mailto:meow@cheesyboy.dev"
          className="underline"
        >
          meow@cheesyboy.dev
        </a>
      </p>
    </div>
  );
}
