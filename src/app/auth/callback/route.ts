import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";
// Note: trackEvent is client-side only. Login Completed is tracked on the
// /account page load (client component) rather than here in the route handler.

// Magic-link redirect target. Supabase sends a `code` we exchange for a session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";
  const intent = url.searchParams.get("intent");

  if (!code) {
    return NextResponse.redirect(`${getSiteUrl()}/login`);
  }

  const supabase = await getSupabaseServer();
  if (!supabase) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=no-supabase`);
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=${encodeURIComponent(error.message)}`);
  }

  let redirectUrl = `${getSiteUrl()}${next}`;
  if (intent) redirectUrl += `${next.includes("?") ? "&" : "?"}intent=${encodeURIComponent(intent)}`;
  return NextResponse.redirect(redirectUrl);
}
