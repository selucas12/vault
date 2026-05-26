#!/usr/bin/env tsx
/**
 * Weekly AI cost estimator. Queries Supabase for entries created in the last
 * 7 days and estimates Anthropic API spend.
 *
 * Thresholds (adjust constants below):
 *   WEEKLY_COST_ALERT: $40 — creates a GitHub issue if exceeded
 *
 * Run via: npx tsx scripts/check-weekly-ai-cost.ts
 * Scheduled: every Sunday at midnight UTC (.github/workflows/weekly-cost-check.yml)
 */
import { createClient } from "@supabase/supabase-js";

const COST_PER_GUIDE = 0.04;
const COST_PER_PROMPT_SCORE = 0.001;
const COST_PER_INTEGRATION_SCORE = 0.002;
const WEEKLY_COST_ALERT = 40;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing Supabase env vars");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: guidesCount } = await supabase
    .from("codes")
    .select("id", { count: "exact", head: true })
    .neq("install_guide_status", "missing")
    .gte("install_guide_updated_at", weekAgo);

  const { count: promptsScored } = await supabase
    .from("prompts")
    .select("id", { count: "exact", head: true })
    .not("quality_score", "is", null)
    .gte("updated_at", weekAgo);

  const { count: integrationsScored } = await supabase
    .from("codes")
    .select("id", { count: "exact", head: true })
    .not("quality_score", "is", null)
    .gte("updated_at", weekAgo);

  const guides = guidesCount ?? 0;
  const prompts = promptsScored ?? 0;
  const integrations = integrationsScored ?? 0;

  const guideCost = guides * COST_PER_GUIDE;
  const promptCost = prompts * COST_PER_PROMPT_SCORE;
  const integrationCost = integrations * COST_PER_INTEGRATION_SCORE;
  const totalCost = guideCost + promptCost + integrationCost;

  console.log("=== Weekly AI Cost Report ===");
  console.log(`Period: ${weekAgo.split("T")[0]} to ${new Date().toISOString().split("T")[0]}`);
  console.log(`Install guides generated: ${guides} ($${guideCost.toFixed(2)})`);
  console.log(`Prompts quality-scored:   ${prompts} ($${promptCost.toFixed(2)})`);
  console.log(`Integrations scored:      ${integrations} ($${integrationCost.toFixed(2)})`);
  console.log(`Estimated weekly total:   $${totalCost.toFixed(2)}`);
  console.log(`Threshold:                $${WEEKLY_COST_ALERT}`);

  if (totalCost > WEEKLY_COST_ALERT) {
    console.log(`\nALERT: Weekly cost $${totalCost.toFixed(2)} exceeds $${WEEKLY_COST_ALERT} threshold.`);
    // Output for CI to create a GitHub issue
    console.log(`WEEKLY_COST_EXCEEDED=true`);
    console.log(`WEEKLY_COST_TOTAL=${totalCost.toFixed(2)}`);
    process.exit(2); // non-zero to signal the workflow
  } else {
    console.log("\nWithin budget.");
  }
}

main().catch((err) => {
  console.error("Weekly cost check crashed:", err);
  process.exit(1);
});
