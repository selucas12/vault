import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

// Pipedream public workflows API.
// Attempt: https://api.pipedream.com/v1/workflows (public, no auth, paginated).
// If 401/403: fall back to HTML scrape of https://pipedream.com/apps (too complex),
// skip gracefully, and log as deferred.
//
// Alternative scrape target: /apps endpoint which lists integrations rather than
// workflows — we can search for apps that bridge AI + chat.

const API_BASE = "https://api.pipedream.com/v1";

const throttle = pThrottle({ limit: 1, interval: 1100 });

interface PipedreamWorkflow {
  id: string;
  name?: string;
  description?: string;
  public?: boolean;
  owner_id?: string;
}

interface PipedreamResponse {
  data: PipedreamWorkflow[];
  page_info?: { end_cursor?: string; has_next_page?: boolean };
}

async function tryPublicApi(
  limit: number,
  logger: (msg: string) => void,
): Promise<RawEntry[] | null> {
  // Probe the public endpoint.
  const probeUrl = `${API_BASE}/workflows?limit=10`;
  const probeRes = await fetch(probeUrl, {
    headers: { "user-agent": "vault-scraper" },
  });
  if (!probeRes.ok) {
    logger(`Pipedream API returned ${probeRes.status} — endpoint requires auth.`);
    return null;
  }

  const out: RawEntry[] = [];
  let cursor: string | undefined;
  let page = 0;

  while (out.length < limit) {
    const url = cursor
      ? `${API_BASE}/workflows?limit=50&after=${cursor}`
      : `${API_BASE}/workflows?limit=50`;
    const res = await fetch(url, {
      headers: { "user-agent": "vault-scraper" },
    });
    if (!res.ok) break;

    const data = (await res.json()) as PipedreamResponse;
    if (!data.data || data.data.length === 0) break;

    for (const w of data.data) {
      if (out.length >= limit) break;
      const text = `${w.name ?? ""} ${w.description ?? ""}`;
      const ai = classifyAIPlatforms(text);
      const target = classifyDeliveryTargets(text);
      if (ai.length === 0 || target.length === 0) continue;
      out.push({
        source_url: `https://pipedream.com/workflows/${w.id}`,
        source_type: "pipedream",
        title: w.name ?? w.id,
        description: w.description ?? null,
        ai_platforms: ai,
        delivery_targets: target,
        install_command: null,
        language: "pipedream-workflow",
        github_url: null,
        stars: 0,
        license: null,
        author: w.owner_id ?? null,
        category: "pipedream-workflow",
      });
    }

    cursor = data.page_info?.end_cursor;
    if (!data.page_info?.has_next_page) break;
    page++;
    logger(`  Page ${page}, running total ${out.length}`);
    await new Promise((r) => setTimeout(r, 1100));
  }
  return out;
}

export const pipedreamSource: SourceModule = {
  type: "pipedream",
  name: "Pipedream workflows",
  maxEntries: 100,
  autoApprove: false,
  async run({ limit, logger }) {
    logger("Probing Pipedream public API…");
    const apiResult = await tryPublicApi(limit, logger);
    if (apiResult !== null) {
      logger(`Pipedream API succeeded — ${apiResult.length} entries`);
      return apiResult.slice(0, limit);
    }
    // API is gated — we log and return empty.
    // Future: Cheerio HTML scrape of pipedream.com/apps or /workflows.
    // Deferred because Pipedream's SPA renders client-side, making static
    // HTML scraping unreliable.
    logger("Pipedream API gated behind auth. Skipping. See deferred list.");
    return [];
  },
};
