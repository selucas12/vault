import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSubscriptionState } from "@/lib/subscription";
import { getLemonSqueezyEnv } from "@/lib/env";
import { SignOutButton } from "@/components/SignOutButton";

export const metadata: Metadata = {
  title: "Account",
  description: "Manage your Vault subscription.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await getSupabaseServer();
  if (!supabase) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="card border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
          Supabase isn&apos;t configured yet. Set the env vars and reload.
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const state = await getSubscriptionState();
  const ls = getLemonSqueezyEnv();

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Account</h1>

      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">Email</div>
        <div className="font-mono text-sm">{user.email}</div>
      </section>

      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-1">Subscription</div>
        {state.active ? (
          <>
            <div className="font-semibold text-lg text-green-700 mb-1">
              ✓ Active — {state.subscriber?.plan ?? "subscriber"}
            </div>
            {state.subscriber?.current_period_end && (
              <div className="text-sm text-[var(--color-ink-muted)]">
                Renews on {new Date(state.subscriber.current_period_end).toLocaleDateString()}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="font-semibold text-lg mb-1">No active subscription</div>
            <p className="text-sm text-[var(--color-ink-muted)] mb-3">
              You&apos;re on the free preview tier. AI search returns one teaser result.
            </p>
            {ls ? (
              <div className="flex gap-2 flex-wrap">
                <a href={ls.monthly} className="btn-primary text-sm">
                  $9.99/mo
                </a>
                <a href={ls.annual} className="btn-ghost text-sm">
                  $99/yr (save 17%)
                </a>
              </div>
            ) : (
              <Link href="/#pricing" className="btn-primary text-sm">
                See pricing
              </Link>
            )}
          </>
        )}
      </section>

      <section className="card mb-4">
        <div className="text-xs uppercase tracking-wider text-[var(--color-ink-muted)] mb-2">Manage</div>
        <div className="flex flex-wrap gap-2">
          {state.subscriber?.ls_customer_id && (
            <a
              href={`https://cheesyboy.lemonsqueezy.com/billing`}
              className="btn-ghost text-sm"
              target="_blank"
              rel="noreferrer"
            >
              Manage billing
            </a>
          )}
          <SignOutButton />
        </div>
      </section>

      <p className="text-xs text-[var(--color-ink-muted)] text-center mt-8">
        Questions? <a href="mailto:meow@cheesyboy.dev" className="underline">meow@cheesyboy.dev</a>
      </p>
    </div>
  );
}
