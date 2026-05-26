import type { RawPrompt, PromptSourceModule } from "../types";
import type { AIPlatform, PromptCategory } from "@/lib/types";

const CSV_URL =
  "https://raw.githubusercontent.com/f/awesome-chatgpt-prompts/main/prompts.csv";

function detectPlatforms(text: string): AIPlatform[] {
  const lower = text.toLowerCase();
  const platforms: AIPlatform[] = ["gpt"];
  if (/\bclaude\b/.test(lower)) platforms.push("claude");
  if (/\bgemini\b/.test(lower)) platforms.push("gemini");
  if (/\bllama\b/.test(lower)) platforms.push("llama");
  if (/\bmistral\b/.test(lower)) platforms.push("mistral");
  return platforms;
}

function guessCategory(title: string, body: string): PromptCategory {
  const text = `${title} ${body}`.toLowerCase();
  if (/\b(code|program|debug|developer|software|api|function)\b/.test(text)) return "coding";
  if (/\b(write|essay|blog|story|article|copywrite)\b/.test(text)) return "writing";
  if (/\b(analy[sz]|data|research|review|evaluat)\b/.test(text)) return "analysis";
  if (/\b(creative|poem|music|art|design|brainstorm)\b/.test(text)) return "creative";
  if (/\b(business|market|sales|startup|strateg)\b/.test(text)) return "business";
  if (/\b(teach|learn|tutor|education|student|explain)\b/.test(text)) return "education";
  if (/\b(act as|pretend|roleplay|character|persona)\b/.test(text)) return "roleplay";
  if (/\b(productiv|organiz|plan|schedul|automat)\b/.test(text)) return "productivity";
  return "other";
}

function parseCSV(raw: string): { act: string; prompt: string }[] {
  const rows: { act: string; prompt: string }[] = [];
  const lines = raw.split("\n");
  let i = 1; // skip header
  while (i < lines.length) {
    let line = lines[i]!.trim();
    if (!line) { i++; continue; }
    // Fields may span multiple lines if they contain newlines inside quotes
    while (i < lines.length - 1) {
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 0) break;
      i++;
      line += "\n" + lines[i]!;
    }
    // Format: act,prompt,for_devs,type,contributor
    // act may be unquoted or quoted; prompt is typically quoted with "" escapes
    const firstComma = line.indexOf(",");
    if (firstComma < 0) { i++; continue; }
    const act = line.slice(0, firstComma).replace(/^"|"$/g, "").replace(/""/g, '"');
    const rest = line.slice(firstComma + 1);
    // Extract prompt (second field) — find the field boundary
    let prompt: string;
    if (rest.startsWith('"')) {
      // Quoted field — find the closing quote (not doubled)
      let end = 1;
      while (end < rest.length) {
        if (rest[end] === '"' && rest[end + 1] !== '"') break;
        if (rest[end] === '"' && rest[end + 1] === '"') end++; // skip escaped quote
        end++;
      }
      prompt = rest.slice(1, end).replace(/""/g, '"');
    } else {
      const nextComma = rest.indexOf(",");
      prompt = nextComma >= 0 ? rest.slice(0, nextComma) : rest;
    }
    if (act && prompt && prompt.length > 20) {
      rows.push({ act, prompt });
    }
    i++;
  }
  return rows;
}

export const awesomeChatgptPromptsSource: PromptSourceModule = {
  source: "awesome-chatgpt-prompts",
  name: "awesome-chatgpt-prompts (GitHub CSV)",
  maxEntries: 200,
  async run({ limit, logger }) {
    logger("Fetching prompts.csv from f/awesome-chatgpt-prompts...");
    const res = await fetch(CSV_URL);
    if (!res.ok) {
      logger(`  Failed to fetch CSV: ${res.status}`);
      return [];
    }
    const csv = await res.text();
    const parsed = parseCSV(csv);
    logger(`  Parsed ${parsed.length} prompts from CSV`);

    const results: RawPrompt[] = [];
    for (const row of parsed.slice(0, limit)) {
      const title = row.act.replace(/^Act as (?:a |an )?/i, "").trim();
      results.push({
        title: `Act as ${title}`,
        body: row.prompt,
        source: "awesome-chatgpt-prompts",
        source_url: `https://github.com/f/awesome-chatgpt-prompts#act-as-${title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
        ai_platforms: detectPlatforms(row.prompt),
        use_case: "roleplay",
        category: guessCategory(row.act, row.prompt),
        tags: ["awesome-list", "chatgpt", "roleplay"],
      });
    }

    logger(`  Returning ${results.length} prompts`);
    return results.slice(0, limit);
  },
};
