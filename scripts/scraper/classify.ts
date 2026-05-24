import type { AIPlatform, DeliveryTarget } from "@/lib/types";

// Each pattern is a lowercased substring or regex. We classify by checking
// title + description + topics + readme blurb. Order doesn't matter; we
// dedupe at the end.

const AI_PATTERNS: { id: AIPlatform; patterns: (string | RegExp)[] }[] = [
  { id: "claude", patterns: ["claude", "anthropic"] },
  { id: "gpt", patterns: ["gpt-", "chatgpt", "openai", /\bgpt\b/, /\bopen ai\b/] },
  { id: "gemini", patterns: ["gemini", "bard", "google ai"] },
  { id: "groq", patterns: ["groq"] },
  { id: "llama", patterns: ["llama", "llama3", "llama2", "llama 3", "llama 2", "ollama"] },
  { id: "mistral", patterns: ["mistral", "mixtral"] },
  { id: "perplexity", patterns: ["perplexity"] },
  { id: "deepseek", patterns: ["deepseek"] },
];

const TARGET_PATTERNS: { id: DeliveryTarget; patterns: (string | RegExp)[] }[] = [
  { id: "telegram", patterns: ["telegram"] },
  { id: "slack", patterns: ["slack"] },
  { id: "discord", patterns: ["discord"] },
  { id: "whatsapp", patterns: ["whatsapp", "whats-app", "whatsapp-web"] },
  { id: "imessage", patterns: ["imessage", "i-message", "applescript"] },
  { id: "teams", patterns: ["microsoft teams", /\bteams bot\b/] },
];

function matches(haystack: string, patterns: (string | RegExp)[]): boolean {
  for (const p of patterns) {
    if (typeof p === "string") {
      if (haystack.includes(p)) return true;
    } else if (p.test(haystack)) {
      return true;
    }
  }
  return false;
}

export function classifyAIPlatforms(text: string, topics: string[] = []): AIPlatform[] {
  const hay = `${text} ${topics.join(" ")}`.toLowerCase();
  const out: AIPlatform[] = [];
  for (const { id, patterns } of AI_PATTERNS) {
    if (matches(hay, patterns)) out.push(id);
  }
  return out;
}

export function classifyDeliveryTargets(text: string, topics: string[] = []): DeliveryTarget[] {
  const hay = `${text} ${topics.join(" ")}`.toLowerCase();
  const out: DeliveryTarget[] = [];
  for (const { id, patterns } of TARGET_PATTERNS) {
    if (matches(hay, patterns)) out.push(id);
  }
  return out;
}
