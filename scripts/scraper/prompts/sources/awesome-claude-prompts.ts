import type { RawPrompt, PromptSourceModule } from "../types";
import type { PromptCategory } from "@/lib/types";

const REPO = "yzfly/awesome-claude-prompts";

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

interface ParsedPrompt {
  title: string;
  body: string;
}

function parseReadme(md: string): ParsedPrompt[] {
  const prompts: ParsedPrompt[] = [];
  // Match markdown table rows or heading+block patterns
  // Pattern 1: ## Title\n\n> prompt text or ```prompt text```
  const headingPattern = /^##\s+(.+?)$/gm;
  const sections: { title: string; startIdx: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = headingPattern.exec(md)) !== null) {
    sections.push({ title: match[1]!.trim(), startIdx: match.index + match[0].length });
  }

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]!;
    const endIdx = i < sections.length - 1 ? sections[i + 1]!.startIdx : md.length;
    const content = md.slice(section.startIdx, endIdx).trim();

    // Skip navigation/TOC sections
    if (/^(table of contents|contributing|license|disclaimer)/i.test(section.title)) continue;

    // Extract prompt from blockquote or code block
    const blockquote = content.match(/^>\s*(.+(?:\n>\s*.+)*)/m);
    const codeBlock = content.match(/```[\s\S]*?\n([\s\S]*?)```/);
    const promptBody = blockquote
      ? blockquote[1]!.replace(/^>\s*/gm, "").trim()
      : codeBlock
        ? codeBlock[1]!.trim()
        : null;

    if (promptBody && promptBody.length > 30) {
      prompts.push({ title: section.title, body: promptBody });
    }
  }

  // Pattern 2: markdown table (| Title | Prompt |)
  const tableRows = md.matchAll(/^\|([^|]+)\|([^|]+)\|$/gm);
  for (const row of tableRows) {
    const title = row[1]!.trim().replace(/\*\*/g, "");
    const body = row[2]!.trim();
    if (title && body && body.length > 30 && !/^-+$/.test(title) && title.toLowerCase() !== "title") {
      prompts.push({ title, body });
    }
  }

  return prompts;
}

export const awesomeClaudePromptsSource: PromptSourceModule = {
  source: "awesome-claude-prompts",
  name: "awesome-claude-prompts (GitHub)",
  maxEntries: 100,
  async run({ limit, logger }) {
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
      accept: "application/vnd.github.raw",
      "user-agent": "vault-scraper",
    };
    if (token) headers.authorization = `Bearer ${token}`;

    logger(`Fetching README from ${REPO}...`);
    let md: string | null = null;
    for (const branch of ["main", "master"]) {
      const url = `https://raw.githubusercontent.com/${REPO}/${branch}/README.md`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        md = await res.text();
        break;
      }
    }
    if (!md) {
      logger("  README not found");
      return [];
    }

    const parsed = parseReadme(md);
    logger(`  Parsed ${parsed.length} prompts`);

    const results: RawPrompt[] = [];
    for (const p of parsed.slice(0, limit)) {
      results.push({
        title: p.title,
        body: p.body,
        source: "awesome-claude-prompts",
        source_url: `https://github.com/${REPO}#${p.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`,
        ai_platforms: ["claude"],
        use_case: "roleplay",
        category: guessCategory(p.title, p.body),
        tags: ["awesome-list", "claude"],
      });
    }

    logger(`  Returning ${results.length} prompts`);
    return results.slice(0, limit);
  },
};
