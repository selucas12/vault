"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const supabase = getSupabaseBrowser();
        if (!supabase) return;
        setLoading(true);
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="btn-ghost text-sm"
      disabled={loading}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
