import { SearchForm } from "@/components/SearchForm";
import { getSubscriptionState } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Search",
  description:
    "Describe what you want in plain English. Vault's AI matches your request to the right integration with reasoning and an install command.",
  alternates: { canonical: "/search" },
};

export default async function SearchPage() {
  const sub = await getSubscriptionState();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AI Search</h1>
        <p className="text-[var(--color-ink-muted)]">
          Describe what you want. Vault matches it to the right integration with reasoning.
        </p>
      </header>

      {!sub.active && (
        <div className="card border-[var(--color-orange-light)] bg-orange-50 text-sm mb-6">
          <strong>You&apos;re in preview mode.</strong> Free tier returns one teaser result. Subscribe for
          full ranked matches with AI reasoning.{" "}
          <Link href="/#pricing" className="underline font-semibold">
            Subscribe →
          </Link>
        </div>
      )}

      <SearchForm />
    </div>
  );
}
