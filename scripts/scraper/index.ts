#!/usr/bin/env tsx
/**
 * Vault scraper entry point. Run via `npm run scrape`.
 *
 * Behavior:
 *   - Calls each source module, capped at its maxEntries.
 *   - Hard global cap from --limit flag (default 200) to avoid runaway costs.
 *   - Dedupes against existing source_url rows in Supabase.
 *   - Classifies AI platform + delivery target by keyword.
 *   - Generates a 1536-dim embedding via OpenAI for each new entry.
 *   - Upserts into codes (approved=true for awesome-lists, false otherwise).
 *   - Records a scrape_runs row per source.
 *
 * Required env: NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL),
 *               SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY,
 *               GITHUB_TOKEN (strongly recommended — bumps to 5000 req/hr).
 *
 * Flags:
 *   --limit N      Global cap on new entries this run (default 200).
 *   --dry-run      Run all sources but don't write to the database.
 *   --source NAME  Only run a single source (github-awesome|github-topic|huggingface).
 */
import { githubAwesomeSource } from "./sources/github-awesome";
import { githubTopicsSource } from "./sources/github-topics";
import { githubSearchSource } from "./sources/github-search";
import { huggingfaceSource } from "./sources/huggingface";
import { n8nSource } from "./sources/n8n";
import { pipedreamSource } from "./sources/pipedream";
import { makeSource } from "./sources/make";
import { npmRegistrySource } from "./sources/npm-registry";
import { gitlabSource } from "./sources/gitlab";
import { embedText } from "./embed";
import { getDb } from "./db";
import { normalizeSourceUrl } from "./normalize";
import type { RawEntry, SourceModule } from "./types";

const ALL_SOURCES: SourceModule[] = [
  githubAwesomeSource,
  githubTopicsSource,
  githubSearchSource,
  huggingfaceSource,
  n8nSource,
  pipedreamSource,
  makeSource,
  npmRegistrySource,
  gitlabSource,
];

interface CliArgs {
  limit: number;
  dryRun: boolean;
  sourceFilter: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { limit: 200, dryRun: false, sourceFilter: null };
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
    ? ALL_SOURCES.filter((s) => s.type === args.sourceFilter)
    : ALL_SOURCES;
  if (sources.length === 0) {
    console.error(`No source matches --source=${args.sourceFilter}`);
    process.exit(1);
  }

  console.log(`Vault scraper — ${args.dryRun ? "DRY RUN" : "LIVE"} — global limit ${args.limit}`);
  const db = args.dryRun ? null : getDb();
  if (!args.dryRun && !db) {
    console.error("Refusing to run without Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(2);
  }
  const { urls: existing, manual: manualUrls } = db
    ? await db.existingSourceUrls()
    : { urls: new Set<string>(), manual: new Set<string>() };
  console.log(`Existing entries: ${existing.size} (${manualUrls.size} manual/seed — protected from overwrite)`);

  let totalNew = 0;
  for (const src of sources) {
    if (totalNew >= args.limit) break;
    const log = logFor(src.type);
    const remaining = args.limit - totalNew;
    const sourceCap = Math.min(src.maxEntries, remaining);
    const started = new Date().toISOString();
    const errors: string[] = [];
    let entries: RawEntry[] = [];
    try {
      entries = await src.run({ limit: sourceCap, logger: log });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      log(`Source threw: ${msg}`);
    }
    log(`Returned ${entries.length} entries`);

    let newCount = 0;
    let updatedCount = 0;
    for (const e of entries) {
      if (totalNew >= args.limit) break;
      // Normalize URL to prevent collisions between seed and scraped entries.
      e.source_url = normalizeSourceUrl(e.source_url);
      if (e.github_url) e.github_url = normalizeSourceUrl(e.github_url);
      // Never overwrite hand-curated seed/manual entries.
      if (manualUrls.has(e.source_url)) continue;
      const isNew = !existing.has(e.source_url);
      const embedSource = `${e.title}\n${e.description ?? ""}\nAI: ${e.ai_platforms.join(",")}\nTarget: ${e.delivery_targets.join(",")}`;
      let embedding: number[] | null = null;
      try {
        embedding = await embedText(embedSource);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`embed ${e.source_url}: ${msg}`);
      }
      const row = {
        source_url: e.source_url,
        source_type: e.source_type,
        title: e.title,
        description: e.description,
        ai_platforms: e.ai_platforms,
        delivery_targets: e.delivery_targets,
        install_command: e.install_command,
        language: e.language,
        github_url: e.github_url,
        stars: e.stars,
        license: e.license,
        author: e.author,
        category: e.category,
        approved: src.autoApprove,
        embedding,
        updated_at: new Date().toISOString(),
      };
      if (args.dryRun) {
        log(`  ${isNew ? "+" : "·"} ${e.title}  [${e.ai_platforms.join(",")}/${e.delivery_targets.join(",")}]`);
        if (isNew) newCount++;
        else updatedCount++;
        continue;
      }
      try {
        await db!.upsertCode(row);
        if (isNew) {
          newCount++;
          totalNew++;
          existing.add(e.source_url);
        } else {
          updatedCount++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`upsert ${e.source_url}: ${msg}`);
      }
    }

    const finished = new Date().toISOString();
    log(`Done — ${newCount} new, ${updatedCount} updated, ${errors.length} errors`);
    if (db) {
      await db.recordRun({
        source_type: src.type,
        started_at: started,
        finished_at: finished,
        entries_found: entries.length,
        entries_new: newCount,
        entries_updated: updatedCount,
        errors,
      });
    }
  }

  console.log(`\nTotal new entries this run: ${totalNew}`);
}

main().catch((err) => {
  console.error("Scraper crashed:", err);
  process.exit(1);
});
