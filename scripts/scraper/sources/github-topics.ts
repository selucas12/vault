import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

// Topic-based search queries. Each yields repos tagged with these topics
// and matching the AI vocabulary in description/topics.
const QUERIES = [
  "topic:chatbot-telegram",
  "topic:telegram-bot openai",
  "topic:telegram-bot claude",
  "topic:telegram-bot gemini",
  "topic:telegram-bot groq",
  "topic:telegram-bot llama",
  "topic:telegram-bot mistral",
  "topic:telegram-bot deepseek",
  "topic:slack-bot openai",
  "topic:slack-bot claude",
  "topic:slack-bot gemini",
  "topic:slack-bot llm",
  "topic:discord-bot openai",
  "topic:discord-bot claude",
  "topic:discord-bot gemini",
  "topic:discord-bot llm",
  "topic:whatsapp-bot openai",
  "topic:whatsapp-bot claude",
  "topic:whatsapp-bot chatgpt",
  "topic:teams-bot openai",
  "topic:teams-bot chatgpt",
  "topic:imessage openai",
  "topic:chatgpt-bot telegram",
  "topic:chatgpt-bot discord",
  "topic:chatgpt-bot slack",
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
}

interface SearchResponse {
  items: SearchHit[];
}

const throttle = pThrottle({ limit: 1, interval: 1100 });

async function search(q: string): Promise<SearchHit[]> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "vault-scraper",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=30`;
  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = (await res.json()) as SearchResponse;
  return data.items ?? [];
}

const throttledSearch = throttle(search);

export const githubTopicsSource: SourceModule = {
  type: "github-topic",
  name: "GitHub topic search",
  maxEntries: 150,
  autoApprove: false,
  async run({ limit, logger }) {
    const out: RawEntry[] = [];
    const seen = new Set<string>();

    for (const q of QUERIES) {
      if (out.length >= limit) break;
      logger(`Searching: ${q}`);
      const hits = await throttledSearch(q);
      logger(`  ${hits.length} hits`);
      for (const hit of hits) {
        if (out.length >= limit) break;
        if (seen.has(hit.full_name)) continue;
        seen.add(hit.full_name);
        const text = `${hit.full_name} ${hit.description ?? ""}`;
        const ai = classifyAIPlatforms(text, hit.topics);
        const target = classifyDeliveryTargets(text, hit.topics);
        if (ai.length === 0 || target.length === 0) continue;
        out.push({
          source_url: hit.html_url,
          source_type: "github-topic",
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
