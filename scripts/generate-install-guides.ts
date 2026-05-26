#!/usr/bin/env tsx
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const BATCH_SIZE = 5;
const MODEL = "claude-sonnet-4-6";
const MAX_README_CHARS = 5000;

interface CodeRow {
  id: string;
  title: string;
  description: string | null;
  ai_platforms: string[];
  delivery_targets: string[];
  github_url: string | null;
  install_command: string | null;
  language: string | null;
}

function getClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE env vars");
  if (!anthropicKey) throw new Error("Missing ANTHROPIC_API_KEY");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const anthropic = new Anthropic({ apiKey: anthropicKey });
  return { supabase, anthropic };
}

function githubRawUrl(ghUrl: string, path: string): string {
  const match = ghUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return "";
  return `https://raw.githubusercontent.com/${match[1]}/${match[2]}/HEAD/${path}`;
}

async function fetchText(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "vault-guide-generator/1.0" },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function buildPrompt(
  entry: CodeRow,
  readme: string | null,
  manifest: string | null,
): string {
  return `You are a technical writer creating an install guide for an AI integration tool.

## Integration Details
- **Name**: ${entry.title}
- **Description**: ${entry.description ?? "No description available"}
- **AI Platforms**: ${entry.ai_platforms.join(", ") || "Unknown"}
- **Chat Targets**: ${entry.delivery_targets.join(", ") || "Unknown"}
- **Language**: ${entry.language ?? "Unknown"}
- **GitHub**: ${entry.github_url ?? "No URL"}
${entry.install_command ? `- **Known install command**: \`${entry.install_command}\`` : ""}

${readme ? `## README (first ${MAX_README_CHARS} chars)\n\`\`\`\n${readme.slice(0, MAX_README_CHARS)}\n\`\`\`` : "## README\nNot available — infer steps from the integration details above."}

${manifest ? `## Dependency Manifest\n\`\`\`\n${manifest.slice(0, 3000)}\n\`\`\`` : ""}

Write a clear, practical install guide in markdown. Use these exact sections:

## Prerequisites
List what the user needs before starting (Node.js version, Python version, accounts, etc.)

## Get Your API Keys
Step-by-step for each API key needed (AI provider key, chat platform bot token, etc.). Include links to the relevant developer portals when you can infer them.

## Installation
Shell commands to clone/install. Use the known install command if provided. If it's a Node project, show npm/yarn. If Python, show pip/pipenv.

## Configuration
A markdown table of environment variables:
| Variable | Description | Where to get it |
|----------|-------------|-----------------|

## Running the Bot
How to start it. Dev mode and production mode if applicable.

## Testing
How to verify it works — a simple smoke test.

## Troubleshooting
A markdown table of common issues:
| Problem | Likely cause | Fix |
|---------|-------------|-----|
Include at least 3 rows.

Rules:
- Be specific and actionable. No vague "configure as needed" hand-waving.
- If you don't know something, say "Check the project README for details" rather than guessing.
- Use \`code blocks\` for all commands and file paths.
- Do NOT include a title heading (the app adds one). Start directly with ## Prerequisites.`;
}

interface GenerationResult {
  success: number;
  failures: { id: string; title: string; reason: string }[];
  inputTokens: number;
  outputTokens: number;
}

async function generateGuides(): Promise<GenerationResult> {
  const { supabase, anthropic } = getClients();

  const { data: entries, error } = await supabase
    .from("codes")
    .select("id, title, description, ai_platforms, delivery_targets, github_url, install_command, language")
    .eq("install_guide_status", "missing")
    .order("stars", { ascending: false });

  if (error) throw new Error(`Query failed: ${error.message}`);
  if (!entries || entries.length === 0) {
    console.log("No entries need guides.");
    return { success: 0, failures: [], inputTokens: 0, outputTokens: 0 };
  }

  console.log(`Found ${entries.length} entries needing guides.\n`);

  const result: GenerationResult = {
    success: 0,
    failures: [],
    inputTokens: 0,
    outputTokens: 0,
  };

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE) as CodeRow[];
    const promises = batch.map(async (entry) => {
      try {
        let readme: string | null = null;
        let manifest: string | null = null;

        if (entry.github_url) {
          const [readmeResult, pkgResult, pyResult] = await Promise.all([
            fetchText(githubRawUrl(entry.github_url, "README.md")),
            fetchText(githubRawUrl(entry.github_url, "package.json")),
            fetchText(githubRawUrl(entry.github_url, "pyproject.toml")),
          ]);
          readme = readmeResult;
          manifest = pkgResult ?? pyResult;
        }

        const prompt = buildPrompt(entry, readme, manifest);

        const response = await anthropic.messages.create({
          model: MODEL,
          max_tokens: 2500,
          messages: [{ role: "user", content: prompt }],
        });

        const guide =
          response.content[0]?.type === "text" ? response.content[0].text : "";

        result.inputTokens += response.usage.input_tokens;
        result.outputTokens += response.usage.output_tokens;

        const { error: upsertError } = await supabase
          .from("codes")
          .update({
            install_guide: guide,
            install_guide_status: "draft",
            install_guide_author: "claude-sonnet-auto",
            install_guide_updated_at: new Date().toISOString(),
          })
          .eq("id", entry.id);

        if (upsertError) throw new Error(upsertError.message);
        result.success++;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        result.failures.push({ id: entry.id, title: entry.title, reason });
      }
    });

    await Promise.all(promises);

    const done = Math.min(i + BATCH_SIZE, entries.length);
    console.log(`Generated ${done}/${entries.length}...`);

    if (i + BATCH_SIZE < entries.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  return result;
}

async function main() {
  console.log("Vault Install Guide Generator\n");

  const result = await generateGuides();

  const inputCost = (result.inputTokens / 1_000_000) * 3;
  const outputCost = (result.outputTokens / 1_000_000) * 15;
  const totalCost = inputCost + outputCost;

  console.log("\n=== Summary ===");
  console.log(`Drafts created: ${result.success}`);
  console.log(`Failures: ${result.failures.length}`);
  if (result.failures.length > 0) {
    for (const f of result.failures) {
      console.log(`  FAIL: ${f.title} — ${f.reason}`);
    }
  }
  console.log(`Tokens: ${result.inputTokens} in / ${result.outputTokens} out`);
  console.log(`Estimated cost: $${totalCost.toFixed(2)} (in: $${inputCost.toFixed(2)}, out: $${outputCost.toFixed(2)})`);
}

main().catch((err) => {
  console.error("Generator crashed:", err);
  process.exit(1);
});
