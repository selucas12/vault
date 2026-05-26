"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DraftGuideToggle({ draftCount }: { draftCount: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showDrafts = searchParams.get("drafts") === "1";

  function toggle() {
    const params = new URLSearchParams(searchParams.toString());
    if (showDrafts) {
      params.delete("drafts");
    } else {
      params.set("drafts", "1");
      params.delete("page");
    }
    const qs = params.toString();
    router.push(`/directory${qs ? `?${qs}` : ""}`);
  }

  if (draftCount === 0) return null;

  return (
    <button onClick={toggle} className="btn-ghost text-xs py-1.5 px-3 mt-4 w-full">
      {showDrafts
        ? "Hide draft entries"
        : `Show ${draftCount} more with draft install guides`}
    </button>
  );
}
