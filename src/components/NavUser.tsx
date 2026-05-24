"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export function NavUser() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }: { data: { session: unknown } }) => {
      setLoggedIn(!!data.session);
    });
  }, []);

  if (!loggedIn) return null;
  return (
    <Link href="/my-list" className="hover:text-[var(--color-orange-primary)]">
      My List
    </Link>
  );
}
