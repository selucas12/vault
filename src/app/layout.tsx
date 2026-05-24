import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { getSiteUrl } from "@/lib/env";

const SITE_URL = getSiteUrl().replace(/\/$/, "");
const SITE_NAME = "Vault";
const DEFAULT_DESCRIPTION =
  "A curated, AI-searchable directory of tools that connect Claude, GPT, Gemini, and other AI to Telegram, Slack, Discord, WhatsApp, and iMessage. By the makers of Cheesyboy.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vault — the curated index of AI ↔ chat-platform integrations",
    template: "%s · Vault",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Cheesyboy", url: "https://cheesyboy.dev" }],
  keywords: [
    "AI integrations",
    "Claude bot",
    "ChatGPT Telegram bot",
    "Slack AI",
    "Discord AI",
    "Gemini bot",
    "AI directory",
    "chatbot index",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Vault — the curated index of AI ↔ chat-platform integrations",
    description: DEFAULT_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vault — curated AI ↔ chat-platform integrations",
    description: DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--color-border)] bg-[var(--color-cream)]/80 backdrop-blur sticky top-0 z-10">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
              <span className="text-2xl">🗝️</span>
              <span>Vault</span>
              <span className="text-xs font-normal text-[var(--color-ink-muted)] hidden sm:inline">
                by Cheesyboy
              </span>
            </Link>
            <div className="flex items-center gap-4 text-sm">
              <Link href="/directory" className="hover:text-[var(--color-orange-primary)]">
                Directory
              </Link>
              <Link href="/search" className="hover:text-[var(--color-orange-primary)]">
                AI Search
              </Link>
              <Link href="/account" className="hover:text-[var(--color-orange-primary)]">
                Account
              </Link>
              <Link href="/#pricing" className="btn-primary text-sm py-2 px-4">
                Subscribe
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-[var(--color-border)] mt-16">
          <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-[var(--color-ink-muted)]">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div>
                <div className="font-semibold text-[var(--color-ink)] mb-1">Vault</div>
                <div>
                  A{" "}
                  <a href="https://cheesyboy.dev" className="underline hover:text-[var(--color-orange-primary)]">
                    Cheesyboy
                  </a>{" "}
                  product.
                </div>
                <a href="mailto:meow@cheesyboy.dev" className="hover:text-[var(--color-orange-primary)]">
                  meow@cheesyboy.dev
                </a>
              </div>
              <div className="flex gap-8">
                <div className="space-y-1">
                  <div className="font-semibold text-[var(--color-ink)] text-xs uppercase tracking-wider">Product</div>
                  <Link href="/directory" className="block hover:text-[var(--color-orange-primary)]">Directory</Link>
                  <Link href="/search" className="block hover:text-[var(--color-orange-primary)]">AI Search</Link>
                  <a href="https://github.com/selucas12/vault" className="block hover:text-[var(--color-orange-primary)]">GitHub</a>
                </div>
                <div className="space-y-1">
                  <div className="font-semibold text-[var(--color-ink)] text-xs uppercase tracking-wider">Legal</div>
                  <Link href="/refund" className="block hover:text-[var(--color-orange-primary)]">Refund</Link>
                  <Link href="/terms" className="block hover:text-[var(--color-orange-primary)]">Terms</Link>
                  <Link href="/privacy" className="block hover:text-[var(--color-orange-primary)]">Privacy</Link>
                  <Link href="/help" className="block hover:text-[var(--color-orange-primary)]">Help</Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
