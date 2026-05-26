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
  body: string;
  source: string;
  source_url: string;
  ai_platforms: string[];
  use_case: string | null;
  category: string | null;
  tags: string[];
  quality_score: number;
  is_free: boolean;
  similarity: number;
}

export async function POST(req: Request) {
  let reqBody: unknown;
  try {
    reqBody = await req.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  }
  const parsed = RequestSchema.safeParse(reqBody);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }

  const supabase = await getSupabaseServer();
  if (!supabase) return NextResponse.json({ ok: false, reason: "no-supabase" }, { status: 503 });

  const openaiKey = getOpenAIKey();
  if (!openaiKey) return NextResponse.json({ ok: false, reason: "no-openai" }, { status: 503 });

  const anthropicKey = getAnthropicKey();
  if (!anthropicKey) return NextResponse.json({ ok: false, reason: "no-anthropic" }, { status: 503 });

  const sub = await getSubscriptionState();
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

  const { data: rows, error: rpcErr } = await supabase.rpc("search_prompts", {
    query_embedding: embedding,
    match_count: 5,
    min_quality_score: 6,
  });
  if (rpcErr) {
    return NextResponse.json({ ok: false, reason: rpcErr.message }, { status: 502 });
  }
  const candidates = (rows ?? []) as RpcRow[];
  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, gated: !sub.active, matches: [] });
  }

  if (!sub.active) {
    const teaser = candidates[0]!;
    return NextResponse.json({
      ok: true,
      gated: true,
      matches: [
        {
          id: teaser.id,
          title: teaser.title,
          body: teaser.body.slice(0, 80) + "...",
          ai_platforms: teaser.ai_platforms,
          category: teaser.category,
          is_free: teaser.is_free,
        },
      ],
    });
  }

  const anthropic = new Anthropic({ apiKey: anthropicKey });
  const systemPrompt = `You are ranking prompt matches for a user's query.

User wants: "${parsed.data.query}"

Return JSON array of 2-3 best matches: [{id, why, confidence}].
confidence is "high"|"medium"|"low". "why" should be one sentence.`;

  const userPrompt = `Candidates:
${candidates.map((c, i) => `[${i + 1}] id=${c.id}\n  title: ${c.title}\n  body preview: ${c.body.slice(0, 200)}\n  platforms: ${c.ai_platforms.join(",")}\n  category: ${c.category}\n  similarity: ${c.similarity.toFixed(3)}`).join("\n\n")}

Return JSON array only.`;

  let ranking: { id: string; why: string; confidence: "high" | "medium" | "low" }[] = [];
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });
    let text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      ranking = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    }
  } catch {
    ranking = candidates.slice(0, 3).map((c) => ({ id: c.id, why: "Vector match", confidence: "medium" as const }));
  }

  const byId = new Map(candidates.map((c) => [c.id, c]));
  const matches = ranking
    .map((r) => {
      const c = byId.get(r.id);
      if (!c) return null;
      return {
        id: c.id,
        title: c.title,
        body: c.body,
        ai_platforms: c.ai_platforms,
        category: c.category,
        is_free: c.is_free,
        why: r.why,
        confidence: r.confidence,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ ok: true, gated: false, matches });
}
