import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Help",
  description: "Frequently asked questions about Vault — getting started, subscriptions, integrations, and your account.",
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2">Help</h1>
      <p className="text-[var(--color-ink-muted)] mb-8">
        Can&apos;t find what you need? Email{" "}
        <a href="mailto:meow@cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">
          meow@cheesyboy.dev
        </a>
        .
      </p>

      <Section title="Getting started">
        <FAQ q="What is Vault?">
          Vault is a curated, AI-searchable directory of tools that connect AI models (Claude, GPT,
          Gemini, Groq, and others) to chat platforms (Telegram, Slack, Discord, WhatsApp, iMessage).
          We scrape, classify, and verify integrations so you don&apos;t have to hunt GitHub.
        </FAQ>
        <FAQ q="How does AI Search work?">
          Describe what you want in plain English — for example, &ldquo;a Slack bot that uses GPT to
          summarize threads.&rdquo; We embed your query, search the directory using vector similarity,
          then rank the best matches with an AI model that explains why each fits.
        </FAQ>
        <FAQ q="Do I need to subscribe to browse the directory?">
          No. Browsing the directory and viewing individual entries is free for everyone. AI Search
          returns a one-result teaser for free users. Subscribers get the full ranked list with
          reasoning and install commands.
        </FAQ>
      </Section>

      <Section title="Subscriptions">
        <FAQ q="What's included?">
          Full directory access, AI-assisted search with ranked results and reasoning, daily updates
          as new integrations are discovered, and the ability to save entries to your personal list.
        </FAQ>
        <FAQ q="Can I cancel anytime?">
          Yes. Cancel from your <Link href="/account" className="text-[var(--color-orange-dark)] underline">account page</Link>.
          Cancellations stop future renewals but your access continues until the end of the current
          billing period.
        </FAQ>
        <FAQ q="Is there a refund policy?">
          Yes — 30-day, no-questions-asked on your initial subscription. See our{" "}
          <Link href="/refund" className="text-[var(--color-orange-dark)] underline">refund policy</Link>.
        </FAQ>
        <FAQ q="Can I switch between monthly and annual?">
          Email us at{" "}
          <a href="mailto:meow@cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">
            meow@cheesyboy.dev
          </a>{" "}
          and we&apos;ll handle the switch manually. We&apos;re working on self-service plan switching.
        </FAQ>
      </Section>

      <Section title="Using integrations">
        <FAQ q="How do I install an integration?">
          Each entry page has a copy-paste install command. Copy it, open your terminal (or
          follow the setup instructions for your platform), and paste. Some integrations are
          Docker containers, some are npm packages, some are Python scripts — the install command
          reflects what the author intended.
        </FAQ>
        <FAQ q="What if an integration doesn't work?">
          Hit the &ldquo;Found something off?&rdquo; link at the bottom of any entry page to email us.
          We&apos;ll investigate and update the entry&apos;s verification status.
        </FAQ>
        <FAQ q="Can I submit a new integration?">
          Not yet through a public form, but we&apos;d love to hear about it. Email{" "}
          <a href="mailto:meow@cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">
            meow@cheesyboy.dev
          </a>{" "}
          with a link to the repo or project and we&apos;ll review it for inclusion.
        </FAQ>
      </Section>

      <Section title="Account">
        <FAQ q="I'm not getting magic-link emails">
          Check your spam/junk folder first. Magic links come from Supabase (noreply@mail.app.supabase.io).
          If it&apos;s not there, try again or email us and we&apos;ll investigate.
        </FAQ>
        <FAQ q="How do I delete my account?">
          Email{" "}
          <a href="mailto:meow@cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">
            meow@cheesyboy.dev
          </a>{" "}
          from the email address on your account. We&apos;ll delete your account and all associated data
          within 7 business days.
        </FAQ>
      </Section>

      <Section title="Privacy">
        <FAQ q="Do you store my data?">
          Minimal data — email for auth, subscription status, and saved entries. Search queries are
          anonymized after 30 days. Full details in our{" "}
          <Link href="/privacy" className="text-[var(--color-orange-dark)] underline">privacy policy</Link>.
        </FAQ>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-[var(--color-orange-dark)]">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function FAQ({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="card group">
      <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
        <span>{q}</span>
        <span className="text-[var(--color-ink-muted)] group-open:rotate-45 transition-transform text-lg">+</span>
      </summary>
      <div className="mt-3 text-sm text-[var(--color-ink-muted)] leading-relaxed">{children}</div>
    </details>
  );
}
