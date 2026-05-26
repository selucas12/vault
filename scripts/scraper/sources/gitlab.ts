import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

const QUERIES = [
  "chatgpt telegram bot",
  "chatgpt discord bot",
  "chatgpt slack bot",
  "chatgpt whatsapp",
  "claude telegram",
  "claude discord",
  "openai telegram bot",
  "openai discord bot",
  "openai slack bot",
  "gemini telegram bot",
  "gemini discord bot",
  "ai telegram bot",
  "ai discord bot",
  "llm telegram",
  "llm discord",
];

interface GitLabProject {
  id: number;
  path_with_namespace: string;
  web_url: string;
  description: string | null;
  star_count: number;
  forks_count: number;
  topics: string[];
  archived: boolean;
  last_activity_at: string;
}

const throttle = pThrottle({ limit: 2, interval: 1100 });

async function searchGitLab(q: string, perPage: number): Promise<GitLabProject[]> {
  const url = `https://gitlab.com/api/v4/projects?search=${encodeURIComponent(q)}&per_page=${perPage}&order_by=star_count&sort=desc&archived=false`;
  const res = await fetch(url, {
    headers: { "user-agent": "vault-scraper" },
  });
  if (!res.ok) return [];
  return (await res.json()) as GitLabProject[];
}

const throttledSearch = throttle(searchGitLab);

export const gitlabSource: SourceModule = {
  type: "gitlab",
  name: "GitLab search",
  maxEntries: 100,
  autoApprove: false,
  async run({ limit, logger }) {
    const out: RawEntry[] = [];
    const seen = new Set<string>();

    for (const q of QUERIES) {
      if (out.length >= limit) break;
      logger(`GitLab search: ${q}`);
      const hits = await throttledSearch(q, 20);
      logger(`  ${hits.length} results`);
      for (const hit of hits) {
        if (out.length >= limit) break;
        if (seen.has(hit.path_with_namespace)) continue;
        seen.add(hit.path_with_namespace);
        if (hit.archived) continue;

        const text = `${hit.path_with_namespace} ${hit.description ?? ""}`;
        const topics = hit.topics ?? [];
        const ai = classifyAIPlatforms(text, topics);
        const target = classifyDeliveryTargets(text, topics);
        if (ai.length === 0 || target.length === 0) continue;

        out.push({
          source_url: hit.web_url,
          source_type: "gitlab",
          title: hit.path_with_namespace.split("/").pop() ?? hit.path_with_namespace,
          description: hit.description,
          ai_platforms: ai,
          delivery_targets: target,
          install_command: null,
          language: null,
          github_url: null,
          stars: hit.star_count,
          license: null,
          author: hit.path_with_namespace.split("/")[0] ?? null,
          category: null,
        });
      }
    }
    return out.slice(0, limit);
  },
};
