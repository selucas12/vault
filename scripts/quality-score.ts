#!/usr/bin/env tsx
/**
 * Quality scoring pipeline.
 *
 * Calls Claude Haiku per entry to rate quality 1-10. Entries below threshold
 * get hidden_from_directory=true. Run via: npx tsx scripts/quality-score.ts
 *
 * Flags:
 *   --threshold N    Min score to remain visible (default: 6)
 *   --limit N        Max entries to score this run (default: 500)
 *   --rescore        Re-score entries that already have a quality_score
 *   --dry-run        Score but don't write to DB
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import pThrottle from "p-throttle";

interface CodeRow {
  id: string;
  title: string;
  description: string | null;
  ai_platforms: string[];
  delivery_targets: string[];
  install_command: string | null;
  github_url: string | null;
  stars: number;
  language: string | null;
  source_type: string;
  quality_score: number | null;
  featured: boolean;
}

interface CliArgs {
  threshold: number;
  limit: number;
  rescore: boolean;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { threshold: 6, limit: 500, rescore: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--rescore") args.rescore = true;
    else if (a === "--threshold") {
      const v = parseInt(argv[++i] ?? "", 10);
      if (!Number.isNaN(v)) args.threshold = v;
    } else if (a === "--limit") {
      const v = parseInt(argv[++i] ?? "", 10);
      if (!Number.isNaN(v)) args.limit = v;
    }
  }
  return args;
}

const SCORE_PROMPT = `You are a quality rater for a directory of AI-to-chat-platform integrations (tools that connect Claude, GPT, Gemini, etc. to Telegram, Slack, Discord, WhatsApp, etc.).

Rate this entry 1-10 on "would a developer actually want to discover and install this?"

Scoring rubric:
- 9-10: Active, well-documented project with clear install path, >100 stars, recent commits
- 7-8: Working project with decent docs, clear purpose, some community traction
- 5-6: Exists and might work, but sparse docs or low activity
- 3-4: Abandoned, archived, or very unclear purpose
- 1-2: Spam, placeholder, or completely broken

Signal inputs provided:
- Title, description, platform/target classification
- Star count (0 may mean npm-only or new — not automatically bad)
- Whether install command exists
- Source type (manual entries are hand-curated, higher trust)
- Language

Respond with ONLY a JSON object, no markdown fencing:
{"score": N, "reasoning": "one sentence"}`;

const throttle = pThrottle({ limit: 4, interval: 1000 });

async function scoreEntry(client: Anthropic, entry: CodeRow): Promise<{ score: number; reasoning: string }> {
  const entryDesc = [
    `Title: ${entry.title}`,
    `Description: ${entry.description ?? "(none)"}`,
    `AI platforms: ${entry.ai_platforms.join(", ")}`,
    `Targets: ${entry.delivery_targets.join(", ")}`,
    `Stars: ${entry.stars}`,
    `Language: ${entry.language ?? "unknown"}`,
    `Install command: ${entry.install_command ?? "(none)"}`,
    `GitHub: ${entry.github_url ?? "(none)"}`,
    `Source: ${entry.source_type}`,
    `Featured: ${entry.featured}`,
  ].join("\n");

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{ role: "user", content: `${SCORE_PROMPT}\n\nEntry:\n${entryDesc}` }],
  });

  const text = res.content[0]?.type === "text" ? res.content[0].text : "";
  try {
    const parsed = JSON.parse(text);
    return { score: Math.max(1, Math.min(10, Math.round(parsed.score))), reasoning: parsed.reasoning ?? "" };
  } catch {
    return { score: 5, reasoning: "Failed to parse LLM response" };
  }
}

const throttledScore = throttle(scoreEntry);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Quality scorer — ${args.dryRun ? "DRY RUN" : "LIVE"} — threshold ${args.threshold}, limit ${args.limit}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !key) { console.error("Missing Supabase env vars"); process.exit(1); }
  if (!anthropicKey) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let query = supabase
    .from("codes")
    .select("id, title, description, ai_platforms, delivery_targets, install_command, github_url, stars, language, source_type, quality_score, featured")
    .eq("approved", true)
    .order("stars", { ascending: false })
    .limit(args.limit);

  if (!args.rescore) {
    query = query.is("quality_score", null);
  }

  const { data: rows, error } = await query;
  if (error) { console.error("DB query failed:", error.message); process.exit(1); }
  const entries = (rows ?? []) as CodeRow[];
  console.log(`Found ${entries.length} entries to score`);

  const histogram = new Map<number, number>();
  const hidden: string[] = [];
  const topEntries: { title: string; score: number; stars: number }[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const { score, reasoning } = await throttledScore(anthropic, entry);
    histogram.set(score, (histogram.get(score) ?? 0) + 1);

    const isHidden = score < args.threshold;
    if (isHidden) hidden.push(entry.title);
    topEntries.push({ title: entry.title, score, stars: entry.stars });

    if ((i + 1) % 10 === 0 || i === entries.length - 1) {
      console.log(`  Scored ${i + 1}/${entries.length} — latest: ${entry.title} → ${score}/10`);
    }

    if (!args.dryRun) {
      const { error: upErr } = await supabase
        .from("codes")
        .update({ quality_score: score, quality_reasoning: reasoning, hidden_from_directory: isHidden })
        .eq("id", entry.id);
      if (upErr) console.error(`  Update failed for ${entry.title}: ${upErr.message}`);
    }
  }

  topEntries.sort((a, b) => b.score - a.score || b.stars - a.stars);
  const top5 = topEntries.slice(0, 5);
  const bottom5 = [...topEntries].sort((a, b) => a.score - b.score).slice(0, 5);

  console.log("\n=== RESULTS ===");
  console.log(`Total scored: ${entries.length}`);
  console.log(`Hidden (below ${args.threshold}): ${hidden.length}`);
  console.log(`Visible: ${entries.length - hidden.length}`);
  console.log("\nHistogram:");
  for (let s = 10; s >= 1; s--) {
    const count = histogram.get(s) ?? 0;
    if (count > 0) console.log(`  ${s}/10: ${"█".repeat(count)} (${count})`);
  }
  console.log("\nTop 5:");
  for (const e of top5) console.log(`  ${e.score}/10 ★${e.stars} — ${e.title}`);
  console.log("\nBottom 5:");
  for (const e of bottom5) console.log(`  ${e.score}/10 ★${e.stars} — ${e.title}`);
}

main().catch((err) => {
  console.error("Quality scorer crashed:", err);
  process.exit(1);
});
