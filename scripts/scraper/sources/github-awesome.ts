import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

// Awesome-lists known to contain Telegram / Slack / Discord / AI bot entries.
// Each is a {owner}/{repo} on GitHub.
const LISTS = [
  "erkcet/awesome-telegram-bots",
  "MoonWalker440/TeleBotList",
  "kalanakt/awesome-telegram",
  "ebertti/awesome-telegram",
  "DopplerHQ/awesome-bots",
  "enescingoz/awesome-n8n-templates",
  "reorx/awesome-chatgpt-api",
  "humanloop/awesome-chatgpt",
  "DenisIzmaylov/awesome-telegram-bots",
  "fendouai/Awesome-Chatbot",
  "JStumpp/awesome-chatbots",
];

// Match common awesome-list markdown link patterns. We catch:
//   - [Name](https://github.com/foo/bar) - description
//   - [Name](https://github.com/foo/bar) — description
//   - * [Name](url) description (no separator)
const LINK_RE =
  /[-*]\s*\[([^\]]{2,120})\]\((https?:\/\/[^)\s]+)\)\s*[-—–:]?\s*([^\n]{0,400})/g;

interface GithubRepoMeta {
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  topics?: string[];
  license?: { spdx_id?: string | null } | null;
  owner?: { login: string };
}

const githubThrottle = pThrottle({ limit: 1, interval: 1100 });

async function fetchReadme(repo: string): Promise<string | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    accept: "application/vnd.github.raw",
    "user-agent": "vault-scraper",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  for (const branch of ["main", "master"]) {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/README.md`;
    const res = await fetch(url, { headers });
    if (res.ok) return res.text();
  }
  return null;
}

async function fetchRepoMeta(repo: string): Promise<GithubRepoMeta | null> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "user-agent": "vault-scraper",
    "x-github-api-version": "2022-11-28",
  };
  if (token) headers.authorization = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers });
  if (!res.ok) return null;
  return (await res.json()) as GithubRepoMeta;
}

const throttledMeta = githubThrottle(fetchRepoMeta);

function parseLinks(markdown: string): { name: string; url: string; description: string }[] {
  const out: { name: string; url: string; description: string }[] = [];
  // Strip badge images and HTML comments to reduce false positives.
  const cleaned = markdown
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "");
  let m: RegExpExecArray | null;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(cleaned)) !== null) {
    const [, name, url, description] = m;
    if (!url || !name) continue;
    if (!url.includes("github.com/")) continue;
    if (url.includes("/blob/") || url.includes("/tree/") || url.includes("#")) continue;
    out.push({ name: name.trim(), url, description: description?.trim() ?? "" });
  }
  return out;
}

function ownerRepoFromUrl(url: string): string | null {
  const m = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
  if (!m) return null;
  return `${m[1]}/${m[2].replace(/\.git$/, "")}`;
}

export const githubAwesomeSource: SourceModule = {
  type: "github-awesome",
  name: "GitHub awesome-lists",
  maxEntries: 250,
  autoApprove: true,
  async run({ limit, logger }) {
    const results: RawEntry[] = [];
    const seen = new Set<string>();
    const perList = Math.ceil(limit / LISTS.length);

    for (const list of LISTS) {
      logger(`Fetching awesome-list ${list}…`);
      const md = await fetchReadme(list);
      if (!md) {
        logger(`  README not found for ${list}`);
        continue;
      }
      const links = parseLinks(md).slice(0, perList * 3); // overfetch; we filter
      logger(`  Parsed ${links.length} candidate links`);

      let kept = 0;
      for (const link of links) {
        if (kept >= perList) break;
        if (results.length >= limit) break;
        const repo = ownerRepoFromUrl(link.url);
        if (!repo) continue;
        if (seen.has(repo)) continue;
        seen.add(repo);

        const meta = await throttledMeta(repo);
        if (!meta) continue;
        const text = `${link.name} ${link.description} ${meta.description ?? ""}`;
        const topics = meta.topics ?? [];
        const ai_platforms = classifyAIPlatforms(text, topics);
        const delivery_targets = classifyDeliveryTargets(text, topics);
        if (ai_platforms.length === 0 || delivery_targets.length === 0) continue;

        results.push({
          source_url: `https://github.com/${repo}`,
          source_type: "github-awesome",
          title: link.name || meta.full_name,
          description: link.description || meta.description || null,
          ai_platforms,
          delivery_targets,
          install_command: null,
          language: meta.language ?? null,
          github_url: `https://github.com/${repo}`,
          stars: meta.stargazers_count ?? 0,
          license: meta.license?.spdx_id ?? null,
          author: meta.owner?.login ?? repo.split("/")[0] ?? null,
          category: list.split("/")[1] ?? null,
        });
        kept++;
      }
      logger(`  Kept ${kept} from ${list} (running total ${results.length})`);
      if (results.length >= limit) break;
    }

    return results.slice(0, limit);
  },
};
