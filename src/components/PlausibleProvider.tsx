"use client";

import Script from "next/script";

const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;

export function PlausibleProvider() {
  if (!DOMAIN) return null;
  return (
    <Script
      defer
      data-domain={DOMAIN}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
