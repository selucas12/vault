import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Vault handles your data — what we collect, what we don't, and your rights.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose-vault">
      <h1 className="text-3xl font-bold mb-2">Privacy policy</h1>
      <p className="text-sm text-[var(--color-ink-muted)] mb-8">Last updated: May 24, 2026</p>

      <Section title="What we collect">
        <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
          <li><strong>Email address</strong> — for authentication (magic-link login) and subscription management.</li>
          <li><strong>Payment information</strong> — handled entirely by LemonSqueezy. We never see or store your card number.</li>
          <li><strong>Search queries</strong> — sent to our AI ranking pipeline. Anonymized after 30 days. Used only to improve search quality.</li>
          <li><strong>Usage data</strong> — page views via Plausible Analytics (cookie-free, GDPR-compliant). No personally identifiable information.</li>
        </ul>
      </Section>

      <Section title="What we don't collect">
        <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
          <li>We don&apos;t store your search history beyond 30-day debugging logs.</li>
          <li>We don&apos;t sell, rent, or share your data with anyone for marketing.</li>
          <li>We don&apos;t use tracking cookies. Our analytics are privacy-first.</li>
          <li>We don&apos;t use Google Analytics, Hotjar, or session-replay tools.</li>
        </ul>
      </Section>

      <Section title="Third parties">
        <p>We use the following services to operate Vault:</p>
        <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
          <li><strong>Supabase</strong> — authentication and database hosting (EU/US regions).</li>
          <li><strong>LemonSqueezy</strong> — subscription billing and payment processing.</li>
          <li><strong>OpenAI</strong> — generates text embeddings for semantic search. Your queries are sent to their API and subject to their <a href="https://openai.com/policies/privacy-policy" className="underline" target="_blank" rel="noreferrer">privacy policy</a>.</li>
          <li><strong>Anthropic</strong> — ranks search results. Your queries are sent to their API and subject to their <a href="https://www.anthropic.com/privacy" className="underline" target="_blank" rel="noreferrer">privacy policy</a>.</li>
          <li><strong>Vercel</strong> — website hosting.</li>
          <li><strong>Plausible Analytics</strong> — privacy-friendly, cookie-free analytics.</li>
        </ul>
      </Section>

      <Section title="Cookies">
        <p>Vault uses only essential cookies for authentication sessions (Supabase auth tokens). We don&apos;t use advertising cookies, social media trackers, or any non-essential cookies.</p>
      </Section>

      <Section title="Data retention">
        <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
          <li><strong>Account data</strong> (email, subscription) — retained until you delete your account.</li>
          <li><strong>Search logs</strong> — anonymized and deleted after 30 days.</li>
          <li><strong>Embeddings</strong> (directory entries, not your data) — retained indefinitely.</li>
          <li><strong>Saved entries</strong> — retained until you remove them or delete your account.</li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>Regardless of where you live, you can:</p>
        <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
          <li><strong>Access</strong> — request a copy of all data we hold about you.</li>
          <li><strong>Delete</strong> — request deletion of your account and all associated data.</li>
          <li><strong>Export</strong> — request a machine-readable export of your data.</li>
          <li><strong>Correct</strong> — update your email address from your account page.</li>
        </ul>
        <p>For EU/EEA residents: these rights are provided under the GDPR. For California residents: these rights are provided under the CCPA.</p>
      </Section>

      <Section title="Contact">
        <p>
          For any privacy questions or data requests, email{" "}
          <a href="mailto:meow@cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">
            meow@cheesyboy.dev
          </a>. We&apos;ll respond within 7 business days.
        </p>
      </Section>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-2 text-[var(--color-ink)]">{children}</div>
    </section>
  );
}
