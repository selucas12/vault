import { NextResponse } from "next/server";
import { z } from "zod";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getAnthropicKey, getOpenAIKey } from "@/lib/env";
import { getSubscriptionState } from "@/lib/subscription";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({ query: z.string().min(3).max(500) });

interface RpcRow {
  id: string;
  title: string;
  description: string | null;
  source_url: string;
  ai_platforms: string[];
  delivery_targets: string[];
  install_command: string | null;
  github_url: string | null;
  stars: number;
  language: string | null;
  license: string | null;
  featured: boolean;
  editor_note: string | null;
  similarity: number;
}

interface Intent {
  ai_platforms: string[];
  delivery_targets: string[];
}

async function extractIntent(
  anthropic: Anthropic,
  query: string,
): Promise<Intent> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      system: `Extract the user's intended AI platform and delivery target from their query.
Return JSON only: { "ai_platforms": ["claude"|"gpt"|"gemini"|"groq"|"llama"|"mistral"|"perplexity"|"deepseek"], "delivery_targets": ["telegram"|"slack"|"discord"|"whatsapp"|"imessage"|"teams"] }
Both arrays may be empty if the user didn't specify. Return no prose.`,
      messages: [{ role: "user", content: query }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
      return {
        ai_platforms: Array.isArray(parsed.ai_platforms) ? parsed.ai_platforms : [],
        delivery_targets: Array.isArray(parsed.delivery_targets) ? parsed.delivery_targets : [],
      };
    }
  } catch {
    // intent extraction is best-effort — falls back to unfiltered search
  }
  return { ai_platforms: [], delivery_targets: [] };
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, reason: "no-supabase" }, { status: 503 });

  const openaiKey = getOpenAIKey();
  if (!openaiKey) return NextResponse.json({ ok: false, reason: "no-openai" }, { status: 503 });

  const anthropicKey = getAnthropicKey();
  if (!anthropicKey)
    return NextResponse.json({ ok: false, reason: "no-anthropic" }, { status: 503 });

  const sub = await getSubscriptionState();
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  // Step 1: extract intent from query using Haiku (cheap + fast)
  const intent = await extractIntent(anthropic, parsed.data.query);

  // Step 2: embed the query
  const openai = new OpenAI({ apiKey: openaiKey });
  let embedding: number[];
  try {
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: parsed.data.query,
    });
    embedding = emb.data[0]!.embedding;
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "embed-failed" },
      { status: 502 },
    );
  }

  // Step 3: pgvector search with intent-based boosting
  const rpcParams: Record<string, unknown> = {
    query_embedding: embedding,
    match_count: 5,
    min_similarity: 0.1,
  };
  if (intent.delivery_targets.length > 0) {
    rpcParams.target_filter = intent.delivery_targets;
  }
  if (intent.ai_platforms.length > 0) {
    rpcParams.platform_filter = intent.ai_platforms;
  }

  const { data: rows, error: rpcErr } = await supabase.rpc("search_codes", rpcParams);
  if (rpcErr) {
    return NextResponse.json({ ok: false, reason: rpcErr.message }, { status: 502 });
  }
  const candidates = (rows ?? []) as RpcRow[];
  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, gated: !sub.active, matches: [] });
  }

  // Step 4: teaser-only for non-subscribers
  if (!sub.active) {
    const teaser = candidates[0]!;
    return NextResponse.json({
      ok: true,
      gated: true,
      matches: [
        {
          id: teaser.id,
          title: teaser.title,
          description: teaser.description,
          ai_platforms: teaser.ai_platforms,
          delivery_targets: teaser.delivery_targets,
          install_command: null,
          github_url: teaser.github_url,
          stars: teaser.stars,
        },
      ],
    });
  }

  // Step 5: rank + explain with Sonnet
  const targetStr = intent.delivery_targets.length > 0
    ? intent.delivery_targets.join(", ")
    : "(not specified)";
  const platformStr = intent.ai_platforms.length > 0
    ? intent.ai_platforms.join(", ")
    : "(not specified)";

  const systemPrompt = `You are ranking matches for a user looking for AI ↔ chat-platform integrations.

User wants: "${parsed.data.query}"
Extracted intent: AI platforms = [${platformStr}], delivery targets = [${targetStr}]

Rules:
1. If the user specified a delivery target (Slack/Discord/etc), STRONGLY prefer matches with that target. A perfect platform match with the wrong delivery target is a bad match.
2. If the user specified an AI platform, prefer that platform but be flexible — many bots are multi-platform.
3. Featured entries get a small ranking boost ONLY if they also fit the user's intent.
4. Star count is a weak signal — don't over-index on it.
5. Return 2-3 results with a "why" field that explicitly references the platform AND target match.

Return JSON only, no prose. Format: an array of objects {id, why, install_summary, confidence}. confidence is "high"|"medium"|"low".`;

  const userPrompt = `Candidates:
${candidates
  .map(
    (c, i) =>
      `[${i + 1}] id=${c.id}\n  title: ${c.title}\n  description: ${c.description ?? "(none)"}\n  ai: ${c.ai_platforms.join(",") || "(unknown)"}\n  target: ${c.delivery_targets.join(",") || "(unknown)"}\n  install: ${c.install_command ?? "(none)"}\n  featured: ${c.featured}\n  similarity: ${c.similarity.toFixed(3)}`,
  )
  .join("\n\n")}

Return JSON array only.`;

  let ranking: { id: string; why: string; install_summary: string; confidence: "high" | "medium" | "low" }[] = [];
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("");
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      ranking = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
  } catch (err) {
    return NextResponse.json({
      ok: true,
      gated: false,
      matches: candidates.slice(0, 3).map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        ai_platforms: c.ai_platforms,
        delivery_targets: c.delivery_targets,
        install_command: c.install_command,
        github_url: c.github_url,
        stars: c.stars,
        why: `Vector similarity ${(c.similarity * 100).toFixed(0)}%. AI ranker unavailable (${err instanceof Error ? err.message : "error"}).`,
      })),
    });
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const matches = ranking
    .map((r) => {
      const cand = byId.get(r.id);
      if (!cand) return null;
      return {
        id: cand.id,
        title: cand.title,
        description: cand.description,
        ai_platforms: cand.ai_platforms,
        delivery_targets: cand.delivery_targets,
        install_command: cand.install_command,
        github_url: cand.github_url,
        stars: cand.stars,
        why: r.why,
        install_summary: r.install_summary,
        confidence: r.confidence,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ ok: true, gated: false, matches });
}
