// Plausible custom event tracking. Safe to call server-side (no-op) or
// client-side when the script hasn't loaded or is blocked.

declare global {
  interface Window {
    plausible?: (event: string, opts?: { props?: Record<string, string | number> }) => void;
  }
}

export function trackEvent(event: string, props?: Record<string, string | number>) {
  if (typeof window !== "undefined") {
    window.plausible?.(event, props ? { props } : undefined);
  }
}
