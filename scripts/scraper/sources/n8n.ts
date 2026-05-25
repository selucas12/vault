import pThrottle from "p-throttle";
import { classifyAIPlatforms, classifyDeliveryTargets } from "../classify";
import type { RawEntry, SourceModule } from "../types";

// n8n public template API. No auth required.
// List: GET https://api.n8n.io/api/templates/workflows?page=N&rows=100
// Detail: GET https://api.n8n.io/api/templates/workflows/{id}
//
// Each workflow has a `nodes` array where `nodes[].type` names the integration
// (e.g. "n8n-nodes-base.openAi", "n8n-nodes-base.telegramTrigger").

const BASE = "https://api.n8n.io/api/templates/workflows";
const ROWS_PER_PAGE = 100;

const SPAM_RE = /\b(buy|cheap|promo|spam|free money|free trial|earn|passive income)\b/i;

// Map n8n node types to our platform/target vocabulary.
const AI_NODE_MAP: Record<string, string> = {
  openai: "gpt",
  openAi: "gpt",
  anthropic: "claude",
  "google-gemini": "gemini",
  gemini: "gemini",
  groq: "groq",
  ollama: "llama",
  mistral: "mistral",
  deepseek: "deepseek",
  perplexity: "perplexity",
};
const TARGET_NODE_MAP: Record<string, string> = {
  telegram: "telegram",
  telegramTrigger: "telegram",
  slack: "slack",
  slackTrigger: "slack",
  discord: "discord",
  discordTrigger: "discord",
  whatsapp: "whatsapp",
  whatsApp: "whatsapp",
  microsoftTeams: "teams",
};

interface N8nWorkflowSummary {
  id: number;
  name: string;
  description?: string;
  totalViews?: number;
  user?: { username?: string };
  createdAt?: string;
}

interface N8nNode {
  type: string;
  typeVersion?: number;
}

interface N8nWorkflowDetail {
  id: number;
  name: string;
  description?: string;
  nodes: N8nNode[];
  user?: { username?: string };
  totalViews?: number;
}

const throttle = pThrottle({ limit: 1, interval: 1100 });

async function fetchPage(page: number): Promise<N8nWorkflowSummary[]> {
  const url = `${BASE}?page=${page}&rows=${ROWS_PER_PAGE}`;
  const res = await fetch(url, { headers: { "user-agent": "vault-scraper" } });
  if (!res.ok) return [];
  const data = (await res.json()) as { workflows?: N8nWorkflowSummary[] };
  return data?.workflows ?? [];
}

async function fetchDetail(id: number): Promise<N8nWorkflowDetail | null> {
  const url = `${BASE}/${id}`;
  const res = await fetch(url, { headers: { "user-agent": "vault-scraper" } });
  if (!res.ok) return null;
  const data = (await res.json()) as { workflow?: N8nWorkflowDetail };
  return data?.workflow ?? null;
}

const throttledPage = throttle(fetchPage);
const throttledDetail = throttle(fetchDetail);

function classifyNodes(
  nodes: N8nNode[],
): { aiPlatforms: string[]; deliveryTargets: string[] } {
  const ai = new Set<string>();
  const target = new Set<string>();
  for (const node of nodes) {
    // node.type looks like "n8n-nodes-base.openAi" or "@n8n/n8n-nodes-langchain.lmChatAnthropic"
    const typeName = node.type.split(".").pop()?.toLowerCase() ?? "";
    for (const [key, val] of Object.entries(AI_NODE_MAP)) {
      if (typeName.includes(key.toLowerCase())) ai.add(val);
    }
    for (const [key, val] of Object.entries(TARGET_NODE_MAP)) {
      if (typeName.includes(key.toLowerCase())) target.add(val);
    }
  }
  return {
    aiPlatforms: Array.from(ai) as string[],
    deliveryTargets: Array.from(target) as string[],
  };
}

export const n8nSource: SourceModule = {
  type: "n8n",
  name: "n8n.io templates",
  maxEntries: 200,
  autoApprove: true,
  async run({ limit, logger }) {
    const results: RawEntry[] = [];
    let page = 1;

    outer: while (results.length < limit) {
      logger(`Fetching page ${page}…`);
      const summaries = await throttledPage(page);
      if (summaries.length === 0) break;

      for (const s of summaries) {
        if (results.length >= limit) break outer;
        // Quick pre-filter on summary text
        const text = `${s.name} ${s.description ?? ""}`;
        if (SPAM_RE.test(text)) continue;

        // Fetch detail to get nodes for classification
        const detail = await throttledDetail(s.id);
        if (!detail) continue;
        if (detail.nodes.length < 3) continue;

        const { aiPlatforms, deliveryTargets } = classifyNodes(detail.nodes);
        // Also check text-based classification as a fallback
        const textAi = classifyAIPlatforms(text);
        const textTarget = classifyDeliveryTargets(text);
        const allAi = Array.from(new Set([...aiPlatforms, ...textAi]));
        const allTarget = Array.from(new Set([...deliveryTargets, ...textTarget]));

        if (allAi.length === 0 || allTarget.length === 0) continue;

        results.push({
          source_url: `https://n8n.io/workflows/${s.id}`,
          source_type: "n8n",
          title: s.name,
          description: s.description ?? null,
          ai_platforms: allAi as RawEntry["ai_platforms"],
          delivery_targets: allTarget as RawEntry["delivery_targets"],
          install_command: null,
          language: "n8n-workflow",
          github_url: null,
          stars: s.totalViews ?? 0,
          license: null,
          author: s.user?.username ?? null,
          category: "n8n-template",
        });
      }
      page++;
    }

    logger(`Kept ${results.length} from n8n`);
    return results.slice(0, limit);
  },
};
