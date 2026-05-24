import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/env";

// Magic-link redirect target. Supabase sends a `code` we exchange for a session.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";

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

  return NextResponse.redirect(`${getSiteUrl()}${next}`);
}
