"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/directory", label: "Directory" },
  { href: "/search", label: "AI Search" },
  { href: "/account", label: "Account" },
  { href: "/help", label: "Help" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="md:hidden p-2 -mr-2"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? (
            <>
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>
      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[var(--color-cream)] border-b border-[var(--color-border)] shadow-lg z-20">
          <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`text-sm py-2 ${pathname === l.href ? "text-[var(--color-orange-primary)] font-semibold" : "hover:text-[var(--color-orange-primary)]"}`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/#pricing"
              onClick={() => setOpen(false)}
              className="btn-primary text-sm py-2 px-4 text-center"
            >
              Subscribe
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
