#!/usr/bin/env tsx
/**
 * Quality scoring for prompts. Rates each prompt 1-10 using Claude Haiku.
 *
 * Flags:
 *   --threshold N    Min score to be visible (default: 6)
 *   --limit N        Max prompts to score (default: 500)
 *   --rescore        Re-score prompts that already have a quality_score
 *   --dry-run        Score but don't write to DB
 */
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import pThrottle from "p-throttle";

interface PromptRow {
  id: string;
  title: string;
  body: string;
  source: string;
  ai_platforms: string[];
  category: string | null;
  tags: string[];
  quality_score: number | null;
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

const SCORE_PROMPT = `You are a quality rater for a curated prompts library.

Rate this prompt 1-10 on "would a developer or power user find this useful?"

Scoring rubric:
- 10: Clear, specific, well-structured, includes role/context/format instructions, no typos, immediately usable
- 8-9: Clear and useful but minor issues (missing format spec, generic title)
- 6-7: Usable but vague or overly generic ("write a blog post about X")
- 4-5: Too short, too generic, or copy-pasted from common templates with no value-add
- 1-3: Broken, nonsensical, obvious AI slop, jailbreak attempts, or single-sentence with no structure

Additional signals:
- Prompts that define a role/persona clearly score higher
- Prompts with specific output format instructions score higher
- Very short prompts (<50 chars body) score lower
- Jailbreak/DAN prompts score 1-2
- Prompts that are just "act as X" with no detail score 3-4

Respond with ONLY a JSON object, no markdown fencing:
{"score": N, "reasoning": "one sentence"}`;

const throttle = pThrottle({ limit: 4, interval: 1000 });

async function scorePrompt(client: Anthropic, prompt: PromptRow): Promise<{ score: number; reasoning: string }> {
  const bodyPreview = prompt.body.length > 500 ? prompt.body.slice(0, 500) + "..." : prompt.body;
  const desc = [
    `Title: ${prompt.title}`,
    `Body: ${bodyPreview}`,
    `AI platforms: ${prompt.ai_platforms.join(", ")}`,
    `Category: ${prompt.category ?? "unknown"}`,
    `Source: ${prompt.source}`,
    `Body length: ${prompt.body.length} chars`,
  ].join("\n");

  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 100,
    messages: [{ role: "user", content: `${SCORE_PROMPT}\n\nPrompt to rate:\n${desc}` }],
  });

  let text = res.content[0]?.type === "text" ? res.content[0].text : "";
  text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    const parsed = JSON.parse(text);
    return { score: Math.max(1, Math.min(10, Math.round(parsed.score))), reasoning: parsed.reasoning ?? "" };
  } catch {
    return { score: 5, reasoning: "Failed to parse LLM response" };
  }
}

const throttledScore = throttle(scorePrompt);

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`Prompt quality scorer — ${args.dryRun ? "DRY RUN" : "LIVE"} — threshold ${args.threshold}, limit ${args.limit}`);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !key) { console.error("Missing Supabase env vars"); process.exit(1); }
  if (!anthropicKey) { console.error("Missing ANTHROPIC_API_KEY"); process.exit(1); }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  let query = supabase
    .from("prompts")
    .select("id, title, body, source, ai_platforms, category, tags, quality_score")
    .order("created_at", { ascending: true })
    .limit(args.limit);

  if (!args.rescore) {
    query = query.is("quality_score", null);
  }

  const { data: rows, error } = await query;
  if (error) { console.error("DB query failed:", error.message); process.exit(1); }
  const entries = (rows ?? []) as PromptRow[];
  console.log(`Found ${entries.length} prompts to score`);

  const histogram = new Map<number, number>();
  const hidden: string[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    const { score, reasoning } = await throttledScore(anthropic, entry);
    histogram.set(score, (histogram.get(score) ?? 0) + 1);

    const isHidden = score < args.threshold;
    if (isHidden) hidden.push(entry.title);

    if ((i + 1) % 20 === 0 || i === entries.length - 1) {
      console.log(`  Scored ${i + 1}/${entries.length} — latest: ${entry.title} → ${score}/10`);
    }

    if (!args.dryRun) {
      const { error: upErr } = await supabase
        .from("prompts")
        .update({ quality_score: score, quality_reasoning: reasoning, hidden_from_directory: isHidden })
        .eq("id", entry.id);
      if (upErr) console.error(`  Update failed for ${entry.title}: ${upErr.message}`);
    }
  }

  console.log("\n=== RESULTS ===");
  console.log(`Total scored: ${entries.length}`);
  console.log(`Hidden (below ${args.threshold}): ${hidden.length}`);
  console.log(`Visible: ${entries.length - hidden.length}`);
  console.log("\nHistogram:");
  for (let s = 10; s >= 1; s--) {
    const count = histogram.get(s) ?? 0;
    if (count > 0) console.log(`  ${s}/10: ${"█".repeat(count)} (${count})`);
  }
}

main().catch((err) => {
  console.error("Prompt quality scorer crashed:", err);
  process.exit(1);
});
