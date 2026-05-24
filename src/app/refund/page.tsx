import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund policy",
  description: "Vault offers a 30-day, no-questions-asked refund on your initial subscription payment.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <article className="max-w-3xl mx-auto px-6 py-12 prose-vault">
      <h1 className="text-3xl font-bold mb-6">Refund policy</h1>

      <p>
        Vault is a subscription service ($9.99/mo or $99/yr). If you&apos;re unsatisfied within
        30 days of your initial subscription, we&apos;ll refund you in full — no questions, no hassle.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">How to request a refund</h2>
      <p>
        Email{" "}
        <a href="mailto:meow@cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">
          meow@cheesyboy.dev
        </a>{" "}
        within 30 days of your first payment. Include the email address you subscribed with.
        Refunds typically process within 3 business days.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">What&apos;s eligible</h2>
      <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
        <li>Initial subscription payment (first month or first year)</li>
        <li>Both monthly and annual plans</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">What&apos;s not eligible</h2>
      <ul className="list-disc ml-6 space-y-1 text-[var(--color-ink-muted)]">
        <li>Renewals after the initial 30-day window</li>
        <li>Refunds requested after your 30-day window has passed</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Cancellation</h2>
      <p>
        You can cancel anytime from your{" "}
        <a href="/account" className="text-[var(--color-orange-dark)] underline">account page</a>.
        Cancellations stop future renewals but don&apos;t trigger a refund of the current period
        (unless within 30 days of your initial subscription).
      </p>

      <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
        Questions? Email{" "}
        <a href="mailto:meow@cheesyboy.dev" className="underline">meow@cheesyboy.dev</a>.
      </p>
    </article>
  );
}
