import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Why Vault",
  description:
    "Why we built Vault — a founder note on the problem, who it's for, and what it isn't.",
  alternates: { canonical: "/docs/why-vault" },
};

export default function WhyVaultPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose-vault">
      <Link
        href="/docs"
        className="text-sm text-[var(--color-ink-muted)] hover:underline"
      >
        &larr; Docs
      </Link>
      <h1 className="text-3xl font-bold mt-4 mb-6">Why Vault</h1>

      <p>
        I built Vault because I kept solving the same problem: &ldquo;I want
        Claude to talk to me on Telegram&rdquo; or &ldquo;Is there a Slack bot
        for Gemini that actually works?&rdquo; Every time, it was 45 minutes of
        sifting through GitHub search results, awesome-lists, and Reddit threads
        before finding something that may or may not still install.
      </p>

      <p>
        Vault is the directory I wanted to exist. Every entry is scraped from
        real sources (awesome-lists, GitHub topics, Hugging Face, n8n, Pipedream,
        Make), classified by AI platform and delivery target, and embedded so you
        can search in plain English instead of guessing keywords.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Who it&apos;s for</h2>

      <p>
        Developers and tinkerers who want to connect an AI model to a chat
        platform and don&apos;t want to waste an afternoon finding the right
        tool. If you&apos;ve ever searched &ldquo;claude telegram bot
        github&rdquo; and scrolled past three archived repos before finding a
        working one, Vault saves you that time.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        What it isn&apos;t
      </h2>

      <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
        <li>
          <strong>Not a hosting platform.</strong> We index and link to tools.
          You install them on your own infrastructure.
        </li>
        <li>
          <strong>Not a review site.</strong> We verify that tools install and
          classify what they do, but we don&apos;t rank them by quality or write
          long-form reviews.
        </li>
        <li>
          <strong>Not an API.</strong> Vault is a UI. We&apos;re considering
          changing that &mdash;{" "}
          <a
            href="mailto:meow@cheesyboy.dev"
            className="text-[var(--color-orange-dark)] underline"
          >
            email if you&apos;d pay for the API
          </a>
          .
        </li>
      </ul>

      <p className="mt-8">
        Vault is built by the same indie shop behind{" "}
        <a
          href="https://cheesyboy.dev"
          className="text-[var(--color-orange-dark)] underline"
        >
          Cheesyboy
        </a>
        . We use it ourselves. Daily.
      </p>

      <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
        &mdash; Stephen,{" "}
        <a
          href="mailto:meow@cheesyboy.dev"
          className="underline"
        >
          meow@cheesyboy.dev
        </a>
      </p>
    </article>
  );
}
