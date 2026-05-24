// Normalizes a source URL for dedup purposes: lowercase host, strip trailing
// slash, remove common tracking params, normalize github.com paths.
export function normalizeSourceUrl(url: string): string {
  try {
    const u = new URL(url);
    // lowercase the host
    u.hostname = u.hostname.toLowerCase();
    // remove common tracking params
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("ref");
    // strip trailing slash from pathname
    u.pathname = u.pathname.replace(/\/+$/, "") || "/";
    // remove .git suffix from GitHub repos
    u.pathname = u.pathname.replace(/\.git$/, "");
    // reconstruct without trailing slash
    let normalized = u.origin + u.pathname;
    const qs = u.searchParams.toString();
    if (qs) normalized += `?${qs}`;
    return normalized;
  } catch {
    // if it's not a valid URL, just lowercase and strip trailing slash
    return url.toLowerCase().replace(/\/+$/, "");
  }
}
