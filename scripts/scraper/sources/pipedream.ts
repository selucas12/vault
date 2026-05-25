import type { RawEntry, SourceModule } from "../types";

// Pipedream GraphQL API (public, no auth).
// Query: POST https://api.pipedream.com/graphql
//   { apps { id name nameSlug description } }
//
// Strategy: fetch all apps, classify AI vs delivery-target apps,
// generate cross-product integration-pair entries with real URLs:
//   https://pipedream.com/apps/{ai-slug}/integrations/{target-slug}

const GQL_URL = "https://api.pipedream.com/graphql";

interface PipedreamApp {
  id: string;
  name: string;
  nameSlug: string;
  description: string;
}

const AI_SLUG_MAP: Record<string, string> = {
  openai: "gpt",
  anthropic: "claude",
  azure_openai_service: "gpt",
  google_gemini: "gemini",
  gemini_public: "gemini",
  groqcloud: "groq",
  mistral_ai: "mistral",
  deepseek: "deepseek",
  perplexity: "perplexity",
  cohere_platform: "cohere",
  hugging_face: "huggingface",
};

const TARGET_SLUG_MAP: Record<string, string> = {
  telegram_bot_api: "telegram",
  slack_v2: "slack",
  slack_bot: "slack",
  discord: "discord",
  discord_bot: "discord",
  whatsapp_business: "whatsapp",
  microsoft_teams: "teams",
  microsoft_teams_bot: "teams",
};

async function fetchApps(logger: (msg: string) => void): Promise<PipedreamApp[]> {
  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: { "content-type": "application/json", "user-agent": "vault-scraper" },
    body: JSON.stringify({ query: "{ apps { id name nameSlug description } }" }),
  });
  if (!res.ok) {
    logger(`Pipedream GraphQL returned ${res.status}`);
    return [];
  }
  const json = (await res.json()) as { data?: { apps?: PipedreamApp[] } };
  return json.data?.apps ?? [];
}

export const pipedreamSource: SourceModule = {
  type: "pipedream",
  name: "Pipedream integrations",
  maxEntries: 100,
  autoApprove: true,
  async run({ limit, logger }) {
    logger("Fetching Pipedream app catalog via GraphQL…");
    const apps = await fetchApps(logger);
    if (apps.length === 0) {
      logger("No apps returned from Pipedream GraphQL. Skipping.");
      return [];
    }
    logger(`  ${apps.length} total apps in catalog`);

    const aiApps = apps.filter((a) => a.nameSlug in AI_SLUG_MAP);
    const targetApps = apps.filter((a) => a.nameSlug in TARGET_SLUG_MAP);
    logger(`  AI apps: ${aiApps.length}, Target apps: ${targetApps.length}`);

    const results: RawEntry[] = [];
    for (const ai of aiApps) {
      for (const tgt of targetApps) {
        if (results.length >= limit) break;
        const aiPlatform = AI_SLUG_MAP[ai.nameSlug];
        const deliveryTarget = TARGET_SLUG_MAP[tgt.nameSlug];
        // Deduplicate: skip if same platform already paired with same target
        const key = `${aiPlatform}:${deliveryTarget}`;
        if (results.some((r) => `${r.ai_platforms[0]}:${r.delivery_targets[0]}` === key)) continue;

        results.push({
          source_url: `https://pipedream.com/apps/${ai.nameSlug}/integrations/${tgt.nameSlug}`,
          source_type: "pipedream",
          title: `${ai.name} + ${tgt.name} integration`,
          description: `Connect ${ai.name} to ${tgt.name} with Pipedream workflows. ${ai.description ?? ""}`.slice(0, 500),
          ai_platforms: [aiPlatform] as RawEntry["ai_platforms"],
          delivery_targets: [deliveryTarget] as RawEntry["delivery_targets"],
          install_command: null,
          language: "pipedream-workflow",
          github_url: null,
          stars: 0,
          license: null,
          author: null,
          category: "pipedream-integration",
        });
      }
      if (results.length >= limit) break;
    }

    logger(`Kept ${results.length} integration pairs`);
    return results.slice(0, limit);
  },
};
