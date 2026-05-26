#!/usr/bin/env tsx
/**
 * Prompt scraper entry point. Run via: npx tsx scripts/scraper/prompts/index.ts
 *
 * Flags:
 *   --limit N      Global cap on new entries (default 300).
 *   --dry-run      Run sources but don't write to DB.
 *   --source NAME  Only run a single source.
 */
import { awesomeChatgptPromptsSource } from "./sources/awesome-chatgpt-prompts";
import { awesomeClaudePromptsSource } from "./sources/awesome-claude-prompts";
import { embedText } from "../embed";
import { getPromptDb, contentHash } from "./db";
import type { RawPrompt, PromptSourceModule } from "./types";

const ALL_SOURCES: PromptSourceModule[] = [
  awesomeChatgptPromptsSource,
  awesomeClaudePromptsSource,
];

interface CliArgs {
  limit: number;
  dryRun: boolean;
  sourceFilter: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { limit: 300, dryRun: false, sourceFilter: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--limit") {
      const v = parseInt(argv[++i] ?? "", 10);
      if (!Number.isNaN(v)) args.limit = v;
    } else if (a === "--source") args.sourceFilter = argv[++i] ?? null;
  }
  return args;
}

function logFor(source: string) {
  return (msg: string) => console.log(`[${source}] ${msg}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = args.sourceFilter
    ? ALL_SOURCES.filter((s) => s.source === args.sourceFilter)
    : ALL_SOURCES;
  if (sources.length === 0) {
    console.error(`No source matches --source=${args.sourceFilter}`);
    process.exit(1);
  }

  console.log(`Prompt scraper — ${args.dryRun ? "DRY RUN" : "LIVE"} — limit ${args.limit}`);
  const db = args.dryRun ? null : getPromptDb();
  if (!args.dryRun && !db) {
    console.error("Missing Supabase env vars.");
    process.exit(2);
  }

  const existingUrls = db ? await db.existingSourceUrls() : new Set<string>();
  const existingHashes = db ? await db.existingContentHashes() : new Set<string>();
  console.log(`Existing prompts: ${existingUrls.size}`);

  let totalNew = 0;
  for (const src of sources) {
    if (totalNew >= args.limit) break;
    const log = logFor(src.source);
    const remaining = args.limit - totalNew;
    const sourceCap = Math.min(src.maxEntries, remaining);
    let entries: RawPrompt[] = [];
    try {
      entries = await src.run({ limit: sourceCap, logger: log });
    } catch (err) {
      log(`Source threw: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    log(`Returned ${entries.length} entries`);

    let newCount = 0;
    let dupCount = 0;
    for (const e of entries) {
      if (totalNew >= args.limit) break;

      if (existingUrls.has(e.source_url)) {
        dupCount++;
        continue;
      }

      const hash = contentHash(e.body);
      if (existingHashes.has(hash)) {
        dupCount++;
        continue;
      }

      const embedSource = `${e.title}\n${e.body}`;
      let embedding: number[] | null = null;
      try {
        embedding = await embedText(embedSource);
      } catch (err) {
        log(`  Embed failed for "${e.title}": ${err instanceof Error ? err.message : String(err)}`);
      }

      const row = {
        title: e.title,
        body: e.body,
        source: e.source,
        source_url: e.source_url,
        ai_platforms: e.ai_platforms,
        use_case: e.use_case,
        category: e.category,
        tags: e.tags,
        embedding,
        hidden_from_directory: true,
        updated_at: new Date().toISOString(),
      };

      if (args.dryRun) {
        log(`  + ${e.title} [${e.ai_platforms.join(",")}] (${e.category})`);
        newCount++;
        totalNew++;
        continue;
      }

      try {
        await db!.upsertPrompt(row);
        newCount++;
        totalNew++;
        existingUrls.add(e.source_url);
        existingHashes.add(hash);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("duplicate") || msg.includes("unique")) {
          dupCount++;
        } else {
          log(`  Upsert failed for "${e.title}": ${msg}`);
        }
      }
    }

    log(`Done — ${newCount} new, ${dupCount} duplicates skipped`);
  }

  console.log(`\nTotal new prompts this run: ${totalNew}`);
}

main().catch((err) => {
  console.error("Prompt scraper crashed:", err);
  process.exit(1);
});
