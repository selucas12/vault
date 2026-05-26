import type { Metadata } from "next";
import { PromptBuilder } from "@/components/PromptBuilder";
import { getSubscriptionState } from "@/lib/subscription";

export const metadata: Metadata = {
  title: "Build a Prompt",
  description:
    "Tell us what you need the AI to do and we'll build a production-ready prompt for you. Pro subscribers only.",
  alternates: { canonical: "/prompts/request" },
};

export default async function PromptRequestPage() {
  const sub = await getSubscriptionState();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Build a Prompt</h1>
        <p className="text-[var(--color-ink-muted)]">
          Describe what you want the AI to do. We&apos;ll generate a tailored, ready-to-use prompt.
        </p>
      </header>

      <PromptBuilder isSubscribed={sub.active} />
    </div>
  );
}
