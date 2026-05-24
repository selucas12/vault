"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { trackEvent } from "@/lib/analytics";

export function LoginForm() {
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setMessage(null);
    trackEvent("Login Started");
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setState("error");
      setMessage("Supabase isn't configured yet. Set the env vars and reload.");
      return;
    }
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://vault.cheesyboy.dev";
    const next = sp.get("next") ?? "/account";
    const intent = sp.get("intent");
    let callbackUrl = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
    if (intent) callbackUrl += `&intent=${encodeURIComponent(intent)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else {
      setState("sent");
    }
  }

  return (
    <>
      {state === "sent" ? (
        <div className="card border-green-300 bg-green-50">
          <div className="text-2xl mb-2">📬</div>
          <p className="font-semibold">Check your email</p>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            We sent a sign-in link to <strong>{email}</strong>. The link expires in 60 minutes.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="card space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            />
          </div>
          <button type="submit" disabled={state === "loading"} className="btn-primary w-full">
            {state === "loading" ? "Sending…" : "Email me a link"}
          </button>
          {state === "error" && message && (
            <p className="text-sm text-red-700">{message}</p>
          )}
        </form>
      )}
    </>
  );
}
