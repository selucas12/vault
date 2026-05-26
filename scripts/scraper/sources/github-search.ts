import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

const QUERIES = [
  "claude telegram bot",
  "claude discord bot",
  "claude slack bot",
  "claude whatsapp bot",
  "chatgpt telegram bot",
  "chatgpt discord bot",
  "chatgpt slack bot",
  "chatgpt whatsapp bot",
  "gemini telegram bot",
  "gemini discord bot",
  "gemini slack bot",
  "openai telegram bot",
  "openai discord bot",
  "openai slack bot",
  "openai whatsapp bot",
  "llama telegram bot",
  "llama discord bot",
  "mistral telegram bot",
  "deepseek telegram bot",
  "ai telegram bot",
  "ai discord bot",
  "ai slack bot",
  "ai whatsapp bot",
  "llm telegram",
  "llm discord",
  "llm slack",
  "gpt teams bot",
  "ai teams bot",
  "groq telegram",
  "groq discord",
];

interface SearchHit {
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics: string[];
  license: { spdx_id?: string | null } | null;
  owner: { login: string };
  html_url: string;
  archived: boolean;
  updated_at: string;
}

interface SearchResponse {
  items: SearchHit[];
}

const throttle = pThrottle({ limit: 1, interval: 2200 });

async function search(q: string, perPage: number): Promise<SearchHit[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "vault-scraper",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=${perPage}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as SearchResponse;
  return data.items ?? [];
}

const throttledSearch = throttle(search);

export const githubSearchSource: SourceModule = {
  type: "github-search",
  name: "GitHub broad search",
  maxEntries: 300,
  autoApprove: false,
  async run({ limit, logger }) {
    const out: RawEntry[] = [];
    const seen = new Set<string>();

    for (const q of QUERIES) {
      if (out.length >= limit) break;
      logger(`Searching: ${q}`);
      const hits = await throttledSearch(q, 30);
      logger(`  ${hits.length} hits`);
      for (const hit of hits) {
        if (out.length >= limit) break;
        if (seen.has(hit.full_name)) continue;
        seen.add(hit.full_name);
        if (hit.archived) continue;
        const text = `${hit.full_name} ${hit.description ?? ""}`;
        const ai = classifyAIPlatforms(text, hit.topics);
        const target = classifyDeliveryTargets(text, hit.topics);
        if (ai.length === 0 || target.length === 0) continue;
        out.push({
          source_url: hit.html_url,
          source_type: "github-search",
          title: hit.full_name.split("/").pop() ?? hit.full_name,
          description: hit.description,
          ai_platforms: ai,
          delivery_targets: target,
          install_command: null,
          language: hit.language ?? null,
          github_url: hit.html_url,
          stars: hit.stargazers_count,
          license: hit.license?.spdx_id ?? null,
          author: hit.owner.login,
          category: null,
        });
      }
    }
    return out.slice(0, limit);
  },
};
