import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

const QUERIES = [
  "keywords:telegram keywords:openai",
  "keywords:telegram keywords:chatgpt",
  "keywords:telegram keywords:claude",
  "keywords:telegram keywords:gemini",
  "keywords:telegram keywords:llm",
  "keywords:discord keywords:openai",
  "keywords:discord keywords:chatgpt",
  "keywords:discord keywords:claude",
  "keywords:discord keywords:ai bot",
  "keywords:slack keywords:openai",
  "keywords:slack keywords:chatgpt",
  "keywords:slack keywords:claude",
  "keywords:slack keywords:ai",
  "keywords:whatsapp keywords:openai",
  "keywords:whatsapp keywords:chatgpt",
  "keywords:whatsapp keywords:ai",
  "keywords:teams keywords:openai",
  "keywords:teams keywords:chatgpt",
];

interface NpmHit {
  package: {
    name: string;
    description?: string;
    keywords?: string[];
    links: {
      npm: string;
      homepage?: string;
      repository?: string;
    };
    publisher?: { username: string };
  };
  score: {
    detail: {
      popularity: number;
      quality: number;
      maintenance: number;
    };
  };
}

interface NpmSearchResponse {
  objects: NpmHit[];
  total: number;
}

const throttle = pThrottle({ limit: 2, interval: 1000 });

async function searchNpm(q: string, size: number): Promise<NpmHit[]> {
  const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=${size}`;
  const res = await fetch(url, {
    headers: { "user-agent": "vault-scraper" },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as NpmSearchResponse;
  return data.objects ?? [];
}

const throttledSearch = throttle(searchNpm);

function extractGithubUrl(repoUrl: string | undefined): string | null {
  if (!repoUrl) return null;
  const m = repoUrl.match(/github\.com\/([^/]+\/[^/?#]+)/);
  if (m) return `https://github.com/${m[1].replace(/\.git$/, "")}`;
  return null;
}

export const npmRegistrySource: SourceModule = {
  type: "npm",
  name: "npm registry",
  maxEntries: 200,
  autoApprove: false,
  async run({ limit, logger }) {
    const out: RawEntry[] = [];
    const seen = new Set<string>();

    for (const q of QUERIES) {
      if (out.length >= limit) break;
      logger(`npm search: ${q}`);
      const hits = await throttledSearch(q, 25);
      logger(`  ${hits.length} results`);
      for (const hit of hits) {
        if (out.length >= limit) break;
        const pkg = hit.package;
        if (seen.has(pkg.name)) continue;
        seen.add(pkg.name);

        const text = `${pkg.name} ${pkg.description ?? ""} ${(pkg.keywords ?? []).join(" ")}`;
        const ai = classifyAIPlatforms(text, pkg.keywords ?? []);
        const target = classifyDeliveryTargets(text, pkg.keywords ?? []);
        if (ai.length === 0 || target.length === 0) continue;

        const githubUrl = extractGithubUrl(pkg.links.repository);
        const sourceUrl = githubUrl ?? pkg.links.npm;

        out.push({
          source_url: sourceUrl,
          source_type: "npm",
          title: pkg.name,
          description: pkg.description ?? null,
          ai_platforms: ai,
          delivery_targets: target,
          install_command: `npm install ${pkg.name}`,
          language: "TypeScript",
          github_url: githubUrl,
          stars: 0,
          license: null,
          author: pkg.publisher?.username ?? null,
          category: null,
        });
      }
    }
    return out.slice(0, limit);
  },
};
