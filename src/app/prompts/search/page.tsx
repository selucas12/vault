import { PromptSearchForm } from "@/components/PromptSearchForm";
import { getSubscriptionState } from "@/lib/subscription";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Prompt Search",
  description:
    "Describe the prompt you need in plain English. Vault's AI finds the best match from our curated library.",
  alternates: { canonical: "/prompts/search" },
};

export default async function PromptSearchPage() {
  const sub = await getSubscriptionState();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">AI Prompt Search</h1>
        <p className="text-[var(--color-ink-muted)]">
          Describe what you need. Vault matches it to the best prompt in our library.
        </p>
      </header>

      {!sub.active && (
        <div className="card border-[var(--color-orange-light)] bg-orange-50 text-sm mb-6">
          <strong>Preview mode.</strong> Free tier returns one teaser result. Subscribe for
          full ranked matches with prompt text.{" "}
          <Link href="/#pricing" className="underline font-semibold">Subscribe →</Link>
        </div>
      )}

      <PromptSearchForm />
    </div>
  );
}
