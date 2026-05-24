import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

// Hugging Face Spaces search. Public API, no token needed for low-volume use.
const QUERIES = ["telegram chatbot", "slack chatbot", "discord chatbot", "whatsapp bot"];

interface HFSpace {
  id: string; // "owner/space-name"
  author: string;
  likes?: number;
  sdk?: string;
  tags?: string[];
  description?: string;
}

const throttle = pThrottle({ limit: 1, interval: 1100 });

async function search(q: string): Promise<HFSpace[]> {
  const url = `https://huggingface.co/api/spaces?search=${encodeURIComponent(q)}&sort=likes&direction=-1&limit=10`;
  const res = await fetch(url, { headers: { "user-agent": "vault-scraper" } });
  if (!res.ok) return [];
  return (await res.json()) as HFSpace[];
}

const throttledSearch = throttle(search);

export const huggingfaceSource: SourceModule = {
  type: "huggingface",
  name: "Hugging Face Spaces",
  maxEntries: 20,
  autoApprove: false,
  async run({ limit, logger }) {
    const out: RawEntry[] = [];
    const seen = new Set<string>();
    for (const q of QUERIES) {
      if (out.length >= limit) break;
      logger(`HF search: ${q}`);
      const spaces = await throttledSearch(q);
      logger(`  ${spaces.length} spaces`);
      for (const s of spaces) {
        if (out.length >= limit) break;
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        const text = `${s.id} ${s.description ?? ""}`;
        const ai = classifyAIPlatforms(text, s.tags ?? []);
        const target = classifyDeliveryTargets(text, s.tags ?? []);
        if (ai.length === 0 || target.length === 0) continue;
        out.push({
          source_url: `https://huggingface.co/spaces/${s.id}`,
          source_type: "huggingface",
          title: s.id.split("/").pop() ?? s.id,
          description: s.description ?? null,
          ai_platforms: ai,
          delivery_targets: target,
          install_command: null,
          language: s.sdk ?? null,
          github_url: null,
          stars: s.likes ?? 0,
          license: null,
          author: s.author,
          category: "huggingface-space",
        });
      }
    }
    return out.slice(0, limit);
  },
};
