import { NextResponse } from "next/server";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicKey } from "@/lib/env";
import { requireSubscription } from "@/lib/subscription";

export const runtime = "nodejs";
export const maxDuration = 30;

const RequestSchema = z.object({
  description: z.string().min(10).max(1000),
  platform: z.string().optional(),
  format: z.string().optional(),
});

export async function POST(req: Request) {
  const sub = await requireSubscription();
  if (!sub.ok) {
    return NextResponse.json(
      { ok: false, reason: sub.reason === "logged-out" ? "logged-out" : "subscription-required" },
      { status: sub.reason === "logged-out" ? 401 : 403 },
    );
  }

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

  const anthropicKey = getAnthropicKey();
  if (!anthropicKey) return NextResponse.json({ ok: false, reason: "no-anthropic" }, { status: 503 });

  const { description, platform, format } = parsed.data;
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const systemPrompt = `You are an expert prompt engineer. Generate a high-quality, ready-to-use prompt based on the user's description.

Rules:
- Include a clear system/role definition
- Add specific output format instructions if requested
- Make it immediately usable — no placeholders the user needs to fill in
- Target the specified AI platform if provided, otherwise make it platform-agnostic
- Keep it under 500 words unless complexity demands more
- Do NOT wrap in markdown fencing — return the raw prompt text only`;

  const userMessage = [
    `Description: ${description}`,
    platform ? `Target platform: ${platform}` : null,
    format ? `Output format preference: ${format}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const text = msg.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("");
    return NextResponse.json({ ok: true, prompt: text.trim() });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: err instanceof Error ? err.message : "generation-failed" },
      { status: 502 },
    );
  }
}
