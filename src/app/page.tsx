import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getLemonSqueezyEnv, getSiteUrl, getTallyFormId } from "@/lib/env";
import { getFlagshipEntry } from "@/lib/flagship";
import { JsonLd } from "@/components/JsonLd";
import { EmailCaptureCTA } from "@/components/EmailCaptureCTA";
import { CheckoutButton } from "@/components/CheckoutButton";
import { checkoutMonthly, checkoutAnnual } from "@/lib/actions/checkout";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const ls = getLemonSqueezyEnv();
  const checkoutReady = ls !== null;
  const flagship = await getFlagshipEntry();
  const flagshipHref = flagship ? `/code/${flagship.id}` : "/directory";
  const siteUrl = getSiteUrl().replace(/\/$/, "");
  const tallyFormId = getTallyFormId();

  return (
    <div>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Vault",
            url: siteUrl,
            logo: `${siteUrl}/icon.png`,
            email: "meow@cheesyboy.dev",
            sameAs: ["https://cheesyboy.dev", "https://github.com/selucas12/vault"],
            parentOrganization: { "@type": "Organization", name: "Cheesyboy", url: "https://cheesyboy.dev" },
          },
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Vault",
            url: siteUrl,
            potentialAction: {
              "@type": "SearchAction",
              target: `${siteUrl}/search?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/cheesy/cheesy%20image%20logo.png"
            alt="Cheesyboy"
            width={240}
            height={240}
            priority
          />
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
          Stop hunting for AI integrations and prompts.
        </h1>
        <p className="text-base sm:text-xl text-[var(--color-ink-muted)] max-w-2xl mx-auto mb-8">
          Curated, AI-searchable index of integrations and quality-scored prompts for{" "}
          <span className="text-[var(--color-orange-dark)] font-semibold">Claude, GPT, Gemini</span>{" "}
          and more. Hand-verified. Install in one line. Copy in one click.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/search" className="btn-primary">
            Try AI Search →
          </Link>
          <Link href="/directory" className="btn-ghost">
            Browse integrations
          </Link>
          <Link href="/prompts" className="btn-ghost">
            Browse prompts
          </Link>
        </div>
        <p className="text-xs text-[var(--color-ink-muted)] mt-6">
          $9.99/mo · $99/yr · cancel any time · 30-day guarantee
        </p>
      </section>

      {/* What is Vault */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">Why Vault?</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="card">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="font-semibold text-lg mb-1">Curated, not scraped</h3>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Every integration is verified before it ships. We check installs, review
              docs, and filter the noise so you don&apos;t have to.
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-lg mb-1">Prompts you can trust</h3>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Every prompt is quality-scored. We hide the slop, you see only the gems.
              Copy-paste ready, or build a custom prompt for your exact use case.
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-lg mb-1">AI search across both</h3>
            <p className="text-sm text-[var(--color-ink-muted)]">
              Type what you want, we find the integration or the prompt that matches.
              Our AI understands intent and explains why each result fits.
            </p>
          </div>
        </div>
      </section>

      {/* Flagship showcase — Cheesyboy is the lived-in example */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-6">
          <div className="text-xs uppercase tracking-wider text-[var(--color-orange-dark)] font-semibold mb-2">
            ★ Featured entry
          </div>
          <h2 className="text-2xl font-bold">The one we use ourselves</h2>
        </div>
        <Link href={flagshipHref} className="card block border-2 border-[var(--color-orange-primary)] hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">Cheesyboy</h3>
            <span className="badge badge-verified">✓ verified</span>
          </div>
          {flagship?.editor_note && (
            <p className="text-sm text-[var(--color-ink)] italic mb-3 border-l-2 border-[var(--color-orange-primary)] pl-3">
              &ldquo;{flagship.editor_note}&rdquo;
            </p>
          )}
          <p className="text-sm text-[var(--color-ink-muted)] mb-3">
            Control Claude Code from Telegram. Approve permission prompts from your phone,
            stay reachable away from your desk.
          </p>
          <div className="flex flex-wrap gap-1 mb-3">
            <span className="badge badge-ai">claude</span>
            <span className="badge badge-target">telegram</span>
          </div>
          <pre className="bg-[var(--color-ink)] text-[var(--color-cream)] p-3 rounded text-xs font-mono overflow-x-auto">
            bash &lt;(curl -fsSL https://cheesyboy.dev/install.sh)
          </pre>
          <div className="text-xs text-[var(--color-ink-muted)] mt-2 flex items-center justify-between">
            <span>★ {flagship?.stars ?? 0} · TypeScript · MIT</span>
            <span className="text-[var(--color-orange-dark)] font-semibold">View entry →</span>
          </div>
        </Link>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-2 text-center">Pricing</h2>
        <p className="text-center text-[var(--color-ink-muted)] mb-8">
          Cancel anytime. 30-day money-back guarantee.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="font-semibold text-lg">Monthly</h3>
            <div className="text-4xl font-bold my-3">
              $9.99 <span className="text-base font-normal text-[var(--color-ink-muted)]">/mo</span>
            </div>
            <ul className="text-sm text-[var(--color-ink-muted)] space-y-2 mb-6">
              <li>✓ Full directory of verified integrations</li>
              <li>✓ Full quality-scored prompts library</li>
              <li>✓ AI search across both</li>
              <li>✓ Save your shortlist (My List)</li>
              <li>✓ 10 custom prompt builds per month</li>
              <li>✓ Cancel anytime</li>
              <li>✓ <a href="/refund" className="underline">30-day refund</a></li>
            </ul>
            {checkoutReady ? (
              <CheckoutButton action={checkoutMonthly} label="Get Vault Monthly" plan="monthly" />
            ) : (
              <button disabled className="btn-primary w-full" title="Pricing locks once the LemonSqueezy product is created">
                Coming soon
              </button>
            )}
          </div>
          <div className="card border-2 border-[var(--color-orange-primary)] relative">
            <div className="absolute -top-3 right-3 badge badge-ai font-semibold">Best value — save 17%</div>
            <h3 className="font-semibold text-lg">Annual</h3>
            <div className="text-4xl font-bold my-3">
              $99 <span className="text-base font-normal text-[var(--color-ink-muted)]">/yr</span>
            </div>
            <ul className="text-sm text-[var(--color-ink-muted)] space-y-2 mb-6">
              <li>✓ Everything in Monthly</li>
              <li>✓ Two months free</li>
              <li>✓ <strong>Unlimited</strong> custom prompt builds</li>
              <li>✓ Early access to new features</li>
              <li>✓ Direct support — meow@cheesyboy.dev</li>
              <li>✓ Cancel anytime</li>
              <li>✓ <a href="/refund" className="underline">30-day refund</a></li>
            </ul>
            {checkoutReady ? (
              <CheckoutButton action={checkoutAnnual} label="Get Vault Annual" plan="annual" />
            ) : (
              <button disabled className="btn-primary w-full" title="Pricing locks once the LemonSqueezy product is created">
                Coming soon
              </button>
            )}
          </div>
        </div>
        {!checkoutReady && (
          <p className="text-xs text-[var(--color-ink-muted)] text-center mt-4">
            Pricing buttons activate as soon as the LemonSqueezy product is created.
          </p>
        )}
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <h2 className="text-2xl font-bold mb-3">No fluff. Just tools and prompts that actually work.</h2>
        <p className="text-[var(--color-ink-muted)] mb-6">
          Vault is built by the same indie shop behind{" "}
          <a href="https://cheesyboy.dev" className="text-[var(--color-orange-dark)] underline">Cheesyboy</a>.
          We use it ourselves. Daily.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/directory" className="btn-ghost">
            Browse integrations →
          </Link>
          <Link href="/prompts" className="btn-ghost">
            Browse prompts →
          </Link>
        </div>
      </section>

      {/* Email capture */}
      <section className="px-6 pb-16">
        <EmailCaptureCTA formId={tallyFormId} />
      </section>
    </div>
  );
}
