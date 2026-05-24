import Link from "next/link";
import type { Code } from "@/lib/types";

export function CodeCard({ code, highlight }: { code: Code; highlight?: string }) {
  const verified = code.last_verified_status === "working";
  return (
    <Link href={`/code/${code.id}`} className="card block">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-semibold text-base leading-snug">{code.title}</h3>
        {verified ? (
          <span className="badge badge-verified shrink-0">✓ verified</span>
        ) : (
          <span className="badge badge-unverified shrink-0">unverified</span>
        )}
      </div>
      {highlight && (
        <p className="text-xs text-[var(--color-orange-dark)] italic mb-2">{highlight}</p>
      )}
      <p className="text-sm text-[var(--color-ink-muted)] mb-3 line-clamp-2">
        {code.description ?? "—"}
      </p>
      <div className="flex flex-wrap gap-1 mb-2">
        {code.ai_platforms.map((p) => (
          <span key={p} className="badge badge-ai">
            {p}
          </span>
        ))}
        {code.delivery_targets.map((t) => (
          <span key={t} className="badge badge-target">
            {t}
          </span>
        ))}
      </div>
      <div className="text-xs text-[var(--color-ink-muted)]">
        ★ {code.stars}
        {code.language ? ` · ${code.language}` : ""}
        {code.license ? ` · ${code.license}` : ""}
      </div>
    </Link>
  );
}
