import Link from "next/link";
import type { Code } from "@/lib/types";

export function CodeCard({ code, highlight, variant = "default", showGuideStatus = false }: { code: Code; highlight?: string; variant?: "default" | "featured"; showGuideStatus?: boolean }) {
  const verified = code.last_verified_status === "working";
  const cardClasses =
    variant === "featured"
      ? "card block border-2 border-[var(--color-orange-primary)]"
      : "card block";
  return (
    <Link href={`/code/${code.id}`} className={cardClasses}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          {variant === "featured" && (
            <span className="badge badge-ai shrink-0">★ featured</span>
          )}
          <h3 className="font-semibold text-base leading-snug">{code.title}</h3>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {showGuideStatus && code.install_guide_status && code.install_guide_status !== "missing" && (
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
              code.install_guide_status === "verified"
                ? "bg-green-100 text-green-700"
                : code.install_guide_status === "broken"
                  ? "bg-red-100 text-red-700"
                  : "bg-orange-100 text-orange-700"
            }`}>
              {code.install_guide_status === "verified" ? "✓ guide" : code.install_guide_status === "broken" ? "⚠️ guide" : "draft guide"}
            </span>
          )}
          {verified ? (
            <span className="badge badge-verified shrink-0">✓ verified</span>
          ) : (
            <span className="badge badge-unverified shrink-0">unverified</span>
          )}
        </div>
      </div>
      {highlight && (
        <p className="text-xs text-[var(--color-orange-dark)] italic mb-2">{highlight}</p>
      )}
      {variant === "featured" && code.editor_note && (
        <p className="text-sm text-[var(--color-ink)] italic mb-3 border-l-2 border-[var(--color-orange-primary)] pl-3">
          &ldquo;{code.editor_note}&rdquo;
        </p>
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
